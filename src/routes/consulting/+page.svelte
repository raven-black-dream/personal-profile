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
		'A scored readiness report across the six dimensions that decide whether AI pays off',
		'A practitioner’s review of your current stack and data',
		'A prioritised shortlist of 5–8 candidate use-cases: where AI actually pays off, and what to skip',
		'A 90-day plan your team can start on Monday'
	];

	const sessions = [
		{
			format: 'Executive briefing or foundations session (90 min to a half-day)',
			price: 'from $1,500'
		},
		{ format: 'Half-day workshop', price: '$4,500–6,000' },
		{ format: 'Full-day workshop', price: '$7,500–10,000' },
		{ format: 'Multi-session program', price: '$12,000–20,000' }
	];

	const faqs = [
		{
			q: 'Is this just a slide deck?',
			a: 'No. You get four concrete things: a scored readiness report, a review of your actual stack and data, a prioritised shortlist of where AI pays off, and a 90-day plan your team can start on Monday. If it isn’t something you can act on, you don’t pay.'
		},
		{
			q: 'We already use ChatGPT. Do we need this?',
			a: 'Using AI tools and having a strategy are different things. Most teams have a dozen people quietly using ChatGPT and no shared answer to which of these is worth building into how we work, and in what order. That gap is what the Audit closes.'
		},
		{
			q: 'What happens after the Audit?',
			a: 'You own the roadmap and can run it with your own team. That’s the point. If you want me on call while you execute, there’s a month-to-month advisory option. No retainer required, no obligation.'
		},
		{
			q: 'How is this different from hiring an agency?',
			a: 'I’m the person doing the work, not a sales lead who hands you to juniors. And I build and run production data and ML systems myself (Base45, base45.ca). I’ve shipped ML into a live product and I test whether it actually helps before it ships, so your plan comes from someone who’s done the work, not just advised on it. I’m also vendor-neutral: I’ve no stake in which tools you choose.'
		},
		{
			q: 'Can we just talk first?',
			a: 'Yes. Score yourself with the free AI Readiness Snapshot, then apply for a no-pitch fit call. I’ll tell you honestly whether the Audit makes sense, and if it doesn’t, I’ll say so.'
		}
	];
</script>

<svelte:head>
	<title>AI Strategy Consulting — Evan Harley</title>
	<meta
		name="description"
		content="A plan you can execute, not just admire. Fixed-scope AI Readiness Audit for founder-led Canadian businesses: clarity on where AI actually pays off."
	/>
</svelte:head>

<AIReadinessSnapshot bind:open={snapshotOpen} fitCallHref={FIT_CALL} />

<!-- 1. HERO -->
<section class="hero relative px-6 pt-28 pb-20 sm:pt-36">
	<div class="mx-auto max-w-3xl text-center">
		<p class="mb-5 font-mono text-xs tracking-[0.16em] text-primary uppercase">
			AI strategy &amp; implementation · for founder-led Canadian businesses
		</p>
		<h1 class="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
			You know AI should be doing more for your business. You just don’t know where it pays off, or
			what to build first.
		</h1>
		<p class="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
			Clarity on where AI actually pays off: a plan you can execute, not just admire.
		</p>
		<div class="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
			<button
				type="button"
				class="rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
				onclick={() => (snapshotOpen = true)}
			>
				Get your free AI Readiness Snapshot →
			</button>
			<a href={FIT_CALL} class="px-2 py-3 text-sm text-muted-foreground hover:text-foreground">
				or apply for a no-pitch fit call
			</a>
		</div>
	</div>
</section>

<!-- 2. THE REFRAME -->
<section class="border-t border-border/60 px-6 py-16">
	<div class="mx-auto max-w-2xl">
		<p class="text-2xl font-medium tracking-tight sm:text-3xl">
			Most teams don’t have an AI problem. They have a prioritisation problem.
		</p>
		<p class="mt-4 text-muted-foreground">
			By some estimates, more than 80% of AI projects fail
			<a
				class="underline-offset-2 hover:underline"
				href="https://www.rand.org/pubs/research_reports/RRA2680-1.html"
				target="_blank"
				rel="noopener noreferrer">(RAND, 2024)</a
			>, usually not because the technology didn’t work but because the wrong thing got built first.
			The job isn’t more AI. It’s knowing which bet pays off, and which to skip.
		</p>
	</div>
</section>

<!-- 3. WHO IT'S FOR / NOT FOR -->
<section class="border-t border-border/60 px-6 py-16">
	<div class="mx-auto grid max-w-4xl gap-8 sm:grid-cols-2">
		<div>
			<h2 class="mb-4 text-lg font-semibold">This is for you if:</h2>
			<ul class="flex flex-col gap-2 text-sm text-muted-foreground">
				<li>you run a founder-led business (~$2M–$50M) and the call on AI sits with you;</li>
				<li>
					your team is already using AI tools, but you have no map for which bets actually pay off;
				</li>
				<li>you want an honest, executable plan, and someone who’ll tell you when not to build.</li>
			</ul>
		</div>
		<div>
			<h2 class="mb-4 text-lg font-semibold">This isn’t for you if:</h2>
			<ul class="flex flex-col gap-2 text-sm text-muted-foreground">
				<li>you’re pre-revenue or want the cheapest possible answer;</li>
				<li>
					you want a vendor to pick and manage your tools, or build custom software on spec (I
					build, but only off a roadmap we’ve agreed is worth it);
				</li>
				<li>you want a big-consultancy framework deck to put on a shelf.</li>
			</ul>
		</div>
	</div>
</section>

