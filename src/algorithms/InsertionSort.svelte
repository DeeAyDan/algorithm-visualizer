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
		return array; // Return the shuffled array
	}

	// ==== Alapadatok ====
	let data = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
	shuffle(data);
	let initArr = [...data];
	let countArray = [...data];
	let maxValue = Math.max(...data);


	// ==== Vizualizációs indexek ====
    let insertedIndex: number | null = null;
	let activeIndex: number | null = null;
	let swapIndices: [number, number] | null = null;

	// ==== Előkalkulált lépésszám ====
	onMount(() => {
		countArray = [...data];
		totalSteps.set(countInsersionSortSteps(initArr));
		resetParameters();
	});

	function reshuffleData() {
		// Create a new array, shuffle it, and assign it to data
		let shuffledData = shuffle([...initArr]);
		data = [...shuffledData];
		initArr = [...data];
		countArray = [...data];
		totalSteps.set(countInsersionSortSteps(countArray));
		resetParameters();
		consoleLog.update((logs) => [...logs, 'Adatok újrakeverve, algoritmus visszaállítva.']);
	}

	function resetParameters() {
		currentStep.set(0);
		algorithmStatus.set('idle');
		consoleLog.set([]);
		activeLine.set({ start: -1, end: -1 });

		data = [...initArr];
	}

    function countInsersionSortSteps(){
        let steps = 0;
        let array = [...data];

        for (let index = 1; index < array.length; index++) {
            // insert
            steps++;
            let temp = array[index];

            let j = index - 1;

            while (j >= 0 && array[j] > temp) {
                // move left to right
                steps++;
                array[j + 1] = array[j];
                j--;
            }
            // pop temp back
            steps++;
            array[j + 1] = temp;
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

	// ==== InsersionSort futás ====
	async function startAlgorithm(event) {
		consoleLog.set([]);
		currentStep.set(0);
		consoleLog.update((logs) => [...logs, `${displayName} indítása...`]);

		await insersionSort(data);
		activeLine.set({ start: -1, end: -1 });


		consoleLog.update((logs) => [...logs, 'A futás befejeződött!']);
		algorithmStatus.set('finished');
		await restartAlgorithm();
	}

    async function insersionSort(array){

        for (let index = 1; index < array.length; index++) {
            
			let temp = array[index];

            activeIndex = index;
            insertedIndex = null;

            log(`Elem kivétele: ${temp}`)
			activeLine.set({ start: 5, end: 6 });
            await delay(900 - get(speed) * 8);
			await pauseIfNeeded();

            let j = index - 1;

            while (j >= 0 && array[j] > temp) {
                array[j + 1] = array[j];
                data = [...array];

                swapIndices = [j + 1, j];

                log(`Mozgatás: ${array[j]} < - > ${temp}`);
				activeLine.set({ start: 9, end: 10 });
				await delay(900 - get(speed) * 8);
				await pauseIfNeeded();

                j--;
            }
            // pop temp back
            array[j + 1] = temp;
            data = [...array];

            swapIndices = null;
            insertedIndex = j + 1;

            log(`Elem visszaillesztése: ${temp}`)
			activeLine.set({ start: 13, end: 13 });
            await delay(900 - get(speed) * 8);
			await pauseIfNeeded();

        }

        insertedIndex = null;
        activeIndex = null;
        swapIndices = null;
    }

	// ==== Forráskód megjelenítés ====
	selectedAlgorithmSourceCode.set(
`function insersionSort(array) {
 
  for (let index = 1; index < array.length; index++){
 
    let temp = array[index];
    let j = index - 1;
 
    while (j >= 0 && array[j] > temp){
      array[j + 1] = array[j];
      j--;
    }
 
    array[j + 1] = temp;
  }
}`);
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
				class="bar {index === activeIndex
					? 'active'
					: ''} {swapIndices && (index === swapIndices[0] || index === swapIndices[1])
					? 'swap'
					: ''} {index === insertedIndex
					? 'inserted'
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