<script lang="ts">
  import { toast } from 'svelte-sonner';
  import { copyToClipboard } from '../share/utils';
  import Icon from '../share/Icon.svelte';

  let {
    content = '',
    fileName = 'source.txt',
    language = ''
  }: {
    content?: string;
    fileName?: string;
    language?: string;
  } = $props();

  let isCopied = $state(false);
  let wrapLines = $state(false);

  let lines = $derived(content.split('\n'));
  let lineCount = $derived(lines.length);

  async function handleCopy() {
    const ok = await copyToClipboard(content);
    if (ok) {
      isCopied = true;
      toast.success('Code copied to clipboard');
      setTimeout(() => {
        isCopied = false;
      }, 2000);
    } else {
      toast.error('Failed to copy code');
    }
  }
</script>

<div class="flex size-full flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 text-zinc-100 font-mono text-xs">
  <!-- Top Toolbar -->
  <div class="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-4 py-2.5 backdrop-blur-md select-none">
    <div class="flex items-center gap-3">
      <div class="flex items-center gap-1.5">
        <span class="size-2.5 rounded-full bg-rose-500/80"></span>
        <span class="size-2.5 rounded-full bg-amber-500/80"></span>
        <span class="size-2.5 rounded-full bg-emerald-500/80"></span>
      </div>
      <span class="text-xs font-semibold text-zinc-300 truncate max-w-xs">{fileName}</span>
      <span class="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
        {lineCount} {lineCount === 1 ? 'line' : 'lines'}
      </span>
    </div>

    <div class="flex items-center gap-2">
      <!-- Toggle Word Wrap -->
      <button
        type="button"
        class="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors cursor-pointer {wrapLines ? 'bg-zinc-800 text-zinc-200' : ''}"
        onclick={() => (wrapLines = !wrapLines)}
        title="Toggle word wrap"
      >
        <span>Wrap</span>
      </button>

      <!-- 1-Click Copy Code Button -->
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/80 px-2.5 py-1 text-[11px] font-medium text-zinc-200 hover:bg-zinc-700 active:scale-95 transition-all cursor-pointer"
        onclick={handleCopy}
      >
        {#if isCopied}
          <Icon name="check" class="size-3 text-emerald-400" />
          <span class="text-emerald-400">Copied!</span>
        {:else}
          <Icon name="copy" class="size-3 text-zinc-400" />
          <span>Copy Code</span>
        {/if}
      </button>
    </div>
  </div>

  <!-- Code Body with Gutter & Line Numbers -->
  <div class="flex-1 overflow-auto p-2 sm:p-4 {wrapLines ? 'overflow-x-hidden' : 'overflow-x-auto'}">
    <div class="w-full font-mono text-xs leading-relaxed">
      {#each lines as line, index}
        <div class="flex hover:bg-zinc-900/60 transition-colors group">
          <!-- Line Number Gutter -->
          <div
            class="w-12 select-none pr-4 text-right font-mono text-[11px] text-zinc-600 group-hover:text-zinc-400 align-top shrink-0"
          >
            {index + 1}
          </div>
          <!-- Code Text -->
          <div class="flex-1 pr-4 {wrapLines ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'} text-zinc-200 select-text">
            {line || ' '}
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>
