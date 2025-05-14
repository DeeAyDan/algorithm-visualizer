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
		return array;
	}

	// ==== Alapadatok ====
	let data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
	shuffle(data);

	let initArr = [...data];
	let maxValue = Math.max(...data);
	let countArray = [...data];

	// ==== Vizualizációs indexek ====
	let activeIndices: number[] = [];
	let swapIndices: [number, number] | null = null;

	// ==== Előkalkulált lépésszám ====
	onMount(() => {
		countArray = [...data];
		totalSteps.set(countMergeSortSteps(countArray));
		resetParameters();
	});

	function resetParameters() {
		currentStep.set(0);
		algorithmStatus.set('idle');
		consoleLog.set([]);
		activeLine.set({ start: -1, end: -1 });

		data = [...initArr];
	}

	// ==== Keverés funkció ====
	function reshuffleData() {
		data = shuffle([...data]);
		initArr = [...data];
		countArray = [...data];
		totalSteps.set(countMergeSortSteps(countArray));
		resetParameters();
		consoleLog.update((logs) => [...logs, 'Adatok újrakeverve!']);
	}

	function countMergeSortSteps(array) {
		let steps = 0;

		let length = array.length;
		if (length < 2) return 0;

		let middle = Math.floor(length / 2);
		let leftArray = [];
		let rightArray = [];

		let i = 0; // left array
		let j = 0; // right array

		for (; i < length; i++) {
			if (i < middle) {
				leftArray.push(array[i]);
			} else {
				rightArray.push(array[i]);
				j++;
			}
		}

		steps += countMergeSortSteps(leftArray);
		steps += countMergeSortSteps(rightArray);
		steps += countMerge(leftArray, rightArray, array);

		return steps;
	}
	function countMerge(leftArray, rightArray, array) {
		let steps = 0;
		let leftSize = Math.floor(array.length / 2);
		let rightSize = array.length - leftSize;
		let i = 0,
			l = 0,
			r = 0;

		while (l < leftSize && r < rightSize) {
			steps++;

			if (leftArray[l] < rightArray[r]) {
				array[i] = leftArray[l];
				l++;
				i++;
			} else {
				array[i] = rightArray[r];
				r++;
				i++;
			}
		}
		while (l < leftSize) {
			steps++;
			array[i] = leftArray[l];
			i++;
			l++;
		}
		while (r < rightSize) {
			steps++;
			array[i] = rightArray[r];
			i++;
			r++;
		}

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

	// ==== MergeSort futás ====
	async function startAlgorithm(event) {
		consoleLog.set([]);
		currentStep.set(0);
		consoleLog.update((logs) => [...logs, `${displayName} indítása...`]);

		await mergeSort(data);
		activeLine.set({ start: -1, end: -1 });

		consoleLog.update((logs) => [...logs, 'A futás befejeződött!']);
		algorithmStatus.set('finished');
		await restartAlgorithm();
	}

	async function mergeSort(array: number[], startIndex = 0): Promise<void> {
		if (array.length < 2) {
			return;
		}

		const middle = Math.floor(array.length / 2);
		const left = array.slice(0, middle);
		const right = array.slice(middle);

		activeLine.set({ start: 11, end: 11 });
		await delay(900 - get(speed) * 8);
		await pauseIfNeeded();
		await mergeSort(left, startIndex);

		activeLine.set({ start: 12, end: 12 });
		await delay(900 - get(speed) * 8);
		await pauseIfNeeded();
		await mergeSort(right, startIndex + middle);

		activeLine.set({ start: 14, end: 14 });
		await delay(900 - get(speed) * 8);
		await pauseIfNeeded();
		await merge(left, right, array, startIndex);
	}

	async function merge(left: number[], right: number[], merged: number[], startIndex: number) {
		let i = 0,
			l = 0,
			r = 0;

		activeIndices = Array.from({ length: merged.length }, (_, idx) => startIndex + idx);

		while (l < left.length && r < right.length) {
			log(`Összehasonlítás: ${left[l]} <= ${right[r]}`);

			swapIndices = [startIndex + i];

			if (left[l] <= right[r]) {
				merged[i] = left[l++];
				activeLine.set({ start: 25, end: 26 });
			} else {
				merged[i] = right[r++];
				activeLine.set({ start: 27, end: 29 });
			}
			await delay(900 - get(speed) * 8);
			await pauseIfNeeded();

			data[startIndex + i] = merged[i];
			data = [...data];
			i++;
			swapIndices = null;
		}

		while (l < left.length) {
			log(`Másolás balról: ${left[l]}`);
			swapIndices = [startIndex + i];

			activeLine.set({ start: 36, end: 41 });
			await delay(900 - get(speed) * 8);
			await pauseIfNeeded();
			merged[i] = left[l++];
			data[startIndex + i] = merged[i];
			data = [...data];
			i++;
		}

		while (r < right.length) {
			log(`Másolás jobbról: ${right[r]}`);
			swapIndices = [startIndex + i];

			activeLine.set({ start: 43, end: 48 });
			await delay(900 - get(speed) * 8);
			await pauseIfNeeded();
			merged[i] = right[r++];
			data[startIndex + i] = merged[i];
			data = [...data];
			i++;
		}
		swapIndices = null;
		activeIndices = [];
	}

	// ==== Forráskód megjelenítés ====
	selectedAlgorithmSourceCode.set(
		`function mergeSort(array, startIndex = 0) {
 
  if (array.length < 2){
    return;
  }
	
  const middle = Math.floor(array.length / 2);
  const left = array.slice(0, middle);
  const right = array.slice(middle);
 
  mergeSort(left, startIndex);
  mergeSort(right, startIndex + middle);
 
  merge(left, right, array, startIndex);
}
 
function merge(left, right, merged, startIndex) {
 
  let i = 0,
  l = 0,
  r = 0;
 
  while (l < left.length && r < right.length) {

    if (left[l] <= right[r]) {
      merged[i] = left[l++];
    } else {
      merged[i] = right[r++];
    }

    data[startIndex + i] = merged[i];
    data = [...data];
    i++;
  }
 
  while (l < left.length) {
    merged[i] = left[l++];
    data[startIndex + i] = merged[i];
    data = [...data];
    i++;
  }
 
  while (r < right.length) {
    merged[i] = right[r++];
    data[startIndex + i] = merged[i];
    data = [...data];
    i++;
  }
}`
	);
</script>

<!-- ==== Komponens markup ==== -->
<div class="custom-buttons button-group">
	<button disabled={$algorithmStatus !== 'idle'} on:click={reshuffleData}>Keverés</button>
</div>

<div class="algorithm-container">
	<Controls {currentStep} {totalSteps} on:start={startAlgorithm} />
	

	<div class="array-visual">
		{#each data as num, index}
			<div
				class="bar {activeIndices.includes(index) ? 'active' : ''} {swapIndices &&
				(index === swapIndices[0] || index === swapIndices[1])
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