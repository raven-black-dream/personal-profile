<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { FileText } from '@lucide/svelte';
</script>

<section
	class="hero-section flex min-h-screen flex-col items-center justify-center p-4 text-center"
>
	<div class="max-w-2xl space-y-4">
		<h1 class="text-5xl font-bold tracking-tighter md:text-7xl">Evan Harley</h1>
		<p class="text-lg text-muted-foreground md:text-xl">
			Full Stack Data Scientist | ML/AI Strategy | Data Engineering
		</p>
		<p class="text-md pt-4 text-muted-foreground md:text-lg">
			10+ years building end-to-end data solutions — from lakehouse architecture and production
			pipelines to predictive models and AI adoption strategy.
		</p>
		<div class="flex justify-center gap-4 pt-4">
			<Button size="lg" href="#projects">View My Work</Button>
			<Button variant="outline" size="lg" href="/evan_harley_resume.pdf" download>
				<FileText class="mr-2 h-5 w-5" />
				Download Resume
			</Button>
		</div>
	</div>
</section>

<style>
	.hero-section {
		background: radial-gradient(
			ellipse at center,
			oklch(from var(--primary) l c h / 15%) 0%,
			var(--background) 70%
		);
	}
</style>
