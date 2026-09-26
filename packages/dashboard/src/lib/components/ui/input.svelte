<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { cn } from '$lib/components/utils';

	interface Props extends Omit<HTMLInputAttributes, 'prefix'> {
		value?: string | number;
		type?: string;
		placeholder?: string;
		disabled?: boolean;
		error?: boolean | string;
		label?: string;
		hint?: string;
		class?: string;
		wrapperClass?: string;
		prefix?: Snippet;
		suffix?: Snippet;
	}

	let {
		value = $bindable(''),
		type = 'text',
		placeholder = '',
		disabled = false,
		error = false,
		label,
		hint,
		class: className = '',
		wrapperClass = '',
		prefix,
		suffix,
		id,
		...restProps
	}: Props = $props();

	const hasError = $derived(Boolean(error));
	const errorMessage = $derived(typeof error === 'string' ? error : undefined);
</script>

<div class={cn('flex flex-col gap-1.5 w-full', wrapperClass)}>
	{#if label}
		<label for={id} class="text-xs font-medium text-zinc-700 dark:text-zinc-300">
			{label}
		</label>
	{/if}

	<div class="relative flex items-center w-full">
		{#if prefix}
			<div class="absolute left-3 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
				{@render prefix()}
			</div>
		{/if}

		<input
			{id}
			{type}
			bind:value
			{placeholder}
			{disabled}
			aria-invalid={hasError}
			class={cn(
				'h-9 w-full rounded-lg border bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors dark:bg-zinc-950/60 dark:text-zinc-100 dark:placeholder:text-zinc-500',
				'border-zinc-200 dark:border-zinc-800',
				'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-1 dark:focus-visible:ring-zinc-600',
				disabled && 'cursor-not-allowed opacity-50 bg-zinc-50 dark:bg-zinc-900',
				hasError &&
					'border-red-500 text-red-900 focus-visible:ring-red-400 dark:border-red-500 dark:text-red-200 dark:focus-visible:ring-red-500',
				prefix && 'pl-9',
				suffix && 'pr-9',
				className
			)}
			{...restProps}
		/>

		{#if suffix}
			<div class="absolute right-3 flex items-center text-zinc-400 dark:text-zinc-500">
				{@render suffix()}
			</div>
		{/if}
	</div>

	{#if errorMessage}
		<p class="text-[11px] text-red-600 dark:text-red-400">{errorMessage}</p>
	{:else if hint}
		<p class="text-[11px] text-zinc-500 dark:text-zinc-400">{hint}</p>
	{/if}
</div>
