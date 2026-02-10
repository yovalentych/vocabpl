import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Translate Ukrainian/Polish query to English keywords for Unsplash
 */
async function translateToEnglish(query: string): Promise<string> {
  try {
    // Use absolute URL for production, relative for dev
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const aiRes = await fetch(`${baseUrl}/api/ai/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "unsplash_translate",
        userInput: query,
        context: "{}"
      })
    });

    if (!aiRes.ok) {
      const errorText = await aiRes.text().catch(() => '');
      console.error("AI translation failed:", aiRes.status, errorText);
      return query;
    }

    const data = await aiRes.json();
    const translated = data.text?.trim();

    if (translated && translated.length > 0 && translated.length < 200) {
      console.log(`Translation success: "${query}" → "${translated}"`);
      return translated;
    }

    console.warn("Translation returned empty/invalid result");
    return query;
  } catch (err) {
    console.error("Translation error:", err);
    return query; // Fallback to original
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim();
  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) {
    return NextResponse.json({ error: "Unsplash key missing" }, { status: 500 });
  }

  // Translate to English for better Unsplash results
  const englishQuery = await translateToEnglish(query);
  console.log(`Unsplash query: "${query}" → "${englishQuery}"`);

  const apiUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(englishQuery)}&per_page=1&orientation=landscape`;

  const res = await fetch(apiUrl, {
    headers: {
      Authorization: `Client-ID ${key}`
    }
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Unsplash error" }, { status: 500 });
  }

  const data = await res.json().catch(() => ({}));
  const photo = Array.isArray(data?.results) ? data.results[0] : null;
  if (!photo) {
    return NextResponse.json({ error: "No images found" }, { status: 404 });
  }

  const image = {
    url: photo.urls?.regular || photo.urls?.full,
    thumb: photo.urls?.thumb,
    alt: photo.alt_description || photo.description || null,
    author: photo.user?.name || null,
    authorUrl: photo.user?.links?.html || null,
    sourceUrl: photo.links?.html || null
  };

  const downloadLocation = photo.links?.download_location;
  if (downloadLocation) {
    fetch(downloadLocation, {
      headers: { Authorization: `Client-ID ${key}` }
    }).catch(() => null);
  }

  return NextResponse.json({ image });
}
