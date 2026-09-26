<script lang="ts">
	import { DropdownMenu } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/components/utils';

	export interface DropdownMenuItemConfig {
		label?: string;
		icon?: Snippet;
		onSelect?: () => void;
		onClick?: () => void;
		destructive?: boolean;
		disabled?: boolean;
		separator?: boolean;
		shortcut?: string;
	}

	interface Props {
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		trigger?: Snippet;
		children?: Snippet;
		items?: DropdownMenuItemConfig[];
		align?: 'start' | 'center' | 'end';
		sideOffset?: number;
		class?: string;
		contentClass?: string;
	}

	let {
		open = $bindable(false),
		onOpenChange,
		trigger,
		children,
		items = [],
		align = 'end',
		sideOffset = 4,
		class: className = '',
		contentClass = '',
		...restProps
	}: Props = $props();
</script>

<DropdownMenu.Root bind:open {onOpenChange} {...restProps}>
	{#if trigger}
		<DropdownMenu.Trigger class={cn('inline-flex items-center justify-center outline-none', className)}>
			{@render trigger()}
		</DropdownMenu.Trigger>
	{/if}

	<DropdownMenu.Portal>
		<DropdownMenu.Content
			class={cn(
				'z-50 min-w-44 overflow-hidden rounded-xl border border-zinc-200/80 bg-white/95 p-1 text-zinc-900 shadow-xl backdrop-blur-md outline-none transition-all duration-150 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 dark:border-zinc-800/80 dark:bg-zinc-900/95 dark:text-zinc-100',
				contentClass
			)}
			{align}
			{sideOffset}
		>
			{#if children}
				{@render children()}
			{:else}
				{#each items as item}
					{#if item.separator}
						<DropdownMenu.Separator class="-mx-1 my-1 h-px bg-zinc-200 dark:bg-zinc-800" />
					{:else}
						<DropdownMenu.Item
							onSelect={item.onSelect || item.onClick}
							disabled={item.disabled}
							class={cn(
								'relative flex cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium outline-none transition-colors data-[highlighted]:bg-zinc-100 data-[highlighted]:text-zinc-900 dark:data-[highlighted]:bg-zinc-800 dark:data-[highlighted]:text-zinc-50 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
								item.destructive &&
									'text-red-600 data-[highlighted]:bg-red-50 data-[highlighted]:text-red-700 dark:text-red-400 dark:data-[highlighted]:bg-red-950/40 dark:data-[highlighted]:text-red-300'
							)}
						>
							{#if item.icon}
								{@render item.icon()}
							{/if}
							<span class="flex-1">{item.label}</span>
							{#if item.shortcut}
								<span class="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
									{item.shortcut}
								</span>
							{/if}
						</DropdownMenu.Item>
					{/if}
				{/each}
			{/if}
		</DropdownMenu.Content>
	</DropdownMenu.Portal>
</DropdownMenu.Root>
