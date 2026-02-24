import type { MetadataRoute } from "next";

const DEFAULT_SITE_URL = "https://www.vocabpl.uno";

function getSiteUrl() {
  const envUrl =
    process.env.APP_PUBLIC_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    DEFAULT_SITE_URL;
  return envUrl.replace(/\/+$/, "");
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();
  const now = new Date();

  const routes: {
    path: string;
    changeFrequency: "daily" | "weekly" | "monthly" | "yearly";
    priority: number;
  }[] = [
    // Main pages
    { path: "", changeFrequency: "weekly", priority: 1.0 },
    { path: "/register", changeFrequency: "monthly", priority: 0.9 },
    { path: "/login", changeFrequency: "monthly", priority: 0.7 },
    { path: "/subscription", changeFrequency: "monthly", priority: 0.8 },

    // Core features (accessible after login but indexable for discovery)
    { path: "/class/workbook", changeFrequency: "weekly", priority: 0.8 },
    { path: "/class/workbook/sentences", changeFrequency: "weekly", priority: 0.7 },
    { path: "/class/workbook/cloze", changeFrequency: "weekly", priority: 0.7 },
    { path: "/class/workbook/match", changeFrequency: "weekly", priority: 0.7 },
    { path: "/class/workbook/translate", changeFrequency: "weekly", priority: 0.7 },
    { path: "/class/workbook/paraphrase", changeFrequency: "weekly", priority: 0.7 },
    { path: "/class/workbook/dialogue", changeFrequency: "weekly", priority: 0.7 },
    { path: "/class/workbook/story", changeFrequency: "weekly", priority: 0.7 },
    { path: "/class/workbook/describe", changeFrequency: "weekly", priority: 0.7 },
    { path: "/dict", changeFrequency: "daily", priority: 0.8 },
    { path: "/tests", changeFrequency: "weekly", priority: 0.7 },
    { path: "/reading", changeFrequency: "weekly", priority: 0.7 },
    { path: "/leaderboard", changeFrequency: "daily", priority: 0.6 },
    { path: "/pvs", changeFrequency: "monthly", priority: 0.5 },
    { path: "/compendium", changeFrequency: "monthly", priority: 0.5 },
    { path: "/compendium/grammar", changeFrequency: "monthly", priority: 0.45 },
    { path: "/compendium/useful-sites", changeFrequency: "monthly", priority: 0.45 },
    { path: "/compendium/facts", changeFrequency: "monthly", priority: 0.45 },
    { path: "/compendium/culture", changeFrequency: "monthly", priority: 0.45 },

    // Legal
    { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
    { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
    { path: "/cookies", changeFrequency: "yearly", priority: 0.2 },
    { path: "/legal", changeFrequency: "yearly", priority: 0.2 },
    { path: "/contacts", changeFrequency: "yearly", priority: 0.3 }
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority
  }));
}
