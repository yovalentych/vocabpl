import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function POST(request: Request) {
  const auth = await getAuthUser();

  try {
    const payload = await request.json();
    const {
      context,
      error,
      userFeedback,
      email,
      errorDetails,
      timestamp,
      userAgent,
      url
    } = payload;

    const db = await getDb();

    const errorReport = {
      userId: auth?.id || "anonymous",
      userName: auth?.username || null,
      userEmail: email || null,
      context,
      error,
      userFeedback,
      errorDetails: errorDetails || {},
      timestamp: timestamp || new Date().toISOString(),
      userAgent,
      url,
      createdAt: new Date()
    };

    await db.collection("error_reports").insertOne(errorReport);

    // TODO: Send email notification to admin
    // You can integrate with SendGrid, Resend, or any email service

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error saving feedback:", err);
    return NextResponse.json(
      { error: "Failed to save feedback" },
      { status: 500 }
    );
  }
}
