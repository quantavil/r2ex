<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { apiClient, formatBytes } from '$lib/api/client';
  import { mainStore } from '$lib/stores/main.svelte';
  import { Folder, File, Download, Share, Plus, Search, Eye } from '$lib/icons';
  import CreateFolderDialog from '$lib/components/files/CreateFolderDialog.svelte';
  import FileContextMenu from '$lib/components/files/FileContextMenu.svelte';
  import CreateShareModal from '$lib/components/share/CreateShareModal.svelte';
  import ManageSharesModal from '$lib/components/share/ManageSharesModal.svelte';
  import PreviewModal from '$lib/components/preview/PreviewModal.svelte';
  import type { R2Object } from '$lib/api/types';
  import { toast } from 'svelte-sonner';

  const bucket = $derived(page.params.bucket || '');
  const folder = $derived(page.params.folder ? page.params.folder.replace(/\/?$/, '/') : '');

  let files = $state<R2Object[]>([]);
  let isLoading = $state(true);
  let searchQuery = $state('');
  let isCreateFolderOpen = $state(false);
  let isManageSharesOpen = $state(false);
  let isCreateShareOpen = $state(false);
  let isPreviewOpen = $state(false);
  let selectedFileForShare = $state<R2Object | null>(null);
  let selectedFileForPreview = $state<R2Object | null>(null);

  // Sync with mainStore
  $effect(() => {
    if (bucket) {
      mainStore.setBucket(bucket);
      mainStore.setFolder(folder);
      loadFiles();
    }
  });

  async function loadFiles() {
    if (!bucket) return;
    isLoading = true;
    try {
      const res = await apiClient.listObjects(bucket, folder);
      files = res.objects || [];
    } catch (err: any) {
      toast.error(err.message || 'Failed to list objects');
    } finally {
      isLoading = false;
    }
  }

  const filteredFiles = $derived(
    files.filter((f) => {
      const name = f.name || f.key.split('/').pop() || '';
      if (!mainStore.showHiddenFiles && name.startsWith('.')) return false;
      if (!searchQuery) return true;
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    })
  );

  const foldersList = $derived(filteredFiles.filter((f) => f.type === 'folder'));
  const regularFilesList = $derived(filteredFiles.filter((f) => f.type !== 'folder'));

  function openFolder(folderKey: string) {
    goto(`/files/${bucket}/${folderKey}`);
  }

  function openPreview(file: R2Object) {
    selectedFileForPreview = file;
    isPreviewOpen = true;
  }

  function openShare(file: R2Object) {
    selectedFileForShare = file;
    isCreateShareOpen = true;
  }

  function getBreadcrumbParts() {
    if (!folder) return [];
    const segments = folder.split('/').filter(Boolean);
    let accum = '';
    return segments.map((seg) => {
      accum += seg + '/';
      return { name: seg, path: accum };
    });
  }
</script>

