import type { MetadataRoute } from "next";

const BASE = "https://affarsboost.se";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE}/integritet`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/villkor`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
