import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { generateOccurrences, isOccurrenceCancelled, type ScheduleEvent } from "@/lib/schedule";
import { notifyScheduleReminder } from "@/lib/notifications";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Нагадування надсилаються за X хвилин до заняття
const REMINDER_WINDOWS = [
  { minutesBefore: 60, toleranceMin: 6 },   // 1 година, запускається кожні 30хв
  { minutesBefore: 1440, toleranceMin: 16 }, // 24 години, запускається щодня
];

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const now = new Date();
  const maxLookahead = new Date(now.getTime() + 26 * 60 * 60 * 1000); // 26 годин вперед

  let totalSent = 0;
  let totalSkipped = 0;

  try {
    // Знаходимо всі активні події, що можуть мати заняття в наступні 26 годин
    const events = await db
      .collection<ScheduleEvent>("schedule_events")
      .find({
        isCancelled: { $ne: true },
        type: { $in: ["lesson", "test", "meeting"] },
        $or: [
          { isRecurring: false, startTime: { $gte: now, $lte: maxLookahead } },
          { isRecurring: true, startTime: { $lte: maxLookahead } },
        ],
      })
      .toArray();

    for (const event of events) {
      // Генеруємо всі occurrences в наступні 26 годин
      const occurrences = generateOccurrences(event, now, maxLookahead);

      for (const occ of occurrences) {
        // Пропускаємо скасовані occurrences
        if (isOccurrenceCancelled(event, occ.start)) continue;

        const minutesUntil = (occ.start.getTime() - now.getTime()) / (1000 * 60);

        for (const window of REMINDER_WINDOWS) {
          const diff = minutesUntil - window.minutesBefore;
          if (diff < 0 || diff > window.toleranceMin) continue;

          // Перевіряємо чи нагадування вже відправлено
          const occDateKey = occ.start.toISOString().slice(0, 10);
          const alreadySent = await db.collection("schedule_reminders_sent").findOne({
            eventId: event._id,
            occurrenceDate: occDateKey,
            minutesBefore: window.minutesBefore,
          });

          if (alreadySent) {
            totalSkipped++;
            continue;
          }

          // Отримуємо клас і його студентів
          const cls = await db.collection("classes").findOne({ _id: event.classId });
          if (!cls) continue;

          // Збираємо userIds: всі студенти + вчитель
          const userIds: ObjectId[] = [];

          if (event.participants === "all") {
            // Студенти
            for (const s of cls.students || []) {
              if (s.id) {
                try { userIds.push(new ObjectId(s.id)); } catch {}
              }
            }
            // Вчитель (тільки для 1-годинного нагадування)
            if (window.minutesBefore <= 60) {
              userIds.push(event.teacherId);
            }
          } else if (Array.isArray(event.participants)) {
            userIds.push(...event.participants);
          }

          if (userIds.length === 0) continue;

          // Надсилаємо нагадування
          await notifyScheduleReminder({
            userIds,
            userRole: "user",
            eventId: event._id!,
            classId: event.classId,
            eventTitle: event.title,
            className: cls.name,
            startTime: occ.start,
            minutesBefore: window.minutesBefore,
          });

          // Записуємо що надіслано
          await db.collection("schedule_reminders_sent").insertOne({
            eventId: event._id,
            occurrenceDate: occDateKey,
            minutesBefore: window.minutesBefore,
            sentAt: now,
            recipientsCount: userIds.length,
          });

          totalSent++;
        }
      }
    }

    return NextResponse.json({
      ok: true,
      processed: events.length,
      sent: totalSent,
      skipped: totalSkipped,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("[schedule-reminders] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
