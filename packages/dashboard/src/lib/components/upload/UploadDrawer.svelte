<script lang="ts">
  import { uploadManager } from '$lib/services/uploader.svelte';
  import { formatBytes } from '$lib/api/client';
  import { X, ChevronDown, ChevronUp, Check, AlertCircle } from '$lib/icons';

  let isCollapsed = $state(false);

  const activeCount = $derived(
    uploadManager.tasks.filter((t) => t.status === 'uploading' || t.status === 'pending').length
  );
  const totalCount = $derived(uploadManager.tasks.length);
  const isFinished = $derived(activeCount === 0 && totalCount > 0);
</script>

{#if totalCount > 0}
  <aside 
    aria-label="Upload transfers"
    class="fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] rounded-2xl border border-zinc-200/80 bg-white/95 shadow-2xl backdrop-blur-md transition-all duration-300 dark:border-zinc-800/80 dark:bg-zinc-900/95"
  >
    <!-- Header -->
    <header class="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
      <div class="flex items-center gap-2">
        {#if activeCount > 0}
          <div class="size-2 animate-pulse rounded-full bg-emerald-500"></div>
          <span class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Uploading {activeCount} {activeCount === 1 ? 'file' : 'files'}
          </span>
          {#if uploadManager.uploadSpeed}
            <span class="text-xs text-zinc-400">({uploadManager.uploadSpeed})</span>
          {/if}
        {:else}
          <div class="size-2 rounded-full bg-emerald-500"></div>
          <span class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Uploads complete</span>
        {/if}
      </div>

      <div class="flex items-center gap-1">
        <button
          onclick={() => (isCollapsed = !isCollapsed)}
          class="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          aria-label={isCollapsed ? 'Expand drawer' : 'Collapse drawer'}
        >
          {#if isCollapsed}
            <ChevronUp class="size-4" />
          {:else}
            <ChevronDown class="size-4" />
          {/if}
        </button>
        <button
          onclick={() => uploadManager.clearCompleted()}
          class="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          aria-label="Close drawer"
        >
          <X class="size-4" />
        </button>
      </div>
    </header>

    <!-- Overall progress bar -->
    {#if !isCollapsed && activeCount > 0}
      <div class="h-1 w-full bg-zinc-100 dark:bg-zinc-800">
        <div
          class="h-full bg-emerald-500 transition-all duration-300"
          style="width: {uploadManager.aggregateProgress}%"
        ></div>
      </div>
    {/if}

    <!-- Task list -->
    {#if !isCollapsed}
      <ul class="max-h-64 overflow-y-auto divide-y divide-zinc-100 p-2 dark:divide-zinc-800/60">
        {#each uploadManager.tasks as task (task.id)}
          <li class="flex items-center justify-between gap-3 p-2 text-xs">
            <div class="min-w-0 flex-1">
              <p class="truncate font-medium text-zinc-800 dark:text-zinc-200">
                {task.file.name}
              </p>
              <div class="mt-1 flex items-center gap-2 text-zinc-400">
                <span>{formatBytes(task.uploadedBytes ?? 0)} of {formatBytes(task.size)}</span>
                <span>•</span>
                <span>{task.progress}%</span>
                {#if task.isMultipart}
                  <span class="rounded bg-indigo-50 px-1 py-0.5 text-[10px] font-semibold text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                    Multipart
                  </span>
                {/if}
              </div>
              {#if task.status === 'uploading'}
                <div class="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    class="h-full bg-emerald-500 transition-all duration-200"
                    style="width: {task.progress}%"
                  ></div>
                </div>
              {/if}
            </div>

            <div class="flex items-center gap-1.5">
              {#if task.status === 'uploading'}
                <button
                  onclick={() => uploadManager.cancelTask(task.id)}
                  class="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-red-500 dark:hover:bg-zinc-800"
                  title="Cancel upload"
                >
                  <X class="size-3.5" />
                </button>
              {:else if task.status === 'completed'}
                <span class="text-emerald-500" title="Completed">
                  <Check class="size-4" />
                </span>
              {:else if task.status === 'error'}
                <span class="text-rose-500" title={task.error || 'Upload failed'}>
                  <AlertCircle class="size-4" />
                </span>
              {/if}
            </div>
          </li>
        {/each}
      </ul>

      <!-- Footer Actions -->
      <footer class="flex items-center justify-between border-t border-zinc-100 px-3 py-2 text-xs text-zinc-400 dark:border-zinc-800">
        <span>{totalCount - activeCount} of {totalCount} completed</span>
        {#if activeCount > 0}
          <button
            onclick={() => uploadManager.cancelAll()}
            class="font-medium text-rose-500 hover:underline"
          >
            Cancel All
          </button>
        {:else}
          <button
            onclick={() => uploadManager.clearCompleted()}
            class="font-medium text-zinc-500 hover:underline dark:text-zinc-400"
          >
            Clear All
          </button>
        {/if}
      </footer>
    {/if}
  </aside>
{/if}
