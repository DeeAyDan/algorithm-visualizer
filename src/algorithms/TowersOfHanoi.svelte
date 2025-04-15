<script lang="ts">
	// @ts-nocheck

	import { selectedAlgorithmSourceCode, currentStep, totalSteps } from '../stores/store.svelte.js';
	import Controls from '../routes/Controls.svelte';

	currentStep.set(50);
	totalSteps.set(150);


	// Define source code for Towers of Hanoi
	const sourceCode = `
      function towersOfHanoi(n, from, to, aux) {
        if (n === 1) {
          console.log('Move disk 1 from ' + from + ' to ' + to);
          return;
        }
        towersOfHanoi(n - 1, from, aux, to);
        console.log('Move disk ' + n + ' from ' + from + ' to ' + to);
        towersOfHanoi(n - 1, aux, to, from);
      }
    `;

	selectedAlgorithmSourceCode.set(sourceCode);
</script>

<div class="algorithm-container">
	<Controls
		{currentStep}
		{totalSteps}
	/>

	<div class="tag">Canvas</div>
</div>

<style>
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
