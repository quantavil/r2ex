# SvelteKit 2 Personal Cloud & Gofile Sharing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completely replace the Quasar v2 dashboard in `packages/dashboard` with a lightweight, high-performance SvelteKit 2 + Svelte 5 SPA with modern personal cloud UX and Gofile-style sharing, using Bun as the package manager.

**Architecture:** Client-side static SPA compiled with `@sveltejs/adapter-static` directly to `dist/spa` to satisfy the Cloudflare Workers Assets contract. Svelte 5 Runes manage fine-grained reactive state, Tailwind CSS v4 provides styling, and an extracted framework-agnostic TypeScript upload service manages 95MB chunked multipart uploads directly to R2.

**Tech Stack:** SvelteKit 2, Svelte 5 (Runes), Bun 1.4+, Tailwind CSS v4 (`@tailwindcss/vite`), shadcn-svelte (Bits UI v1), Custom SVG Icons (`$lib/icons/`), mode-watcher, svelte-sonner, fflate, uqr, Svelte Markdown + Shiki.

**Spec:** [`docs/superpowers/specs/2026-09-26-sveltekit-gofile-redesign-design.md`](file:///home/quantavil/Documents/R2-Explorer/docs/superpowers/specs/2026-09-26-sveltekit-gofile-redesign-design.md)

---

## Global Constraints

- **Package Manager:** Must use Bun (`bun add`, `bun run build`, `bun test`) exclusively for the dashboard package.
- **Build Contract:** Output must build to `packages/dashboard/dist/spa` containing `index.html` and static assets.
- **Serverless Exclusivity:** Zero external databases (no D1, no KV, no external VPS). All persistence uses Cloudflare R2 bucket keys.
- **Icon Dependency Prohibition:** No `@lucide/svelte` or external icon packages. All icons must be native Svelte 5 components in `$lib/icons/`.
- **Zero Heavy Previews in Main Bundle:** Markdown parser, Shiki, and heavy preview logic must be lazy-loaded on demand via dynamic `import()`.
- **Upload API Compatibility:** Must preserve exact multipart chunking (95MB), base64 key encoding, and query parameters expected by `packages/worker`.

---

## Review Focus

1. **Large File Upload (>100MB):** Multipart upload must automatically split the file into 95MB chunks and call `/multipart/create`, `/multipart/upload`, and `/multipart/complete` without crashing browser memory.
2. **Password-Protected Share Link:** When visiting `/share/:shareId` with password protection, the page must show an unlock prompt and must not expose file contents until the correct SHA-256 validated password is provided.
3. **Deep Link Navigation in SPA:** Reloading a URL like `/files/bucket-name/subfolder/` must route to `index.html` via Cloudflare Workers Assets without throwing 404s.
4. **Folder Drop via WebKit:** Dropping a folder hierarchy via drag-and-drop must parse `webkitGetAsEntry` / `webkitRelativePath` and create folder keys ending in `/` before uploading contained files.
5. **Special Characters in Object Keys:** Keys with spaces, emoji, slashes, or unicode characters must be safely base64-encoded via `btoa(unescape(encodeURIComponent(key)))` matching the worker decoder.

---

## Task Decomposition

### Task 1: Scaffolding SvelteKit 2 with Bun, Tailwind CSS v4 & Adapter-Static

**Files:**
- Create: `packages/dashboard/package.json`
- Create: `packages/dashboard/svelte.config.js`
- Create: `packages/dashboard/vite.config.ts`
- Create: `packages/dashboard/tsconfig.json`
- Create: `packages/dashboard/src/app.html`
- Create: `packages/dashboard/src/app.css`
- Create: `packages/dashboard/src/routes/+layout.ts`
- Create: `packages/dashboard/src/routes/+layout.svelte`
- Create: `packages/dashboard/src/routes/+page.svelte`

**Interfaces:**
- Produces: Working SvelteKit 2 SPA build emitting to `packages/dashboard/dist/spa`
- Verifies: `bun run build` generates valid `dist/spa/index.html`

- [ ] **Step 1: Write new package.json and configuration files**
  Configure Bun dependencies: `@sveltejs/kit`, `@sveltejs/adapter-static`, `svelte`, `tailwindcss`, `@tailwindcss/vite`, `typescript`, `vite`, `mode-watcher`, `svelte-sonner`.
  Set adapter-static `pages: 'dist/spa'`, `assets: 'dist/spa'`, `fallback: 'index.html'`, `ssr: false`.

- [ ] **Step 2: Install dependencies using Bun**
  Run: `cd packages/dashboard && bun install`
  Expected: Clean install with `bun.lock` generated.

- [ ] **Step 3: Test compilation to dist/spa**
  Run: `cd packages/dashboard && bun run build`
  Expected: Successful compilation producing `packages/dashboard/dist/spa/index.html`.

- [ ] **Step 4: Verify monorepo build link**
  Run: `bun run --filter r2-explorer-dashboard build` from root.
  Expected: Success.

- [ ] **Step 5: Commit**
  ```bash
  git add packages/dashboard/
  git commit -m "chore: scaffold sveltekit 2 with bun, tailwind v4, and adapter-static"
  ```

---

### Task 2: Custom SVG Icon System (`$lib/icons/`) & Design Tokens

**Files:**
- Create: `packages/dashboard/src/lib/icons/Folder.svelte`
- Create: `packages/dashboard/src/lib/icons/File.svelte`
- Create: `packages/dashboard/src/lib/icons/Share.svelte`
- Create: `packages/dashboard/src/lib/icons/Download.svelte`
- Create: `packages/dashboard/src/lib/icons/Upload.svelte`
- Create: `packages/dashboard/src/lib/icons/Trash.svelte`
- Create: `packages/dashboard/src/lib/icons/Copy.svelte`
- Create: `packages/dashboard/src/lib/icons/Lock.svelte`
- Create: `packages/dashboard/src/lib/icons/Eye.svelte`
- Create: `packages/dashboard/src/lib/icons/Search.svelte`
- Create: `packages/dashboard/src/lib/icons/MoreVertical.svelte`
- Create: `packages/dashboard/src/lib/icons/ChevronRight.svelte`
- Create: `packages/dashboard/src/lib/icons/Check.svelte`
- Create: `packages/dashboard/src/lib/icons/Sun.svelte`
- Create: `packages/dashboard/src/lib/icons/Moon.svelte`
- Create: `packages/dashboard/src/lib/icons/index.ts`
- Test: `packages/dashboard/tests/unit/icons.test.ts`

**Interfaces:**
- Produces: `<Icon class="size-4 text-zinc-400" />` components with zero external dependencies.

- [ ] **Step 1: Write unit test verifying icon components render SVG tags**
  Write tests in `tests/unit/icons.test.ts` importing icons and checking `viewBox="0 0 24 24"`.

- [ ] **Step 2: Implement the 15 SVG icon components**
  Each icon accepts `class` and `size` props using Svelte 5 `$props()`.

- [ ] **Step 3: Run icon tests with Bun**
  Run: `cd packages/dashboard && bun test tests/unit/icons.test.ts`
  Expected: PASS.

- [ ] **Step 4: Commit**
  ```bash
  git add packages/dashboard/src/lib/icons packages/dashboard/tests/unit/icons.test.ts
  git commit -m "feat: add zero-dependency svelte 5 svg icon system"
  ```

---

### Task 3: Typed R2 API Client, Upload Service & Svelte 5 Stores

**Files:**
- Create: `packages/dashboard/src/lib/api/types.ts`
- Create: `packages/dashboard/src/lib/api/client.ts`
- Create: `packages/dashboard/src/lib/services/uploader.svelte.ts`
- Create: `packages/dashboard/src/lib/stores/main.svelte.ts`
- Test: `packages/dashboard/tests/unit/api.test.ts`
- Test: `packages/dashboard/tests/unit/uploader.test.ts`

**Interfaces:**
- Consumes: Worker API (`/api/server/config`, `/api/buckets/...`, `/api/multipart/...`)
- Produces: `apiClient`, `mainStore`, `uploadManager.queueUpload()`

- [ ] **Step 1: Write test for API client encoding and decoding**
  Test `encodeKey`, `decodeKey`, and bucket object normalization.

- [ ] **Step 2: Implement `api/client.ts` with native fetch**
  Port base64 key handling, exponential backoff retries, and REST methods without Axios.

- [ ] **Step 3: Implement `uploader.svelte.ts`**
  Handles 95MB chunking, upload progress calculation, cancellation, and retry logic.

- [ ] **Step 4: Implement `mainStore.svelte.ts` using Svelte 5 Runes**
  Class-based reactive store with `$state` for `buckets`, `currentBucket`, `readonly`, and `showHiddenFiles`.

- [ ] **Step 5: Run tests**
  Run: `cd packages/dashboard && bun test tests/unit/api.test.ts tests/unit/uploader.test.ts`
  Expected: PASS.

- [ ] **Step 6: Commit**
  ```bash
  git add packages/dashboard/src/lib/api packages/dashboard/src/lib/services packages/dashboard/src/lib/stores packages/dashboard/tests/
  git commit -m "feat: implement native r2 api client, uploader service, and svelte 5 store"
  ```

---

### Task 4: UI Primitives & App Shell Layout

**Files:**
- Create: `packages/dashboard/src/lib/components/ui/button.svelte`
- Create: `packages/dashboard/src/lib/components/ui/dialog.svelte`
- Create: `packages/dashboard/src/lib/components/ui/dropdown-menu.svelte`
- Create: `packages/dashboard/src/lib/components/ui/input.svelte`
- Create: `packages/dashboard/src/lib/components/ui/badge.svelte`
- Create: `packages/dashboard/src/lib/components/layout/Sidebar.svelte`
- Create: `packages/dashboard/src/lib/components/layout/Topbar.svelte`
- Create: `packages/dashboard/src/lib/components/layout/Breadcrumbs.svelte`
- Modify: `packages/dashboard/src/routes/+layout.svelte`

**Interfaces:**
- Produces: Responsive Personal Cloud layout with dark/light mode toggle, bucket switcher, search, and navigation.

- [ ] **Step 1: Implement accessible UI primitives with `bits-ui` and Tailwind v4**
  Build Button, Dialog, Dropdown, Input, and Badge with clean zinc/slate color palette.

- [ ] **Step 2: Implement Sidebar & Topbar**
  Include bucket picker dropdown, storage navigation, search bar, and mode-watcher theme toggle.

- [ ] **Step 3: Wire into `+layout.svelte` with `svelte-sonner` toast container**
  Ensure layout handles responsive mobile collapse and desktop persistence.

- [ ] **Step 4: Verify visually and compile**
  Run: `cd packages/dashboard && bun run build`
  Expected: PASS.

- [ ] **Step 5: Commit**
  ```bash
  git add packages/dashboard/src/lib/components packages/dashboard/src/routes/+layout.svelte
  git commit -m "feat: implement personal cloud app shell and core ui primitives"
  ```

---

### Task 5: File Explorer View (Table & Grid Views, Breadcrumbs & Actions)

**Files:**
- Create: `packages/dashboard/src/lib/components/files/FileRow.svelte`
- Create: `packages/dashboard/src/lib/components/files/FileCard.svelte`
- Create: `packages/dashboard/src/lib/components/files/FileContextMenu.svelte`
- Create: `packages/dashboard/src/lib/components/files/CreateFolderDialog.svelte`
- Create: `packages/dashboard/src/routes/files/[bucket]/[...folder]/+page.svelte`
- Test: `packages/dashboard/tests/unit/file-explorer.test.ts`

**Interfaces:**
- Consumes: `apiClient.listObjects`, `mainStore`
- Produces: Interactive file browsing, folder navigation, rename/delete/copy actions.

- [ ] **Step 1: Write test for folder listing and breadcrumb generation**
  Verify breadcrumbs parse subfolder slashes into clickable segment pills.

- [ ] **Step 2: Build Table and Grid view components**
  Support dual view toggle (compact list view vs. thumbnail grid view), sort by name/size/date.

- [ ] **Step 3: Implement Context Menu and File Actions**
  Right-click / three-dot context menu for Download, Share, Rename, Duplicate, and Delete.

- [ ] **Step 4: Implement Create Folder Modal**
  Direct R2 0-byte key creation with trailing `/`.

- [ ] **Step 5: Run tests**
  Run: `cd packages/dashboard && bun test tests/unit/file-explorer.test.ts`
  Expected: PASS.

- [ ] **Step 6: Commit**
  ```bash
  git add packages/dashboard/src/lib/components/files packages/dashboard/src/routes/files/ packages/dashboard/tests/
  git commit -m "feat: implement file explorer with dual views, context menu, and folder creation"
  ```

---

### Task 6: Full-Page Drag-and-Drop & Floating Upload Drawer

**Files:**
- Create: `packages/dashboard/src/lib/components/upload/DropZone.svelte`
- Create: `packages/dashboard/src/lib/components/upload/UploadDrawer.svelte`
- Modify: `packages/dashboard/src/routes/+layout.svelte`
- Test: `packages/dashboard/tests/unit/upload-drawer.test.ts`

**Interfaces:**
- Consumes: `uploadManager` from Task 3
- Produces: Seamless drag-and-drop file/folder ingestion and floating progress tray.

- [ ] **Step 1: Implement full-page `DropZone.svelte`**
  Handles window dragover/dragleave, shows animated dashed drop target with frosted glass backdrop.

- [ ] **Step 2: Add directory upload support via webkitdirectory**
  Recursively extracts folder entries and queues them to `uploadManager`.

- [ ] **Step 3: Build `UploadDrawer.svelte`**
  Floating bottom-right card with speed indicator, aggregate progress bar, per-file rows, and cancel controls.

- [ ] **Step 4: Verify build and test**
  Run: `cd packages/dashboard && bun run build`
  Expected: PASS.

- [ ] **Step 5: Commit**
  ```bash
  git add packages/dashboard/src/lib/components/upload packages/dashboard/src/routes/+layout.svelte
  git commit -m "feat: implement full-page dropzone and floating upload progress drawer"
  ```

---

### Task 7: Lazy-Loaded File Preview Modal (Media, PDF, Markdown + Shiki)

**Files:**
- Create: `packages/dashboard/src/lib/components/preview/PreviewModal.svelte`
- Create: `packages/dashboard/src/lib/components/preview/MarkdownViewer.svelte`
- Create: `packages/dashboard/src/lib/components/preview/CodeViewer.svelte`
- Create: `packages/dashboard/src/lib/components/preview/MediaViewer.svelte`
- Test: `packages/dashboard/tests/unit/preview.test.ts`

**Interfaces:**
- Consumes: Object URL from R2 streaming endpoint
- Produces: Instant in-browser preview without initial bundle weight.

- [ ] **Step 1: Implement dynamic import loaders**
  Ensure Shiki and Svelte Markdown are only imported when `PreviewModal` is opened for relevant file types.

- [ ] **Step 2: Build `MediaViewer.svelte` and PDF embed**
  Native `<video>`, `<audio>`, `<img>`, and `<iframe src={blobUrl}>` for zero-overhead streaming.

- [ ] **Step 3: Build `MarkdownViewer.svelte` & `CodeViewer.svelte`**
  Svelte Markdown with Shiki syntax highlighting, copy-code button, and language tag.

- [ ] **Step 4: Test preview modal rendering**
  Run: `cd packages/dashboard && bun test tests/unit/preview.test.ts`
  Expected: PASS.

- [ ] **Step 5: Commit**
  ```bash
  git add packages/dashboard/src/lib/components/preview packages/dashboard/tests/unit/preview.test.ts
  git commit -m "feat: implement lazy-loaded preview modal with shiki and svelte markdown"
  ```

---

### Task 8: Share Management & Gofile-Style Public Share Page (`/share/:shareId`)

**Files:**
- Create: `packages/dashboard/src/lib/components/share/CreateShareModal.svelte`
- Create: `packages/dashboard/src/lib/components/share/ManageSharesModal.svelte`
- Create: `packages/dashboard/src/routes/share/[shareId]/+page.svelte`
- Create: `packages/dashboard/src/lib/components/share/PublicShareCard.svelte`
- Modify: `packages/worker/src/index.ts:145-155` (Worker routing adjustment for HTML vs file stream)
- Test: `packages/dashboard/tests/unit/share.test.ts`

**Interfaces:**
- Consumes: `/api/buckets/:bucket/:key/share`, `/share/:shareId`
- Produces: Gofile-style public share view with countdown timer, password unlock, inline preview, QR code (`uqr`), and 1-click download.

- [ ] **Step 1: Build `CreateShareModal.svelte`**
  Input fields for expiration (1h, 24h, 7d, 30d, Never), optional password, max downloads. Generates instant copyable share link and mobile QR code via `uqr`.

- [ ] **Step 2: Build `ManageSharesModal.svelte`**
  Table showing active share links, download counts, expiration countdowns, and revoke buttons.

- [ ] **Step 3: Build Gofile-style Public Share View (`/share/[shareId]/+page.svelte`)**
  Sleek centered card displaying file name, badge, formatted size, expiration countdown, direct download button, and inline preview.

- [ ] **Step 4: Add Password Unlock Form**
  If share is password protected (401), displays clean unlock card; on correct password, unlocks direct download and preview.

- [ ] **Step 5: Adjust Worker routing to serve SPA for HTML navigations**
  Ensure visiting `/share/:shareId` in a browser renders the public share card.

- [ ] **Step 6: Run share tests**
  Run: `cd packages/dashboard && bun test tests/unit/share.test.ts`
  Expected: PASS.

- [ ] **Step 7: Commit**
  ```bash
  git add packages/dashboard/src/lib/components/share packages/dashboard/src/routes/share packages/worker/src/index.ts
  git commit -m "feat: implement gofile-style public share page and share management"
  ```

---

### Task 9: Monorepo Integration, Verification & Production Build with Bun

**Files:**
- Modify: `package.json` (root scripts to use `bun --filter` where appropriate)
- Modify: `packages/worker/package.json` (ensure `build` copies `../dashboard/dist/spa` correctly)
- Test: Monorepo build, Worker integration tests, Playwright E2E tests

**Interfaces:**
- Produces: Complete production build ready for deployment via `wrangler`.

- [ ] **Step 1: Run dashboard production build with Bun**
  Run: `cd packages/dashboard && bun run build`
  Expected: Output generated in `packages/dashboard/dist/spa/` with total gzipped payload < 50 KB.

- [ ] **Step 2: Run root build**
  Run: `bun run build` (or `pnpm run build` root pipeline)
  Expected: Worker compiles and embeds `packages/dashboard/dist/spa/` into `packages/worker/dashboard/`.

- [ ] **Step 3: Run Worker integration tests**
  Run: `pnpm --filter r2-explorer test`
  Expected: All 88 tests pass.

- [ ] **Step 4: Run Playwright E2E tests**
  Run: `pnpm test:e2e`
  Expected: E2E tests pass against the new SvelteKit SPA.

- [ ] **Step 5: Run linter**
  Run: `pnpm lint`
  Expected: Clean pass with 0 errors.

- [ ] **Step 6: Final Commit**
  ```bash
  git add .
  git commit -m "chore: complete migration to sveltekit 2 with bun and verified builds"
  ```
