<script lang="ts">
  import { page } from '$app/state';
  import PublicShareCard from '$lib/components/share/PublicShareCard.svelte';
  import Icon from '$lib/components/share/Icon.svelte';

  let shareId = $derived(page.params.shareId || '');
</script>

<svelte:head>
  <title>Shared File | R2 Explorer</title>
  <meta name="description" content="Download shared file directly from Cloudflare R2" />
</svelte:head>

<div class="min-h-screen flex flex-col justify-between bg-zinc-50 text-zinc-900 selection:bg-blue-500 selection:text-white dark:bg-zinc-950 dark:text-zinc-100 transition-colors duration-200">
  <!-- Minimal Top Navigation -->
  <header class="w-full border-b border-zinc-200/60 bg-white/70 backdrop-blur-md dark:border-zinc-900/80 dark:bg-zinc-950/70">
    <div class="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
      <!-- Brand Logo -->
      <a href="/" class="flex items-center gap-2.5 font-bold tracking-tight text-sm hover:opacity-80 transition-opacity">
        <div class="flex size-8 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-xs">
          <Icon name="sparkles" class="size-4" />
        </div>
        <span class="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-600 bg-clip-text text-transparent dark:from-white dark:via-zinc-200 dark:to-zinc-400 font-semibold">
          R2 Explorer
        </span>
      </a>

      <!-- Minimal right link -->
      <div class="flex items-center gap-3">
        <a
          href="/"
          class="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-zinc-600 shadow-2xs hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
        >
          <Icon name="external-link" class="size-3" />
          <span>r2ex</span>
        </a>
      </div>
    </div>
  </header>

  <!-- Main Content Area -->
  <main class="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
    {#if shareId}
      <PublicShareCard {shareId} />
    {:else}
      <div class="text-center space-y-2">
        <p class="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Invalid Share URL</p>
        <p class="text-xs text-zinc-500 dark:text-zinc-400">No share ID specified.</p>
      </div>
    {/if}
  </main>

  <!-- Minimal Footer -->
  <footer class="w-full py-4 text-center text-xs text-zinc-400 dark:text-zinc-600 border-t border-zinc-200/40 dark:border-zinc-900/40">
    <p>r2ex • Self-hosted Cloudflare R2 Storage Interface</p>
  </footer>
</div>
