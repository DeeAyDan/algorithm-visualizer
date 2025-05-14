<script>
	import { onMount } from 'svelte';
	import { marked } from 'marked';

	let content = '';

	onMount(async () => {
		const res = await fetch('/README.md');
		const text = await res.text();
		content = await marked(text);
	});
</script>

<div class="markdown">
	{@html content}
</div>

<style>
	.markdown {
		padding: 20px;
		height: 100%;
	}
</style>
