<script lang="ts">
  import { uploadManager } from '$lib/services/uploader.svelte';
  import { mainStore } from '$lib/stores/main.svelte';
  import { Upload } from '$lib/icons';

  interface Props {
    children?: import('svelte').Snippet;
  }
  let { children }: Props = $props();

  let isDragging = $state(false);
  let dragCounter = $state(0);

  function onDragEnter(e: DragEvent) {
    e.preventDefault();
    dragCounter++;
    if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
      isDragging = true;
    }
  }

  function onDragLeave(e: DragEvent) {
    e.preventDefault();
    dragCounter--;
    if (dragCounter <= 0) {
      isDragging = false;
      dragCounter = 0;
    }
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  }

  async function onDrop(e: DragEvent) {
    e.preventDefault();
    isDragging = false;
    dragCounter = 0;

    if (!e.dataTransfer || !mainStore.currentBucket || mainStore.apiReadonly) return;

    const files: File[] = [];
    const items = e.dataTransfer.items;

    if (items) {
      const queue: any[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.webkitGetAsEntry) {
          const entry = item.webkitGetAsEntry();
          if (entry) queue.push(entry);
        } else if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }

      while (queue.length > 0) {
        const entry = queue.shift();
        if (entry.isFile) {
          const file = await new Promise<File>((resolve, reject) => entry.file(resolve, reject));
          // Attach relative path if available
          Object.defineProperty(file, 'webkitRelativePath', {
            value: entry.fullPath.startsWith('/') ? entry.fullPath.slice(1) : entry.fullPath,
            writable: false
          });
          files.push(file);
        } else if (entry.isDirectory) {
          const dirReader = entry.createReader();
          const entries = await new Promise<any[]>((resolve, reject) => dirReader.readEntries(resolve, reject));
          queue.push(...entries);
        }
      }
    } else if (e.dataTransfer.files) {
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        files.push(e.dataTransfer.files[i]);
      }
    }

    if (files.length > 0) {
      await uploadManager.uploadFiles(mainStore.currentBucket, mainStore.currentFolder, files);
    }
  }
</script>

<div
  role="region"
  aria-label="File drop area"
  class="relative min-h-screen w-full"
  ondragenter={onDragEnter}
  ondragleave={onDragLeave}
  ondragover={onDragOver}
  ondrop={onDrop}
>
  {@render children?.()}

  <!-- Drag overlay -->
  {#if isDragging && !mainStore.apiReadonly}
    <div 
      class="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-md transition-all duration-300"
    >
      <div class="flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-emerald-500 bg-white/10 p-12 text-center text-white shadow-2xl backdrop-blur-xl dark:bg-zinc-900/60">
        <div class="rounded-2xl bg-emerald-500/20 p-5 ring-8 ring-emerald-500/10">
          <Upload class="size-12 text-emerald-400" size={48} />
        </div>
        <div>
          <h3 class="text-2xl font-bold tracking-tight">Drop files to upload</h3>
          <p class="mt-1 text-sm text-zinc-300">
            Uploading to <span class="font-semibold text-emerald-300">{mainStore.currentBucket}</span>
            {#if mainStore.currentFolder}
              <span>/ {mainStore.currentFolder}</span>
            {/if}
          </p>
        </div>
      </div>
    </div>
  {/if}
</div>
