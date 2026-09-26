# Development Instructions for r2ex

## Monorepo Workflow

Managed with **Bun workspaces**:

```bash
# Install dependencies
bun install

# Run type check and Svelte diagnostics
bun run check

# Check dead code with Knip
bun x knip

# Lint with Biome
bun run lint

# Run all test suites
bun run test

# Build monorepo
bun run build
```

## Running Dev Server

```bash
# In packages/dashboard
cd packages/dashboard && bun run dev

# In packages/worker/dev
cd packages/worker/dev && bun run start
```
