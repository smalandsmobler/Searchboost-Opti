import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/", "/_next/"] },
      { userAgent: ["GPTBot", "ClaudeBot", "Google-Extended", "PerplexityBot", "anthropic-ai"], allow: "/" },
    ],
    sitemap: "https://affarsboost.se/sitemap.xml",
    host: "https://affarsboost.se",
  };
}
