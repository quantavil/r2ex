# r2ex Agent Guide

## Project Overview

r2ex is a modern, high-performance personal cloud and file explorer for Cloudflare R2 storage buckets, built as a serverless application on Cloudflare Workers. It provides a sleek, Google Drive & Gofile-style web interface for managing R2 object storage with full-page drag-and-drop uploads, live media/code previews, folder navigation, instant public share links with expiration & password protection, and email routing integration.

**Key Characteristics:**
- Serverless architecture running entirely on Cloudflare Workers
- Monorepo structure managed exclusively with **Bun workspaces**
- TypeScript backend powered by Hono & Chanfana (OpenAPI framework)
- Modern frontend powered by **SvelteKit 2 + Svelte 5 (Runes)** and **Tailwind CSS v4**
- Static SPA export via `@sveltejs/adapter-static` bundled into Workers Assets
- Gofile-style public sharing links with expiration countdowns, password protection, and live SVG QR codes
- Built-in automatic 95MB multipart chunking and full-page drag-and-drop file upload engine
- Published as an npm package for 1-command deployment via Wrangler
- Zero external server dependencies (fully self-hosted on Cloudflare)

---

## Architecture

### Project Structure

```
r2ex/
├── packages/
│   ├── worker/          # Backend API (Cloudflare Worker + Hono + Chanfana)
│   ├── dashboard/       # Frontend UI (SvelteKit 2 + Svelte 5 + Tailwind v4 + Bits UI)
│   ├── docs/           # Documentation site
│   └── github-action/  # GitHub Action for deployment
├── template/           # Starter template for end users
├── package.json        # Root workspace configuration (Bun workspaces)
├── bun.lock            # Unified Bun lockfile
└── biome.json          # Biome linter & formatter configuration
```

### Core Components

#### 1. Backend Worker (`packages/worker/`)
- **Technology:** TypeScript, Hono, Chanfana (OpenAPI framework)
- **Entry Point:** `src/index.ts`
- **Purpose:** REST API interfacing directly with Cloudflare R2 buckets
- **Key Features:**
  - R2 bucket operations (CRUD, list, copy, move, delete)
  - Direct upload and multipart upload (initiate, upload part, complete, abort)
  - Public sharing links with SHA-256 password protection and expiration timestamps
  - Email routing integration with `postal-mime`
  - Basic Authentication and Cloudflare Access authentication
  - Read-only safety mode support

**Main Export:**
```typescript
export function r2ex(config?: r2exConfig)
```

**Key API Endpoints:**
- `/api/server/config` - Server configuration and bucket list
- `/api/buckets/:bucket` - List objects (with pagination cursor, prefixes, and delimiters)
- `/api/buckets/:bucket/:key` - GET/HEAD/POST object
- `/api/buckets/:bucket/upload` - Direct file upload (<= 95MB)
- `/api/buckets/:bucket/multipart/create` - Initialize multipart upload session
- `/api/buckets/:bucket/multipart/upload` - Upload multipart chunk
- `/api/buckets/:bucket/multipart/complete` - Complete multipart upload
- `/api/buckets/:bucket/multipart/abort` - Abort multipart upload
- `/api/buckets/:bucket/folder` - Create folder placeholder
- `/api/buckets/:bucket/move` - Rename / move object
- `/api/buckets/:bucket/copy` - Duplicate / copy object
- `/api/buckets/:bucket/delete` - Delete object
- `/api/buckets/:bucket/:key/share` - Create public share link
- `/api/buckets/:bucket/shares` - List all share links for a bucket
- `/api/buckets/:bucket/share/:shareId` - Revoke / delete share link
- `/share/:shareId` - Public download and metadata retrieval endpoint (bypasses auth)
- `/api/emails/send` - Send emails

