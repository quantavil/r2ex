<script lang="ts">
import { apiClient } from "$lib/api/client";
import type { R2Object } from "$lib/api/types";
import { Copy, Download, Eye, MoreVertical, Share, Trash } from "$lib/icons";
import { toast } from "svelte-sonner";

interface Props {
	file: R2Object;
	bucket: string;
	onshare?: (file: R2Object) => void;
	onpreview?: (file: R2Object) => void;
	ondeleted?: (file: R2Object) => void;
	onaction?: () => void;
}
let { file, bucket, onshare, onpreview, ondeleted, onaction }: Props =
	$props();

let isOpen = $state(false);
const fileName = $derived(file.name || file.key.split("/").pop() || "file");

function handleDownload() {
	isOpen = false;
	onaction?.();
	const url = `/api/buckets/${bucket}/${apiClient.encodeKey(file.key)}`;
	const a = document.createElement("a");
	a.href = url;
	a.download = fileName;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
}

function handleShare() {
	isOpen = false;
	onaction?.();
	onshare?.(file);
}

function handlePreview() {
	isOpen = false;
	onaction?.();
	onpreview?.(file);
}

async function handleDelete() {
	isOpen = false;
	onaction?.();
	if (!confirm(`Are you sure you want to delete "${fileName}"?`)) return;

	try {
		await apiClient.deleteObject(bucket, file.key);
		toast.success(`Deleted ${fileName}`);
		ondeleted?.(file);
	} catch (err: any) {
		toast.error(err.message || "Failed to delete");
	}
}

async function handleDuplicate() {
	isOpen = false;
	onaction?.();
	const ext = fileName.includes(".") ? `.${fileName.split(".").pop()}` : "";
	const base = ext ? fileName.slice(0, -ext.length) : fileName;
	const newName = `${base} copy${ext}`;
	const prefix = file.key.includes("/")
		? file.key.slice(0, file.key.lastIndexOf("/") + 1)
		: "";
	const destinationKey = `${prefix}${newName}`;

	try {
		await apiClient.copyObject(bucket, file.key, destinationKey);
		toast.success(`Duplicated to ${newName}`);
		ondeleted?.(file); // trigger reload
	} catch (err: any) {
		toast.error(err.message || "Failed to duplicate");
	}
}
</script>

<div class="relative">
  <button
    onclick={(e) => {
      e.stopPropagation();
      isOpen = !isOpen;
    }}
    class="rounded-lg p-1.5 text-zinc-400 opacity-0 group-hover:opacity-100 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition"
    aria-label="File options"
  >
    <MoreVertical class="size-4" />
  </button>

  {#if isOpen}
    <div
      role="presentation"
      tabindex="-1"
      class="fixed inset-0 z-40"
      onclick={(e) => {
        e.stopPropagation();
        isOpen = false;
      }}
      onkeydown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          isOpen = false;
        }
      }}
    ></div>

    <div
      role="menu"
      tabindex="-1"
      class="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border border-zinc-200 bg-white/95 p-1.5 shadow-xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
    >
      {#if file.type !== 'folder'}
        <button
          onclick={handlePreview}
          class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <Eye class="size-3.5 text-zinc-400" />
          Preview
        </button>

        <button
          onclick={handleShare}
          class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <Share class="size-3.5 text-blue-500" />
          Share Link
        </button>

        <button
          onclick={handleDownload}
          class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <Download class="size-3.5 text-emerald-500" />
          Download
        </button>

        <button
          onclick={handleDuplicate}
          class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <Copy class="size-3.5 text-zinc-400" />
          Duplicate
        </button>

        <div class="my-1 border-t border-zinc-100 dark:border-zinc-800"></div>
      {/if}

      <button
        onclick={handleDelete}
        class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
      >
        <Trash class="size-3.5" />
        Delete
      </button>
    </div>
  {/if}
</div>
