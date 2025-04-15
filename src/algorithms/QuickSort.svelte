<script lang="ts">
	// @ts-nocheck
	import {
		selectedAlgorithmSourceCode,
		currentStep,
		totalSteps,
		consoleLog
	} from '../stores/store.svelte.js';
	import Controls from '../routes/Controls.svelte';

	let data = [5, 3, 18, 14, 8, 1, 2, 6, 10, 2, 1, -2, 8]; // vagy generált tömb
	let speed = 50;

	consoleLog.set([]);
	$: totalSteps.set(data.length * 5); // becsült max lépésszám

	// Késleltető helper
	function delay(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	function log(message: string) {
		consoleLog.update((logs) => [...logs, message]);
	}

	// Start gombra indul
	async function startAlgorithm(event) {
		consoleLog.set([]);
		speed = event.detail.speed;
		currentStep.set(0);
		log('QuickSort indítása...');
		await quickSort(data, 0, data.length - 1);
		log('QuickSort kész!');
	}

	// QuickSort algoritmus (aszinkron léptetéssel)
	async function quickSort(arr: number[], left: number, right: number) {
		if (left < right) {
			let pivotIndex = await partition(arr, left, right);
			await quickSort(arr, left, pivotIndex - 1);
			await quickSort(arr, pivotIndex + 1, right);
		}
	}

	async function partition(arr: number[], left: number, right: number): Promise<number> {
		let pivot = arr[right];
		log(`Pivot kiválasztva: ${pivot}`);
		currentStep.update((n) => n + 1);
		let i = left - 1;

		for (let j = left; j < right; j++) {
			log(`Összehasonlítás: ${arr[j]} <= ${pivot}`);
			// currentStep.update((n) => n + 1);
			await delay(900 - speed * 8);

			if (arr[j] <= pivot) {
				i++;
				[arr[i], arr[j]] = [arr[j], arr[i]];
				log(`Csere: ${arr[i]} <-> ${arr[j]}`);
				// currentStep.update((n) => n + 1);

				data = [...arr]; // trigger vizualizáció
				await delay(900 - speed * 8);
			}
		}

		[arr[i + 1], arr[right]] = [arr[right], arr[i + 1]];
		log(`Pivot helyre rakása: ${arr[i + 1]} <-> ${arr[right]}`);
		currentStep.update((n) => n + 1);

		data = [...arr];
		await delay(900 - speed * 8);

		return i + 1;
	}

	// Forráskód beállítás
	const sourceCode = `
function quickSort(arr, left, right) {
	if (left < right) {
		let pivotIndex = partition(arr, left, right);
		quickSort(arr, left, pivotIndex - 1);
		quickSort(arr, pivotIndex + 1, right);
	}
}
	`;
	selectedAlgorithmSourceCode.set(sourceCode);
</script>

<div class="algorithm-container">
	<Controls {currentStep} {totalSteps} on:start={startAlgorithm} />

	<div class="tag">Canvas</div>
	<div class="array-visual">
		{#each data as num}
			<div class="bar" style="height: {num * 10}px">{num}</div>
		{/each}
	</div>
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
	.array-visual {
		display: flex;
		gap: 4px;
		justify-content: center;
		align-items: flex-end;
		height: 200px;
		margin: 1rem 0;
	}

	.bar {
		width: 20px;
		background-color: teal;
		text-align: center;
		color: white;
		font-size: 12px;
	}
</style>
