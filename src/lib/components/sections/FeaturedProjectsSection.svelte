<script lang="ts">

	import * as Card from '../ui/card';
    import { Badge } from '../ui/badge';
	import { Button } from '../ui/button';
	const projects = [
		{
			title: 'Employment Services Dashboard',
			description: 'This project is an interactive web dashboard built with Streamlit to visualize and analyze data related to Employment Services in British Columbia. It provides at-a-glance metrics, trend plots, and detailed data tables.',
			tags: ['Streamlit', 'Data Visualization', 'Public Sector'],
			url: 'https://github.com/raven-black-dream/Employment-Services-Dashboard'
		},
		{
			title: 'NLP Toy Example',
			description: 'This project is an interactive web application built with Streamlit to demonstrate key concepts in Natural Language Processing (NLP). It was created to serve as a visual aid for an NLP presentation.',
			tags: ['NLP', 'Python', 'Spacy', 'Scikit-learn', 'Pandas'],
			url: 'https://github.com/raven-black-dream/nlp-toy-example'
		},
		{
			title: 'Large-Scale Data Analysis',
			description: 'Architected and executed large-scale data analysis on datasets exceeding 200 million rows, uncovering key trends that directly informed provincial policy changes.',
			tags: ['Big Data', 'SQL', 'Python', 'Policy'],
			url: '#'
		}
	];
</script>

<section id="projects" class="py-16 md:py-24 bg-background/50">
	<div class="container mx-auto px-4">
		<h2 class="text-3xl md:text-4xl font-bold tracking-tight text-center mb-12">Featured Projects</h2>
		<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
			{#each projects as project}
				<Card.Root>
                    <Card.Header>
                        <Card.Title>{project.title}</Card.Title>
                        <Card.Description>{project.description}</Card.Description>
                    </Card.Header>
                    <Card.Footer class="flex flex-wrap gap-2">
                        {#each project.tags as tag}
                            <Badge>{tag}</Badge>
                        {/each}
                    </Card.Footer>
					<Card.Action>
						<Button variant="outline" href={project.url}>View Project</Button>
					</Card.Action>
				</Card.Root>
			{/each}
		</div>
	</div>
</section>