#### 2. Frontend Dashboard (`packages/dashboard/`)
- **Technology:** SvelteKit 2, Svelte 5 (Runes: `$state`, `$derived`, `$props`, `$bindable`, `$effect`), Tailwind CSS v4, Bits UI primitives, mode-watcher, svelte-sonner
- **Purpose:** Fast, reactive personal cloud SPA interface
- **Directory Layout:**
  ```
  packages/dashboard/
  ├── src/
  │   ├── lib/
  │   │   ├── api/             # Typed API client, fetch wrapper, base64 key encoding
  │   │   ├── components/
  │   │   │   ├── files/       # FileContextMenu, CreateFolderDialog
  │   │   │   ├── layout/      # Sidebar, Topbar, Breadcrumbs
  │   │   │   ├── preview/     # PreviewModal, MediaViewer, CodeViewer
  │   │   │   ├── share/       # PublicShareCard, CreateShareModal, ManageSharesModal, share utils
  │   │   │   ├── ui/          # Accessible primitives (button, dialog, dropdown-menu, input, badge)
  │   │   │   ├── upload/      # Full-page DropZone, floating UploadDrawer
  │   │   │   ├── state.svelte.ts # Reactive app-wide UI state
  │   │   │   └── utils.ts     # Class merging (clsx + twMerge)
  │   │   ├── icons/           # 15 zero-dependency custom SVG icons
  │   │   ├── services/        # UploadManager (multipart chunking + XHR progress)
  │   │   └── stores/          # MainStore (Svelte 5 runes store)
  │   └── routes/
  │       ├── +layout.svelte   # App shell (Sidebar, Topbar, DropZone, UploadDrawer)
  │       ├── +page.svelte     # Root redirect / landing
  │       ├── files/[bucket]/[...folder]/+page.svelte # File Explorer (table & grid views)
  │       └── share/[shareId]/+page.svelte            # Gofile-style public share page
  ├── tests/
  │   ├── helpers.ts           # Typed mock factories (mockServerConfig, mockR2Object)
  │   └── unit/                # 10 Vitest test suites (100 tests passing)
  └── svelte.config.js         # Adapter-static configuration with SPA fallback 200.html
  ```

**Build Output:**
- Compiled to `dist/spa/` directory
- Bundled into `packages/worker/dashboard/` for distribution via Workers Assets

---

## Configuration

### `r2exConfig` Type (`packages/worker/src/types.d.ts`)

```typescript
type r2exConfig = {
  readonly?: boolean;                  // Default: true (blocks write operations)
  cors?: boolean;                      // Enable CORS headers on API routes
  cfAccessTeamName?: string;           // Cloudflare Access team name
  dashboardUrl?: string;               // Custom dashboard URL
  emailRouting?: {                     // Email routing configuration
    targetBucket: string;
  } | false;
  showHiddenFiles?: boolean;           // Show files starting with .
  basicAuth?: BasicAuth | BasicAuth[]; // Basic authentication credentials
};

type BasicAuth = {
  username: string;
  password: string;
};
```

### Environment Bindings (`wrangler.toml`)

```toml
[[r2_buckets]]
binding = "BUCKET_NAME"
bucket_name = "my-storage-bucket"

# Cloudflare Workers Assets configuration
assets = { 
  directory = "node_modules/r2ex/dashboard",
  binding = "ASSETS",
  html_handling = "auto-trailing-slash",
  not_found_handling = "single-page-application"
}
```

---

## Development Workflow

### Prerequisites
- **Bun 1.2+ / 1.4+** (primary package manager & runtime across all workspaces)
- Node.js 22+ (for Cloudflare Workers runtime compatibility)
- Cloudflare account with R2 enabled
- Wrangler CLI

### Setup & Installation
```bash
# Install all dependencies across Bun workspaces
bun install

# Run static type checks and Svelte diagnostics
bun run check

# Audit dead code, missing dependencies, and unused exports
bun x knip

# Lint and format code with Biome
bun run lint
```

### Build Commands
```bash
# Build entire monorepo (dashboard SPA + worker bundling)
bun run build

# Build individual packages
bun run build-dashboard   # SvelteKit 2 SPA build to packages/dashboard/dist/spa
bun run build-worker      # tsup build + dashboard asset copying
```

### Testing Commands
```bash
# Run all monorepo unit and integration tests (188 tests total)
bun run test

# Run dashboard unit tests (10 suites, 100 tests)
bun --filter r2ex-dashboard test
# or: cd packages/dashboard && bun run test

# Run backend worker integration tests (8 suites, 88 tests)
bun --filter r2ex test
# or: cd packages/worker && bun run test

# Run E2E tests (Playwright)
bun run test:e2e
```

### Code Quality & Standards
- **Linter & Formatter:** Biome (`biome.json` at root).
- **Auto-Fix:** `bun x @biomejs/biome check --write packages/dashboard/src packages/worker/src packages/dashboard/tests`
- **Zero Dead Code:** `bun x knip` must pass with 0 issues.
- **Strict Svelte Check:** `bun run check` must report 0 errors and 0 warnings.
- **Git Branching:** Never commit directly to `main`. Create descriptive feature branches.

