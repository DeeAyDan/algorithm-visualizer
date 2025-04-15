<script lang="ts">
	// @ts-nocheck
	import { onMount } from 'svelte';
    import {
		selectedAlgorithmSourceCode,
		currentStep,
		totalSteps,
		consoleLog
	} from '../stores/store.svelte.js';
	import Controls from '../routes/Controls.svelte';

	let data = [5, 3, 18, 14, 8, 1, 2, 6, 10, 2, 1, 8]; // vagy generált tömb
	let speed = 50;
	let stepCount = 0;
    currentStep.set(0);

	let pivotIndex: number | null = null;
	let activeIndex: number | null = null;
	let swapIndices: [number, number] | null = null;

	consoleLog.set([]);

	function countQuickSortSteps(arr: number[]): number {
		let steps = 0;

		function countSort(arr: number[], left: number, right: number): void {
			if (left < right) {
				let pivotIndex = countPartition(arr, left, right);
				countSort(arr, left, pivotIndex - 1);
				countSort(arr, pivotIndex + 1, right);
			}
		}

		function countPartition(arr: number[], left: number, right: number): number {
			let pivot = arr[right];
			steps++; // pivot kiválasztás
			let i = left - 1;

			for (let j = left; j < right; j++) {
				steps++; // összehasonlítás
				if (arr[j] <= pivot) {
					steps++; // csere
					i++;
				}
			}

			steps++; // pivot helyre rakása
			return i + 1;
		}

		const copy = [...arr];
		countSort(copy, 0, copy.length - 1);
		return steps;
	}

	onMount(() => {
		const estimatedSteps = countQuickSortSteps(data);
		totalSteps.set(estimatedSteps);
	});

	// Késleltető helper
	function delay(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	function log(message: string) {
		consoleLog.update((logs) => [...logs, message]);
		stepCount++;
		currentStep.update((n) => n + 1);
	}

	// Start gombra indul
	async function startAlgorithm(event) {
		consoleLog.set([]);
		stepCount = 0;
		currentStep.set(0);
		speed = event.detail.speed;

        consoleLog.update((logs) => [...logs,'QuickSort indítása...']);
		await quickSort(data, 0, data.length - 1);
        consoleLog.update((logs) => [...logs,'QuickSort kész!']);

		totalSteps.set(stepCount);
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
		pivotIndex = right;
		log(`Pivot kiválasztva: ${pivot}`);
		let i = left - 1;

		for (let j = left; j < right; j++) {
			activeIndex = j;
			log(`Összehasonlítás: ${arr[j]} <= ${pivot}`);
			await delay(900 - speed * 8);

			if (arr[j] <= pivot) {
				i++;
				[arr[i], arr[j]] = [arr[j], arr[i]];
				log(`Csere: ${arr[i]} <-> ${arr[j]}`);
				data = [...arr];
				await delay(900 - speed * 8);
			}
		}

		[arr[i + 1], arr[right]] = [arr[right], arr[i + 1]];
		swapIndices = [i + 1, right];
		log(`Pivot helyre rakása: ${arr[i + 1]} <-> ${arr[right]}`);

		data = [...arr];
		await delay(900 - speed * 8);
		swapIndices = null;
		pivotIndex = null;
		activeIndex = null;

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
		{#each data as num, index}
			<div
				class="bar {index === pivotIndex ? 'pivot' : ''} {index === activeIndex
					? 'active'
					: ''} {swapIndices && (index === swapIndices[0] || index === swapIndices[1])
					? 'swap'
					: ''}"
				style="height: {num * 10}px"
			>
				{num}
			</div>
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
		transition: height 0.3s ease;
	}

	.bar.pivot {
		background-color: crimson;
	}

	.bar.active {
		background-color: gold;
		color: black;
	}

	.bar.swap {
		background-color: limegreen;
		color: black;
	}
</style>
