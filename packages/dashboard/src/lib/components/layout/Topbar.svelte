<script lang="ts">
	import { appState } from '$lib/components/state.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Breadcrumbs from './Breadcrumbs.svelte';
	import { cn } from '$lib/components/utils';

	interface Props {
		onUpload?: () => void;
		onNewFolder?: () => void;
		onSearch?: (query: string) => void;
		class?: string;
	}

	let {
		onUpload,
		onNewFolder,
		onSearch,
		class: className = ''
	}: Props = $props();

	function handleSearchInput(e: Event) {
		const target = e.target as HTMLInputElement;
		appState.searchQuery = target.value;
		onSearch?.(target.value);
	}

	function clearSearch() {
		appState.searchQuery = '';
		onSearch?.('');
	}
</script>

<header
	class={cn(
		'sticky top-0 z-20 flex h-16 w-full items-center justify-between gap-3 border-b border-zinc-200/80 bg-white/80 px-4 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/80 md:px-6',
		className
	)}
>
	<!-- Left section: Mobile menu toggle & Breadcrumbs -->
	<div class="flex items-center gap-2 min-w-0 flex-1 md:flex-initial">
		<!-- Mobile hamburger button -->
		<button
			type="button"
			onclick={() => appState.toggleMobileMenu()}
			class="inline-flex md:hidden items-center justify-center p-2 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
			aria-label="Toggle navigation menu"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<line x1="4" y1="12" x2="20" y2="12"></line>
				<line x1="4" y1="6" x2="20" y2="6"></line>
				<line x1="4" y1="18" x2="20" y2="18"></line>
			</svg>
		</button>

		<!-- Breadcrumbs display in topbar -->
		<div class="hidden sm:flex min-w-0">
			<Breadcrumbs />
		</div>
	</div>

	<!-- Center/Right section: Search & Actions -->
	<div class="flex items-center gap-2 sm:gap-3 flex-1 justify-end max-w-2xl">
		<!-- Search input with clear button -->
		<div class="relative w-full max-w-xs sm:max-w-sm">
			<!-- Magnifying glass icon -->
			<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400 dark:text-zinc-500">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<circle cx="11" cy="11" r="8"></circle>
					<path d="m21 21-4.3-4.3"></path>
				</svg>
			</div>

			<input
				type="text"
				value={appState.searchQuery}
				oninput={handleSearchInput}
				placeholder="Search files and folders..."
				class="h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50/70 pl-9 pr-8 text-xs text-zinc-900 placeholder:text-zinc-400 transition-colors focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-400/40 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-700 dark:focus:bg-zinc-900 dark:focus:ring-zinc-600/40"
			/>

			<!-- Clear button -->
			{#if appState.searchQuery}
				<button
					type="button"
					onclick={clearSearch}
					class="absolute inset-y-0 right-0 flex items-center pr-2.5 text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200 transition-colors cursor-pointer"
					aria-label="Clear search query"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-3.5 w-3.5"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<circle cx="12" cy="12" r="10"></circle>
						<line x1="15" y1="9" x2="9" y2="15"></line>
						<line x1="9" y1="9" x2="15" y2="15"></line>
					</svg>
				</button>
			{/if}
		</div>

		<!-- View mode toggle (Table view vs Grid view) -->
		<div
			class="flex items-center rounded-lg border border-zinc-200 bg-zinc-100/80 p-0.5 dark:border-zinc-800 dark:bg-zinc-900"
			role="group"
			aria-label="View mode toggle"
		>
			<button
				type="button"
				onclick={() => { appState.viewMode = 'table'; }}
				class={cn(
					'flex h-7 w-7 items-center justify-center rounded-md text-xs transition-all cursor-pointer',
					appState.viewMode === 'table'
						? 'bg-white font-medium text-zinc-950 shadow-xs dark:bg-zinc-800 dark:text-zinc-50'
						: 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
				)}
				title="Table view"
				aria-label="Table view"
				aria-pressed={appState.viewMode === 'table'}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-3.5 w-3.5"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<line x1="8" y1="6" x2="21" y2="6"></line>
					<line x1="8" y1="12" x2="21" y2="12"></line>
					<line x1="8" y1="18" x2="21" y2="18"></line>
					<line x1="3" y1="6" x2="3.01" y2="6"></line>
					<line x1="3" y1="12" x2="3.01" y2="12"></line>
					<line x1="3" y1="18" x2="3.01" y2="18"></line>
				</svg>
			</button>

			<button
				type="button"
				onclick={() => { appState.viewMode = 'grid'; }}
				class={cn(
					'flex h-7 w-7 items-center justify-center rounded-md text-xs transition-all cursor-pointer',
					appState.viewMode === 'grid'
						? 'bg-white font-medium text-zinc-950 shadow-xs dark:bg-zinc-800 dark:text-zinc-50'
						: 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
				)}
				title="Grid view"
				aria-label="Grid view"
				aria-pressed={appState.viewMode === 'grid'}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-3.5 w-3.5"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<rect width="7" height="7" x="3" y="3" rx="1"></rect>
					<rect width="7" height="7" x="14" y="3" rx="1"></rect>
					<rect width="7" height="7" x="14" y="14" rx="1"></rect>
					<rect width="7" height="7" x="3" y="14" rx="1"></rect>
				</svg>
			</button>
		</div>

		<!-- Action buttons: "New Folder", "Upload" -->
		<div class="flex items-center gap-1.5 sm:gap-2">
			<Button
				variant="outline"
				size="sm"
				disabled={appState.apiReadonly}
				onclick={onNewFolder}
				title={appState.apiReadonly ? 'Read-only mode' : 'New Folder'}
				class="hidden sm:inline-flex"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-3.5 w-3.5"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path>
					<line x1="12" y1="10" x2="12" y2="16"></line>
					<line x1="9" y1="13" x2="15" y2="13"></line>
				</svg>
				<span>New Folder</span>
			</Button>

			<Button
				variant="default"
				size="sm"
				disabled={appState.apiReadonly}
				onclick={onUpload}
				title={appState.apiReadonly ? 'Read-only mode' : 'Upload Files'}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-3.5 w-3.5"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
					<polyline points="17 8 12 3 7 8"></polyline>
					<line x1="12" y1="3" x2="12" y2="15"></line>
				</svg>
				<span class="hidden xs:inline">Upload</span>
			</Button>
		</div>
	</div>
</header>
