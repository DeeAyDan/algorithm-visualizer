<script lang="ts">
	// @ts-nocheck
	import { selectedAlgorithmSourceCode, selectedAlgorithm } from '../stores/store.svelte';
	import { algorithmDisplayNames } from '../stores/algorithmMap';

	$: formattedAlgorithmName = algorithmDisplayNames[$selectedAlgorithm];
</script>

<div class="source-container">
	<div class="tag">{formattedAlgorithmName}</div>
	<div>
		{$selectedAlgorithmSourceCode}
	</div>
</div>

<style>
	.source-container {
		width: 70%;
		background-color: #484848;
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
