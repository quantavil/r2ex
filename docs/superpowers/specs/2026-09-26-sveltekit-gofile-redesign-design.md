# SvelteKit 2 Personal Cloud & Gofile-Style Redesign Specification

**Date:** 2026-09-26  
**Status:** Approved  
**Package Manager:** Bun (`bun`)  
**Target Output:** `packages/dashboard/dist/spa` (Static SPA for Cloudflare Workers Assets)  

---

## 1. Vision & Architecture

Modernize the R2-Explorer frontend from Quasar v2 / Vite 2 into a high-performance, lightweight personal cloud with Gofile-style public sharing.

### 1.1 Core Principles
1. **Cloudflare Serverless Exclusivity:** Runs exclusively on Cloudflare Workers and Cloudflare R2 object storage. No D1 database, no KV namespaces, no VPS/Docker containers.
2. **Zero-Bloat Performance:** Sub-50 KB initial gzipped payload, instant edge delivery, zero font downloads (custom SVG icons), zero Virtual DOM diffing (Svelte 5 Runes).
3. **Gofile-Style Public Sharing:** Dedicated, beautiful landing card for `/share/:shareId` with inline previews, mobile QR codes, clean countdown timers, and in-place password unlocking.
4. **Preserve Proven Reliability:** Keep and port the battle-tested multipart chunked uploader (95MB chunks, exponential backoff) and HTTP Range streaming.

---

## 2. Technology Stack & Versions (Latest 2026)

- **Package Manager:** Bun (`bun` v1.4+)
- **Application Framework:** SvelteKit 2 (`@sveltejs/kit: ^2.16.0`)
- **Reactivity Engine:** Svelte 5 (`svelte: ^5.16.0`, Runes: `$state`, `$derived`, `$props`)
- **Build Adapter:** `@sveltejs/adapter-static: ^3.0.8` (`ssr: false`, `fallback: 'index.html'`, `pages: 'dist/spa'`)
- **Styling:** Tailwind CSS v4 (`tailwindcss: ^4.0.0`, `@tailwindcss/vite: ^4.0.0`)
- **UI Components:** `shadcn-svelte` (built on `bits-ui: ^1.0.0`)
- **Icons:** Custom `$lib/icons/` Svelte 5 SVG components (User preference, 0 dependencies)
- **Theme Manager:** `mode-watcher` (anti-FOUC dark/light mode toggle)
- **Notifications:** `svelte-sonner` (spring-physics toast cards)
- **Archive / Zip:** `fflate` (client-side multi-file zip generator)
- **QR Generator:** `uqr` (2 KB micro SVG QR generator)
- **Markdown & Code:** Svelte Markdown + Shiki (lazy-loaded on demand)

---

## 3. Storage & Backend Contracts

### 3.1 R2 Storage Conventions
- **Folders:** Virtual hierarchy delimited by `/`. Creating a folder uploads a 0-byte key ending in `/` (`application/x-directory`).
- **Share Links:** Saved as JSON in R2 under `.r2-explorer/sharable-links/${shareId}.json` containing:
  ```typescript
  interface ShareMetadata {
    bucket: string;
    key: string;
    expiresAt?: number;
    passwordHash?: string;
    maxDownloads?: number;
    currentDownloads: number;
    createdBy: string;
    createdAt: number;
  }
  ```
- **Custom Metadata:** Stored in R2 object `customMetadata` and `httpMetadata`.

### 3.2 Routing Separation
- **Dashboard Routes (SPA):**
  - `/` $\rightarrow$ Redirects to `/files/:bucket`
  - `/files/:bucket/:folder*` $\rightarrow$ Main Personal Cloud file explorer
  - `/share/:shareId` $\rightarrow$ Gofile-style public share landing page
- **Worker API Routes:**
  - `GET /api/server/config` $\rightarrow$ Server config, auth status, bucket list
  - `GET /api/buckets/:bucket?prefix=...&delimiter=/` $\rightarrow$ Object list
  - `GET /api/buckets/:bucket/:key` $\rightarrow$ Stream object (supports Range requests)
  - `POST /api/buckets/:bucket/upload` $\rightarrow$ Direct upload
  - `POST /api/buckets/:bucket/multipart/*` $\rightarrow$ Multipart create, part upload, complete
  - `POST /api/buckets/:bucket/:key/share` $\rightarrow$ Create shareable link
  - `GET /api/buckets/:bucket/shares` $\rightarrow$ List all shares
  - `DELETE /api/buckets/:bucket/share/:shareId` $\rightarrow$ Revoke share
  - `GET /share/:shareId` $\rightarrow$ When requested with `Accept: text/html` serve SPA; when `download=true` stream file.
