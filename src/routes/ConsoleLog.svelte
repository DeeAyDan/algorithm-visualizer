<script>
// @ts-nocheck

	import { consoleLog } from '../stores/store.svelte';
	import { selectedAlgorithmSourceCode, selectedAlgorithm } from '../stores/store.svelte';
	import { algorithmDisplayNames } from '../stores/algorithmMap';

	$: formattedAlgorithmName = algorithmDisplayNames[$selectedAlgorithm];
</script>

<div class="console-log-container">
	<div class="tag">{formattedAlgorithmName}</div>
	<div class="console">
		<ol class="console-list">
			{#each $consoleLog as line}
				<li>{line}</li>
			{/each}
		</ol>
	</div>
</div>

<style>
	.console-log-container {
		flex: 1;
		z-index: 10;
	}
	.tag {
		display: inline-block;
		top: 0;
		left: 0;
		background-color: #484848;
		color: aliceblue;
		padding: 3px;
	}
	.console {
		height: 90%;
		overflow: auto;
		position: relative;

	}
	.console-list {
		margin: 1rem;
		color: aliceblue;
	}
</style>
