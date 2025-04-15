<script lang="ts">
	// @ts-nocheck
	import { createEventDispatcher } from 'svelte';
	import { algorithmComponents } from '../stores/algorithmComponents';
	import {
		selectedAlgorithmSourceCode,
		selectedAlgorithm,
		currentStep,
		totalSteps
	} from '../stores/store.svelte.js';

	let speed = 50;
	const dispatch = createEventDispatcher();

	$: progressPercentage = ($currentStep / $totalSteps) * 100 + '%';

	function handlePlay() {
		dispatch('start', { speed });
	}

	function handleSpeedChange(newSpeed: number) {
		speed = newSpeed;
	}
</script>

<div class="controls-bar">
	<div class="tag">Controls</div>
	<button class="play-button" on:click={handlePlay}>
		<!-- SVG -->
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="aliceblue"
			class="feather feather-play"><polygon points="5 3 19 12 5 21 5 3" /></svg
		> Play
	</button>

	<div class="step-counter">
		<div class="progress" data-label="{$currentStep}/{$totalSteps}">
			<span class="value" style="--progress-percentage: {progressPercentage}"></span>
		</div>
	</div>
	<div class="speed-slider">
		<label for="speed-range">Speed</label>
		<input
			type="range"
			class="slider"
			id="speed-range"
			min="1"
			max="100"
			value={speed}
			on:input={(e) => handleSpeedChange(e.target.value)}
		/>
	</div>
</div>

<style>
	.controls-bar {
		height: 48px;
		border-bottom: 3px solid #505050;
		position: relative;
		display: flex;
		padding-left: 100px;
		align-items: center;
		justify-content: center;
		gap: 20px;
	}
	.tag {
		display: inline-block;
		position: absolute;
		top: 0;
		left: 0;
		background-color: #484848;
		color: white;
		padding: 3px;
		font-size: px;
	}
	.play-button {
		background-color: #484848;
		border: none;
		cursor: pointer;
		padding: 10px;
		display: flex;
		height: 2em;
		align-items: center;
	}
	.progress {
		height: 1.5em;
		width: 200px;
		background-color: #484848;
		position: relative;
	}
	.progress:before {
		content: attr(data-label);
		font-size: 0.8em;
		position: absolute;
		text-align: center;
		top: 5px;
		left: 0;
		right: 0;
	}
	.progress .value {
		background-color: #04aa6d;
		width: var(--progress-percentage);
		display: inline-block;
		height: 100%;
	}
	.speed-slider {
		display: flex;
		align-items: center;
	}
	.slider {
		-webkit-appearance: none;
		appearance: none;
		width: 100%;
		height: 1.5rem;
		background: #484848;
		outline: none;
		margin-left: 5px;
	}
	.slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 10px;
		height: 25px;
		background: #04aa6d;
		cursor: pointer;
	}

	.slider::-moz-range-thumb {
		-webkit-appearance: none;
		appearance: none;
		border-radius: 0;
		border: none;
		background: #04aa6d;
		width: 10px;
		height: 25px;
		cursor: pointer;
	}
	#speed-range {
		width: 100px;
		height: 1.5em;
		cursor: pointer;
	}
</style>
