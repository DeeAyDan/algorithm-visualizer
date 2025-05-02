<script>
	// @ts-nocheck

	import { algorithmComponents } from '../stores/algorithmComponents';
	import { selectedAlgorithmSourceCode, selectedAlgorithm } from '../stores/store.svelte.js';

</script>

<div class="canvas-container">
<svelte:component this={algorithmComponents[$selectedAlgorithm]} />

</div>


<style>
	.canvas-container {
		border-left: 3px solid #505050;
		border-top: 3px solid #505050;
	}
</style>
