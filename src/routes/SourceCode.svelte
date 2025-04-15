<script lang="ts">
	export let activeLine = -1;
	export let code = '';

	let lines = code.split('\n');
</script>

<div class="source-container">
	<div class="tag">Source Code</div>
	{#each lines as line, index}
		<div class={index === activeLine ? 'highlight' : ''}>
			{line}
		</div>
	{/each}
</div>

<style>
	.source-container {
		width: 70%;
		background-color: #484848;
	}
	.highlight {
		background-color: turquoise;
	}
	.tag {
		display: inline-block;
		top: 0;
		left: 0;
		background-color: #484848;
		color: white;
		padding: 3px;
		font-size: px;
	}
</style>
