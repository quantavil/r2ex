<script lang="ts">
	import { appState } from '$lib/components/state.svelte';
	import DropdownMenu from '$lib/components/ui/dropdown-menu.svelte';
	import { toggleMode, mode } from 'mode-watcher';
	import { cn } from '$lib/components/utils';

	interface Props {
		class?: string;
	}

	let { class: className = '' }: Props = $props();

	// Reactive derived values
	const activeBucket = $derived(
		appState.currentBucket || (appState.buckets.length > 0 ? appState.buckets[0].name : 'default')
	);

	const isCollapsed = $derived(!appState.sidebarOpen);

	function selectBucket(name: string) {
		appState.setBucket(name);
	}
</script>

<!-- Mobile Overlay Backdrop -->
{#if appState.mobileMenuOpen}
	<div
		tabindex="0"
		role="button"
		class="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs transition-opacity md:hidden cursor-pointer"
		onclick={() => appState.setMobileMenu(false)}
		onkeydown={(e) => { if (e.key === 'Escape') appState.setMobileMenu(false); }}
		aria-label="Close navigation overlay"
	></div>
{/if}

<!-- Sidebar Container -->
<aside
	class={cn(
		'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-zinc-200/80 bg-white/95 backdrop-blur-md transition-all duration-200 ease-in-out dark:border-zinc-800/80 dark:bg-zinc-950/95 md:static md:z-30',
		// Mobile slide-over
		appState.mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
		// Desktop width
		isCollapsed ? 'md:w-18' : 'md:w-64',
		'w-72',
		className
	)}
>
	<!-- App Branding Header -->
	<div class="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200/80 px-4 dark:border-zinc-800/80">
		<a
			href="/"
			class="flex items-center gap-2.5 overflow-hidden font-semibold tracking-tight text-zinc-900 transition-colors dark:text-zinc-50"
		>
			<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-xs">
				<!-- Cloudflare / R2 Cloud Icon -->
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4.5 w-4.5"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path>
				</svg>
			</div>
			{#if !isCollapsed}
				<span class="truncate text-base font-bold">r2ex</span>
			{/if}
		</a>

		<!-- Desktop Collapse / Expand Button -->
		<button
			type="button"
			onclick={() => appState.toggleSidebar()}
			class="hidden md:inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 transition-colors cursor-pointer"
			title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
			aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class={cn('h-4 w-4 transition-transform duration-200', isCollapsed && 'rotate-180')}
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<polyline points="15 18 9 12 15 6"></polyline>
			</svg>
		</button>

		<!-- Mobile Close Button -->
		<button
			type="button"
			onclick={() => appState.setMobileMenu(false)}
			class="inline-flex md:hidden h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 transition-colors cursor-pointer"
			aria-label="Close menu"
		>
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
				<line x1="18" y1="6" x2="6" y2="18"></line>
				<line x1="6" y1="6" x2="18" y2="18"></line>
			</svg>
		</button>
	</div>

	<!-- Bucket Picker Selector -->
	<div class="p-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
		<DropdownMenu align="start" class="w-full">
			{#snippet trigger()}
				<div
					class={cn(
						'flex w-full items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50/80 p-2 text-left text-xs font-medium text-zinc-800 transition-all hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200 dark:hover:bg-zinc-800/80 cursor-pointer',
						isCollapsed ? 'justify-center px-1' : 'justify-between px-3'
					)}
					title={`Current bucket: ${activeBucket}`}
				>
					<div class="flex items-center gap-2 min-w-0">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4 shrink-0 text-orange-500"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
							<path d="M3 5v14a9 3 0 0 0 18 0V5"></path>
							<path d="M3 12a9 3 0 0 0 18 0"></path>
						</svg>
						{#if !isCollapsed}
							<div class="flex flex-col min-w-0">
								<span class="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold">Bucket</span>
								<span class="truncate font-semibold text-zinc-900 dark:text-zinc-100">{activeBucket}</span>
							</div>
						{/if}
					</div>

					{#if !isCollapsed}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-3.5 w-3.5 shrink-0 text-zinc-400"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="m6 9 6 6 6-6"></path>
						</svg>
					{/if}
				</div>
			{/snippet}

			{#snippet children()}
				<div class="p-1 min-w-52">
					<div class="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
						Available Buckets ({appState.buckets.length})
					</div>
					{#each appState.buckets as b}
						<button
							type="button"
							onclick={() => selectBucket(b.name)}
							class={cn(
								'flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors cursor-pointer text-left',
								b.name === activeBucket
									? 'bg-zinc-100 font-semibold text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
									: 'text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/60'
							)}
						>
							<span class="truncate">{b.name}</span>
							{#if b.name === activeBucket}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-3.5 w-3.5 shrink-0 text-orange-500"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<polyline points="20 6 9 17 4 12"></polyline>
								</svg>
							{/if}
						</button>
					{/each}
				</div>
			{/snippet}
		</DropdownMenu>
	</div>

	<!-- Read-only Banner (if apiReadonly is true) -->
	{#if appState.apiReadonly}
		<div class="mx-3 mt-3 rounded-xl border border-amber-200 bg-amber-50/90 p-2.5 dark:border-amber-900/50 dark:bg-amber-950/40">
			<div class="flex items-center gap-2 text-amber-800 dark:text-amber-300">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4 shrink-0"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
					<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
				</svg>
				{#if !isCollapsed}
					<div class="flex flex-col">
						<span class="text-xs font-bold leading-none">Read-Only Mode</span>
						<span class="text-[10px] opacity-80 mt-0.5">Modifications disabled</span>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Navigation Links -->
	<nav class="flex-1 space-y-1 p-3 overflow-y-auto" aria-label="Sidebar Navigation">
		<!-- All Files -->
		<button
			type="button"
			onclick={() => {
				appState.setActiveNav('files');
				appState.setMobileMenu(false);
			}}
			class={cn(
				'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-colors cursor-pointer text-left',
				appState.activeNav === 'files'
					? 'bg-zinc-900 text-zinc-50 shadow-xs dark:bg-zinc-100 dark:text-zinc-900'
					: 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100',
				isCollapsed && 'justify-center px-2'
			)}
			title="All Files"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-4 w-4 shrink-0"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path>
			</svg>
			{#if !isCollapsed}
				<span class="truncate">All Files</span>
			{/if}
		</button>

		<!-- Shared Links -->
		<button
			type="button"
			onclick={() => {
				appState.setActiveNav('shares');
				appState.setMobileMenu(false);
			}}
			class={cn(
				'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-colors cursor-pointer text-left',
				appState.activeNav === 'shares'
					? 'bg-zinc-900 text-zinc-50 shadow-xs dark:bg-zinc-100 dark:text-zinc-900'
					: 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100',
				isCollapsed && 'justify-center px-2'
			)}
			title="Shared Links"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-4 w-4 shrink-0"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<circle cx="18" cy="5" r="3"></circle>
				<circle cx="6" cy="12" r="3"></circle>
				<circle cx="18" cy="19" r="3"></circle>
				<line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
				<line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
			</svg>
			{#if !isCollapsed}
				<span class="truncate">Shared Links</span>
			{/if}
		</button>

		<!-- Storage Info -->
		<button
			type="button"
			onclick={() => {
				appState.setActiveNav('storage');
				appState.setMobileMenu(false);
			}}
			class={cn(
				'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-colors cursor-pointer text-left',
				appState.activeNav === 'storage'
					? 'bg-zinc-900 text-zinc-50 shadow-xs dark:bg-zinc-100 dark:text-zinc-900'
					: 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100',
				isCollapsed && 'justify-center px-2'
			)}
			title="Storage Info"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-4 w-4 shrink-0"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<line x1="22" y1="12" x2="2" y2="12"></line>
				<path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
				<line x1="6" y1="16" x2="6.01" y2="16"></line>
				<line x1="10" y1="16" x2="10.01" y2="16"></line>
			</svg>
			{#if !isCollapsed}
				<span class="truncate">Storage Info</span>
			{/if}
		</button>
	</nav>

	<!-- Footer with Theme Toggle -->
	<div class="border-t border-zinc-200/80 p-3 dark:border-zinc-800/80">
		<button
			type="button"
			onclick={() => toggleMode()}
			class={cn(
				'flex w-full items-center gap-3 rounded-xl border border-zinc-200/70 bg-zinc-50/60 px-3 py-2 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 cursor-pointer',
				isCollapsed && 'justify-center px-2'
			)}
			title="Toggle Dark / Light Theme"
			aria-label="Toggle theme"
		>
			<!-- Sun icon for dark mode / Moon icon for light mode -->
			<div class="relative h-4 w-4 shrink-0">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="absolute inset-0 h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<circle cx="12" cy="12" r="4"></circle>
					<path d="M12 2v2"></path>
					<path d="M12 20v2"></path>
					<path d="m4.93 4.93 1.41 1.41"></path>
					<path d="m17.66 17.66 1.41 1.41"></path>
					<path d="M2 12h2"></path>
					<path d="M20 12h2"></path>
					<path d="m6.34 17.66-1.41 1.41"></path>
					<path d="m19.07 4.93-1.41 1.41"></path>
				</svg>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="absolute inset-0 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-blue-400"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
				</svg>
			</div>

			{#if !isCollapsed}
				<span class="truncate">Theme</span>
				<span class="ml-auto text-[10px] text-zinc-400 dark:text-zinc-500 capitalize">
					{$mode || 'System'}
				</span>
			{/if}
		</button>
	</div>
</aside>
