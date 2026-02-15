import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

function extractYoutubeId(url: string) {
  const youtubeRegex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(youtubeRegex);
  return match?.[1] || null;
}

function decodeHtml(input: string) {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&#039;/g, "'");
}

function parseTranscriptXml(xml: string) {
  const matches = Array.from(xml.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g));
  const parts = matches.map((m) => decodeHtml(m[1]).replace(/\s+/g, " ").trim()).filter(Boolean);
  return parts.join(" ");
}

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (!auth || !auth.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const videoUrl = String(body.videoUrl || "");
  const lang = String(body.lang || "pl");

  const videoId = extractYoutubeId(videoUrl);
  if (!videoId) {
    return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
  }

  const transcriptUrl = `https://www.youtube.com/api/timedtext?lang=${encodeURIComponent(lang)}&v=${videoId}`;
  const res = await fetch(transcriptUrl);
  if (!res.ok) {
    return NextResponse.json({ error: "Transcript not available" }, { status: 404 });
  }

  const xml = await res.text();
  const transcript = parseTranscriptXml(xml);

  if (!transcript) {
    return NextResponse.json({ error: "Transcript empty" }, { status: 404 });
  }

  return NextResponse.json({ transcript });
}
