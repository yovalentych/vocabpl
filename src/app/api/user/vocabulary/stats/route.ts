import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

type WordProgressEntry = {
  wordId: string;
  seenCount?: number;
  correctCount?: number;
  lastSeen?: Date | string;
};

type UserDoc = {
  _id: ObjectId;
  wordProgress?: WordProgressEntry[];
};

function getDayKey(value: Date | string | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function isLearned(progress: WordProgressEntry) {
  const correct = progress.correctCount || 0;
  const seen = progress.seenCount || 0;
  return correct >= 3 || seen >= 5;
}

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getDb();

    // Get total words count
    const baseWordsTotal = await db.collection("words").countDocuments({});

    // Get user progress data
    const user = await db.collection<UserDoc>("users").findOne(
      { _id: new ObjectId(auth.id) },
      { projection: { wordProgress: 1 } }
    );
    const progressData = Array.isArray(user?.wordProgress) ? user.wordProgress : [];

    // Get favorites
    const favoritesData = await db
      .collection("user_favorites")
      .findOne({ userId: auth.id });
    const favoriteIds = Array.isArray(favoritesData?.favorites) ? favoritesData.favorites : [];

    // Get custom words
    const customWords = await db
      .collection("user_custom_words")
      .countDocuments({ userId: auth.id });

    const totalWords = baseWordsTotal + customWords;

    // Calculate learned words (correctCount >= 3)
    const learnedWords = progressData.filter(isLearned).length;

    // Calculate current streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activityDays = new Set(
      progressData
        .map((p: any) => getDayKey(p.lastSeen))
        .filter((day): day is string => Boolean(day))
    );

    let currentStreak = 0;
    const checkDate = new Date(today);
    for (let i = 0; i < 365; i += 1) {
      const dayKey = getDayKey(checkDate);
      if (dayKey && activityDays.has(dayKey)) {
        currentStreak += 1;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    const sortedDayKeys = Array.from(activityDays).sort();
    let longestStreak = 0;
    let streak = 0;
    let prevDate: Date | null = null;
    for (const key of sortedDayKeys) {
      const date = new Date(`${key}T00:00:00`);
      if (Number.isNaN(date.getTime())) continue;
      if (!prevDate) {
        streak = 1;
      } else {
        const diffDays = Math.round((date.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        streak = diffDays === 1 ? streak + 1 : 1;
      }
      prevDate = date;
      longestStreak = Math.max(longestStreak, streak);
    }

    // Calculate accuracy
    const totalSeen = progressData.reduce((sum: number, p: any) => sum + (p.seenCount || 0), 0);
    const totalCorrect = progressData.reduce((sum: number, p: any) => sum + (p.correctCount || 0), 0);
    const accuracy = totalSeen > 0 ? Math.round((totalCorrect / totalSeen) * 100) : 0;

    // Weekly progress (last 7 days)
    const weeklyProgress: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayKey = getDayKey(date);

      const count = progressData.filter((p: any) => {
        const key = getDayKey(p.lastSeen);
        return key === dayKey;
      }).length;

      weeklyProgress.push(count);
    }

    // Category breakdown
    const allWords = await db.collection("words").find({}).toArray();
    const categoryBreakdown: Record<string, { total: number; learned: number }> = {};
    const progressById = new Map(progressData.map((p: any) => [p.wordId, p]));

    const categories = [
      "verb",
      "adverb",
      "adjective",
      "slang",
      "others",
      "soft_swears",
      "clean_emotions",
      "abbreviations"
    ];

    for (const category of categories) {
      const categoryWords = allWords.filter((w: any) => w.type === category);
      const learnedInCategory = categoryWords.filter((w: any) => {
        const progress = progressById.get(w.id);
        return progress ? isLearned(progress) : false;
      }).length;

      categoryBreakdown[category] = {
        total: categoryWords.length,
        learned: learnedInCategory
      };
    }

    if (customWords > 0) {
      const customWordDocs = await db
        .collection("user_custom_words")
        .find({ userId: auth.id })
        .project({ id: 1 })
        .toArray();
      const customIds = new Set(customWordDocs.map((item: any) => item.id));
      const learnedCustom = progressData.filter((p: any) => customIds.has(p.wordId) && isLearned(p)).length;
      categoryBreakdown["my_words"] = { total: customWords, learned: learnedCustom };
    }

    // Due for review (words that were learned but not seen in 5+ days)
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const dueForReview = progressData.filter((p: any) => {
      if (!p.lastSeen || !isLearned(p)) return false;
      return new Date(p.lastSeen) < fiveDaysAgo;
    }).length;

    return NextResponse.json({
      totalWords,
      learnedWords,
      favoriteWords: favoriteIds.length,
      customWords,
      currentStreak,
      longestStreak,
      accuracy,
      weeklyProgress,
      categoryBreakdown,
      dueForReview
    });
  } catch (error) {
    console.error("Vocabulary stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch vocabulary stats" },
      { status: 500 }
    );
  }
}
