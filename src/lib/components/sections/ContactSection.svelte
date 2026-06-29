<script lang="ts">
	import { Button } from '../ui/button';
	import { Github, Linkedin, FileText } from '@lucide/svelte';
</script>

<section class="bg-background/50 py-16 md:py-24">
	<div class="container mx-auto px-4 text-center">
		<h2 class="mb-4 text-3xl font-bold tracking-tight md:text-4xl">Let's Connect</h2>
		<p class="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
			I'm always open to discussing new opportunities and interesting projects. Feel free to reach
			out or explore my work further.
		</p>
		<div class="flex items-center justify-center gap-4">
			<Button size="lg" href="/evan_harley_resume.pdf" download>
				<FileText class="mr-2 h-5 w-5" />
				Download Resume
			</Button>
			<Button
				variant="outline"
				size="lg"
				href="https://www.linkedin.com/in/evan-harley-3bab1b22/"
				target="_blank"
			>
				<Linkedin class="mr-2 h-5 w-5" />
				LinkedIn
			</Button>
			<Button
				variant="outline"
				size="lg"
				href="https://github.com/raven-black-dream"
				target="_blank"
			>
				<Github class="mr-2 h-5 w-5" />
				GitHub
			</Button>
		</div>
	</div>
</section>
