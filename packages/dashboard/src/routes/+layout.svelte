<script lang="ts">
import "../app.css";
import { page } from "$app/state";
import Sidebar from "$lib/components/layout/Sidebar.svelte";
import Topbar from "$lib/components/layout/Topbar.svelte";
import { appState } from "$lib/components/state.svelte";
import DropZone from "$lib/components/upload/DropZone.svelte";
import UploadDrawer from "$lib/components/upload/UploadDrawer.svelte";
import { mainStore } from "$lib/stores/main.svelte";
import { ModeWatcher } from "mode-watcher";
import { onMount } from "svelte";
import { Toaster } from "svelte-sonner";

const { children } = $props();

const isPublicShare = $derived(page.url.pathname.startsWith("/share"));

onMount(async () => {
	if (!isPublicShare) {
		await mainStore.loadServerConfigs();
		if (mainStore.buckets.length > 0) {
			appState.buckets = mainStore.buckets;
			if (!appState.currentBucket) {
				appState.currentBucket = mainStore.buckets[0].name;
			}
		}
		appState.apiReadonly = mainStore.apiReadonly;
	}
});
</script>

<ModeWatcher />
<Toaster richColors position="bottom-right" />

{#if isPublicShare}
  <div class="min-h-screen w-full bg-zinc-950 text-zinc-100 antialiased selection:bg-orange-500 selection:text-white">
    {@render children()}
  </div>
{:else}
  <DropZone>
    <div class="flex h-screen w-screen overflow-hidden bg-zinc-50 text-zinc-900 antialiased selection:bg-orange-500 selection:text-white dark:bg-zinc-950 dark:text-zinc-100">
      <!-- Responsive Collapsible Sidebar -->
      <Sidebar />

      <!-- Main App Shell -->
      <div class="flex flex-1 flex-col min-w-0 overflow-hidden">
        <!-- Shell Topbar -->
        <Topbar />

        <!-- Page Content Container -->
        <main class="flex-1 overflow-y-auto focus:outline-none">
          {@render children()}
        </main>
      </div>
    </div>

    <!-- Floating Upload Progress Drawer -->
    <UploadDrawer />
  </DropZone>
{/if}
