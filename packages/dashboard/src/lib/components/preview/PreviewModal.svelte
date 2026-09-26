<script lang="ts">
  import { Dialog } from 'bits-ui';
  import { toast } from 'svelte-sonner';
  import { encodeKey, formatBytes, getMediaType } from '../share/utils';
  import type { MediaType } from '../share/types';
  import Icon from '../share/Icon.svelte';
  import MediaViewer from './MediaViewer.svelte';
  import CodeViewer from './CodeViewer.svelte';

  let {
    open = $bindable(false),
    bucket,
    fileKey,
    fileName = '',
    fileSize = 0,
    contentType = ''
  }: {
    open?: boolean;
    bucket: string;
    fileKey: string;
    fileName?: string;
    fileSize?: number;
    contentType?: string;
  } = $props();

  let isLoading = $state(false);
  let error = $state<string | null>(null);
  let isFullScreen = $state(false);

  // Content states
  let textContent = $state('');
  let blobUrl = $state<string | null>(null);
  let detectedType = $state<MediaType>('unknown');

  let displayName = $derived(fileName || fileKey?.split('/').pop() || 'File Preview');
  let downloadUrl = $derived.by(() => {
    if (!bucket || !fileKey) return '';
    return `/api/buckets/${encodeURIComponent(bucket)}/${encodeKey(fileKey)}`;
  });

  // Watch for open and fileKey changes
  $effect(() => {
    if (open && bucket && fileKey) {
      loadFile();
    } else if (!open) {
      cleanup();
    }
  });

  function cleanup() {
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      blobUrl = null;
    }
    textContent = '';
    error = null;
    isLoading = false;
  }

  async function loadFile() {
    cleanup();
    isLoading = true;
    error = null;

    detectedType = getMediaType(displayName, contentType);

    try {
      const res = await fetch(downloadUrl);
      if (!res.ok) {
        throw new Error(`Failed to load file (${res.status} ${res.statusText})`);
      }

      if (['image', 'video', 'audio', 'pdf'].includes(detectedType)) {
        const blob = await res.blob();
        blobUrl = URL.createObjectURL(blob);
      } else if (['code', 'text'].includes(detectedType)) {
        textContent = await res.text();
      } else {
        // Unknown type: test if it's text or binary
        const typeHeader = res.headers.get('content-type') || '';
        if (typeHeader.startsWith('text/') || typeHeader.includes('json') || typeHeader.includes('xml')) {
          detectedType = 'text';
          textContent = await res.text();
        } else {
          // Keep as unknown binary
          detectedType = 'unknown';
        }
      }
    } catch (err: any) {
      console.error('File load error', err);
      error = err.message || 'Unable to preview file';
    } finally {
      isLoading = false;
    }
  }

  function handleDownload() {
    if (!downloadUrl) return;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = displayName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Download initiated');
  }
</script>

<Dialog.Root
  bind:open
  onOpenChange={(next) => {
    if (!next) cleanup();
  }}
>
  <Dialog.Portal>
    <Dialog.Overlay
      class="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs transition-opacity data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
    />
    <Dialog.Content
      class="fixed left-1/2 top-1/2 z-50 flex flex-col -translate-x-1/2 -translate-y-1/2 border border-zinc-200 bg-white shadow-2xl transition-all duration-200 dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden {isFullScreen
        ? 'inset-2 sm:inset-4 rounded-2xl w-auto h-auto'
        : 'w-[95vw] max-w-5xl h-[88vh] rounded-2xl'}"
    >
      <!-- Modal Header -->
      <div
        class="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 px-4 sm:px-6 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/60 backdrop-blur-xs select-none"
      >
        <!-- File Name and Details -->
        <div class="flex items-center gap-3 min-w-0">
          <div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
            <Icon name={detectedType === 'image' ? 'image' : detectedType === 'video' ? 'video' : detectedType === 'audio' ? 'audio' : detectedType === 'code' ? 'code' : 'file'} class="size-4" />
          </div>
          <div class="min-w-0 flex items-center gap-2">
            <Dialog.Title class="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100" title={fileKey}>
              {displayName}
            </Dialog.Title>
            {#if fileSize > 0}
              <span class="shrink-0 rounded-md bg-zinc-200/60 px-2 py-0.5 text-[10px] font-mono font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {formatBytes(fileSize)}
              </span>
            {/if}
          </div>
        </div>

        <!-- Action Controls -->
        <div class="flex items-center gap-1.5 shrink-0 ml-3">
          <!-- Download Button -->
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 transition-colors cursor-pointer"
            onclick={handleDownload}
            title="Download file"
          >
            <Icon name="download" class="size-3.5" />
            <span class="hidden sm:inline">Download</span>
          </button>

          <!-- Fullscreen Toggle Button -->
          <button
            type="button"
            class="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 transition-colors cursor-pointer"
            onclick={() => (isFullScreen = !isFullScreen)}
            title={isFullScreen ? 'Exit full screen' : 'Full screen'}
          >
            <Icon name={isFullScreen ? 'minimize' : 'maximize'} class="size-4" />
          </button>

          <div class="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-1"></div>

          <!-- Close Button -->
          <Dialog.Close
            class="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-200/60 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <Icon name="close" class="size-4" />
            <span class="sr-only">Close</span>
          </Dialog.Close>
        </div>
      </div>

      <!-- Preview Body -->
      <div class="relative flex-1 overflow-hidden bg-zinc-100/50 dark:bg-zinc-950/60">
        {#if isLoading}
          <!-- Loading State -->
          <div class="flex size-full flex-col items-center justify-center space-y-3">
            <Icon name="spinner" class="size-8 animate-spin text-blue-500" />
            <p class="text-xs text-zinc-500 dark:text-zinc-400">Loading preview...</p>
          </div>
        {:else if error}
          <!-- Error State -->
          <div class="flex size-full flex-col items-center justify-center p-6 text-center space-y-4">
            <div class="flex size-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
              <Icon name="alert-circle" class="size-7" />
            </div>
            <div class="space-y-1">
              <h4 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Unable to Preview</h4>
              <p class="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm">{error}</p>
            </div>
            <div class="flex items-center gap-3">
              <button
                type="button"
                class="rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                onclick={loadFile}
              >
                Retry
              </button>
              <button
                type="button"
                class="rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors cursor-pointer"
                onclick={handleDownload}
              >
                Download File
              </button>
            </div>
          </div>
        {:else if ['image', 'video', 'audio', 'pdf'].includes(detectedType) && blobUrl}
          <!-- Media Viewer -->
          <MediaViewer
            src={blobUrl}
            type={detectedType as 'image' | 'video' | 'audio' | 'pdf'}
            {fileName}
            {fileSize}
          />
        {:else if ['code', 'text'].includes(detectedType)}
          <!-- Code / Text Viewer -->
          <div class="size-full p-2 sm:p-4">
            <CodeViewer content={textContent} {fileName} />
          </div>
        {:else}
          <!-- Unsupported Binary Fallback -->
          <div class="flex size-full flex-col items-center justify-center p-6 text-center space-y-4">
            <div class="flex size-16 items-center justify-center rounded-2xl bg-zinc-200/80 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              <Icon name="file" class="size-8" />
            </div>
            <div class="space-y-1">
              <h4 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">No Preview Available</h4>
              <p class="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm leading-relaxed">
                This file format cannot be previewed directly in the browser. You can download the file to view it locally.
              </p>
            </div>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-500 active:scale-95 transition-all cursor-pointer"
              onclick={handleDownload}
            >
              <Icon name="download" class="size-4" />
              <span>Download ({formatBytes(fileSize)})</span>
            </button>
          </div>
        {/if}
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
