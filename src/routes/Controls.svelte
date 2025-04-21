<script lang="ts">
	// @ts-nocheck
	import { createEventDispatcher } from 'svelte';
	import {
		algorithmStatus,
		resumeSignal,
		currentStep,
		totalSteps,
		speed
	} from '../stores/store.svelte.js';
	import { get } from 'svelte/store';

	const dispatch = createEventDispatcher();

	// Progress bar érték kiszámítása
	$: progressPercentage = ($currentStep / $totalSteps) * 100 + '%';

	// ▶️ Start
	function handleStart() {
		algorithmStatus.set('running');
		dispatch('start', { speed });
	}

	// ⏸️ Pause
	function handlePause() {
		algorithmStatus.set('paused');
	}

	// ▶️ Resume
	function handleResume() {
		algorithmStatus.set('running');
		resumeSignal.update(n => n + 1);
	}

	// ▶️ Resume
	function handleReset() {
		algorithmStatus.set('idle');
		resumeSignal.update(n => n + 1);
	}

	// Sebesség állítása
	function handleSpeedChange(newSpeed: number) {
		speed.set(Number(newSpeed));
	}
</script>

<div class="controls-bar">
	<div class="tag">Controls</div>

	<!-- Állapotfüggő gombok -->
	{#if $algorithmStatus === 'idle'}
		<button class="play-button" on:click={handleStart}>Start</button>
	{:else if $algorithmStatus === 'running'}
		<button class="play-button" on:click={handlePause}>Pause</button>
	{:else if $algorithmStatus === 'paused'}
		<button class="play-button" on:click={handleResume}>Resume</button>
	{:else if $algorithmStatus === 'finished'}
		<button class="play-button" on:click={handleReset}>Reset</button>
	{/if}

	<!-- Léptetési információ -->
	<div class="step-counter">
		<div class="progress" data-label="{$currentStep}/{$totalSteps}">
			<span class="value" style="--progress-percentage: {progressPercentage}"></span>
		</div>
	</div>

	<!-- Sebességcsúszka -->
	<div class="speed-slider">
		<label for="speed-range">Speed</label>
		<input
			type="range"
			class="slider"
			id="speed-range"
			min="1"
			max="100"
			bind:value={$speed}
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
