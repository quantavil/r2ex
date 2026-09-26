# My Personal r2ex

This is my personal r2ex application self hosted on my Cloudflare account.

## Get started

1. Sign up for [Cloudflare Workers](https://workers.dev).
2. Clone this project and install dependencies:
   ```bash
   bun install
   ```
3. Run `wrangler login` to login to your Cloudflare account.
4. Run `wrangler deploy` to publish to Cloudflare Workers.

### Optional Steps

1. Read only mode is enabled by default. Disable it in `src/index.ts` if you want full write access:
   ```ts
   export default r2ex({ readonly: false });
   ```

## Updating

Install the latest version:

```bash
bun add r2ex@latest
```

Deploy to Cloudflare Workers:

```bash
wrangler deploy
```
