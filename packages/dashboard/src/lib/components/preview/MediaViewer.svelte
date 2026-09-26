<script lang="ts">
  import Icon from '../share/Icon.svelte';

  let {
    src,
    type,
    fileName = 'Media File',
    fileSize = 0
  }: {
    src: string;
    type: 'image' | 'video' | 'audio' | 'pdf';
    fileName?: string;
    fileSize?: number;
  } = $props();

  // Zoom state for images
  let zoomLevel = $state(1);
  const minZoom = 0.25;
  const maxZoom = 4;
  const step = 0.25;

  function handleZoomIn() {
    zoomLevel = Math.min(maxZoom, Math.round((zoomLevel + step) * 100) / 100);
  }

  function handleZoomOut() {
    zoomLevel = Math.max(minZoom, Math.round((zoomLevel - step) * 100) / 100);
  }

  function handleZoomReset() {
    zoomLevel = 1;
  }

  function toggleClickZoom() {
    if (zoomLevel > 1) {
      zoomLevel = 1;
    } else {
      zoomLevel = 2;
    }
  }
</script>

<div class="relative flex size-full items-center justify-center overflow-hidden select-none">
  {#if type === 'image'}
    <!-- Image Preview with Zoom Controls -->
    <div class="relative flex size-full items-center justify-center overflow-auto p-4">
      <div
        class="transition-transform duration-150 ease-out flex items-center justify-center"
        style="transform: scale({zoomLevel}); transform-origin: center center;"
      >
        <button
          type="button"
          class="outline-hidden cursor-zoom-in"
          onclick={toggleClickZoom}
        >
          <img
            {src}
            alt={fileName}
            class="max-h-[75vh] max-w-full rounded-lg object-contain shadow-md"
            draggable="false"
          />
        </button>
      </div>

      <!-- Floating Zoom Controls Bar -->
      <div
        class="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full border border-zinc-200/80 bg-white/90 px-3 py-1.5 shadow-lg backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/90 z-10"
      >
        <button
          type="button"
          class="rounded-full p-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 transition-colors disabled:opacity-40 cursor-pointer"
          title="Zoom out"
          onclick={handleZoomOut}
          disabled={zoomLevel <= minZoom}
        >
          <Icon name="zoom-out" class="size-4" />
        </button>

        <span class="w-12 text-center font-mono text-xs font-medium text-zinc-700 dark:text-zinc-300">
          {Math.round(zoomLevel * 100)}%
        </span>

        <button
          type="button"
          class="rounded-full p-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 transition-colors disabled:opacity-40 cursor-pointer"
          title="Zoom in"
          onclick={handleZoomIn}
          disabled={zoomLevel >= maxZoom}
        >
          <Icon name="zoom-in" class="size-4" />
        </button>

        <div class="h-4 w-px bg-zinc-200 dark:bg-zinc-700 mx-0.5"></div>

        <button
          type="button"
          class="rounded-full p-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 transition-colors cursor-pointer"
          title="Reset zoom (100%)"
          onclick={handleZoomReset}
        >
          <Icon name="zoom-reset" class="size-4" />
        </button>
      </div>
    </div>
  {:else if type === 'video'}
    <!-- Video Player -->
    <div class="flex size-full items-center justify-center p-4">
      <div class="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-black shadow-2xl">
        <!-- svelte-ignore a11y_media_has_caption -->
        <video
          controls
          playsinline
          preload="metadata"
          class="max-h-[75vh] w-full object-contain outline-hidden"
          {src}
        >
          Your browser does not support HTML5 video playback.
        </video>
      </div>
    </div>
  {:else if type === 'audio'}
    <!-- Audio Player -->
    <div class="flex size-full items-center justify-center p-6">
      <div
        class="w-full max-w-md rounded-3xl border border-zinc-200 bg-white/90 p-8 shadow-xl backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/90 text-center space-y-6"
      >
        <!-- Album Art / Vinyl Graphic -->
        <div class="relative mx-auto flex size-28 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500/20 via-orange-500/20 to-amber-600/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 shadow-inner">
          <Icon name="audio" class="size-12" />
        </div>

        <div class="space-y-1">
          <h3 class="text-base font-semibold text-zinc-900 dark:text-zinc-100 truncate px-2" title={fileName}>
            {fileName}
          </h3>
          <p class="text-xs text-zinc-400 dark:text-zinc-500">
            Audio Stream Playback
          </p>
        </div>

        <!-- Native Audio Controls -->
        <div class="pt-2">
          <audio controls preload="metadata" class="w-full outline-hidden" {src}>
            Your browser does not support HTML5 audio playback.
          </audio>
        </div>
      </div>
    </div>
  {:else if type === 'pdf'}
    <!-- PDF Preview via IFrame (Zero Overhead) -->
    <div class="size-full bg-zinc-100 dark:bg-zinc-950 flex flex-col">
      <iframe
        {src}
        title="PDF Preview"
        class="size-full border-0 rounded-b-xl"
        style="min-height: 70vh;"
      ></iframe>
    </div>
  {/if}
</div>
