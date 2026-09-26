<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes, HTMLAnchorAttributes } from 'svelte/elements';
	import { cn } from '$lib/components/utils';

	export type ButtonVariant = 'default' | 'secondary' | 'destructive' | 'ghost' | 'outline';
	export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

	interface BaseProps {
		variant?: ButtonVariant;
		size?: ButtonSize;
		disabled?: boolean;
		class?: string;
		children?: Snippet;
	}

	type ButtonAsButton = BaseProps &
		Omit<HTMLButtonAttributes, keyof BaseProps> & {
			href?: undefined;
			type?: 'button' | 'submit' | 'reset';
		};

	type ButtonAsAnchor = BaseProps &
		Omit<HTMLAnchorAttributes, keyof BaseProps> & {
			href: string;
			type?: undefined;
		};

	type Props = ButtonAsButton | ButtonAsAnchor;

	let {
		variant = 'default',
		size = 'md',
		disabled = false,
		href,
		class: className = '',
		type = 'button',
		children,
		...restProps
	}: Props = $props();

	const variantClasses: Record<ButtonVariant, string> = {
		default:
			'bg-zinc-900 text-zinc-50 hover:bg-zinc-800 active:bg-zinc-950 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:active:bg-zinc-50 shadow-sm border border-transparent',
		secondary:
			'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 active:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 dark:active:bg-zinc-600 border border-transparent',
		destructive:
			'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 dark:bg-red-600 dark:hover:bg-red-700 shadow-sm border border-transparent',
		ghost:
			'hover:bg-zinc-100 hover:text-zinc-900 active:bg-zinc-200 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 text-zinc-700 dark:text-zinc-300 border border-transparent',
		outline:
			'border border-zinc-200 bg-transparent hover:bg-zinc-100 text-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-800 dark:text-zinc-100 shadow-xs'
	};

	const sizeClasses: Record<ButtonSize, string> = {
		sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
		md: 'h-9 px-4 text-sm rounded-lg gap-2',
		lg: 'h-10 px-5 text-base rounded-xl gap-2.5',
		icon: 'h-9 w-9 p-0 rounded-lg justify-center shrink-0'
	};
</script>

{#if href}
	<a
		{href}
		class={cn(
			'inline-flex items-center justify-center font-medium transition-colors select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600 focus-visible:ring-offset-1',
			disabled && 'pointer-events-none opacity-50 cursor-not-allowed',
			variantClasses[variant],
			sizeClasses[size],
			className
		)}
		aria-disabled={disabled}
		{...(restProps as any)}
	>
		{@render children?.()}
	</a>
{:else}
	<button
		{type}
		{disabled}
		class={cn(
			'inline-flex items-center justify-center font-medium transition-colors select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600 focus-visible:ring-offset-1',
			disabled && 'pointer-events-none opacity-50 cursor-not-allowed',
			variantClasses[variant],
			sizeClasses[size],
			className
		)}
		{...(restProps as any)}
	>
		{@render children?.()}
	</button>
{/if}
