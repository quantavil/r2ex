<script lang="ts">
	import { Dialog } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/components/utils';

	interface Props {
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		title?: string;
		description?: string;
		trigger?: Snippet;
		children?: Snippet;
		footer?: Snippet;
		titleSnippet?: Snippet;
		descriptionSnippet?: Snippet;
		showClose?: boolean;
		size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
		class?: string;
		contentClass?: string;
	}

	let {
		open = $bindable(false),
		onOpenChange,
		title,
		description,
		trigger,
		children,
		footer,
		titleSnippet,
		descriptionSnippet,
		showClose = true,
		size = 'md',
		class: className = '',
		contentClass = '',
		...restProps
	}: Props = $props();

	const sizeClasses = {
		sm: 'max-w-sm',
		md: 'max-w-lg',
		lg: 'max-w-2xl',
		xl: 'max-w-4xl',
		full: 'max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]'
	};
</script>

<Dialog.Root bind:open {onOpenChange} {...restProps}>
	{#if trigger}
		<Dialog.Trigger>
			{@render trigger()}
		</Dialog.Trigger>
	{/if}

	<Dialog.Portal>
		<Dialog.Overlay
			class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-200 animate-in fade-in"
		/>
		<Dialog.Content
			class={cn(
				'fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-zinc-200/80 bg-white/95 p-6 shadow-2xl backdrop-blur-md outline-none transition-all duration-200 animate-in fade-in-0 zoom-in-95 dark:border-zinc-800/80 dark:bg-zinc-900/95 dark:text-zinc-50',
				sizeClasses[size],
				contentClass,
				className
			)}
		>
			{#if title || titleSnippet || description || descriptionSnippet}
				<div class="flex flex-col gap-1.5 pb-3">
					{#if titleSnippet}
						<Dialog.Title>
							{@render titleSnippet()}
						</Dialog.Title>
					{:else if title}
						<Dialog.Title class="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
							{title}
						</Dialog.Title>
					{/if}

					{#if descriptionSnippet}
						<Dialog.Description>
							{@render descriptionSnippet()}
						</Dialog.Description>
					{:else if description}
						<Dialog.Description class="text-sm text-zinc-500 dark:text-zinc-400">
							{description}
						</Dialog.Description>
					{/if}
				</div>
			{/if}

			<div class="relative">
				{@render children?.()}
			</div>

			{#if footer}
				<div class="flex items-center justify-end gap-2 pt-4 mt-2 border-t border-zinc-100 dark:border-zinc-800/60">
					{@render footer()}
				</div>
			{/if}

			{#if showClose}
				<Dialog.Close
					class="absolute right-4 top-4 rounded-lg p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:text-zinc-500 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400"
					aria-label="Close"
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
				</Dialog.Close>
			{/if}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
