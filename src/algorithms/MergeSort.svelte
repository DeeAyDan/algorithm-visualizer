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
		resumeSignal
	} from '../stores/store.svelte.js';
	import Controls from '../routes/Controls.svelte';
	import { get } from 'svelte/store';
	import { algorithmDisplayNames } from '../stores/algorithmMap.js';


	// ==== Adattömb randomizálása ====
	function shuffle(array) {
		let currentIndex = array.length;
		while (currentIndex != 0) {
			let randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex--;

			[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
		}
	}

	// ==== Alapadatok ====
	let data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
	shuffle(data);
	let initArr = [...data];
	let maxValue = Math.max(...data);
	currentStep.set(0);
	algorithmStatus.set('idle');
	consoleLog.set([]);
	const displayName = algorithmDisplayNames[get(selectedAlgorithm)];


	// ==== Vizualizációs indexek ====
	let activeIndices: number[] = [];
	let swapIndices: [number, number] | null = null;

	// ==== Előkalkulált lépésszám ====
	onMount(() => {
		let countArray = [...data];
		totalSteps.set(countMergeSortSteps(countArray));
	});

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
	function waitUntilRestart(): Promise<void> {
		return new Promise((resolve) => {
			const unsub = resumeSignal.subscribe(() => {
				if (get(algorithmStatus) === 'idle') {
					consoleLog.set([]);
					currentStep.set(0);
					data = [...initArr];

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
	async function restartAlgorithm() {
		if (get(algorithmStatus) === 'finished') {
			await waitUntilRestart();
		}
	}

	// ==== MergeSort futás ====
	async function startAlgorithm(event) {
		consoleLog.set([]);
		currentStep.set(0);
		consoleLog.update((logs) => [...logs, `${displayName} indítása...`]);
		await mergeSort(data);
		consoleLog.update((logs) => [...logs, 'A futás befejeződött!']);
		algorithmStatus.set('finished');
		await restartAlgorithm();
	}

	async function mergeSort(array: number[], startIndex = 0): Promise<void> {
		if (array.length < 2){
			return;
		}

		const middle = Math.floor(array.length / 2);
		const left = array.slice(0, middle);
		const right = array.slice(middle);

		await mergeSort(left, startIndex);
		await mergeSort(right, startIndex + middle);

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
		} else {
			merged[i] = right[r++];
		}

		await pauseIfNeeded();
		await delay(900 - get(speed) * 8);

		data[startIndex + i] = merged[i];
		data = [...data];
		i++;
		swapIndices = null;
	}

	while (l < left.length) {
		log(`Másolás balról: ${left[l]}`);
		swapIndices = [startIndex + i];

		await pauseIfNeeded();
		await delay(900 - get(speed) * 8);
		merged[i] = left[l++];
		data[startIndex + i] = merged[i];
		data = [...data];
		i++;
	}

	while (r < right.length) {
		log(`Másolás jobbról: ${right[r]}`);
		swapIndices = [startIndex + i];

		await pauseIfNeeded();
		await delay(900 - get(speed) * 8);
		merged[i] = right[r++];
		data[startIndex + i] = merged[i];
		data = [...data];
		i++;
	}
	swapIndices = null;
	activeIndices = [];
}



	// ==== Forráskód megjelenítés ====
	selectedAlgorithmSourceCode.set(`
Merge Sort`);
</script>

<!-- ==== Komponens markup ==== -->
<div class="algorithm-container">
	<Controls {currentStep} {totalSteps} on:start={startAlgorithm} />
	<div class="tag">Canvas</div>
	<div class="array-visual">
		{#each data as num, index}
			<div class="bar {activeIndices.includes(index)
					? 'active'
					: ''} {swapIndices && (index === swapIndices[0] || index === swapIndices[1])
					? 'swap'
					: ''}" style="height: {(num / maxValue) * 100}%">
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
	.bar.active {
		background-color: gold;
		color: black;
	}
	.bar.swap {
		background-color: limegreen;
		color: black;
	}
</style>