---

## Key Technical Concepts

### 1. Svelte 5 Runes Architecture
- **State Management:** Uses Svelte 5 runes (`$state`, `$derived`, `$derived.by`, `$props`, `$bindable`, `$effect`).
- **Clean Decoupling:** Business logic and upload state are isolated in reactive classes (`UploadManager` in `uploader.svelte.ts`, `AppState` in `state.svelte.ts`, and `MainStore` in `main.svelte.ts`).
- **Performance:** Fine-grained reactivity without Virtual DOM overhead or external state libraries.

### 2. Gofile-Style Public Sharing & Media Previews
- **Public Share Card (`PublicShareCard.svelte`):**
  - Instant access at `/share/:shareId` without requiring user authentication.
  - Generates instant SVG QR codes dynamically using `uqr`.
  - Expiration countdown badges with urgency thresholds (`Expires in 6 hours`, `Expires in 3 days`, `Permanent`).
  - Sleek password protection gate; validates and unmasks streaming downloads.
- **Live Previews (`MediaViewer.svelte` & `CodeViewer.svelte`):**
  - Zoomable high-resolution images, streaming HTML5 video and audio players.
  - Native embedded PDF viewer.
  - Syntax code viewer with line numbers and 1-click clipboard copying.

### 3. File Upload Engine
- Ported and extracted into pure TypeScript & Svelte 5 (`packages/dashboard/src/lib/services/uploader.svelte.ts`).
- Automatically routes files <= 95MB to direct upload `/api/buckets/:bucket/upload`.
- Automatically chunks files > 95MB into 95MB parts using the Cloudflare R2 multipart upload API (`/multipart/create`, `/multipart/upload`, `/multipart/complete`).
- Full-page dropzone (`DropZone.svelte`) with visual backdrop overlay and floating upload drawer (`UploadDrawer.svelte`) tracking real-time speeds, percentages, and cancellation.

---

## Important Files Reference

| File | Purpose |
| :--- | :--- |
| `packages/worker/src/index.ts` | Backend worker entry point, route definitions, middleware |
| `packages/worker/src/types.d.ts` | Worker & r2ex configuration TypeScript definitions |
| `packages/dashboard/src/lib/api/client.ts` | Typed R2 API client with native `fetch` and base64 key encoding |
| `packages/dashboard/src/lib/services/uploader.svelte.ts` | Svelte 5 reactive multipart upload manager |
| `packages/dashboard/src/lib/components/layout/` | Shell components: `Sidebar.svelte`, `Topbar.svelte`, `Breadcrumbs.svelte` |
| `packages/dashboard/src/lib/components/files/` | `FileContextMenu.svelte`, `CreateFolderDialog.svelte` |
| `packages/dashboard/src/lib/components/preview/` | `PreviewModal.svelte`, `MediaViewer.svelte`, `CodeViewer.svelte` |
| `packages/dashboard/src/lib/components/share/` | `PublicShareCard.svelte`, `CreateShareModal.svelte`, `ManageSharesModal.svelte` |
| `packages/dashboard/src/lib/components/upload/` | `DropZone.svelte`, `UploadDrawer.svelte` |
| `packages/dashboard/src/lib/icons/` | Custom zero-dependency SVG icon system |
| `packages/dashboard/tests/unit/` | Complete 100-test Vitest test suite for all components & stores |
| `template/src/index.ts` | End-user deployment template |
| `template/wrangler.toml` | User Cloudflare Workers deployment config |
| `biome.json` | Linter and code style rules |
| `knip.json` | Dead code and unused export validation config |

---

## Security Considerations

1. **Authentication:** Enforce either Basic Auth or Cloudflare Access in production deployments.
2. **Read-Only Mode:** Active by default to prevent accidental data modifications.
3. **Share Links:**
   - Metadata is securely partitioned in `.r2ex/sharable-links/` inside the bucket.
   - Passwords are encrypted using SHA-256 before validation.
   - Timestamps and download limits are strictly validated on every access attempt.
   - Public `/share/:shareId` endpoints bypass administrative authentication safely.
4. **Credential Isolation:** Never hardcode secrets in code; bind them via Cloudflare Wrangler secrets.
