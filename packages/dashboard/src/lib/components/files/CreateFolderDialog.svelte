<script lang="ts">
import { apiClient } from "$lib/api/client";
import { Folder, X } from "$lib/icons";
import { mainStore } from "$lib/stores/main.svelte";
import { toast } from "svelte-sonner";

interface Props {
	open?: boolean;
	oncreated?: () => void;
}
let { open = $bindable(false), oncreated }: Props = $props();

let folderName = $state("");
let isCreating = $state(false);

async function handleCreate(e?: Event) {
	e?.preventDefault();
	const trimmed = folderName.trim().replace(/\/+/g, "");
	if (!trimmed) {
		toast.error("Folder name cannot be empty");
		return;
	}

	if (!mainStore.currentBucket) {
		toast.error("No bucket selected");
		return;
	}

	isCreating = true;
	try {
		const targetKey = `${mainStore.currentFolder}${trimmed}/`;
		await apiClient.createFolder(mainStore.currentBucket, targetKey);
		toast.success(`Folder "${trimmed}" created`);
		folderName = "";
		open = false;
		oncreated?.();
	} catch (err: any) {
		toast.error(err.message || "Failed to create folder");
	} finally {
		isCreating = false;
	}
}
</script>

{#if open}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div
      role="presentation"
      tabindex="-1"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      onclick={() => (open = false)}
      onkeydown={(e) => e.key === 'Escape' && (open = false)}
    ></div>

    <!-- Modal Card -->
    <div class="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
      <div class="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div class="flex items-center gap-2.5">
          <div class="rounded-xl bg-amber-500/10 p-2 text-amber-500">
            <Folder class="size-5" />
          </div>
          <h3 class="font-semibold text-zinc-900 dark:text-zinc-100">Create New Folder</h3>
        </div>
        <button
          onclick={() => (open = false)}
          class="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          aria-label="Close"
        >
          <X class="size-4" />
        </button>
      </div>

      <form onsubmit={handleCreate} class="mt-4 space-y-4">
        <div>
          <label for="folder-name-input" class="block text-xs font-medium text-zinc-600 dark:text-zinc-400">Folder Name</label>
          <input
            id="folder-name-input"
            type="text"
            bind:value={folderName}
            placeholder="e.g. Documents, Photos, 2026"
            class="mt-1.5 w-full rounded-xl border border-zinc-200 bg-transparent px-3.5 py-2 text-sm outline-none transition focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:focus:border-zinc-100 dark:focus:ring-zinc-100"
          />
        </div>

        <div class="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onclick={() => (open = false)}
            class="rounded-xl px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isCreating}
            class="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {isCreating ? 'Creating...' : 'Create Folder'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
