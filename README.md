# seo-mcp-server

An MCP (Model Context Protocol) server that provides SEO analysis tools for AI assistants. Enables LLMs to perform keyword research, on-page SEO audits, meta tag analysis, and more through a standardized tool interface.

## Features

- **On-Page SEO Audit** — Analyze pages for title tags, meta descriptions, headings, and content structure
- **Keyword Analysis** — Extract keyword density, check placement, and suggest improvements
- **Meta Tag Validation** — Verify Open Graph, Twitter Cards, and structured data markup
- **Link Analysis** — Check internal/external links, anchor text, and broken links
- **Performance Hints** — Flag common performance issues affecting SEO (image sizes, render-blocking resources)
- **Sitemap & Robots.txt Validation** — Parse and validate sitemap.xml and robots.txt files

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

```bash
git clone https://github.com/smalandsmobler/seo-mcp-server.git
cd seo-mcp-server
npm install
```

### Running the Server

```bash
npm start
```

### Connecting to an MCP Client

Add the server to your MCP client configuration:

```json
{
  "mcpServers": {
    "seo": {
      "command": "node",
      "args": ["src/index.js"],
      "cwd": "/path/to/seo-mcp-server"
    }
  }
}
```

## Available Tools

| Tool | Description |
|------|-------------|
| `analyze_page_seo` | Run a full on-page SEO audit for a given URL |
| `check_meta_tags` | Validate meta tags, Open Graph, and Twitter Card data |
| `analyze_keywords` | Analyze keyword density and placement on a page |
| `check_links` | Audit internal and external links on a page |
| `validate_sitemap` | Parse and validate a sitemap.xml file |
| `validate_robots` | Parse and validate a robots.txt file |

## Project Structure

```
seo-mcp-server/
├── README.md
├── LICENSE
├── CONTRIBUTING.md
├── .gitignore
├── package.json
├── src/
│   ├── index.js          # MCP server entry point
│   ├── tools/            # Tool implementations
│   │   ├── analyzePage.js
│   │   ├── checkMeta.js
│   │   ├── analyzeKeywords.js
│   │   ├── checkLinks.js
│   │   ├── validateSitemap.js
│   │   └── validateRobots.js
│   └── utils/            # Shared utilities
│       ├── fetcher.js
│       └── parser.js
└── tests/                # Test files
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute to this project.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
