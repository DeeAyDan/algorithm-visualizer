<script lang="ts">
	import { selectedAlgorithmSourceCode, selectedAlgorithm } from "../stores/store.svelte";

	function formatAlgorithmName(name: string): string {
	return name
		.replace(/([A-Z])/g, ' $1') // camelCase -> szóköz a nagybetűk előtt
		.replace(/_/g, ' ')         // snake_case -> szóköz
		.replace(/^./, (str) => str.toUpperCase()); // első betű nagybetűs
}


$: formattedAlgorithmName = formatAlgorithmName($selectedAlgorithm);

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
