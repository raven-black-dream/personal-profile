<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		open: boolean;
		title: string;
		onclose?: () => void;
		children: Snippet;
	}

	let { open = $bindable(false), title, onclose, children }: Props = $props();

	let dialogEl = $state<HTMLDivElement | null>(null);
	let restoreFocus: HTMLElement | null = null;

	// Scroll-lock + focus management while open; restore on close.
	$effect(() => {
		if (!open) return;
		restoreFocus = (document.activeElement as HTMLElement) ?? null;
		const prevOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		queueMicrotask(() => focusFirst());
		return () => {
			document.body.style.overflow = prevOverflow;
			restoreFocus?.focus?.();
		};
	});

	function focusable(): HTMLElement[] {
		if (!dialogEl) return [];
		return Array.from(
			dialogEl.querySelectorAll<HTMLElement>(
				'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
			)
		);
	}

	function focusFirst() {
		const els = focusable();
		(els[0] ?? dialogEl)?.focus();
	}

	function close() {
		open = false;
		onclose?.();
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.preventDefault();
			close();
			return;
		}
		if (e.key !== 'Tab') return;
		// Focus trap.
		const els = focusable();
		if (els.length === 0) return;
		const first = els[0];
		const last = els[els.length - 1];
		const active = document.activeElement;
		if (e.shiftKey && active === first) {
			e.preventDefault();
			last.focus();
		} else if (!e.shiftKey && active === last) {
			e.preventDefault();
			first.focus();
		}
	}
</script>

{#if open}
	<!-- Backdrop. Click outside the panel closes. -->
	<div
		class="backdrop fixed inset-0 z-50 flex items-stretch justify-center bg-black/60 p-0 sm:items-center sm:p-6"
		onclick={(e) => {
			if (e.target === e.currentTarget) close();
		}}
		role="presentation"
	>
		<div
			bind:this={dialogEl}
			class="panel flex max-h-screen w-full flex-col overflow-y-auto border border-border bg-background text-foreground shadow-xl sm:max-h-[90vh] sm:max-w-2xl sm:rounded-lg"
			role="dialog"
			aria-modal="true"
			aria-label={title}
			tabindex="-1"
			{onkeydown}
		>
			<div class="flex items-center justify-between gap-4 p-4 sm:p-6">
				<h2 class="text-lg font-semibold">{title}</h2>
				<button
					type="button"
					class="rounded-md p-1 text-2xl leading-none text-muted-foreground hover:text-foreground"
					aria-label="Close"
					onclick={close}>×</button
				>
			</div>
			<div class="px-4 pb-6 sm:px-6">
				{@render children()}
			</div>
		</div>
	</div>
{/if}

<style>
	.backdrop {
		animation: fade 0.12s ease-out;
	}
	.panel {
		animation: rise 0.16s cubic-bezier(0.16, 1, 0.3, 1);
	}
	@keyframes fade {
		from {
			opacity: 0;
		}
	}
	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.backdrop,
		.panel {
			animation: none;
		}
	}
</style>
