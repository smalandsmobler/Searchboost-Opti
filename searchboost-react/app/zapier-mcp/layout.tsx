import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zapier MCP-integration — koppla dina verktyg | Searchboost",
  description:
    "Koppla dina Zapier-integrationer direkt via MCP (Model Context Protocol). Bygg AI-arbetsflöden som svarar på dina verktyg utan kod. Gratis test hos Searchboost.",
  alternates: { canonical: "https://searchboost.se/zapier-mcp" },
  openGraph: {
    title: "Zapier MCP-integration — AI som styr dina verktyg",
    description:
      "Koppla Zapier till AI via MCP. Bygg arbetsflöden utan kod. Gratis test.",
    url: "https://searchboost.se/zapier-mcp",
    siteName: "Searchboost",
    locale: "sv_SE",
    type: "website",
  },
};

export default function ZapierMCPLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
