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
	let data = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
	shuffle(data);
	let initArr = [...data];
	let maxValue = Math.max(...data);
	currentStep.set(0);
	algorithmStatus.set('idle');
	consoleLog.set([]);

	// ==== Vizualizációs indexek ====
    let activeIndices: [number, number] | null = null;
    let mergedRange: [number, number] | null = null;


	// ==== Előkalkulált lépésszám ====
	onMount(() => {
        let countArray = [...data];
		totalSteps.set(countMergeSortSteps(countArray));
	});

    function countMergeSortSteps(array){
        let steps = 0;

        let length = array.length;
        if(length < 2) return 0;

        let middle = length / 2;
        let leftArray = [];
        let rightArray = [];

        let i = 0; // left array
        let j = 0; // right array

        for (; i < length; i++) {
            if (i < middle) {
                leftArray.push(array[i]);
            }
            else {
                rightArray.push(array[i]);
            }
        }
        steps += countMergeSortSteps(leftArray);
        steps += countMergeSortSteps(rightArray);
        steps += countMerge(leftArray, rightArray, array);


        return steps;
    }
    function countMerge(leftArray, rightArray, array){
        let steps = 0;
        let leftSize = array.length / 2;
        let rightSize = array.length - leftSize;
        let i = 0, l = 0, r = 0;

        while(l < leftSize && r < rightSize) {
            // összehasonlítás
            steps++;
            i++;
            if(leftArray[l] < rightArray[r]) {
                array[i] = leftArray[l];
                l++;
            }
            else {
                array[i] = rightArray[r];
                r++;
            }
        }
        while(l < leftSize){

            steps++;
            array[i] = leftArray[l];
            i++;
            l++;
        }
        while(r < rightSize){

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
		consoleLog.update((logs) => [...logs, 'MergeSort indítása...']);
		await MergeSort(data);
		consoleLog.update((logs) => [...logs, 'MergeSort kész!']);
		algorithmStatus.set('finished');
		await restartAlgorithm();
	}

    function mergeSort(array){
        let length = array.length;
        if(length < 2) return 0;

        // subarray kivalasztas

        let middle = length / 2;
        let leftArray = [];
        let rightArray = [];

        let i = 0;
        let j = 0;

        for (; i < length; i++) {
            if (i < middle) {
                leftArray.push(array[i]);
            }
            else {
                rightArray.push(array[i]);
            }
        }
        mergeSort(leftArray);
        mergeSort(rightArray);
        Merge(leftArray, rightArray, array);

    }
    function Merge(leftArray, rightArray, array){
        let leftSize = array.length / 2;
        let rightSize = array.length - leftSize;
        let i = 0, l = 0, r = 0;

        while(l < leftSize && r < rightSize) {
            // összehasonlítás
            steps++;
            i++;
            if(leftArray[l] < rightArray[r]) {
                array[i] = leftArray[l];
                l++;
            }
            else {
                array[i] = rightArray[r];
                r++;
            }
        }
        while(l < leftSize){

            steps++;
            array[i] = leftArray[l];
            i++;
            l++;
        }
        while(r < rightSize){

            steps++;
            array[i] = rightArray[r];
            i++;
            r++;
        }

        return steps;
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
			<div
				class="bar "
				style="height: {(num / maxValue) * 100}%"
			>
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
	.bar.inserted {
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
