<script lang="ts">
	import * as Card from '../ui/card';
	import { Badge } from '../ui/badge';

	const skillCategories = [
		{
			title: 'Languages & Databases',
			subCategories: [
				{
					title: 'Languages',
					skills: [
						'Python (10+ yrs)',
						'R (10+ yrs)',
						'SQL',
						'TypeScript / JavaScript',
						'C#',
						'C++',
						'Dart / Flutter'
					]
				},
				{ title: 'Databases', skills: ['PostgreSQL', 'SQL Server', 'MongoDB', 'DuckDB'] }
			]
		},
		{
			title: 'ML / AI',
			subCategories: [
				{
					title: 'Methods',
					skills: [
						'Supervised & Unsupervised Learning',
						'NLP',
						'Computer Vision',
						'Time Series Forecasting',
						'Survival Analysis'
					]
				},
				{ title: 'Modern AI', skills: ['LLMs', 'Agentic AI', 'RAG', 'Fine-Tuning'] }
			]
		},
		{
			title: 'Data Engineering & MLOps',
			subCategories: [
				{
					title: 'Engineering',
					skills: [
						'Data Lakehouse Architecture',
						'Pipeline Design',
						'ETL / ELT',
						'DuckDB / MotherDuck',
						'Estuary Flow'
					]
				},
				{
					title: 'Deployment',
					skills: ['Docker', 'Kubernetes', 'Svelte', 'Streamlit', 'GitHub Actions']
				}
			]
		},
		{
			title: 'BI, Visualization & Strategy',
			subCategories: [
				{
					title: 'BI & Visualization',
					skills: ['Power BI', 'Tableau', 'Plotly', 'Matplotlib', 'ggplot2']
				},
				{
					title: 'Strategy & Leadership',
					skills: [
						'AI Adoption Strategy',
						'Data Strategy',
						'Executive Communication',
						'Working Group Leadership'
					]
				}
			]
		}
	];
</script>

<section class="py-16 md:py-24">
	<div class="container mx-auto px-4">
		<h2 class="mb-12 text-center text-3xl font-bold tracking-tight md:text-4xl">
			Skills & Technologies
		</h2>
		<div class="grid gap-8 md:grid-cols-2">
			{#each skillCategories as category (category.title)}
				<Card.Root>
					<Card.Header>
						<Card.Title>{category.title}</Card.Title>
					</Card.Header>
					<Card.Content class="flex flex-col gap-4">
						{#each category.subCategories as subCategory (subCategory.title)}
							<div>
								<h4 class="mb-2 text-sm font-semibold text-muted-foreground">
									{subCategory.title}
								</h4>
								<div class="flex flex-wrap gap-2">
									{#each subCategory.skills as skill (skill)}
										<Badge variant="secondary">{skill}</Badge>
									{/each}
								</div>
							</div>
						{/each}
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	</div>
</section>
