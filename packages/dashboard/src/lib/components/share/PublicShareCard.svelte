<script lang="ts">
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';
  import { renderSVG } from 'uqr';
  import { copyToClipboard, formatBytes, formatCountdown, getFileExtension, getMediaType } from './utils';
  import type { MediaType } from './types';
  import Icon from './Icon.svelte';

  let {
    shareId,
    initialFileName = '',
    initialFileSize = 0,
    expiresAt = null,
    isPasswordProtected = false
  }: {
    shareId: string;
    initialFileName?: string;
    initialFileSize?: number;
    expiresAt?: number | null;
    isPasswordProtected?: boolean;
  } = $props();

  // Component state
  let isLoading = $state(true);
  let error = $state<string | null>(null);
  let errorStatus = $state<number | null>(null);

  // File metadata
  let fileName = $state('');
  let fileSize = $state(0);
  let contentType = $state('');
  let mediaType = $state<MediaType>('unknown');
  let currentExpiresAt = $state<number | null>(null);

  // Security / Password state
  let requiresPassword = $state(false);
  let password = $state('');
  let showPassword = $state(false);
  let isUnlocking = $state(false);
  let isUnlocked = $state(false);
  let passwordError = $state<string | null>(null);

  // Initialize from props
  $effect(() => {
    if (initialFileName && !fileName) fileName = initialFileName;
    if (initialFileSize && !fileSize) fileSize = initialFileSize;
    if (expiresAt !== undefined && currentExpiresAt === null) currentExpiresAt = expiresAt;
    if (isPasswordProtected && !requiresPassword) requiresPassword = isPasswordProtected;
  });

  // Preview state
  let previewBlobUrl = $state<string | null>(null);
  let isPreviewLoading = $state(false);
  let isImageZoomed = $state(false);

  // QR Code & Sharing state
  let showQr = $state(false);
  let qrSvg = $state('');
  let isCopied = $state(false);

  // URL references
  let publicUrl = $derived(
    typeof window !== 'undefined' ? `${window.location.origin}/share/${shareId}` : `/share/${shareId}`
  );

  let streamDownloadUrl = $derived.by(() => {
    let url = `/share/${encodeURIComponent(shareId)}`;
    if (password.trim().length > 0) {
      url += `?password=${encodeURIComponent(password.trim())}`;
    }
    return url;
  });

  let extension = $derived(getFileExtension(fileName).toUpperCase() || 'FILE');
  let countdown = $derived(formatCountdown(currentExpiresAt ?? undefined));

  // Determine media badge styling
  let badgeTheme = $derived.by(() => {
    switch (mediaType) {
      case 'image':
        return {
          bg: 'from-blue-500/20 to-cyan-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
          icon: 'image',
          pill: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
        };
      case 'video':
        return {
          bg: 'from-purple-500/20 to-pink-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30',
          icon: 'video',
          pill: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
        };
      case 'audio':
        return {
          bg: 'from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
          icon: 'audio',
          pill: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
        };
      case 'pdf':
        return {
          bg: 'from-rose-500/20 to-red-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30',
          icon: 'pdf',
          pill: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
        };
      case 'code':
        return {
          bg: 'from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
          icon: 'code',
          pill: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
        };
      default:
        return {
          bg: 'from-zinc-500/20 to-slate-500/20 text-zinc-600 dark:text-zinc-400 border-zinc-500/30',
          icon: 'file',
          pill: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20'
        };
    }
  });

  onMount(async () => {
    // Generate QR code
    try {
      qrSvg = renderSVG(publicUrl, {
        pixelSize: 6,
        whiteColor: '#ffffff',
        blackColor: '#09090b',
        border: 2
      });
    } catch {}

    await checkShare();
  });

  async function checkShare(enteredPassword?: string) {
    isLoading = true;
    error = null;
    passwordError = null;

    let targetUrl = `/share/${encodeURIComponent(shareId)}`;
    if (enteredPassword) {
      targetUrl += `?password=${encodeURIComponent(enteredPassword)}`;
    }

    try {
      const response = await fetch(targetUrl, { method: 'GET' });

      if (response.status === 401) {
        requiresPassword = true;
        isUnlocked = false;
        if (enteredPassword) {
          passwordError = 'Incorrect password. Please try again.';
          toast.error('Incorrect password');
        }
        isLoading = false;
        return;
      }

      if (response.status === 404) {
        error = 'This share link does not exist or has been removed.';
        errorStatus = 404;
        isLoading = false;
        return;
      }

      if (response.status === 410) {
        error = 'This share link has expired.';
        errorStatus = 410;
        isLoading = false;
        return;
      }

      if (response.status === 403) {
        error = 'The maximum download limit for this link has been reached.';
        errorStatus = 403;
        isLoading = false;
        return;
      }

      if (!response.ok) {
        error = `Unable to access shared file (HTTP ${response.status}).`;
        errorStatus = response.status;
        isLoading = false;
        return;
      }

      // Success! File is available
      requiresPassword = false;
      isUnlocked = true;

      // Extract filename from Content-Disposition
      const disposition = response.headers.get('content-disposition');
      if (disposition) {
        const utf8Match = /filename\*=UTF-8''([^;\r\n]+)/i.exec(disposition);
        if (utf8Match && utf8Match[1]) {
          fileName = decodeURIComponent(utf8Match[1]);
        } else {
          const match = /filename=["']?([^"';\r\n]+)["']?/i.exec(disposition);
          if (match && match[1]) {
            fileName = decodeURIComponent(match[1]);
          }
        }
      }

      if (!fileName) {
        fileName = `shared-file-${shareId}`;
      }

      // Extract content type and size
      contentType = response.headers.get('content-type') || '';
      const len = response.headers.get('content-length');
      if (len) {
        fileSize = parseInt(len, 10);
      }

      mediaType = getMediaType(fileName, contentType);

      // Load preview if media is image, audio, or small video
      if (['image', 'video', 'audio'].includes(mediaType)) {
        try {
          isPreviewLoading = true;
          const blob = await response.blob();
          if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
          previewBlobUrl = URL.createObjectURL(blob);
        } catch (err) {
          console.error('Failed to create preview blob', err);
        } finally {
          isPreviewLoading = false;
        }
      }
    } catch (err: any) {
      error = err.message || 'Failed to connect to the server.';
    } finally {
      isLoading = false;
    }
  }

  async function handleUnlock(e: Event) {
    e.preventDefault();
    if (!password.trim()) {
      passwordError = 'Please enter a password';
      return;
    }

    isUnlocking = true;
    await checkShare(password.trim());
    isUnlocking = false;
  }

  function handleDirectDownload() {
    if (requiresPassword && !isUnlocked) {
      toast.error('Please unlock the file first');
      return;
    }

    // Direct streaming download via browser
    const a = document.createElement('a');
    a.href = streamDownloadUrl;
    a.download = fileName || 'download';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    toast.success('Starting direct download stream...');
  }

  async function handleCopyLink() {
    const ok = await copyToClipboard(publicUrl);
    if (ok) {
      isCopied = true;
      toast.success('Share link copied to clipboard');
      setTimeout(() => {
        isCopied = false;
      }, 2000);
    } else {
      toast.error('Failed to copy link');
    }
  }

  function handleDownloadQr() {
    if (!qrSvg) return;
    const blob = new Blob([qrSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `qr-${shareId}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('QR Code saved');
  }
</script>

<div class="relative w-full max-w-xl mx-auto">
  <!-- Ambient background glow behind card -->
  <div
    class="pointer-events-none absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-600/20 via-indigo-600/15 to-purple-600/20 opacity-70 blur-xl dark:opacity-40"
  ></div>

  <!-- Main Gofile Glassmorphic Card -->
  <div
    class="relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-white/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl transition-all duration-300 dark:border-zinc-800/80 dark:bg-zinc-950/80"
  >
    {#if isLoading && !requiresPassword}
      <!-- Loading Skeleton -->
      <div class="flex flex-col items-center justify-center py-16 text-center space-y-4">
        <div class="size-16 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-blue-500 animate-pulse">
          <Icon name="spinner" class="size-8 animate-spin" />
        </div>
        <div class="space-y-2">
          <div class="h-4 w-40 bg-zinc-200 dark:bg-zinc-800 rounded-full mx-auto animate-pulse"></div>
          <div class="h-3 w-24 bg-zinc-100 dark:bg-zinc-900 rounded-full mx-auto animate-pulse"></div>
        </div>
        <p class="text-xs text-zinc-400">Connecting to secure R2 storage...</p>
      </div>
    {:else if error}
      <!-- Error / Expired View -->
      <div class="flex flex-col items-center text-center py-8 space-y-4">
        <div
          class="flex size-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 ring-8 ring-rose-50/50 dark:ring-rose-950/20"
        >
          <Icon name="alert-circle" class="size-8" />
        </div>
        <div class="space-y-1">
          <h2 class="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {errorStatus === 410 ? 'Share Link Expired' : errorStatus === 403 ? 'Download Limit Reached' : 'Unavailable'}
          </h2>
          <p class="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm leading-relaxed">
            {error}
          </p>
        </div>
        <div class="pt-2">
          <a
            href="/"
            class="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white transition-colors"
          >
            Go to Explorer
          </a>
        </div>
      </div>
    {:else}
      <!-- Normal / Unlocked / Password View -->
      <div class="space-y-6">
        <!-- Top Section: File Icon, Name, and Badges -->
        <div class="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          <!-- File Type Avatar Badge -->
          <div
            class="relative flex size-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br {badgeTheme.bg} border shadow-inner"
          >
            <Icon name={badgeTheme.icon} class="size-10" />
            <span
              class="absolute -bottom-2 font-mono text-[9px] font-bold px-2 py-0.5 rounded-full border shadow-xs {badgeTheme.pill}"
            >
              {extension}
            </span>
          </div>

          <!-- File Info -->
          <div class="flex-1 min-w-0 space-y-2">
            <h1
              class="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 truncate"
              title={fileName}
            >
              {fileName || 'Shared Document'}
            </h1>

            <!-- Meta details row -->
            <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
              <!-- Formatted Size -->
              {#if fileSize > 0}
                <span
                  class="inline-flex items-center rounded-md bg-zinc-100 px-2.5 py-1 font-medium text-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-200"
                >
                  {formatBytes(fileSize)}
                </span>
              {/if}

              <!-- Expiration Countdown Badge -->
              {#if countdown.isPermanent}
                <span
                  class="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2.5 py-1 font-medium text-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-300"
                >
                  <span class="size-1.5 rounded-full bg-zinc-400"></span>
                  Permanent
                </span>
              {:else}
                <span
                  class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium {countdown.urgent
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'}"
                >
                  <span
                    class="size-1.5 rounded-full {countdown.urgent
                      ? 'bg-amber-500 animate-pulse'
                      : 'bg-emerald-500'}"
                  ></span>
                  {countdown.text}
                </span>
              {/if}

              <!-- Protected Badge -->
              {#if requiresPassword && !isUnlocked}
                <span
                  class="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                >
                  <Icon name="lock" class="size-3" />
                  Protected
                </span>
              {/if}
            </div>
          </div>
        </div>

        <!-- Inline Media Preview (Image, Video, Audio) -->
        {#if isUnlocked && previewBlobUrl}
          <div class="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-2 dark:border-zinc-800/80 dark:bg-zinc-900/40 overflow-hidden">
            {#if mediaType === 'image'}
              <div class="relative group max-h-[420px] flex items-center justify-center overflow-hidden rounded-xl bg-zinc-950/5 dark:bg-zinc-950/50">
                <button
                  type="button"
                  class="flex items-center justify-center outline-hidden cursor-zoom-in {isImageZoomed ? 'cursor-zoom-out' : ''}"
                  onclick={() => (isImageZoomed = !isImageZoomed)}
                >
                  <img
                    src={previewBlobUrl}
                    alt={fileName}
                    class="max-h-[380px] w-auto max-w-full rounded-lg object-contain transition-transform duration-200 {isImageZoomed ? 'scale-150' : ''}"
                  />
                </button>
                <button
                  type="button"
                  class="absolute bottom-3 right-3 rounded-lg bg-black/60 backdrop-blur-xs p-1.5 text-white/80 hover:text-white transition-opacity opacity-0 group-hover:opacity-100 cursor-pointer"
                  title={isImageZoomed ? 'Zoom out' : 'Zoom in'}
                  onclick={() => (isImageZoomed = !isImageZoomed)}
                >
                  <Icon name={isImageZoomed ? 'zoom-out' : 'zoom-in'} class="size-4" />
                </button>
              </div>
            {:else if mediaType === 'video'}
              <div class="rounded-xl overflow-hidden bg-black max-h-[420px] flex items-center justify-center">
                <!-- svelte-ignore a11y_media_has_caption -->
                <video
                  controls
                  playsinline
                  class="max-h-[380px] w-full rounded-lg outline-hidden"
                  src={previewBlobUrl}
                ></video>
              </div>
            {:else if mediaType === 'audio'}
              <div class="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/20 dark:from-amber-950/20 dark:to-orange-950/20">
                <div class="flex items-center gap-3 mb-3">
                  <div class="size-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <Icon name="audio" class="size-5" />
                  </div>
                  <div class="text-xs">
                    <p class="font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-xs">{fileName}</p>
                    <p class="text-zinc-500 dark:text-zinc-400 text-[11px]">Audio playback stream</p>
                  </div>
                </div>
                <audio controls class="w-full h-10 outline-hidden" src={previewBlobUrl}></audio>
              </div>
            {/if}
          </div>
        {/if}

        <!-- Password Challenge Form (When File is Password Protected) -->
        {#if requiresPassword && !isUnlocked}
          <div
            class="rounded-2xl border border-amber-200/70 bg-amber-50/40 p-5 backdrop-blur-xs dark:border-amber-950/60 dark:bg-amber-950/20 space-y-4"
          >
            <div class="flex items-center gap-2.5">
              <div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                <Icon name="lock" class="size-4" />
              </div>
              <div>
                <h3 class="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Password Required
                </h3>
                <p class="text-[11px] text-zinc-500 dark:text-zinc-400">
                  This shared link was encrypted by the owner. Enter the password to unlock.
                </p>
              </div>
            </div>

            <form onsubmit={handleUnlock} class="space-y-3">
              <div class="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter access password"
                  bind:value={password}
                  class="w-full rounded-xl border border-zinc-200/80 bg-white/90 py-2.5 pl-3.5 pr-10 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700/80 dark:bg-zinc-900/90 dark:text-zinc-100 dark:placeholder:text-zinc-500"
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

              {#if passwordError}
                <p class="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <Icon name="alert-circle" class="size-3.5" />
                  {passwordError}
                </p>
              {/if}

              <button
                type="submit"
                disabled={isUnlocking}
                class="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-xs font-semibold text-white shadow-md shadow-blue-500/25 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] disabled:opacity-50 transition-all cursor-pointer"
              >
                {#if isUnlocking}
                  <Icon name="spinner" class="size-4 animate-spin" />
                  <span>Verifying & Unlocking...</span>
                {:else}
                  <Icon name="unlock" class="size-4" />
                  <span>Unlock & Download</span>
                {/if}
              </button>
            </form>
          </div>
        {/if}

        <!-- Primary Action Button: "Download File" with direct streaming -->
        {#if !requiresPassword || isUnlocked}
          <div class="space-y-3">
            <button
              type="button"
              onclick={handleDirectDownload}
              class="w-full group relative flex items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 py-4 px-6 text-sm font-semibold text-white shadow-xl shadow-blue-500/25 transition-all duration-200 hover:shadow-blue-500/40 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <div
                class="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              ></div>
              <Icon name="download" class="size-5 shrink-0 transition-transform group-hover:-translate-y-0.5" />
              <span>Download File</span>
              {#if fileSize > 0}
                <span class="rounded-lg bg-black/20 px-2 py-0.5 text-xs font-mono font-normal">
                  {formatBytes(fileSize)}
                </span>
              {/if}
            </button>
          </div>
        {/if}

        <!-- Secondary Controls: Copy Link & QR Toggle -->
        <div class="flex items-center justify-between gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
          <!-- Copy Link Button -->
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200/80 bg-zinc-50/80 px-3.5 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 active:scale-95 transition-all cursor-pointer dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:bg-zinc-800"
            onclick={handleCopyLink}
          >
            {#if isCopied}
              <Icon name="check" class="size-3.5 text-emerald-500" />
              <span class="text-emerald-600 dark:text-emerald-400 font-semibold">Copied Link!</span>
            {:else}
              <Icon name="link" class="size-3.5 text-zinc-400" />
              <span>Copy Link</span>
            {/if}
          </button>

          <!-- QR Code Toggle -->
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200/80 bg-zinc-50/80 px-3.5 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 active:scale-95 transition-all cursor-pointer dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:bg-zinc-800 {showQr
              ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-500/60 dark:bg-blue-950/40 dark:text-blue-300'
              : ''}"
            onclick={() => (showQr = !showQr)}
          >
            <Icon name="qr" class="size-3.5 {showQr ? 'text-blue-500' : 'text-zinc-400'}" />
            <span>QR Code</span>
          </button>
        </div>

        <!-- Expandable Instant QR Code Card -->
        {#if showQr && qrSvg}
          <div
            class="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/60 transition-all duration-200 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left"
          >
            <div class="size-28 rounded-xl bg-white p-2 shadow-xs ring-1 ring-zinc-200 dark:ring-zinc-800 flex items-center justify-center shrink-0">
              <div class="size-full [&>svg]:size-full">
                {@html qrSvg}
              </div>
            </div>
            <div class="space-y-1.5 flex-1 min-w-0">
              <h4 class="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                Scan with Mobile Device
              </h4>
              <p class="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Scan this QR code using your phone camera to download or stream immediately.
              </p>
              <div class="pt-1">
                <button
                  type="button"
                  class="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors cursor-pointer"
                  onclick={handleDownloadQr}
                >
                  <Icon name="download" class="size-3" />
                  Save QR SVG
                </button>
              </div>
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Bottom Brand Footer -->
  <div class="mt-6 flex items-center justify-center gap-2 text-[11px] text-zinc-400 dark:text-zinc-600">
    <Icon name="shield" class="size-3.5" />
    <span>Encrypted & Delivered via Cloudflare R2</span>
  </div>
</div>
