import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

export type FeedbackTemplate = {
  _id: ObjectId;
  teacherId?: ObjectId;
  title: string;
  comment: string;
  category: string;
  tags?: string[];
  isDefault: boolean;
  usedCount: number;
  createdAt: Date;
};

// Default templates (UK + PL локалізації)
const DEFAULT_TEMPLATES_UK: Omit<FeedbackTemplate, '_id' | 'teacherId' | 'usedCount' | 'createdAt'>[] = [
  {
    title: "Чудова робота!",
    comment: "Відмінне виконання завдання! Всі відповіді правильні, видно глибоке розуміння матеріалу.",
    category: "positive",
    isDefault: true
  },
  {
    title: "Добре, але є помилки",
    comment: "Загалом добре, але є кілька помилок. Зверніть увагу на деталі та перевірте ще раз.",
    category: "needs_improvement",
    isDefault: true
  },
  {
    title: "Потребує доопрацювання",
    comment: "Виконання потребує суттєвого покращення. Будь ласка, повторіть матеріал та спробуйте ще раз.",
    category: "needs_improvement",
    isDefault: true
  },
  {
    title: "Спробуй ще раз",
    comment: "Не вдалося виконати завдання. Рекомендую повторити тему та звернутися за допомогою.",
    category: "needs_improvement",
    isDefault: true
  }
];

const DEFAULT_TEMPLATES_PL: Omit<FeedbackTemplate, '_id' | 'teacherId' | 'usedCount' | 'createdAt'>[] = [
  {
    title: "Świetna robota!",
    comment: "Doskonałe wykonanie zadania! Wszystkie odpowiedzi prawidłowe, widać głębokie zrozumienie materiału.",
    category: "positive",
    isDefault: true
  },
  {
    title: "Dobrze, ale są błędy",
    comment: "Ogólnie dobrze, ale jest kilka błędów. Zwróć uwagę na szczegóły i sprawdź jeszcze raz.",
    category: "needs_improvement",
    isDefault: true
  },
  {
    title: "Wymaga poprawy",
    comment: "Wykonanie wymaga znacznej poprawy. Proszę powtórz materiał i spróbuj ponownie.",
    category: "needs_improvement",
    isDefault: true
  },
  {
    title: "Spróbuj ponownie",
    comment: "Nie udało się wykonać zadania. Polecam powtórzyć temat i zwrócić się o pomoc.",
    category: "needs_improvement",
    isDefault: true
  }
];

// Seed default templates if they don't exist
async function seedDefaultTemplates() {
  const db = await getDb();
  const collection = db.collection<FeedbackTemplate>("feedback_templates");

  // Check if defaults already exist
  const existingCount = await collection.countDocuments({ isDefault: true });
  if (existingCount > 0) {
    return; // Already seeded
  }

  const now = new Date();
  const defaultTemplates = [
    ...DEFAULT_TEMPLATES_UK.map(t => ({ ...t, usedCount: 0, createdAt: now })),
    ...DEFAULT_TEMPLATES_PL.map(t => ({ ...t, usedCount: 0, createdAt: now }))
  ];

  await collection.insertMany(defaultTemplates as any[]);

  // Create index
  await collection.createIndex({ teacherId: 1, createdAt: -1 });
}

// GET /api/feedback-templates - Get user templates + defaults
export async function GET(request: Request) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getDb();
    await seedDefaultTemplates(); // Ensure defaults exist

    const templates = await db
      .collection<FeedbackTemplate>("feedback_templates")
      .find({
        $or: [
          { teacherId: new ObjectId(auth.id) },
          { isDefault: true }
        ]
      })
      .sort({ isDefault: -1, createdAt: -1 }) // Defaults first, then user's by date
      .toArray();

    return NextResponse.json({
      templates: templates.map(t => ({
        ...t,
        _id: t._id.toString(),
        teacherId: t.teacherId?.toString()
      }))
    });
  } catch (error) {
    console.error("Error fetching feedback templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

// POST /api/feedback-templates - Create new template
export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, comment, category, tags } = body;

    if (!title || !comment) {
      return NextResponse.json(
        { error: "Title and comment are required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const now = new Date();

    const newTemplate: Omit<FeedbackTemplate, '_id'> = {
      teacherId: new ObjectId(auth.id),
      title: title.trim(),
      comment: comment.trim(),
      category: category || 'custom',
      tags: tags || [],
      isDefault: false,
      usedCount: 0,
      createdAt: now
    };

    const result = await db
      .collection<FeedbackTemplate>("feedback_templates")
      .insertOne(newTemplate as any);

    return NextResponse.json({
      success: true,
      templateId: result.insertedId.toString()
    });
  } catch (error) {
    console.error("Error creating feedback template:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
