import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

function parseDay(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export async function GET(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get("date");
  if (!dateStr) return NextResponse.json({ error: "date param required" }, { status: 400 });

  try {
    const eventId = new ObjectId(params.eventId);
    const occurrenceDate = parseDay(dateStr);
    const db = await getDb();

    const event = await db.collection("schedule_events").findOne({ _id: eventId });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const classDoc = await db.collection("classes").findOne({ _id: event.classId });
    if (!classDoc) return NextResponse.json({ error: "Class not found" }, { status: 404 });

    const isTeacher = classDoc.teacherId.toString() === auth.id;
    const isStudent = (classDoc.students || []).some((s: any) => s.id === auth.id);
    if (!isTeacher && !isStudent) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    const duration = eventEnd.getTime() - eventStart.getTime();
    const occStart = new Date(occurrenceDate);
    occStart.setUTCHours(eventStart.getUTCHours(), eventStart.getUTCMinutes(), 0, 0);
    const occEnd = new Date(occStart.getTime() + duration);
    const windowStart = new Date(occStart.getTime() - 30 * 60 * 1000);
    const windowEnd = new Date(occEnd.getTime() + 30 * 60 * 1000);

    const now = new Date();
    const windowOpen = isTeacher || (now >= windowStart && now <= windowEnd);
    const students = classDoc.students || [];

    const existing = await db.collection("lesson_sessions").findOne({ eventId, occurrenceDate });
    let session: any;
    if (existing) {
      session = existing;
      await db.collection("lesson_sessions").updateOne({ _id: existing._id }, { $set: { updatedAt: now } });
    } else {
      const doc = {
        eventId,
        classId: event.classId,
        teacherId: classDoc.teacherId,
        occurrenceDate,
        status: "waiting",
        sharedNotes: "",
        agenda: "",
        vocabularyCards: [],
        grammarBlocks: [],
        homework: null,
        attendance: students.map((s: any) => ({
          studentId: s.id,
          studentName: s.name || s.username,
          status: null,
        })),
        conducted: false,
        participants: [],
        exercises: [],
        responses: [],
        personalNotes: {},
        createdAt: now,
        updatedAt: now,
      };
      const result = await db.collection("lesson_sessions").insertOne(doc);
      session = { ...doc, _id: result.insertedId };
    }

    const threshold = new Date(now.getTime() - 20000);
    const onlineParticipants = (session.participants || []).filter(
      (p: any) => new Date(p.lastSeenAt) >= threshold
    );

    return NextResponse.json({
      sessionId: session._id.toString(),
      eventId: params.eventId,
      classId: event.classId.toString(),
      occurrenceDate: occurrenceDate.toISOString(),
      status: session.status,
      isTeacher,
      windowOpen,
      windowStart: windowStart.toISOString(),
      windowEnd: windowEnd.toISOString(),
      event: {
        title: event.title,
        description: event.description,
        meetingLink: event.meetingLink,
        location: event.location,
        startTime: occStart.toISOString(),
        endTime: occEnd.toISOString(),
        color: event.color,
        type: event.type,
      },
      className: classDoc.name,
      teacherName: classDoc.teacherName,
      students: students.map((s: any) => ({
        id: s.id,
        name: s.name || s.username,
        username: s.username,
      })),
      sharedNotes: session.sharedNotes || "",
      agenda: session.agenda || "",
      vocabularyCards: session.vocabularyCards || [],
      grammarBlocks: session.grammarBlocks || [],
      homework: session.homework || null,
      attendance: session.attendance || [],
      conducted: session.conducted || false,
      participants: onlineParticipants,
      exercises: session.exercises || [],
      responses: session.responses || [],
      personalNote: session.personalNotes?.[auth.id] || "",
    });
  } catch (error) {
    console.error("[lessons GET]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get("date");
  if (!dateStr) return NextResponse.json({ error: "date param required" }, { status: 400 });

  try {
    const eventId = new ObjectId(params.eventId);
    const occurrenceDate = parseDay(dateStr);
    const db = await getDb();

    const event = await db.collection("schedule_events").findOne({ _id: eventId });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const classDoc = await db.collection("classes").findOne({ _id: event.classId });
    if (!classDoc) return NextResponse.json({ error: "Class not found" }, { status: 404 });

    const isTeacher = classDoc.teacherId.toString() === auth.id;
    const isStudent = (classDoc.students || []).some((s: any) => s.id === auth.id);
    if (!isTeacher && !isStudent) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const body = await request.json();
    const {
      sharedNotes,
      agenda,
      conducted,
      status: newStatus,
      attendanceUpdate,
      personalNote,
      addExercise,
      toggleExercise,
      submitResponse,
      gradeResponse,
      // Board V2
      addVocabCard,
      removeVocabCard,
      addGrammarBlock,
      removeGrammarBlock,
      updateGrammarBlock,
      setHomework,
      convertHomework,
    } = body;

    const now = new Date();
    const $set: Record<string, any> = { updatedAt: now };
    const $push: Record<string, any> = {};
    const $pull: Record<string, any> = {};
    const arrayFilters: any[] = [];

    if (isTeacher) {
      if (sharedNotes !== undefined) $set.sharedNotes = sharedNotes;
      if (agenda !== undefined) $set.agenda = agenda;
      if (newStatus !== undefined) $set.status = newStatus;
      if (conducted !== undefined) $set.conducted = conducted;

      if (attendanceUpdate) {
        $set["attendance.$[elem].status"] = attendanceUpdate.status;
        arrayFilters.push({ "elem.studentId": attendanceUpdate.studentId });
      }

      // Exercises
      if (addExercise) {
        $push.exercises = {
          id: crypto.randomUUID(),
          title: addExercise.title,
          description: addExercise.description || "",
          points: addExercise.points || 0,
          isActive: true,
          createdAt: now,
        };
      }
      if (toggleExercise) {
        $set["exercises.$[ex].isActive"] = toggleExercise.isActive;
        arrayFilters.push({ "ex.id": toggleExercise.exerciseId });
      }
      if (gradeResponse) {
        $set["responses.$[r].score"] = gradeResponse.score;
        $set["responses.$[r].gradedAt"] = now;
        arrayFilters.push({
          "r.exerciseId": gradeResponse.exerciseId,
          "r.studentId": gradeResponse.studentId,
        });
      }

      // Vocabulary
      if (addVocabCard) {
        $push.vocabularyCards = {
          id: crypto.randomUUID(),
          word: addVocabCard.word.trim(),
          translation: addVocabCard.translation.trim(),
          addedAt: now,
        };
      }
      if (removeVocabCard) {
        $pull.vocabularyCards = { id: removeVocabCard.cardId };
      }

      // Grammar
      if (addGrammarBlock) {
        $push.grammarBlocks = {
          id: crypto.randomUUID(),
          title: addGrammarBlock.title.trim(),
          rule: addGrammarBlock.rule.trim(),
          examples: (addGrammarBlock.examples || []).filter((e: string) => e.trim()),
          addedAt: now,
        };
      }
      if (removeGrammarBlock) {
        $pull.grammarBlocks = { id: removeGrammarBlock.blockId };
      }
      if (updateGrammarBlock) {
        if (updateGrammarBlock.title !== undefined)
          $set["grammarBlocks.$[gb].title"] = updateGrammarBlock.title;
        if (updateGrammarBlock.rule !== undefined)
          $set["grammarBlocks.$[gb].rule"] = updateGrammarBlock.rule;
        if (updateGrammarBlock.examples !== undefined)
          $set["grammarBlocks.$[gb].examples"] = updateGrammarBlock.examples;
        arrayFilters.push({ "gb.id": updateGrammarBlock.blockId });
      }

      // Homework
      if (setHomework !== undefined) {
        $set.homework = setHomework
          ? {
              text: setHomework.text,
              dueDate: setHomework.dueDate || null,
              assignmentId: null,
              assignmentClassId: null,
            }
          : null;
      }

      // Convert homework to assignment
      if (convertHomework) {
        const session = await db.collection("lesson_sessions").findOne({ eventId, occurrenceDate });
        if (session?.homework?.text) {
          const assignmentDoc = {
            classId: event.classId,
            teacherId: classDoc.teacherId,
            title: session.homework.text.slice(0, 100),
            description: session.homework.text,
            type: "custom",
            status: "published",
            publishAt: now,
            maxScore: 100,
            dueDate: session.homework.dueDate ? new Date(session.homework.dueDate) : null,
            createdAt: now,
            updatedAt: now,
          };
          const result = await db.collection("class_assignments").insertOne(assignmentDoc);
          $set["homework.assignmentId"] = result.insertedId.toString();
          $set["homework.assignmentClassId"] = event.classId.toString();
        }
      }

      // Sync to attendance_records when marking conducted
      if (conducted === true) {
        const session = await db.collection("lesson_sessions").findOne({ eventId, occurrenceDate });
        if (session) {
          const attendanceStudents = (session.attendance || []).map((a: any) => ({
            studentId: a.studentId,
            studentName: a.studentName,
            status: (a.status as string) || "absent",
          }));
          await db.collection("attendance_records").updateOne(
            { eventId, occurrenceDate },
            {
              $set: {
                classId: event.classId,
                teacherId: classDoc.teacherId,
                conducted: true,
                students: attendanceStudents,
                updatedAt: now,
              },
              $setOnInsert: { createdAt: now },
            },
            { upsert: true }
          );
        }
      }
    }

    if (personalNote !== undefined) {
      $set[`personalNotes.${auth.id}`] = personalNote;
    }

    if (submitResponse && isStudent) {
      const studentName =
        (classDoc.students || []).find((s: any) => s.id === auth.id)?.name || auth.username;
      const existingResp = await db.collection("lesson_sessions").findOne({
        eventId,
        occurrenceDate,
        "responses.exerciseId": submitResponse.exerciseId,
        "responses.studentId": auth.id,
      });
      if (!existingResp) {
        $push.responses = {
          exerciseId: submitResponse.exerciseId,
          studentId: auth.id,
          studentName,
          answer: submitResponse.answer,
          submittedAt: now,
        };
      } else {
        $set["responses.$[resp].answer"] = submitResponse.answer;
        $set["responses.$[resp].submittedAt"] = now;
        arrayFilters.push({
          "resp.exerciseId": submitResponse.exerciseId,
          "resp.studentId": auth.id,
        });
      }
    }

    const updateDoc: any = {};
    if (Object.keys($set).length) updateDoc.$set = $set;
    if (Object.keys($push).length) updateDoc.$push = $push;
    if (Object.keys($pull).length) updateDoc.$pull = $pull;
    if (!Object.keys(updateDoc).length) return NextResponse.json({ success: true });

    const options: any = {};
    if (arrayFilters.length) options.arrayFilters = arrayFilters;

    await db.collection("lesson_sessions").updateOne(
      { eventId, occurrenceDate },
      updateDoc,
      options
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[lessons PATCH]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
