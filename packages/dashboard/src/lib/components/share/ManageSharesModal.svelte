<script lang="ts">
  import { Dialog } from 'bits-ui';
  import { toast } from 'svelte-sonner';
  import { listShares, deleteShareLink } from './api';
  import { copyToClipboard, formatCountdown, formatDate } from './utils';
  import type { ShareItem } from './types';
  import Icon from './Icon.svelte';

  let {
    open = $bindable(false),
    bucket
  }: {
    open?: boolean;
    bucket: string;
  } = $props();

  let shares = $state<ShareItem[]>([]);
  let isLoading = $state(false);
  let searchQuery = $state('');
  let revokingId = $state<string | null>(null);
  let copiedId = $state<string | null>(null);

  // Load shares when modal opens or bucket changes
  $effect(() => {
    if (open && bucket) {
      loadShares();
    }
  });

  async function loadShares() {
    if (!bucket) return;
    isLoading = true;
    try {
      shares = await listShares(bucket);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load share links');
      shares = [];
    } finally {
      isLoading = false;
    }
  }

  async function handleRevoke(share: ShareItem) {
    if (!bucket) return;
    revokingId = share.shareId;
    try {
      const ok = await deleteShareLink(bucket, share.shareId);
      if (ok) {
        shares = shares.filter((s) => s.shareId !== share.shareId);
        toast.success(`Revoked share link for ${share.key.split('/').pop()}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to revoke share link');
    } finally {
      revokingId = null;
    }
  }

  async function handleCopy(share: ShareItem) {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = share.shareUrl || `${origin}/share/${share.shareId}`;
    const ok = await copyToClipboard(url);
    if (ok) {
      copiedId = share.shareId;
      toast.success('Share link copied to clipboard');
      setTimeout(() => {
        if (copiedId === share.shareId) copiedId = null;
      }, 2000);
    } else {
      toast.error('Could not copy link');
    }
  }

  let filteredShares = $derived(
    shares.filter((s) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const filename = s.key.split('/').pop()?.toLowerCase() || '';
      return filename.includes(q) || s.key.toLowerCase().includes(q) || s.shareId.toLowerCase().includes(q);
    })
  );
</script>

<Dialog.Root bind:open>
  <Dialog.Portal>
    <Dialog.Overlay
      class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
    />
    <Dialog.Content
      class="fixed left-1/2 top-1/2 z-50 w-full max-w-4xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl transition-all duration-200 dark:border-zinc-800 dark:bg-zinc-950 sm:p-7 max-h-[90vh] flex flex-col"
    >
      <!-- Header -->
      <div class="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div class="flex items-center gap-3">
          <div
            class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400"
          >
            <Icon name="link" class="size-5" />
          </div>
          <div>
            <Dialog.Title class="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Active Share Links
            </Dialog.Title>
            <Dialog.Description class="text-xs text-zinc-500 dark:text-zinc-400">
              Manage public sharing links and download permissions for <span class="font-medium text-zinc-700 dark:text-zinc-300">{bucket}</span>
            </Dialog.Description>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            title="Refresh list"
            onclick={loadShares}
            disabled={isLoading}
          >
            <Icon name="refresh" class="size-4 {isLoading ? 'animate-spin' : ''}" />
          </button>
          <Dialog.Close
            class="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors dark:hover:bg-zinc-900 dark:hover:text-zinc-200 cursor-pointer"
          >
            <Icon name="close" class="size-4" />
            <span class="sr-only">Close</span>
          </Dialog.Close>
        </div>
      </div>

      <!-- Search & Status Bar -->
      <div class="mt-4 flex items-center justify-between gap-3">
        <div class="relative flex-1 max-w-sm">
          <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
            <Icon name="search" class="size-3.5" />
          </div>
          <input
            type="text"
            placeholder="Search by filename or ID..."
            bind:value={searchQuery}
            class="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-1.5 pl-9 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:bg-white focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
        </div>
        <div class="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
          {shares.length} {shares.length === 1 ? 'active link' : 'active links'}
        </div>
      </div>

      <!-- Table Area -->
      <div class="mt-4 flex-1 overflow-x-auto overflow-y-auto min-h-[260px] max-h-[50vh] rounded-xl border border-zinc-200 dark:border-zinc-800">
        {#if isLoading}
          <div class="flex flex-col items-center justify-center py-20 text-zinc-400">
            <Icon name="spinner" class="size-8 animate-spin text-blue-500 mb-2" />
            <p class="text-xs">Loading share links...</p>
          </div>
        {:else if filteredShares.length === 0}
          <div class="flex flex-col items-center justify-center py-20 text-center px-4">
            <div class="size-12 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-400 mb-3">
              <Icon name="link" class="size-6" />
            </div>
            <p class="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {searchQuery ? 'No matching share links found' : 'No active share links'}
            </p>
            <p class="text-xs text-zinc-400 dark:text-zinc-500 mt-1 max-w-xs">
              {searchQuery
                ? 'Try searching with a different filename or clear the search query.'
                : 'Create shareable public links from any file context menu.'}
            </p>
          </div>
        {:else}
          <table class="w-full text-left border-collapse text-xs">
            <thead class="sticky top-0 bg-zinc-50 dark:bg-zinc-900/90 backdrop-blur-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[10px] font-semibold border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th class="py-3 px-4">File Name</th>
                <th class="py-3 px-3">Share Link</th>
                <th class="py-3 px-3">Expiration</th>
                <th class="py-3 px-3">Downloads</th>
                <th class="py-3 px-3">Created</th>
                <th class="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-zinc-700 dark:text-zinc-300">
              {#each filteredShares as share (share.shareId)}
                {@const countdown = formatCountdown(share.expiresAt)}
                {@const filename = share.key.split('/').pop() || share.key}
                <tr class="hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40 transition-colors">
                  <!-- File Name -->
                  <td class="py-3 px-4 max-w-[200px]">
                    <div class="flex items-center gap-2">
                      <Icon name="file" class="size-4 shrink-0 text-blue-500" />
                      <div class="truncate font-medium text-zinc-900 dark:text-zinc-100" title={share.key}>
                        {filename}
                      </div>
                      {#if share.hasPassword}
                        <span
                          class="inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-400"
                          title="Password protected"
                        >
                          <Icon name="lock" class="size-3 mr-0.5" />
                        </span>
                      {/if}
                    </div>
                  </td>

                  <!-- Share Link -->
                  <td class="py-3 px-3 max-w-[180px]">
                    <div class="flex items-center gap-1.5">
                      <span class="truncate font-mono text-[11px] text-zinc-500 dark:text-zinc-400" title={share.shareUrl}>
                        /share/{share.shareId}
                      </span>
                      <button
                        type="button"
                        class="p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        title="Copy link"
                        onclick={() => handleCopy(share)}
                      >
                        <Icon name={copiedId === share.shareId ? 'check' : 'copy'} class="size-3.5 {copiedId === share.shareId ? 'text-emerald-500' : ''}" />
                      </button>
                      <a
                        href={share.shareUrl}
                        target="_blank"
                        rel="noreferrer"
                        class="p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                        title="Open link"
                      >
                        <Icon name="external-link" class="size-3.5" />
                      </a>
                    </div>
                  </td>

                  <!-- Expiration Countdown -->
                  <td class="py-3 px-3 whitespace-nowrap">
                    {#if countdown.isExpired}
                      <span class="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700 ring-1 ring-rose-600/20 dark:bg-rose-950/40 dark:text-rose-400">
                        Expired
                      </span>
                    {:else if countdown.isPermanent}
                      <span class="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        Permanent
                      </span>
                    {:else}
                      <span class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium {countdown.urgent
                        ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-400'
                        : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-400'}">
                        <Icon name="clock" class="size-3 mr-1" />
                        {countdown.text}
                      </span>
                    {/if}
                  </td>

                  <!-- Downloads Used -->
                  <td class="py-3 px-3 whitespace-nowrap">
                    <span class="font-medium text-zinc-900 dark:text-zinc-100">
                      {share.currentDownloads}
                    </span>
                    <span class="text-zinc-400">
                      / {share.maxDownloads ? share.maxDownloads : '∞'}
                    </span>
                  </td>

                  <!-- Created At -->
                  <td class="py-3 px-3 whitespace-nowrap text-zinc-500 dark:text-zinc-400 text-[11px]">
                    {formatDate(share.createdAt)}
                  </td>

                  <!-- Revoke Action -->
                  <td class="py-3 px-4 text-right whitespace-nowrap">
                    <button
                      type="button"
                      class="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 transition-colors cursor-pointer disabled:opacity-50"
                      title="Revoke and delete this share link"
                      disabled={revokingId === share.shareId}
                      onclick={() => handleRevoke(share)}
                    >
                      {#if revokingId === share.shareId}
                        <Icon name="spinner" class="size-3.5 animate-spin" />
                        <span>Revoking...</span>
                      {:else}
                        <Icon name="trash" class="size-3.5" />
                        <span>Revoke</span>
                      {/if}
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        {/if}
      </div>

      <!-- Footer -->
      <div class="mt-5 flex items-center justify-end pt-3 border-t border-zinc-100 dark:border-zinc-800">
        <button
          type="button"
          class="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white transition-colors cursor-pointer"
          onclick={() => (open = false)}
        >
          Close
        </button>
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
