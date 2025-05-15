<script lang="ts">
	// @ts-nocheck
	import { onMount } from 'svelte';
	import {
		selectedAlgorithmSourceCode,
		selectedAlgorithm,
		currentStep,
		totalSteps,
		consoleLog,
		speed,
		algorithmStatus,
		resumeSignal,
		activeLine
	} from '../stores/store.svelte.js';
	import Controls from '../routes/Controls.svelte';
	import { get } from 'svelte/store';
	import { algorithmDisplayNames } from '../stores/algorithmMap.js';
	import { waitUntilResume, delay, pauseIfNeeded, log } from '../stores/utils.js';

	const displayName = algorithmDisplayNames[get(selectedAlgorithm)];

	// ==== Adattömb randomizálása ====
	function shuffle(array) {
		let currentIndex = array.length;
		while (currentIndex != 0) {
			let randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex--;

			[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
		}
	}

	function reshuffleData() {
  shuffle(data);
  initArr = [...data];
  maxValue = Math.max(...data);
  resetParameters();
  totalSteps.set(countQuickSortSteps());
  consoleLog.set([]);
  consoleLog.update((logs) => [...logs, 'Adatok újrakeverve, algoritmus visszaállítva.']);
}

	// ==== Alapadatok ====
	let data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
	shuffle(data);
	let initArr = [...data];
	let maxValue = Math.max(...data);

	$: totalSteps.set(countQuickSortSteps());

	// ==== Vizualizációs indexek ====
	let pivotIndex: number | null = null;
	let activeIndex: number | null = null;
	let swapIndices: [number, number] | null = null;

	// ==== Előkalkulált lépésszám ====
	onMount(() => {
		resetParameters();
	});

	function resetParameters() {
		currentStep.set(0);
		algorithmStatus.set('idle');
		consoleLog.set([]);
		activeLine.set({start: -1, end: -1});

		data = [...initArr];
		maxValue = Math.max(...data);
		pivotIndex = null;
		activeIndex = null;
		swapIndices = null;
	}

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
	async function restartAlgorithm() {
		if (get(algorithmStatus) === 'finished') {
			return new Promise((resolve) => {
				const unsub = resumeSignal.subscribe(() => {
					if (get(algorithmStatus) === 'idle') {
						resetParameters();
						unsub();
						resolve();
					}
				});
			});
		}
	}

	// ==== QuickSort futás ====
	async function startAlgorithm(event) {
		consoleLog.set([]);
		currentStep.set(0);
		consoleLog.update((logs) => [...logs, `${displayName} indítása...`]);

		await quickSort(data, 0, data.length - 1);
		activeLine.set({start: -1, end: -1});

		consoleLog.update((logs) => [...logs, 'A futás befejeződött!']);
		algorithmStatus.set('finished');
		await restartAlgorithm();
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
		activeLine.set({start: 2, end: 2});
		await delay(900 - get(speed) * 8);
		await pauseIfNeeded();
		let i = left - 1;
		for (let j = left; j < right; j++) {
			activeIndex = j;
			log(`Összehasonlítás: ${arr[j]} <= ${pivot}`);
			activeLine.set({start: 15, end: 16});
			await delay(900 - get(speed) * 8);
			await pauseIfNeeded();
			if (arr[j] <= pivot) {
				i++;
				[arr[i], arr[j]] = [arr[j], arr[i]];
				log(`Csere: ${arr[i]} <-> ${arr[j]}`);
				activeLine.set({start: 17, end: 20});
				data = [...arr];
				await delay(900 - get(speed) * 8);
				await pauseIfNeeded();
			}
		}
		[arr[i + 1], arr[right]] = [arr[right], arr[i + 1]];
		swapIndices = [i + 1, right];
		log(`Pivot helyre rakása: ${arr[i + 1]} <-> ${arr[right]}`);
		activeLine.set({start: 23, end: 25});
		data = [...arr];
		await delay(900 - get(speed) * 8);
		await pauseIfNeeded();
		swapIndices = null;
		pivotIndex = null;
		activeIndex = null;
		return i + 1;
	}

	// ==== Forráskód megjelenítés ====
	selectedAlgorithmSourceCode.set(`function quickSort(arr, left, right){
  let pivot = arr[right];

  if (left < right){
    let pivotIndex = partition(arr, left, right);
    quickSort(arr, left, pivotIndex - 1);
    quickSort(arr, pivotIndex + 1, right);
  }
}
 
function partition(arr, left, right){
  let pivot = arr[right];
  let i = left - 1;
 
  for (let j = left; j < right; j++){
    activeIndex = j;
    if (arr[j] <= pivot){
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
 
  [arr[i + 1], arr[right]] = [arr[right], arr[i + 1]];
  pivotIndex = null;
  return i + 1;
}`);
</script>

<div class="custom-buttons button-group">
	<button disabled={$algorithmStatus !== 'idle'} on:click={reshuffleData}>Keverés</button>
</div>

<!-- ==== Komponens markup ==== -->
<div class="algorithm-container">
	<Controls {currentStep} {totalSteps} on:start={startAlgorithm} />
	<div class="array-visual">
		{#each data as num, index}
			<div
				class="bar {index === pivotIndex ? 'pivot' : ''} {index === activeIndex
					? 'active'
					: ''} {swapIndices && (index === swapIndices[0] || index === swapIndices[1])
					? 'swap'
					: ''}"
				style="height: {(num / maxValue) * 100}%"
			>
				{num}
			</div>
		{/each}
	</div>
</div>

<!-- ==== Stílus ==== -->
<style>
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
	.button-group {
		display: flex;
		justify-content: center;
		padding: 0.5rem;
		border-bottom: 3px solid #484848;
	}
	.custom-buttons button {
		padding: 0.5rem 1rem;
		background-color: #444;
		color: aliceblue;
		border: none;
		border-radius: 5px;
		cursor: pointer;
	}
	.custom-buttons button:hover {
		background-color: #5cb85c;
	}
	.custom-buttons button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		border-color: #3a3a3a;
	}
</style>
