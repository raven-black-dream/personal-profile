<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { INTENT_QUESTION, type Branch } from '$lib/consulting/snapshot-content';
	import { questionsForBranch, scoreSnapshot, type Answers } from '$lib/consulting/scoring';

	interface Props {
		open: boolean;
		/** Where the result's primary CTA points (placeholder routing). */
		fitCallHref?: string;
	}

	let { open = $bindable(false), fitCallHref = 'mailto:evan@evanharley.ca' }: Props = $props();

	// Wizard state. step 0 = intent; 1..N = branch questions; > N = result.
	let step = $state(0);
	let branch = $state<Branch | null>(null);
	let answers = $state<Answers>({});

	const questions = $derived(branch ? questionsForBranch(branch) : []);
	const onResult = $derived(branch != null && step > questions.length);
	const result = $derived(onResult && branch ? scoreSnapshot(branch, answers) : null);
	const progress = $derived(
		branch ? Math.min(100, Math.round((step / (questions.length + 1)) * 100)) : 0
	);

	function reset() {
		step = 0;
		branch = null;
		answers = {};
	}

	// Reset the wizard whenever the dialog closes (Esc, overlay, or close button).
	function onOpenChange(next: boolean) {
		if (!next) reset();
	}

	function chooseIntent(b: Branch) {
		branch = b;
		answers = {};
		step = 1;
	}

	function choose(qid: string, idx: number) {
		answers = { ...answers, [qid]: idx };
		step += 1;
	}

	function back() {
		if (step > 0) step -= 1;
	}
</script>

<Dialog.Root bind:open {onOpenChange}>
	<Dialog.Content class="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
		<Dialog.Header>
			<Dialog.Title class="text-lg font-semibold">AI Readiness Snapshot</Dialog.Title>
		</Dialog.Header>

		<!-- progress -->
		{#if branch && !onResult}
			<div class="mb-5 h-1 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
				<div class="h-full bg-primary transition-all" style="width: {progress}%"></div>
			</div>
		{/if}

		{#if step === 0}
			<!-- Q0 — intent -->
			<fieldset>
				<legend class="mb-4 text-base font-medium">{INTENT_QUESTION.prompt}</legend>
				<div class="flex flex-col gap-2">
					{#each INTENT_QUESTION.options as opt (opt.label)}
						<button
							type="button"
							class="rounded-md border border-border px-4 py-3 text-left text-sm transition-colors hover:border-primary hover:bg-muted/50"
							onclick={() => chooseIntent(opt.branch)}>{opt.label}</button
						>
					{/each}
				</div>
			</fieldset>
		{:else if !onResult}
			<!-- branch questions -->
			{@const q = questions[step - 1]}
			<fieldset>
				<legend class="mb-4 text-base font-medium">{q.prompt}</legend>
				<div class="flex flex-col gap-2">
					{#each q.options as opt, i (opt.label)}
						<button
							type="button"
							class="rounded-md border border-border px-4 py-3 text-left text-sm transition-colors hover:border-primary hover:bg-muted/50"
							onclick={() => choose(q.id, i)}>{opt.label}</button
						>
					{/each}
				</div>
			</fieldset>
			<button
				type="button"
				class="mt-4 text-sm text-muted-foreground hover:underline"
				onclick={back}
			>
				← Back
			</button>
		{:else if result}
			<!-- result -->
			<div class="flex flex-col gap-5">
				<div>
					<p class="font-mono text-xs tracking-[0.14em] text-muted-foreground uppercase">
						Your readiness
					</p>
					<p class="text-xl font-semibold">{result.band.label}</p>
					<p class="mt-2 text-sm text-muted-foreground">{result.band.blurb}</p>
				</div>

				<!-- AI Readiness Index — placeholder bar viz -->
				<div class="flex flex-col gap-2">
					{#each result.dimensions.filter((d) => d.weight > 0 && d.normalised != null) as d (d.id)}
						<div class="flex items-center gap-3">
							<span class="w-32 shrink-0 text-xs text-muted-foreground">{d.label}</span>
							<div class="h-2 flex-1 overflow-hidden rounded-full bg-muted">
								<div class="h-full bg-primary" style="width: {d.normalised}%"></div>
							</div>
						</div>
					{/each}
				</div>

				{#if result.observations.length}
					<ul class="flex flex-col gap-3">
						{#each result.observations as obs (obs)}
							<li class="border-l-2 border-primary/40 pl-3 text-sm text-foreground/90">{obs}</li>
						{/each}
					</ul>
				{/if}

				<div class="flex flex-col gap-2 sm:flex-row">
					<a
						href={fitCallHref}
						class="rounded-md bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground"
						>{result.band.cta}</a
					>
					<button
						type="button"
						class="rounded-md border border-border px-4 py-2.5 text-sm"
						onclick={reset}>Start over</button
					>
				</div>

				<p class="text-xs text-muted-foreground">
					This snapshot is a guide, not a verdict — it’s scored with simple rules, not AI. A short
					conversation gets you a sharper read.
				</p>
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>
