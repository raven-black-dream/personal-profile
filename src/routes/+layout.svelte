<script lang="ts">
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import Header from '$lib/components/layout/Header.svelte';

	let { children } = $props();
</script>

<ModeWatcher />
<Header />
<main>
	{@render children()}
</main>