<!-- 4. LEARN FIRST (education-led entry) -->
<section id="workshops" class="border-t border-border/60 px-6 py-16">
	<div class="mx-auto max-w-3xl">
		<p class="mb-3 font-mono text-xs tracking-[0.16em] text-primary uppercase">Learn first</p>
		<h2 class="text-3xl font-semibold tracking-tight">AI literacy sessions</h2>
		<p class="mt-3 text-muted-foreground">
			Most teams start here. Sessions that give your leadership, or your whole team, a working grasp
			of what AI can and can’t do. Every session ends in something you can use, not a slide deck.
		</p>

		<ul class="mt-6 flex flex-col gap-2">
			{#each sessions as s (s.format)}
				<li
					class="flex flex-col justify-between gap-1 border-b border-border/60 py-3 text-sm sm:flex-row sm:items-baseline"
				>
					<span>{s.format}</span>
					<span class="shrink-0 font-medium text-foreground/90">{s.price}</span>
				</li>
			{/each}
		</ul>
	</div>
</section>

<!-- 5. THE AUDIT (keystone) -->
<section id="audit" class="border-t border-border/60 px-6 py-16">
	<div class="mx-auto max-w-3xl">
		<p class="mb-3 font-mono text-xs tracking-[0.16em] text-primary uppercase">The keystone</p>
		<h2 class="text-3xl font-semibold tracking-tight">The AI Readiness Audit</h2>
		<p class="mt-3 text-muted-foreground">
			A fixed-scope assessment that ends with the one bet worth building first, and the plan to ship
			it.
		</p>

		<ul class="mt-6 flex flex-col gap-3">
			{#each deliverables as d (d)}
				<li class="flex gap-3 text-sm">
					<span class="text-primary" aria-hidden="true">→</span>
					<span>{d}</span>
				</li>
			{/each}
		</ul>

		<div class="mt-8 rounded-lg border border-border bg-card p-6">
			<div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
				<span class="text-2xl font-semibold">$4,500 CAD</span>
				<span class="text-sm text-muted-foreground"
					>for the first 3 clients, in exchange for a case study · standard rate after that: $8,500</span
				>
			</div>
			<p class="mt-3 text-sm font-medium text-foreground/90">
				If the roadmap isn’t something your team can act on, you don’t pay.
			</p>
			<ul class="mt-4 flex flex-col gap-1.5 text-sm text-muted-foreground">
				<li>No upsells.</li>
				<li>Vendor-neutral: I have no stake in which tools you choose.</li>
				<li>I never credit this fee against build work I deliver.</li>
				<li>You own the report.</li>
			</ul>
			<button
				type="button"
				class="mt-6 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
				onclick={() => (snapshotOpen = true)}
			>
				Start with the free Snapshot →
			</button>
		</div>

		<p class="mt-6 text-sm text-muted-foreground">
			Not sure you’re ready for the full Audit? Start with a session from the list above. Need
			ongoing help after? A month-to-month advisory option exists too. Both come up on the call;
			neither is a prerequisite.
		</p>
	</div>
</section>

<!-- 6. PROOF -->
<section class="border-t border-border/60 px-6 py-16">
	<div class="mx-auto max-w-2xl">
		<p class="mb-3 font-mono text-xs tracking-[0.16em] text-primary uppercase">Why me</p>
		<p class="text-foreground/90">
			I build and run the data and ML systems AI actually depends on. I don’t just advise on them.
			<a
				class="underline-offset-2 hover:underline"
				href="https://base45.ca"
				target="_blank"
				rel="noopener noreferrer">Base45</a
			>
			is a production analytics app I run end-to-end on a real stack (a medallion lakehouse, orchestration,
			experiment tracking). I’ve shipped ML into it, and I run an active research loop to prove a model
			improves outcomes before it goes live. That’s the same bar I’ll hold your AI plans to.
		</p>
	</div>
</section>

<!-- 7. WHAT TO EXPECT -->
<section class="border-t border-border/60 px-6 py-16">
	<div class="mx-auto max-w-3xl">
		<h2 class="mb-6 text-lg font-semibold">What to expect</h2>
		<ol class="grid gap-6 text-sm text-muted-foreground sm:grid-cols-3">
			<li>
				<span class="font-mono text-xs text-primary">01</span>
				<p class="mt-1 font-medium text-foreground">Score yourself</p>
				<p class="mt-1">Take the free Snapshot, then a no-pitch fit call if it’s a fit.</p>
			</li>
			<li>
				<span class="font-mono text-xs text-primary">02</span>
				<p class="mt-1 font-medium text-foreground">The Audit</p>
				<p class="mt-1">A fixed-scope read of where AI pays off for you.</p>
			</li>
			<li>
				<span class="font-mono text-xs text-primary">03</span>
				<p class="mt-1 font-medium text-foreground">A 90-day plan</p>
				<p class="mt-1">An executable roadmap you own and can run with your team.</p>
			</li>
		</ol>
	</div>
</section>

<!-- 8. FAQ -->
<section class="border-t border-border/60 px-6 py-16">
	<div class="mx-auto max-w-2xl">
		<h2 class="mb-6 text-lg font-semibold">Questions</h2>
		<div class="flex flex-col">
			{#each faqs as f (f.q)}
				<details class="border-b border-border/60 py-4">
					<summary class="cursor-pointer list-none font-medium">{f.q}</summary>
					<p class="mt-3 text-sm text-muted-foreground">{f.a}</p>
				</details>
			{/each}
		</div>
	</div>
</section>

<!-- 9. CLOSING CTA -->
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
