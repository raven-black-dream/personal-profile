<script lang="ts">
	import * as Card from '../ui/card';
	import { Badge } from '../ui/badge';
	import { Button } from '../ui/button';

	const projects = [
		{
			title: 'Nyström-OCRKM: Scalable Anomaly Detection',
			description:
				'Implemented a One-Class Restricted Kernel Machine and scaled it to millions of ride-hail trip records via Nyström approximation (O(N²) → O(Nm)), benchmarked against Isolation Forest and SGD-OCSVM. It surfaced four classes of data-quality defect that pass every rule-based check — each independently corroborated — while honestly reporting where the simpler baselines won. A graduate research project written up as a conference-style paper.',
			tags: [
				'Python',
				'Kernel Methods',
				'Nyström Approximation',
				'Anomaly Detection',
				'scikit-learn'
			],
			url: null,
			note: 'Public-data (NYC TLC) rerun in progress — code link to follow.'
		},
		{
			title: 'Base45: Hypertrophy Training App + MLOps Research Layer',
			description:
				'A multi-user web app that automates progressive-overload programming for hypertrophy — turning each session’s logged sets into the next session’s prescribed sets, load, and reps. Built end to end on a MotherDuck medallion lakehouse with an MLflow research loop on top; that research surfaced a "controller-censoring" effect — a well-tuned training controller erases the very variance naive models chase — reframing the ML work toward honest, diagnostic signal.',
			tags: ['SvelteKit', 'TypeScript', 'MotherDuck', 'MLflow', 'Kestra', 'Applied ML'],
			url: 'https://base45.ca',
			note: null
		}
	];
</script>

<section id="projects" class="bg-background/50 py-16 md:py-24">
	<div class="container mx-auto px-4">
		<h2 class="mb-12 text-center text-3xl font-bold tracking-tight md:text-4xl">
			Featured Projects
		</h2>
		<div class="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
			{#each projects as project}
				<Card.Root
					class="flex flex-col transition-colors duration-300 hover:border-primary/60"
				>
					<Card.Header>
						<Card.Title>{project.title}</Card.Title>
						<Card.Description>{project.description}</Card.Description>
					</Card.Header>
					<Card.Content class="flex flex-wrap gap-2">
						{#each project.tags as tag}
							<Badge variant="secondary">{tag}</Badge>
						{/each}
					</Card.Content>
					<Card.Footer class="mt-auto flex flex-col items-start gap-3">
						{#if project.url}
							<Button variant="outline" href={project.url} target="_blank" rel="noopener">
								View Project
							</Button>
						{/if}
						{#if project.note}
							<p class="text-sm text-muted-foreground">{project.note}</p>
						{/if}
					</Card.Footer>
				</Card.Root>
			{/each}
		</div>
	</div>
</section>