<div class="flex-1 p-6 max-w-7xl mx-auto w-full">
  <!-- Top Navigation & Action Bar -->
  <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
    <!-- Breadcrumbs -->
    <div class="flex flex-wrap items-center gap-1.5 text-sm">
      <a
        href="/files/{bucket}"
        class="flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-zinc-100 hover:text-emerald-500 transition"
      >
        <Folder class="size-4 text-amber-500" />
        {bucket}
      </a>

      {#each getBreadcrumbParts() as part}
        <span class="text-zinc-400">/</span>
        <a
          href="/files/{bucket}/{part.path}"
          class="font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition"
        >
          {part.name}
        </a>
      {/each}
    </div>

    <!-- Right Controls -->
    <div class="flex items-center gap-2.5 w-full sm:w-auto">
      <!-- Search Input -->
      <div class="relative flex-1 sm:w-64">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Filter files..."
          class="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/50 outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition"
        />
      </div>

      <button
        onclick={() => (isManageSharesOpen = true)}
        class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-zinc-200 hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800 transition"
      >
        <Share class="size-3.5 text-zinc-500" />
        Shares
      </button>

      {#if !mainStore.apiReadonly}
        <button
          onclick={() => (isCreateFolderOpen = true)}
          class="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition shadow-sm"
        >
          <Plus class="size-3.5" />
          New Folder
        </button>
      {/if}
    </div>
  </div>

  <!-- Content List -->
  {#if isLoading}
    <div class="flex flex-col items-center justify-center py-24 text-zinc-400">
      <div class="size-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100"></div>
      <p class="mt-3 text-xs">Loading objects...</p>
    </div>
  {:else if filteredFiles.length === 0}
    <div class="flex flex-col items-center justify-center py-28 text-center text-zinc-400">
      <div class="rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-900">
        <Folder class="size-8 text-zinc-400" size={32} />
      </div>
      <h3 class="mt-3 font-semibold text-zinc-900 dark:text-zinc-100">This folder is empty</h3>
      <p class="mt-1 text-xs text-zinc-500 max-w-xs">Drag and drop files anywhere on the page to upload them to R2.</p>
    </div>
  {:else}
    <!-- Folders Section -->
    {#if foldersList.length > 0}
      <div class="mt-6">
        <h4 class="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">Folders ({foldersList.length})</h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {#each foldersList as item}
            <div
              role="button"
              tabindex="0"
              onclick={() => openFolder(item.key)}
              onkeydown={(e) => e.key === 'Enter' && openFolder(item.key)}
              class="group flex items-center justify-between p-3 rounded-xl border border-zinc-200/80 bg-white hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:hover:border-zinc-700 transition cursor-pointer"
            >
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="rounded-lg bg-amber-500/10 p-2 text-amber-500 group-hover:scale-105 transition">
                  <Folder class="size-4" />
                </div>
                <span class="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                  {item.name}
                </span>
              </div>

              <FileContextMenu
                file={item}
                {bucket}
                ondeleted={loadFiles}
              />
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Files Section -->
    {#if regularFilesList.length > 0}
      <div class="mt-8">
        <h4 class="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">Files ({regularFilesList.length})</h4>
        <div class="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900/60 shadow-sm">
          <table class="w-full text-left text-xs">
            <thead class="bg-zinc-50/50 border-b border-zinc-100 dark:bg-zinc-900/80 dark:border-zinc-800/80 text-zinc-400 font-semibold">
              <tr>
                <th class="py-3 px-4">Name</th>
                <th class="py-3 px-4 hidden sm:table-cell">Size</th>
                <th class="py-3 px-4 hidden md:table-cell">Modified</th>
                <th class="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {#each regularFilesList as file}
                <tr
                  class="group hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition cursor-pointer"
                  onclick={() => openPreview(file)}
                >
                  <td class="py-3 px-4">
                    <div class="flex items-center gap-2.5 min-w-0">
                      <div class="rounded-lg bg-zinc-100 p-1.5 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                        <File class="size-4" />
                      </div>
                      <span class="font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-md">
                        {file.name}
                      </span>
                    </div>
                  </td>
                  <td class="py-3 px-4 text-zinc-500 hidden sm:table-cell">
                    {formatBytes(file.size || 0)}
                  </td>
                  <td class="py-3 px-4 text-zinc-400 hidden md:table-cell">
                    {file.uploaded ? new Date(file.uploaded).toLocaleDateString() : '--'}
                  </td>
                  <td class="py-3 px-4 text-right" onclick={(e) => e.stopPropagation()}>
                    <div class="flex items-center justify-end gap-1">
                      <button
                        onclick={() => openShare(file)}
                        class="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-blue-500 dark:hover:bg-zinc-800 transition"
                        title="Share link"
                      >
                        <Share class="size-3.5" />
                      </button>
                      <FileContextMenu
                        {file}
                        {bucket}
                        onshare={openShare}
                        onpreview={openPreview}
                        ondeleted={loadFiles}
                      />
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}
  {/if}
</div>

<!-- Modals -->
<CreateFolderDialog
  bind:open={isCreateFolderOpen}
  oncreated={loadFiles}
/>

{#if selectedFileForShare && bucket}
  <CreateShareModal
    bind:open={isCreateShareOpen}
    {bucket}
    fileKey={selectedFileForShare.key}
    fileName={selectedFileForShare.name}
  />
{/if}

{#if bucket}
  <ManageSharesModal
    bind:open={isManageSharesOpen}
    {bucket}
  />
{/if}

{#if selectedFileForPreview && bucket}
  <PreviewModal
    bind:open={isPreviewOpen}
    {bucket}
    fileKey={selectedFileForPreview.key}
    fileName={selectedFileForPreview.name}
    fileSize={selectedFileForPreview.size || 0}
  />
{/if}
