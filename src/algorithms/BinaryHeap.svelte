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
		resumeSignal,
		selectedAlgorithm
	} from '../stores/store.svelte.js';
	import Controls from '../routes/Controls.svelte';
	import { get } from 'svelte/store';
	import { algorithmDisplayNames } from '../stores/algorithmMap.js';
	import { waitUntilResume, delay, pauseIfNeeded, log } from '../stores/utils.js';

	currentStep.set(0);
	algorithmStatus.set('idle');
	consoleLog.set([]);
	const displayName = algorithmDisplayNames[get(selectedAlgorithm)];

	let elementValue;
	let heap: number[] = [Infinity]; // heap[0] nem használt, 1-indexelt

	function validateInput() {
		if (elementValue === undefined || elementValue === null) {
			log('Kérlek adj meg egy értéket!');
			return false;
		} else if (typeof elementValue !== 'number') {
			log('Kérlek számot adj meg!');
			return false;
		} else if (elementValue < 0 || elementValue > 100) {
			log('Kérlek 0 és 100 közötti számot adj meg!');
			return false;
		}
		return true;
	}

	function heapifyUp(index: number) {
		while (index > 1 && heap[Math.floor(index / 2)] > heap[index]) {
			[heap[Math.floor(index / 2)], heap[index]] = [heap[index], heap[Math.floor(index / 2)]];
			index = Math.floor(index / 2);
			log('Heapify up...');
		}
	}

	function insertElement() {
		if (!validateInput()) return;
		heap.push(elementValue);
		heap = [...heap]; // Új referencia létrehozása
		log(`Elem beszúrása: ${elementValue}`);
		heapifyUp(heap.length - 1);
	}

	function deleteElement() {
		if (heap.length <= 1) return log('A kupac üres.');
		log(`Gyökér törlése: ${heap[1]}`);
		heap[1] = heap[heap.length - 1];
		heap.pop();
		heap = [...heap]; // Új referencia létrehozása
		heapifyDown(1);
	}

	function heapifyDown(index: number) {
		while (2 * index < heap.length) {
			let left = 2 * index;
			let right = 2 * index + 1;
			let smallest = left;
			if (right < heap.length && heap[right] < heap[left]) {
				smallest = right;
			}
			if (heap[index] <= heap[smallest]) break;
			[heap[index], heap[smallest]] = [heap[smallest], heap[index]];
			index = smallest;
			log('Heapify down...');
		}
	}

	function searchElement() {
		if (!validateInput()) return;
		const index = heap.findIndex((val) => val === elementValue);
		if (index === -1) log(`${elementValue} nincs a kupacban.`);
		else log(`${elementValue} megtalálva indexen: ${index}`);
	}

	onMount(() => {
		totalSteps.set(0);
	});

	async function restartAlgorithm() {
		if (get(algorithmStatus) === 'finished') {
			return new Promise((resolve) => {
				const unsub = resumeSignal.subscribe(() => {
					if (get(algorithmStatus) === 'idle') {
						consoleLog.set([]);
						currentStep.set(0);
						heap = [Infinity];
						unsub();
						resolve();
					}
				});
			});
		}
	}

	async function startAlgorithm(event) {
		consoleLog.set([]);
		currentStep.set(0);
		consoleLog.update((logs) => [...logs, `${displayName} indítása...`]);
		// Itt nincs teljes futtatás, mert műveleteken keresztül manipuláljuk a struktúrát.
		consoleLog.update((logs) => [...logs, 'A futás befejeződött!']);
		algorithmStatus.set('finished');
		await restartAlgorithm();
	}

	selectedAlgorithmSourceCode.set(`Bináris kupac vizualizáció`);
</script>

<div class="control-buttons">
	<input class="custom-input" type="number" bind:value={elementValue} placeholder="Elem értéke" />

	<div><button on:click={insertElement}>Elem beszúrás</button>
		<button on:click={deleteElement}>Gyökér törlés</button>
		<button on:click={searchElement}>Elem keresés</button>
		<button on:click={createExampleHeap} class="special-button">Példa kupac</button>
		<button on:click={clearHeap} class="clear-button">Kupac törlése</button></div>
</div>


<div class="algorithm-container">
	<div class="array-visual">
		<div class="row">
			{#each heap.slice(1) as value, i}
				<div class="bar">{value}</div>
			{/each}
		</div>
		<svg viewBox="0 0 800 400" class="svg-tree">
			{#each heap.slice(1) as value, i (i)}
				{#if 2 * (i + 1) < heap.length}
					<line
						x1={(i + 1) * 50}
						y1={50 + Math.floor(Math.log2(i + 1)) * 70}
						x2={2 * (i + 1) * 50}
						y2={50 + Math.floor(Math.log2(2 * (i + 1))) * 70}
						stroke="black"
					/>
				{/if}
				{#if 2 * (i + 1) + 1 < heap.length}
					<line
						x1={(i + 1) * 50}
						y1={50 + Math.floor(Math.log2(i + 1)) * 70}
						x2={(2 * (i + 1) + 1) * 50}
						y2={50 + Math.floor(Math.log2(2 * (i + 1) + 1)) * 70}
						stroke="black"
					/>
				{/if}
				<circle cx={(i + 1) * 50} cy={50 + Math.floor(Math.log2(i + 1)) * 70} r="15" fill="#ccc" />
				<text
					x={(i + 1) * 50}
					y={55 + Math.floor(Math.log2(i + 1)) * 70}
					text-anchor="middle"
					fill="black"
					font-size="14">{value}</text
				>
			{/each}
		</svg>
	</div>
</div>

<style>
	.array-visual {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		align-items: center;
	}
	.row {
		display: flex;
		gap: 4px;
	}
	.bar {
		width: 30px;
		height: 30px;
		border: 1px solid #000;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.control-buttons {
		display: flex;
		justify-content: space-around;
		align-items: center;
		padding: 1rem;
		border-bottom: 3px solid #505050;
		flex-wrap: wrap;
		gap: 8px;
	}
	.control-buttons input {
		width: 150px;
		padding: 0.5rem;
		margin-right: 10px;
		border-radius: 5px;
		background-color: #2f2f2f;
		border: 3px solid #505050;
		color: white;
	}
	.control-buttons div {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
		justify-content: center;
	}
	.control-buttons button {
		padding: 0.5rem 1rem;
		background-color: #505050;
		color: white;
		border: none;
		border-radius: 5px;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.control-buttons button:hover {
		background-color: #45a049;
	}
	
	.special-button {
		background-color: #3498db !important;
	}
	
	.special-button:hover {
		background-color: #2980b9 !important;
	}
	
	.clear-button {
		background-color: #e74c3c !important;
	}
	
	.clear-button:hover {
		background-color: #c0392b !important;
	}
	.svg-tree {
		width: 100%;
		height: 300px;
		border: 1px solid #aaa;
		background-color: #f8f8f8;
	}
</style>
