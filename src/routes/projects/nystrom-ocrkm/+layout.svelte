<script lang="ts">
	let { children } = $props();
</script>

<article
	class="container mx-auto prose max-w-3xl px-4 py-16 prose-neutral md:py-24 dark:prose-invert"
>
	{@render children()}
</article>
