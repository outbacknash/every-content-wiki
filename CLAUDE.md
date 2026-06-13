# Every Content Wiki — Schema

## Purpose

This is an LLM-maintained knowledge base focused on content curated from the "every.to" subscription—"the only subscription you need to stay at the forefront of AI." The system processes raw articles, newsletters, and notes from Every.to to build a structured library of AI concepts, business strategies, and technological shifts. The LLM writes and maintains all files under `wiki/`, while the human curates raw sources and directs queries.

## Directory Layout

- `raw/` — Immutable source documents (articles from Every, transcripts, notes). Never modify these.
- `wiki/index.md` — Master catalog. Every wiki page must appear here.
- `wiki/log.md` — Append-only activity log.
- `wiki/summaries/` — One summary page per raw Every.to source document.
- `wiki/concepts/` — AI frameworks, business strategies, and mental models (e.g., "AI Value Chain", "Small Models", "Agency-as-a-Service").
- `wiki/entities/` — Companies, people, and software tools mentioned in Every.to content (e.g., "OpenAI", "Anthropic", "Cursor").
- `wiki/syntheses/` — Comparison tables, decision frameworks, and cross-article syntheses.

## File Naming

- All lowercase, hyphens for word separation: `concept-name.md`
- No spaces, no special characters, no uppercase
- Name should match the page title slug

## Page Format

Every wiki page uses this frontmatter and structure:

```yaml
---
title: "Page Title"
type: concept | entity | summary | synthesis
tags: [tag1, tag2, tag3]
created: YYYY-MM-DD
updated: YYYY-MM-DD
sources: ["raw/filename.txt"]
confidence: high | medium | low
---
```

### Required Sections by Page Type

**Summary pages** (`wiki/summaries/`):
- `## Key Points` — Bulleted list of main claims/ideas from the Every article
- `## Relevant Concepts` — Links to concept pages this article touches
- `## Source Metadata` — Author (e.g., Dan Shipper, Nathan Baschez), date published on Every, original URL

**Concept pages** (`wiki/concepts/`):
- `## Definition` — One-paragraph plain-English definition
- `## How It Works` — Mechanics, process, or structure of the concept
- `## Business Impact` — How this concept changes market dynamics or personal productivity
- `## Related Concepts` — Wiki links to related pages
- `## Sources` — Which raw sources inform this page

**Entity pages** (`wiki/entities/`):
- `## Overview` — What this entity is and its role in the AI ecosystem
- `## Key Products/Contributions` — What they are known for in the context of Every.to discussions
- `## Related Entities` — Links to related entity pages

**Synthesis pages** (`wiki/syntheses/`):
- `## Comparison` — Table or structured comparison of different viewpoints or tools
- `## Evolution` — How a particular trend has shifted over multiple Every articles
- `## Recommendations` — Actionable insights for the user

## Linking Conventions

- Use Obsidian-style wiki links: `[[concepts/concept-name]]`
- Always use relative paths from wiki root
- Every page must link to at least one other page (no orphans)

## Tagging Taxonomy

- **Domain**: `artificial-intelligence`, `productivity`, `business-strategy`, `psychology`, `software-engineering`
- **AI-Focus**: `llms`, `agents`, `multimodal`, `rag`, `fine-tuning`
- **Productivity**: `writing`, `coding`, `organization`, `learning`
- **Scope**: `foundational`, `advanced`, `experimental`
- **Status**: `well-established`, `emerging`, `speculative`

## Confidence Levels

- **high** — Deeply researched Every.to long-form piece, corroborated by multiple sources
- **medium** — Weekly newsletter update or single-author opinion
- **low** — Speculative prediction or early-stage experimental tool mention

## Workflows

### Ingest
When an article is added to `raw/`:
1. Create a detailed summary in `wiki/summaries/`.
2. Extract concepts and entities.
3. Update or create corresponding pages in `wiki/concepts/` and `wiki/entities/`.
4. Update `wiki/index.md` and `wiki/log.md`.

### Query
When asked about a topic:
1. Search the index for relevant pages.
2. Synthesize an answer based on the Every.to knowledge base.
3. Reference specific articles and authors.

### Lint
Regularly check for broken links, orphan pages, or outdated summaries as new Every.to content is added.

## Rules
- Never modify files in `raw/`
- All dates in ISO 8601 format: YYYY-MM-DD
- Prefer updating existing concept pages with new "Every" insights rather than creating duplicates.