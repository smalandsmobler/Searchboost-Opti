# Contributing to seo-mcp-server

Thank you for your interest in contributing! Here's how to get started.

## How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Run the tests (`npm test`)
5. Commit your changes (`git commit -m "Add my feature"`)
6. Push to your branch (`git push origin feature/my-feature`)
7. Open a Pull Request

## Development Setup

```bash
git clone https://github.com/smalandsmobler/seo-mcp-server.git
cd seo-mcp-server
npm install
```

## Adding a New Tool

1. Create a new file in `src/tools/`
2. Implement the tool following the existing pattern
3. Register the tool in `src/index.js`
4. Add tests in `tests/`

## Code Style

- Use ES module syntax (`import`/`export`)
- Follow existing naming conventions
- Keep functions focused and small

## Reporting Bugs

Open an issue with:
- A clear description of the bug
- Steps to reproduce
- Expected vs actual behavior

## Suggesting Features

Open an issue describing:
- The use case
- Proposed behavior
- Any alternatives considered
