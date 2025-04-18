<script lang="ts">
	// @ts-nocheck
	import { onMount } from 'svelte';
	import {
		selectedAlgorithmSourceCode,
		currentStep,
		totalSteps,
		consoleLog,
		speed,
		algorithmStatus,
		resumeSignal
	} from '../stores/store.svelte.js';
	import Controls from '../routes/Controls.svelte';
	import { get } from 'svelte/store';

	// ==== Alapadatok ====
	let data = [8, 3, 7, 10, 4, 6, 9, 2, 1, 5];
	let maxValue = Math.max(...data);
	currentStep.set(0);
	algorithmStatus.set('idle');
	consoleLog.set([]);

	// ==== Vizualizációs indexek ====
	let pivotIndex: number | null = null;
	let activeIndex: number | null = null;
	let swapIndices: [number, number] | null = null;

		// ==== Előkalkulált lépésszám ====
	onMount(() => {
		totalSteps.set(countQuickSortSteps());
	});

	function countQuickSortSteps() {
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
			steps++;
			let i = left - 1;
			for (let j = left; j < right; j++) {
				steps++;
				if (arr[j] <= pivot) {
					i++;
					steps++;
					[arr[i], arr[j]] = [arr[j], arr[i]];
					copy = [...arr];
				}
			}
			[arr[i + 1], arr[right]] = [arr[right], arr[i + 1]];
			steps++;
			return i + 1;
		}
		let copy = [...data];
		countSort(copy, 0, copy.length - 1);
		return steps;
	}

	// ==== Késleltetés és vezérlés ====
	function log(message: string) {
		consoleLog.update((logs) => [...logs, message]);
		currentStep.update((n) => n + 1);
	}
	function delay(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
	function waitUntilResume(): Promise<void> {
		return new Promise((resolve) => {
			const unsub = resumeSignal.subscribe(() => {
				if (get(algorithmStatus) === 'running') {
					unsub();
					resolve();
				}
			});
		});
	}
	async function pauseIfNeeded() {
		if (get(algorithmStatus) === 'paused') {
			await waitUntilResume();
		}
	}

	// ==== QuickSort futás ====
	async function startAlgorithm(event) {
		consoleLog.set([]);
		currentStep.set(0);
		consoleLog.update((logs) => [...logs, 'QuickSort indítása...']);
		await quickSort(data, 0, data.length - 1);
		consoleLog.update((logs) => [...logs, 'QuickSort kész!']);
	}

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
			await pauseIfNeeded();
			await delay(900 - get(speed) * 8);
			if (arr[j] <= pivot) {
				i++;
				[arr[i], arr[j]] = [arr[j], arr[i]];
				log(`Csere: ${arr[i]} <-> ${arr[j]}`);
				data = [...arr];
				await pauseIfNeeded();
				await delay(900 - get(speed) * 8);
			}
		}
		[arr[i + 1], arr[right]] = [arr[right], arr[i + 1]];
		swapIndices = [i + 1, right];
		log(`Pivot helyre rakása: ${arr[i + 1]} <-> ${arr[right]}`);
		data = [...arr];
		await pauseIfNeeded();
		await delay(900 - get(speed) * 8);
		swapIndices = null;
		pivotIndex = null;
		activeIndex = null;
		return i + 1;
	}

	// ==== Forráskód megjelenítés ====
	selectedAlgorithmSourceCode.set(`
function quickSort(arr, left, right) {
	if (left < right) {
		let pivotIndex = partition(arr, left, right);
		quickSort(arr, left, pivotIndex - 1);
		quickSort(arr, pivotIndex + 1, right);
	}
}`);
</script>

<!-- ==== Komponens markup ==== -->
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
				style="height: {(num / maxValue) * 100}%">
				{num}
			</div>
		{/each}
	</div>
</div>

<!-- ==== Stílus ==== -->
<style>
	.tag {
		display: inline-block;
		top: 0;
		left: 0;
		background-color: #484848;
		color: white;
		padding: 3px;
	}
	.array-visual {
		display: flex;
		gap: 4px;
		justify-content: center;
		align-items: flex-end;
		height: 200px;
		margin: 1rem 0 0 0;
	}
	.bar {
		width: 5%;
		background-color: teal;
		text-align: center;
		color: white;
		font-size: 12px;
		transition: height 0.3s ease;
	}
	.bar.pivot { background-color: crimson; }
	.bar.active { background-color: gold; color: black; }
	.bar.swap { background-color: limegreen; color: black; }
</style>
