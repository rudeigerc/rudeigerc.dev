# AGENTS.md

This file provides a comprehensive guide for AI agents working on the **rudeigerc.dev** blog project. It describes the project structure, tech stack, conventions, and essential development workflows.

## Project Overview

**rudeigerc.dev** is a personal blog built with Astro and styled using shadcn/ui components. The site focuses on technical articles covering topics like cloud-native, Kubernetes, LLM, and infrastructure.

- **Site URL**: <https://rudeigerc.dev>
- **Framework**: Astro 5.x
- **UI Components**: shadcn/ui (New York style) + Radix UI
- **Styling**: Tailwind CSS v4
- **Content**: Markdown/MDX with advanced plugins
- **Package Manager**: pnpm (required via `only-allow`)
- **Node Version**: ^18.17.1 || ^20.3.0 || >=21.0.0

## Tech Stack

### Core Technologies

- **Astro**: Static site generation with content collections
- **React**: Interactive components (v19.x)
- **TypeScript**: Strict type checking
- **Tailwind CSS v4**: Utility-first styling via Vite plugin
- **shadcn/ui**: Reusable UI components

### Integrations & Plugins

#### Astro Integrations

- `@astrojs/react`: React component support
- `@astrojs/mdx`: MDX support
- `@astrojs/sitemap`: Automatic sitemap generation
- `@astrojs/rss`: RSS feed generation
- `@astrojs/partytown`: Third-party script optimization

#### Markdown Processing

- **Remark Plugins**:
  - `remark-math`: Math equation support
  - `remark-github-alerts`: GitHub-style alerts

- **Rehype Plugins**:
  - `rehype-katex`: Render KaTeX math equations
  - `rehype-mermaid`: Render Mermaid diagrams
  - `rehype-figure`: Enhanced figure handling
  - `rehype-slug`: Auto-generate heading IDs
  - `rehype-autolink-headings`: Add anchor links to headings

#### Syntax Highlighting

- **Shiki** via `rehypeShiki` with custom transformers:
  - Copy button (`@rudeigerc/shiki-transformer-copy-button`)
  - Title transformer (`@rudeigerc/shiki-transformer-title`)
  - Notation highlight, diff, meta highlight
- **Theme**: `github-dark`

#### Search

- **Pagefind**: Client-side search (runs in `postbuild` script)

#### OG Image Generation

- `@vercel/og`: Dynamic Open Graph images

## Project Structure

### Key Directories

```text
/
├── src/
│   ├── components/        # Astro & React components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── animate-ui/   # Animation components
│   │   └── structured-data/  # SEO structured data
│   ├── content/
│   │   ├── blog/         # Blog posts (MD/MDX)
│   │   └── pages/        # Static pages
│   ├── layouts/          # Page layouts
│   ├── pages/            # Route pages
│   ├── lib/              # Utility functions
│   ├── styles/           # Global styles
│   ├── assets/           # Static assets per post
│   ├── consts.ts         # Site constants
│   ├── content.config.ts # Content collection schemas
│   └── env.d.ts          # TypeScript environment types
├── public/               # Static files (served as-is)
├── scripts/              # Build/utility scripts
└── excalidraw/           # Excalidraw diagrams
```

### Important Files

- **astro.config.mjs**: Astro configuration with integrations and plugins
- **components.json**: shadcn/ui configuration
- **tsconfig.json**: TypeScript configuration with path aliases
- **biome.json**: Biome linter/formatter configuration
- **prettier.config.mjs**: Prettier configuration
- **package.json**: Dependencies and scripts
- **pnpm-workspace.yaml**: pnpm workspace configuration
- **pagefind.yaml**: Pagefind search configuration
- **netlify.toml**: Netlify deployment configuration

## Development Conventions

### Code Style

#### Linting & Formatting

- **Biome**: Primary linter and formatter for JS/TS/JSON
  - Indent: 2 spaces
  - Quotes: Double quotes
  - Semicolons: Always
  - Trailing commas: Always
  - Ignores: `.astro` files, `pnpm-lock.yaml`, shadcn UI components

- **Prettier**: For Astro files and final formatting pass
  - Plugins: astro, tailwindcss, astro-organize-imports
  - Runs after Biome for comprehensive formatting

