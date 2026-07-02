<script lang="ts">
	import { onMount } from 'svelte';
	import AIReadinessSnapshot from '$lib/components/consulting/AIReadinessSnapshot.svelte';

	let snapshotOpen = $state(false);

	// Deep-link: /consulting?snapshot=1 opens the snapshot (for LinkedIn / newsletter links).
	onMount(() => {
		if (new URLSearchParams(location.search).get('snapshot')) snapshotOpen = true;
	});

	const FIT_CALL = 'mailto:evan@evanharley.ca?subject=AI%20Readiness%20-%20fit%20call';

	const deliverables = [
		'A scored readiness report across the dimensions that decide whether AI pays off',
		'A practitioner’s review of your current stack and data',
		'A prioritised shortlist of where AI actually pays off — and what to skip',
		'A 90-day plan your team can start on Monday'
	];

	const faqs = [
		{
			q: 'Is this just a slide deck?',
			a: 'No. You get four concrete things — a scored readiness report, a review of your actual stack and data, a prioritised shortlist of where AI pays off, and a 90-day plan your team can start on Monday. If it isn’t something you can act on, you don’t pay.'
		},
		{
			q: 'We already use ChatGPT — do we need this?',
			a: 'Using AI tools and having a strategy are different things. Most teams have a dozen people quietly using ChatGPT and no shared answer to which of these is worth building into how we work, and in what order. That gap is what the Audit closes.'
		},
		{
			q: 'What happens after the Audit?',
			a: 'You own the roadmap and can run it with your own team — that’s the point. If you want me on call while you execute, there’s a month-to-month advisory option. No retainer required, no obligation.'
		},
		{
			q: 'How is this different from hiring an agency?',
			a: 'I’m the person doing the work — not a sales lead who hands you to juniors. And I build and run production data and ML systems myself (Base45, base45.ca) — I’ve shipped ML into a live product and I test whether it actually helps before it ships. So your plan comes from someone who’s done the work, not just advised on it. I’m also vendor-neutral — I’ve no stake in which tools you choose.'
		},
		{
			q: 'Can we just talk first?',
			a: 'Yes. Score yourself with the free AI Readiness Snapshot, then apply for a no-pitch fit call. I’ll tell you honestly whether the Audit makes sense — and if it doesn’t, I’ll say so.'
		}
	];
</script>

<svelte:head>
	<title>AI Strategy Consulting — Evan Harley</title>
	<meta
		name="description"
		content="A plan you can execute, not just admire. Fixed-scope AI Readiness Audit for founder-led Canadian businesses — clarity on where AI actually pays off."
	/>
</svelte:head>

<section class="flex min-h-screen flex-col items-center justify-center px-6 text-center">
	<p class="mb-4 text-sm tracking-[0.18em] text-muted-foreground uppercase">
		AI Strategy &amp; Implementation
	</p>
	<h1 class="max-w-3xl text-4xl font-semibold text-foreground sm:text-5xl">
		A plan you can execute, not just admire.
	</h1>
	<p class="mt-6 max-w-xl text-lg text-muted-foreground">
		The consulting practice is taking shape. The full offer is coming soon.
	</p>
	<a href="mailto:evan@evanharley.ca" class="mt-10 text-primary underline-offset-4 hover:underline">
		evan@evanharley.ca
	</a>
</section>

<!-- 8. CLOSING CTA -->
<section class="border-t border-border/60 px-6 py-20">
	<div class="mx-auto max-w-xl text-center">
		<h2 class="text-2xl font-semibold tracking-tight">See where AI actually pays off for you.</h2>
		<p class="mt-3 text-muted-foreground">
			Three minutes, scored on the spot. No email required to see your result.
		</p>
		<button
			type="button"
			class="mt-6 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
			onclick={() => (snapshotOpen = true)}
		>
			Get your free AI Readiness Snapshot →
		</button>
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
