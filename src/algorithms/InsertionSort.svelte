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
	let data = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
	shuffle(data);
	let initArr = [...data];
	let maxValue = Math.max(...data);
	currentStep.set(0);
	algorithmStatus.set('idle');
	consoleLog.set([]);
	const displayName = algorithmDisplayNames[get(selectedAlgorithm)];


	// ==== Vizualizációs indexek ====
    let insertedIndex: number | null = null;
	let activeIndex: number | null = null;
	let swapIndices: [number, number] | null = null;

	// ==== Előkalkulált lépésszám ====
	onMount(() => {
		totalSteps.set(countInsersionSortSteps(data));
	});

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

	// ==== InsersionSort futás ====
	async function startAlgorithm(event) {
		consoleLog.set([]);
		currentStep.set(0);
		consoleLog.update((logs) => [...logs, `${displayName} indítása...`]);
		await insersionSort(data);
		consoleLog.update((logs) => [...logs, 'A futás befejeződött!']);
		algorithmStatus.set('finished');
		await restartAlgorithm();
	}

    async function insersionSort(array){

        for (let index = 1; index < array.length; index++) {
            // insert
            let temp = array[index];

            activeIndex = index;
            insertedIndex = null;

            log(`Elem kivétele: ${temp}`)
            await pauseIfNeeded();
            await delay(900 - get(speed) * 8);

            let j = index - 1;

            while (j >= 0 && array[j] > temp) {
                // move left to right
                array[j + 1] = array[j];
                data = [...array];

                swapIndices = [j + 1, j];

                log(`Mozgatás: ${array[j]} < - > ${temp}`);
                await pauseIfNeeded();
                await delay(900 - get(speed) * 8);

                j--;
            }
            // pop temp back
            array[j + 1] = temp;
            data = [...array];

            swapIndices = null;
            insertedIndex = j + 1;

            log(`Elem visszaillesztése: ${temp}`)
            await pauseIfNeeded();
            await delay(900 - get(speed) * 8);

        }

        insertedIndex = null;
        activeIndex = null;
        swapIndices = null;
    }

	// ==== Forráskód megjelenítés ====
	selectedAlgorithmSourceCode.set(`
Insert Sort`);
</script>

<!-- ==== Komponens markup ==== -->
<div class="algorithm-container">
	<Controls {currentStep} {totalSteps} on:start={startAlgorithm} />
	<div class="tag">Canvas</div>
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
