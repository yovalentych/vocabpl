import type { MetadataRoute } from "next";

const DEFAULT_SITE_URL = "https://vocabpl.uno";

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

  const staticRoutes = [
    "",
    "/login",
    "/register",
    "/privacy",
    "/terms",
    "/cookies",
    "/subscription",
    "/pvs",
    "/legal",
    "/contacts"
  ];

  return staticRoutes.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: now
  }));
}
