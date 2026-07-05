<script lang="ts">
	let { children } = $props();
</script>

<article
	class="prose prose-neutral dark:prose-invert container mx-auto max-w-3xl px-4 py-16 md:py-24"
>
	{@render children()}
</article>