#### Commands

```bash
pnpm check           # Biome check
pnpm format          # Full format (Biome + Prettier)
```

### TypeScript

- **Config**: Extends `astro/tsconfigs/strict`
- **Path Aliases**: `@/*` → `./src/*`
- **JSX**: React JSX runtime

### Content Collections

Defined in [src/content.config.ts](src/content.config.ts):

- **blog**: Blog posts with schema:
  - `title`: string (required)
  - `description`: string (default: "")
  - `pubDate`: date (required)
  - `updatedDate`: date (optional)
  - `cover`: image (optional)
  - `draft`: boolean (default: false)
  - `categories`: string[] (optional)
  - `tags`: string[] (optional)
  - `series`: string[] (optional)
  - `external`: boolean (default: false)
  - `canonicalURL`: URL (optional)

### Component Organization

#### Astro Components

- Layouts: [src/layouts/](src/layouts/)
- Page components: [src/components/](src/components/)
- Structured data: [src/components/structured-data/](src/components/structured-data/)

#### React Components

- Interactive UI: [src/components/](src/components/) (`.tsx` files)
- shadcn/ui: [src/components/ui/](src/components/ui/)
- Animation components: [src/components/animate-ui/](src/components/animate-ui/)

#### Styling

- Global styles: [src/styles/global.css](src/styles/global.css)
- Code highlighting: [src/styles/code.css](src/styles/code.css)
- Tailwind v4 via Vite plugin
- CSS variables enabled for theming

### Utilities

- **HTML utilities**: [src/lib/html.ts](src/lib/html.ts)
- **TOC utilities**: [src/lib/toc.ts](src/lib/toc.ts)
- **shadcn utils**: [src/lib/utils.ts](src/lib/utils.ts) (class merging with `clsx` and `tailwind-merge`)

## Development Workflow

### Installation

```bash
pnpm install
```

### Development Server

```bash
pnpm dev         # Start dev server
pnpm start       # Alias for dev
```

### Build & Preview

```bash
pnpm build       # Type check + build + pagefind indexing
pnpm preview     # Preview production build
```

### Post Management

```bash
pnpm post:new    # Create new blog post (runs scripts/new.js)
```

### Code Formatting

```bash
pnpm check       # Biome check
pnpm format      # Full format (Biome + Prettier + Biome apply)
```

### Deployment

- Platform: Netlify
- Build command: `pnpm build`
- Post-build: `pnpx pagefind` (indexes content for search)
- Configuration: [netlify.toml](netlify.toml)
- Headers: [public/_headers](public/_headers)
- Redirects: [public/_redirects](public/_redirects)

## Special Features

### Markdown Enhancements

1. **Math Equations**: Use KaTeX syntax
   - Inline: `$equation$`
   - Block: `$$equation$$`

2. **Mermaid Diagrams**: Fenced code blocks with `mermaid` language

3. **GitHub Alerts**: Use GitHub-style alert syntax

4. **Code Blocks**:
   - Title in meta string
   - Copy button auto-injected
   - Line highlighting with notation
   - Diff notation support

5. **Figures**: Automatic figure wrapping for images

6. **Auto-linked Headings**: Click on heading anchors

### Client-Side Search

- Pagefind integration for client-side search
- Search command dialog: [src/components/SearchCommandDialog.tsx](src/components/SearchCommandDialog.tsx)
- Configuration: [pagefind.yaml](pagefind.yaml)

### RSS Feed

- Generated at `/rss.xml`
- Implementation: [src/pages/rss.xml.ts](src/pages/rss.xml.ts)

### OG Images

- Dynamic generation
- Implementation: [src/pages/og.png.ts](src/pages/og.png.ts)

### Structured Data

- BlogPosting schema: [src/components/structured-data/BlogPosting.astro](src/components/structured-data/BlogPosting.astro)
- WebSite schema: [src/components/structured-data/WebSite.astro](src/components/structured-data/WebSite.astro)

### Theme Toggle

- Dark/light mode support
- Implementation: [src/components/ModeToggle.tsx](src/components/ModeToggle.tsx), [src/components/Theme.astro](src/components/Theme.astro)

### Analytics

- Google Tag Manager via Partytown
- Implementation: [src/components/GTag.astro](src/components/GTag.astro)

