<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/components/utils';

	export type BadgeVariant =
		| 'default'
		| 'secondary'
		| 'outline'
		| 'destructive'
		| 'success'
		| 'warning'
		| 'info';
	export type BadgeSize = 'sm' | 'md';

	interface Props {
		variant?: BadgeVariant;
		size?: BadgeSize;
		text?: string;
		class?: string;
		children?: Snippet;
	}

	let {
		variant = 'default',
		size = 'md',
		text,
		class: className = '',
		children,
		...restProps
	}: Props = $props();

	const variantClasses: Record<BadgeVariant, string> = {
		default: 'bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900',
		secondary: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
		outline: 'border border-zinc-200 text-zinc-800 dark:border-zinc-800 dark:text-zinc-200',
		destructive:
			'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50',
		success:
			'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50',
		warning:
			'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50',
		info: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50'
	};

	const sizeClasses: Record<BadgeSize, string> = {
		sm: 'px-2 py-0.5 text-[10px]',
		md: 'px-2.5 py-0.5 text-xs'
	};
</script>

<span
	class={cn(
		'inline-flex items-center gap-1 rounded-full font-medium tracking-wide transition-colors uppercase font-mono select-none',
		variantClasses[variant],
		sizeClasses[size],
		className
	)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{:else if text}
		{text}
	{/if}
</span>
