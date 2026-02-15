import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getAuthUser } from "@/lib/auth";

export async function POST() {
  const auth = await getAuthUser();
  if (!auth || !auth.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const error = new Error("Sentry test: server error");
  Sentry.captureException(error);
  Sentry.captureMessage("Sentry test: server message", { level: "error" });
  await Sentry.flush(2000);
  return NextResponse.json({ ok: true });
}
