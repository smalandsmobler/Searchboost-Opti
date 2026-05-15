import type { MetadataRoute } from "next";
import { getAllArticles } from "@/lib/articles";

const BASE = "https://searchboost.se";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`,                          lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE}/tjanster`,                  lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/tjanster/google-ads`,       lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/tjanster/webutveckling`,    lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/tjanster/social-medier`,    lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/om-oss`,                    lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/kontakt`,                   lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/seo-skola`,                 lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${BASE}/zapier-mcp`,                lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];

  const articles = getAllArticles();
  const articleRoutes: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${BASE}/seo-skola/${a.slug}`,
    lastModified: a.date ? new Date(a.date) : now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...articleRoutes];
}