### Comments

- Giscus integration
- Implementation: [src/components/Giscus.astro](src/components/Giscus.astro)

## Key Patterns & Best Practices

### Adding New Blog Posts

1. Create `.md` or `.mdx` file in [src/content/blog/](src/content/blog/)
2. Add frontmatter with required fields (title, pubDate)
3. Use `draft: true` for unpublished posts
4. Place post-specific assets in `src/assets/{post-slug}/`

### Adding shadcn/ui Components

shadcn/ui is configured in [components.json](components.json):

- Style: `new-york`
- Base color: `neutral`
- CSS variables enabled
- Prefix: none

Components go in [src/components/ui/](src/components/ui/) and are ignored by Biome.

### Path Aliases

Always use `@/` for imports from `src/`:

```typescript
import { cn } from "@/lib/utils";
import Button from "@/components/ui/button";
```

### Content Collections API

Use Astro's Content Collections API for type-safe content:

```typescript
import { getCollection } from "astro:content";

const posts = await getCollection("blog", ({ data }) => !data.draft);
```

### Styling Components

- Use Tailwind utility classes
- Use `cn()` from `@/lib/utils` for conditional classes
- Theme variables available via CSS variables
- Animation support via `tailwindcss-animate` and `motion` (Framer Motion successor)

### SEO Optimization

- Add structured data for blog posts
- Generate OG images dynamically
- Include meta descriptions in frontmatter
- Use canonical URLs for cross-posted content

## Common Tasks

### Modify Site Metadata

Edit [src/consts.ts](src/consts.ts) for site title and description.

### Update Astro Configuration

Edit [astro.config.mjs](astro.config.mjs) for integrations, plugins, or site URL.

### Add New Page Route

Create `.astro` file in [src/pages/](src/pages/).

### Add New Layout

Create `.astro` file in [src/layouts/](src/layouts/).

### Modify Global Styles

Edit [src/styles/global.css](src/styles/global.css) or [src/styles/code.css](src/styles/code.css).

### Add New Collection

Update [src/content.config.ts](src/content.config.ts) with schema and loader.

## Troubleshooting

### Build Errors

1. Run type check: `pnpm astro check`
2. Check for missing dependencies
3. Verify content frontmatter matches schema
4. Check for markdown plugin conflicts

### Formatting Issues

1. Run Biome check: `pnpm check`
2. Run full format: `pnpm format`
3. Check ignored files in [biome.json](biome.json)

### Search Not Working

1. Ensure `pnpx pagefind` runs in `postbuild`
2. Check [pagefind.yaml](pagefind.yaml) configuration
3. Verify search is excluded from sitemap

## Repository Information

- **Owner**: rudeigerc
- **Repository**: rudeigerc.dev
- **Default Branch**: main
- **License**: See [LICENSE](LICENSE)

## Notes for AI Agents

1. **Content Location**: Blog content is in [src/content/blog/](src/content/blog/). When asked to "ignore blog content", skip reading/modifying files in this directory.

2. **Component Modifications**: shadcn/ui components in [src/components/ui/](src/components/ui/) are auto-generated. Modifications should be done carefully and documented.

3. **Biome vs Prettier**: Biome handles most formatting. Prettier is for Astro files and final pass. Always run `pnpm format` after code changes.

4. **Package Manager**: This project strictly requires `pnpm`. Do not suggest `npm` or `yarn`.

5. **TypeScript Strictness**: The project uses Astro's strict TypeScript config. All type errors must be resolved.

6. **Asset Organization**: Post-specific assets (images, diagrams) should be placed in `src/assets/{post-slug}/` for better organization.

7. **External Dependencies**: When suggesting new dependencies, verify compatibility with:
   - Astro 5.x
   - React 19.x
   - Tailwind CSS v4
   - Node.js version constraints

8. **Vite Configuration**: Tailwind CSS v4 is integrated via `@tailwindcss/vite` plugin. Do not suggest separate Tailwind config file.

9. **Deployment**: The site deploys on Netlify. Consider Netlify-specific features like redirects, headers, and serverless functions if needed.

10. **Performance**: The site uses Partytown for third-party script optimization. Consider this when adding analytics or tracking.
