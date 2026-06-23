# Searchboost Component Library

A curated library of 21st.dev Magic MCP prompts organized by client niche. Each prompt generates a production-ready React component that is then converted to match the client's WordPress theme and injected via Perispa.

---

## Pipeline

```
1. Pick prompt  →  2. Generate  →  3. Convert  →  4. Inject
   (this lib)        (21st Magic)    (/convert)     (perispa)
```

### Step 1 — Pick a prompt

Browse the folders below. Each `.md` file contains one component prompt tuned for a specific niche.

### Step 2 — Generate with 21st Magic

Copy the prompt block from the `.md` file and pass it to the MCP tool:

```
mcp__magic__21st_magic_component_builder
```

Pass the prompt text as the `message` parameter. The tool returns a complete React component (JSX + Tailwind or CSS-in-JS).

### Step 3 — Convert to theme

Use `/convert [theme]` to adapt the component to the client's existing theme. Common targets:

| Theme | Command | Clients |
|-------|---------|---------|
| Flatsome | `/convert flatsome` | SMK, Arbetsro, Mobelrondellen |
| GeneratePress | `/convert generatepress` | Jelmtech, Humanpower |
| Kadence | `/convert kadence` | Traficator |
| Divi | `/convert divi` | (avoid — script stripping issues) |
| Plain HTML/CSS | `/convert html` | Any client, safest fallback |

### Step 4 — Inject via Perispa

Use `perispa_inject_builder_content` or `perispa_add_html` to place the component on the target page. Always create a snapshot first with `perispa_create_snapshot`.

---

## Folder structure

```
components/
├── README.md                  ← you are here
├── kontorsmobler/             ← SMK, Arbetsro (Scandinavian office furniture)
│   ├── hero.md
│   ├── product-grid.md
│   ├── usp-section.md
│   ├── testimonials.md
│   └── footer.md
├── halsa/                     ← Healthcare, wellness, clinics
│   ├── hero.md
│   ├── before-after.md
│   ├── booking-cta.md
│   └── testimonials.md
├── tjansteforetag/            ← B2B service companies (Traficator, Humanpower)
│   ├── hero.md
│   ├── case-studies.md
│   ├── team.md
│   ├── pricing.md
│   └── contact.md
└── ehandel/                   ← E-commerce, WooCommerce clients
    ├── hero.md
    ├── product-card.md
    ├── category-grid.md
    └── cart-section.md
```

---

## How to add a new component

1. Pick the right folder (or create a new niche folder)
2. Create a `.md` file named after the component
3. Follow this exact structure:

```markdown
# [Component Name]

## Description
What it is, when to use it.

## 21st.dev Prompt
[The English prompt to pass to mcp__magic__21st_magic_component_builder]

## Swedish text suggestions
[Suggested Swedish copy for headlines, CTAs, labels]

## Design notes
[Colors, typography, spacing, interaction notes]

## Theme compatibility
[Which /convert targets work best and any gotchas]
```

4. Test the prompt once before committing — paste it into the builder and verify the output is usable.

---

## Tips

- **Always write prompts in English** — 21st.dev generates significantly better output in English regardless of the final language of the content.
- **Include exact hex colors** in the prompt if the client has a strict brand — the builder respects them.
- **Specify "no external fonts"** if the WordPress theme already loads its own fonts to avoid double-loading.
- **Request semantic HTML** (section, article, nav, h1-h3) in the prompt — important for SEO.
- **Ask for aria-labels** on interactive elements — helps accessibility and Core Web Vitals.
- After generation, always swap placeholder text for real Swedish copy before injecting.
