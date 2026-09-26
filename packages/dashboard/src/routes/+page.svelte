<script lang="ts">
import { goto } from "$app/navigation";
import { mainStore } from "$lib/stores/main.svelte";
import { onMount } from "svelte";

onMount(async () => {
	await mainStore.loadServerConfigs();
	if (mainStore.buckets.length > 0) {
		goto(`/files/${mainStore.buckets[0].name}`);
	}
});
</script>

<div class="flex h-full min-h-[50vh] flex-col items-center justify-center p-8 text-center text-zinc-400">
  <div class="size-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100"></div>
  <p class="mt-4 text-xs font-medium tracking-wide">Connecting to R2 Bucket...</p>
</div>
