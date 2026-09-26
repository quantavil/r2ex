<script lang="ts">
	import { appState } from '$lib/components/state.svelte';
	import { cn } from '$lib/components/utils';

	interface Props {
		bucket?: string;
		path?: string;
		onNavigate?: (path: string) => void;
		class?: string;
	}

	let {
		bucket = '',
		path = '',
		onNavigate,
		class: className = ''
	}: Props = $props();

	const activeBucket = $derived(bucket || appState.currentBucket || 'default');
	const activePath = $derived(path !== undefined && path !== '' ? path : appState.currentPath);

	const segments = $derived.by(() => {
		if (!activePath) return [];
		return activePath.split('/').filter(Boolean);
	});

	function handleNavigate(targetPath: string) {
		appState.setPath(targetPath);
		onNavigate?.(targetPath);
	}

	function getPathUpTo(index: number) {
		return segments.slice(0, index + 1).join('/');
	}
</script>

<nav aria-label="Breadcrumb" class={cn('flex items-center gap-1 overflow-x-auto py-1 scrollbar-none', className)}>
	<!-- Root / Bucket pill -->
	<button
		type="button"
		onclick={() => handleNavigate('')}
		class={cn(
			'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer',
			segments.length === 0
				? 'bg-zinc-200/70 text-zinc-900 font-semibold dark:bg-zinc-800 dark:text-zinc-100'
				: 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'
		)}
		title={`Root: ${activeBucket}`}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-3.5 w-3.5 shrink-0 text-zinc-500 dark:text-zinc-400"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path>
		</svg>
		<span>{activeBucket}</span>
	</button>

	{#each segments as segment, i}
		<span class="text-zinc-400 dark:text-zinc-600 select-none text-xs" aria-hidden="true">/</span>

		{#if i === segments.length - 1}
			<!-- Current active folder segment -->
			<span
				class="inline-flex items-center rounded-lg bg-zinc-200/70 px-2.5 py-1 text-xs font-semibold text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
				aria-current="page"
			>
				{segment}
			</span>
		{:else}
			<!-- Parent directory segment button -->
			<button
				type="button"
				onclick={() => handleNavigate(getPathUpTo(i))}
				class="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
			>
				{segment}
			</button>
		{/if}
	{/each}
</nav>
