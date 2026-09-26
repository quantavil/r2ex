<script lang="ts">
  import { Dialog } from 'bits-ui';
  import { toast } from 'svelte-sonner';
  import { renderSVG } from 'uqr';
  import { createShareLink } from './api';
  import { copyToClipboard } from './utils';
  import Icon from './Icon.svelte';

  let {
    open = $bindable(false),
    bucket,
    fileKey,
    fileName
  }: {
    open?: boolean;
    bucket: string;
    fileKey: string;
    fileName?: string;
  } = $props();

  const presets = [
    { label: '1 hour', seconds: 3600 },
    { label: '24 hours', seconds: 86400 },
    { label: '7 days', seconds: 604800 },
    { label: '30 days', seconds: 2592000 },
    { label: 'Never', seconds: 0 }
  ];

  let selectedPreset = $state(86400); // Default to 24 hours
  let password = $state('');
  let showPassword = $state(false);
  let maxDownloads = $state<number | undefined>(undefined);
  let isSubmitting = $state(false);

  // Result state
  let createdShareUrl = $state('');
  let createdShareId = $state('');
  let createdExpiresAt = $state<number | undefined>(undefined);
  let qrSvg = $state('');
  let isCopied = $state(false);

  let displayName = $derived(fileName || fileKey?.split('/').pop() || 'Selected file');

  function resetForm() {
    selectedPreset = 86400;
    password = '';
    showPassword = false;
    maxDownloads = undefined;
    createdShareUrl = '';
    createdShareId = '';
    createdExpiresAt = undefined;
    qrSvg = '';
    isCopied = false;
    isSubmitting = false;
  }

  // Generate QR code whenever createdShareUrl changes
  $effect(() => {
    if (createdShareUrl) {
      try {
        qrSvg = renderSVG(createdShareUrl, {
          pixelSize: 6,
          whiteColor: '#ffffff',
          blackColor: '#09090b',
          border: 2
        });
      } catch (err) {
        console.error('Failed to generate QR code', err);
        qrSvg = '';
      }
    } else {
      qrSvg = '';
    }
  });

  async function handleCreate() {
    if (!bucket || !fileKey) {
      toast.error('Missing bucket or file information');
      return;
    }

    isSubmitting = true;
    try {
      const options: {
        expiresIn?: number;
        password?: string;
        maxDownloads?: number;
      } = {};

      if (selectedPreset > 0) {
        options.expiresIn = selectedPreset;
      }

      if (password.trim().length > 0) {
        options.password = password.trim();
      }

      if (maxDownloads && maxDownloads > 0) {
        options.maxDownloads = Math.floor(maxDownloads);
      }

      const res = await createShareLink(bucket, fileKey, options);

      // Determine absolute share URL
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      createdShareUrl = res.shareUrl || `${origin}/share/${res.shareId}`;
      createdShareId = res.shareId;
      createdExpiresAt = res.expiresAt;

      toast.success('Share link generated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create share link');
    } finally {
      isSubmitting = false;
    }
  }

  async function handleCopy() {
    if (!createdShareUrl) return;
    const ok = await copyToClipboard(createdShareUrl);
    if (ok) {
      isCopied = true;
      toast.success('Share link copied to clipboard');
      setTimeout(() => {
        isCopied = false;
      }, 2500);
    } else {
      toast.error('Could not copy link');
    }
  }

  function handleDownloadQr() {
    if (!qrSvg) return;
    const blob = new Blob([qrSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `share-qr-${createdShareId || 'code'}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('QR code SVG downloaded');
  }
</script>

<Dialog.Root
  bind:open
  onOpenChange={(next) => {
    if (!next) {
      setTimeout(resetForm, 200);
    }
  }}
>
  <Dialog.Portal>
    <Dialog.Overlay
      class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
    />
    <Dialog.Content
      class="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl transition-all duration-200 dark:border-zinc-800 dark:bg-zinc-950 sm:p-7 max-h-[90vh] overflow-y-auto"
    >
      <!-- Header -->
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-center gap-3">
          <div
            class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400"
          >
            <Icon name="share" class="size-5" />
          </div>
          <div>
            <Dialog.Title class="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Share File
            </Dialog.Title>
            <Dialog.Description class="line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">
              {displayName}
            </Dialog.Description>
          </div>
        </div>

        <Dialog.Close
          class="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
        >
          <Icon name="close" class="size-4" />
          <span class="sr-only">Close</span>
        </Dialog.Close>
      </div>

      {#if !createdShareUrl}
        <!-- Form View -->
        <div class="mt-6 space-y-5">
          <!-- Expiration Presets -->
          <div>
            <span class="block text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
              Link Expiration
            </span>
            <div class="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {#each presets as preset}
                <button
                  type="button"
                  class="flex items-center justify-center py-2 px-2.5 rounded-lg text-xs font-medium border transition-all cursor-pointer {selectedPreset === preset.seconds
                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold shadow-xs dark:border-blue-500 dark:bg-blue-950/60 dark:text-blue-300'
                    : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400 dark:hover:bg-zinc-900'}"
                  onclick={() => (selectedPreset = preset.seconds)}
                >
                  {preset.label}
                </button>
              {/each}
            </div>
          </div>

          <!-- Password Field -->
          <div>
            <label
              for="share-password"
              class="block text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2"
            >
              Password Protection <span class="text-zinc-400 normal-case">(optional)</span>
            </label>
            <div class="relative">
              <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                <Icon name="lock" class="size-4" />
              </div>
              <input
                id="share-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Leave blank for public access"
                bind:value={password}
                class="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-10 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-all dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-blue-400 dark:focus:bg-zinc-950"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                onclick={() => (showPassword = !showPassword)}
                tabindex="-1"
              >
                <Icon name={showPassword ? 'eye-off' : 'eye'} class="size-4" />
              </button>
            </div>
            <p class="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
              Visitors must enter this password to view and download the file.
            </p>
          </div>

          <!-- Max Downloads -->
          <div>
            <label
              for="max-downloads"
              class="block text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2"
            >
              Maximum Downloads <span class="text-zinc-400 normal-case">(optional)</span>
            </label>
            <div class="relative">
              <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                <Icon name="download" class="size-4" />
              </div>
              <input
                id="max-downloads"
                type="number"
                min="1"
                placeholder="Unlimited downloads"
                bind:value={maxDownloads}
                class="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-all dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-blue-400 dark:focus:bg-zinc-950"
              />
            </div>
            <p class="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
              Link will automatically expire once this download count is reached.
            </p>
          </div>

          <!-- Actions -->
          <div class="mt-8 flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
            <button
              type="button"
              class="rounded-xl px-4 py-2.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
              onclick={() => (open = false)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              class="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-500 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer dark:bg-blue-500 dark:hover:bg-blue-400"
              onclick={handleCreate}
            >
              {#if isSubmitting}
                <Icon name="spinner" class="size-3.5 animate-spin" />
                Generating...
              {:else}
                <Icon name="link" class="size-3.5" />
                Create Share Link
              {/if}
            </button>
          </div>
        </div>
      {:else}
        <!-- Success View with Link & Instant QR Code -->
        <div class="mt-6 space-y-6">
          <div
            class="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-emerald-800 dark:border-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-300 flex items-center gap-2.5 text-xs"
          >
            <Icon name="check" class="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Public share link is active and ready to distribute.</span>
          </div>

          <!-- URL and 1-Click Copy -->
          <div>
            <label for="shareable-link-input" class="block text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
              Shareable Link
            </label>
            <div class="flex items-center gap-2">
              <input
                id="shareable-link-input"
                type="text"
                readonly
                value={createdShareUrl}
                class="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 px-3.5 font-mono text-xs text-zinc-900 select-all focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              />
              <button
                type="button"
                class="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs font-medium text-zinc-800 shadow-xs hover:bg-zinc-50 active:scale-95 transition-all cursor-pointer dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                onclick={handleCopy}
              >
                {#if isCopied}
                  <Icon name="check" class="size-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Copied</span>
                {:else}
                  <Icon name="copy" class="size-3.5" />
                  <span>Copy</span>
                {/if}
              </button>
            </div>
          </div>

          <!-- QR Code Section -->
          <div class="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
            <div class="flex flex-col sm:flex-row items-center gap-4">
              {#if qrSvg}
                <div class="size-32 rounded-xl bg-white p-2 shadow-xs ring-1 ring-zinc-200 dark:ring-zinc-800 flex items-center justify-center shrink-0">
                  <div class="size-full [&>svg]:size-full">
                    {@html qrSvg}
                  </div>
                </div>
              {/if}

              <div class="space-y-2 text-center sm:text-left flex-1">
                <h4 class="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Instant QR Code
                </h4>
                <p class="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Scan to immediately download or view on mobile devices without typing the URL.
                </p>
                <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <button
                    type="button"
                    class="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors cursor-pointer"
                    onclick={handleDownloadQr}
                  >
                    <Icon name="download" class="size-3" />
                    Download SVG
                  </button>
                  <span class="text-zinc-300 dark:text-zinc-700">•</span>
                  <a
                    href={createdShareUrl}
                    target="_blank"
                    rel="noreferrer"
                    class="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                  >
                    <Icon name="external-link" class="size-3" />
                    Open in Tab
                  </a>
                </div>
              </div>
            </div>
          </div>

          <!-- Done / Create Another -->
          <div class="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              class="text-xs text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              onclick={resetForm}
            >
              Create another link
            </button>
            <button
              type="button"
              class="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white transition-colors cursor-pointer"
              onclick={() => (open = false)}
            >
              Done
            </button>
          </div>
        </div>
      {/if}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
