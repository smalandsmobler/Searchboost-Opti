import type { MetadataRoute } from "next";
import { ARTICLES } from "@/lib/articles";
import { GUIDES } from "@/lib/guider";

const BASE = "https://affarsboost.se";

const TEMA_SLUGS = ["ledartext", "strategi", "mindset", "ai", "community", "management"];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const articleUrls: MetadataRoute.Sitemap = ARTICLES.map((a) => ({
    url: `${BASE}/artiklar/${a.slug}`,
    lastModified: new Date(a.publishedAt),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const guideUrls: MetadataRoute.Sitemap = GUIDES.map((g) => ({
    url: `${BASE}/guider/${g.slug}`,
    lastModified: new Date(g.updatedAt),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const temaUrls: MetadataRoute.Sitemap = TEMA_SLUGS.map((tema) => ({
    url: `${BASE}/tema/${tema}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE}/om-oss`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/program`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/prova-gratis`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/guider`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/artiklar`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/mentorer`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/investera`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    ...guideUrls,
    ...articleUrls,
    ...temaUrls,
    { url: `${BASE}/integritet`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/villkor`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
