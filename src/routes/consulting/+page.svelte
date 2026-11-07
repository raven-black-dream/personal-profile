<script lang="ts">
	import { onMount } from 'svelte';
	import AIReadinessSnapshot from '$lib/components/consulting/AIReadinessSnapshot.svelte';

	// Holding page (2026-11-07) while the consulting model is reworked.
	// The old offers are retired; the Snapshot stays reachable so existing
	// /consulting?snapshot=1 links keep working.
	let snapshotOpen = $state(false);

	onMount(() => {
		if (new URLSearchParams(location.search).get('snapshot')) snapshotOpen = true;
	});

	const CONTACT = 'mailto:evan@evanharley.ca?subject=AI%20consulting';
</script>

<svelte:head>
	<title>AI Consulting — Evan Harley</title>
	<meta
		name="description"
		content="I build AI into small and mid-sized businesses: something working inside your business, measured by what it changes."
	/>
</svelte:head>

<AIReadinessSnapshot bind:open={snapshotOpen} fitCallHref={CONTACT} />

<section class="hero relative px-6 pt-28 pb-24 sm:pt-36">
	<div class="mx-auto max-w-2xl text-center">
		<p class="mb-5 font-mono text-xs tracking-[0.16em] text-primary uppercase">AI consulting · Victoria, BC</p>
		<h1 class="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
			I build AI into small businesses.
		</h1>
		<p class="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
			Something working inside your business, not a slide deck. I start with one workflow where your
			data already exists but nobody has time to use it, build it, and measure what it changes.
		</p>
		<p class="mx-auto mt-4 max-w-xl text-muted-foreground">
			I build and run production data and ML systems myself, including
			<a href="https://base45.ca" class="underline-offset-2 hover:underline">Base45</a>. I’m reworking
			how I offer this work. If you’d like to talk in the meantime, email me.
		</p>
		<div class="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
			<a
				href={CONTACT}
				class="rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
			>
				Email me
			</a>
		</div>
	</div>
</section>

<style>
	.hero {
		background: radial-gradient(
			ellipse at center top,
			oklch(from var(--primary) l c h / 10%) 0%,
			var(--background) 60%
		);
	}
</style>
