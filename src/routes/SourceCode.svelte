<script lang="ts">
	import { selectedAlgorithmSourceCode } from "../stores/store.svelte";

</script>

<div class="source-container">
	<div class="tag">Source Code</div>
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
