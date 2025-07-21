<script lang="ts">
	import { Button } from '$lib/components/ui/button';
</script>

<section class="hero-section min-h-screen flex flex-col justify-center items-center text-center p-4">
	<div class="max-w-2xl space-y-4">
		<h1 class="text-5xl md:text-7xl font-bold tracking-tighter">
			Evan Harley
		</h1>
		<p class="text-lg md:text-xl text-muted-foreground">
			Full Stack Data Scientist | Building with clarity and purpose.
		</p>
		<p class="text-md md:text-lg text-muted-foreground pt-4">
			A curious mind passionate about solving complex puzzles with data.
		</p>
		<div class="flex justify-center gap-4 pt-4">
			<Button size="lg">View My Work</Button>
			<Button variant="secondary" size="lg">Download Resume</Button>
		</div>
	</div>
</section>

<style>
	.hero-section {
		background: radial-gradient(ellipse at center, oklch(from var(--primary) l c h / 15%) 0%, var(--background) 70%);
	}
</style>
