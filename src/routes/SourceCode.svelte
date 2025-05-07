<script lang="ts">
	// @ts-nocheck
	import { selectedAlgorithmSourceCode, selectedAlgorithm, activeLine } from '../stores/store.svelte';
	import { algorithmDisplayNames } from '../stores/algorithmMap';

	$: formattedAlgorithmName = algorithmDisplayNames[$selectedAlgorithm];
	$: codeLines = $selectedAlgorithmSourceCode.split('\n');
</script>

<div class="source-container">
	<div class="tag">{formattedAlgorithmName}</div>
	<div class="source-code">
		<code>
			{#each codeLines as line, i}
			<div class="{ i === $activeLine ? 'active-line' : ''}">{i}  {line}</div>
		{/each}
		</code>
	</div>
</div>

<style>
	.source-container {
		width: 100%;
		background-color: #484848;
		
	}
	.tag {
		display: inline-block;
		top: 0;
		left: 0;
		background-color: #484848;
		padding: 3px;
		font-size: px;
	}
	.source-code{
		padding: 10px;
		}
	code div{
		white-space: pre-wrap;
		font-size: 70%;
	}
	.active-line {
		background-color: #45a049;
		color: #2f2f2f;
	}
</style>
