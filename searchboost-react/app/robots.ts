import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/_next/", "/admin/"],
      },
      {
        userAgent: ["GPTBot", "ClaudeBot", "Google-Extended", "PerplexityBot", "anthropic-ai"],
        allow: "/",
      },
    ],
    sitemap: "https://searchboost.se/sitemap.xml",
    host: "https://searchboost.se",
  };
}
