import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getDb();

    // Get total words count
    const totalWords = await db.collection("words").countDocuments({});

    // Get user progress data
    const progressData = await db
      .collection("user_word_progress")
      .find({ userId: auth.id })
      .toArray();

    // Get favorites
    const favoritesData = await db
      .collection("user_favorites")
      .findOne({ userId: auth.id });
    const favoriteIds = Array.isArray(favoritesData?.favorites) ? favoritesData.favorites : [];

    // Get custom words
    const customWords = await db
      .collection("user_custom_words")
      .countDocuments({ userId: auth.id });

    // Calculate learned words (correctCount >= 3)
    const learnedWords = progressData.filter(
      (p: any) => (p.correctCount || 0) >= 3
    ).length;

    // Calculate current streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sortedProgress = progressData
      .filter((p: any) => p.lastSeen)
      .sort((a: any, b: any) =>
        new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()
      );

    let currentStreak = 0;
    let checkDate = new Date(today);

    for (let i = 0; i < 365; i++) {
      const dayStr = checkDate.toISOString().split("T")[0];
      const hasActivity = sortedProgress.some((p: any) => {
        const pDate = new Date(p.lastSeen);
        pDate.setHours(0, 0, 0, 0);
        return pDate.toISOString().split("T")[0] === dayStr;
      });

      if (hasActivity) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate longest streak (simplified - you may want to improve this)
    const longestStreak = Math.max(currentStreak, 0);

    // Calculate accuracy
    const totalSeen = progressData.reduce((sum: number, p: any) => sum + (p.seenCount || 0), 0);
    const totalCorrect = progressData.reduce((sum: number, p: any) => sum + (p.correctCount || 0), 0);
    const accuracy = totalSeen > 0 ? totalCorrect / totalSeen : 0;

    // Weekly progress (last 7 days)
    const weeklyProgress: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayStr = date.toISOString().split("T")[0];

      const count = progressData.filter((p: any) => {
        if (!p.lastSeen) return false;
        const pDate = new Date(p.lastSeen);
        pDate.setHours(0, 0, 0, 0);
        return pDate.toISOString().split("T")[0] === dayStr;
      }).length;

      weeklyProgress.push(count);
    }

    // Category breakdown
    const allWords = await db.collection("words").find({}).toArray();
    const categoryBreakdown: Record<string, { total: number; learned: number }> = {};

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
        const progress = progressData.find((p: any) => p.wordId === w.id);
        return progress && (progress.correctCount || 0) >= 3;
      }).length;

      categoryBreakdown[category] = {
        total: categoryWords.length,
        learned: learnedInCategory
      };
    }

    // Due for review (words that were learned but not seen in 5+ days)
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const dueForReview = progressData.filter((p: any) => {
      if (!p.lastSeen || (p.correctCount || 0) < 3) return false;
      return new Date(p.lastSeen) < fiveDaysAgo;
    }).length;

    return NextResponse.json({
      totalWords,
      learnedWords,
      favoriteWords: favoriteIds.length,
      customWords,
      currentStreak,
      longestStreak,
      accuracy: Math.round(accuracy * 100) / 100,
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
