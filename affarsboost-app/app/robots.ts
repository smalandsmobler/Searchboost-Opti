import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/_next/", "/admin/", "/konto/", "/privat/", "/onboarding/"],
      },
      {
        userAgent: ["GPTBot", "ClaudeBot", "Google-Extended", "PerplexityBot", "anthropic-ai", "Bytespider", "cohere-ai"],
        allow: ["/guider/", "/artiklar/", "/tema/", "/om-oss", "/program", "/"],
      },
    ],
    sitemap: "https://affarsboost.se/sitemap.xml",
    host: "https://affarsboost.se",
  };
}
