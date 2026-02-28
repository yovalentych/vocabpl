/**
 * Скрипт для створення індексів для колекцій classes
 * Запустити: npx tsx scripts/init-class-indexes.ts
 */

import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI не знайдено в environment variables");
  process.exit(1);
}

async function createIndexes() {
  const client = new MongoClient(MONGODB_URI!);

  try {
    await client.connect();
    console.log("✅ Підключено до MongoDB");

    const db = client.db();

    // Classes indexes
    console.log("\n📚 Створення індексів для колекції 'classes'...");
    await db.collection("classes").createIndex({ teacherId: 1 }, { background: true });
    await db.collection("classes").createIndex({ studentIds: 1 }, { background: true });
    await db.collection("classes").createIndex(
      { "settings.inviteCode": 1 },
      { sparse: true, background: true }
    );
    await db.collection("classes").createIndex({ createdAt: -1 }, { background: true });
    await db.collection("classes").createIndex(
      { archivedAt: 1 },
      { sparse: true, background: true }
    );
    console.log("✅ Індекси для 'classes' створені");

    // Assignments indexes
    console.log("\n📝 Створення індексів для колекції 'class_assignments'...");
    await db.collection("class_assignments").createIndex(
      { classId: 1, createdAt: -1 },
      { background: true }
    );
    await db.collection("class_assignments").createIndex(
      { teacherId: 1 },
      { background: true }
    );
    await db.collection("class_assignments").createIndex(
      { dueAt: 1 },
      { sparse: true, background: true }
    );
    await db.collection("class_assignments").createIndex({ type: 1 }, { background: true });
    console.log("✅ Індекси для 'class_assignments' створені");

    // Submissions indexes
    console.log("\n📤 Створення індексів для колекції 'class_submissions'...");
    await db.collection("class_submissions").createIndex(
      { assignmentId: 1, studentId: 1 },
      { unique: true, background: true }
    );
    await db.collection("class_submissions").createIndex(
      { classId: 1, studentId: 1 },
      { background: true }
    );
    await db.collection("class_submissions").createIndex({ status: 1 }, { background: true });
    await db.collection("class_submissions").createIndex(
      { submittedAt: -1 },
      { sparse: true, background: true }
    );
    console.log("✅ Індекси для 'class_submissions' створені");

    // Додаємо індекси для users.classes
    console.log("\n👥 Оновлення індексів для колекції 'users'...");
    await db.collection("users").createIndex(
      { "classes.asTeacher": 1 },
      { sparse: true, background: true }
    );
    await db.collection("users").createIndex(
      { "classes.asStudent": 1 },
      { sparse: true, background: true }
    );
    console.log("✅ Індекси для 'users' оновлені");

    console.log("\n🎉 Всі індекси успішно створені!");
  } catch (error) {
    console.error("❌ Помилка:", error);
    process.exit(1);
  } finally {
    await client.close();
    console.log("\n👋 З'єднання закрите");
  }
}

createIndexes();
