<script lang="ts">
	import * as Card from '../ui/card';
	import { Badge } from '../ui/badge';

	const skillCategories = [
		{
			title: 'Programming & Databases',
			subCategories: [
				{ title: 'Languages', skills: ['Python', 'R', 'SQL', 'JavaScript'] },
				{ title: 'Databases', skills: ['PostgreSQL', 'SQL Server', 'Oracle', 'MongoDB', 'DuckDB', 'Vector Stores', 'Time-series Databases'] }
			]
		},
		{
			title: 'Data Science & Machine Learning',
			subCategories: [
				{ title: 'Core Libraries', skills: ['Pandas', 'NumPy', 'Scikit-learn', 'TensorFlow'] },
				{ title: 'Specializations', skills: ['Natural Language Processing (NLP)', 'Computer Vision (CV)', 'Time-Series Forecasting', 'Anomaly Detection'] }
			]
		},
		{
			title: 'Web, Deployment & MLOps',
			subCategories: [
				{ title: 'Frameworks', skills: ['Svelte', 'Streamlit'] },
				{ title: 'Deployment & CI/CD', skills: ['Docker', 'Kubernetes', 'GitHub Actions', 'APIs'] }
			]
		},
		{
			title: 'Visualization & Reporting',
			subCategories: [
				{ title: 'BI Tools', skills: ['Power BI'] },
				{ title: 'Libraries', skills: ['Plotly', 'Matplotlib'] }
			]
		}
	];
</script>

<section class="py-16 md:py-24">
	<div class="container mx-auto px-4">
		<h2 class="text-3xl md:text-4xl font-bold tracking-tight text-center mb-12">Skills & Technologies</h2>
		<div class="grid md:grid-cols-2 gap-8">
			{#each skillCategories as category}
				<Card.Root>
					<Card.Header>
						<Card.Title>{category.title}</Card.Title>
					</Card.Header>
					<Card.Content class="flex flex-col gap-4">
						{#each category.subCategories as subCategory}
							<div>
								<h4 class="font-semibold mb-2 text-sm text-muted-foreground">{subCategory.title}</h4>
								<div class="flex flex-wrap gap-2">
									{#each subCategory.skills as skill}
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