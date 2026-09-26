<div align="center">
  <h1>⚡ r2ex</h1>
  <p><strong>Modern, high-performance personal cloud & file explorer for Cloudflare R2 storage buckets</strong></p>
</div>

<p align="center">
  <a href="LICENSE" target="_blank">
    <img src="https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square" alt="Software License">
  </a>
</p>

## Overview

**r2ex** brings a Google Drive & Gofile-style web interface to your Cloudflare R2 storage buckets, built entirely on Cloudflare Workers with zero external server dependencies.

- ⚡ **SvelteKit 2 + Svelte 5 (Runes)** personal cloud SPA interface
- 🎨 **Tailwind CSS v4 & Bits UI** with dark / light mode support
- 🔗 **Gofile-style public sharing links** with expiration countdowns, SHA-256 password protection, and live SVG QR codes
- 📤 **Automatic 95MB multipart chunking** and full-page drag-and-drop file upload engine
- 👁️ **Live in-browser previews** for images (with zoom), video, audio, PDFs, and syntax-highlighted code
- 🔒 **Enterprise-grade security** with Basic Auth, Cloudflare Access, and default read-only safety mode
- 📧 **Cloudflare Email Routing integration**

---

## Architecture & Monorepo Structure

Managed exclusively with **Bun workspaces**:

```
r2ex/
├── packages/
│   ├── worker/          # Backend REST API (Cloudflare Worker + Hono + Chanfana)
│   ├── dashboard/       # Frontend UI (SvelteKit 2 + Svelte 5 + Tailwind v4 + Bits UI)
│   ├── docs/           # Documentation site
│   └── github-action/  # GitHub Action for deployment
├── template/           # Starter template for end users
├── package.json        # Root Bun workspaces configuration
├── bun.lock            # Unified Bun lockfile
└── biome.json          # Biome linter & formatter configuration
```

---

## Getting Started

### 1. Template Deployment

1. Sign up for [Cloudflare Workers](https://workers.dev).
2. Clone or copy `template/` into a new project.
3. Install dependencies:
   ```bash
   bun install
   ```
4. Configure your R2 bucket in `wrangler.toml`:
   ```toml
   name = "my-r2ex"
   main = "src/index.ts"
   compatibility_date = "2025-05-08"

   [[r2_buckets]]
   binding = "BUCKET_NAME"
   bucket_name = "my-storage-bucket"

   [assets]
   directory = "node_modules/r2ex/dashboard"
   binding = "ASSETS"
   html_handling = "auto-trailing-slash"
   not_found_handling = "single-page-application"
   ```
5. Deploy to Cloudflare Workers:
   ```bash
   bun x wrangler deploy
   ```

---

## Development

```bash
# Install dependencies across all workspaces
bun install

# Run static type checks and Svelte diagnostics
bun run check

# Audit dead code, missing dependencies, and unused exports
bun x knip

# Lint and format code with Biome
bun run lint

# Run all 188 unit & integration tests
bun run test

# Build monorepo (dashboard SPA + worker bundling)
bun run build
```

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
