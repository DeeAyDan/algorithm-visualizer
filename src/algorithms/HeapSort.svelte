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
		selectedAlgorithm,
		activeLine
	} from '../stores/store.svelte.js';
	import Controls from '../routes/Controls.svelte';
	import { get } from 'svelte/store';
	import { algorithmDisplayNames } from '../stores/algorithmMap.js';
	import { waitUntilResume, delay, pauseIfNeeded, log } from '../stores/utils.js';

	const displayName = algorithmDisplayNames[get(selectedAlgorithm)];

	let nodes = [10, 8, 6, 7, 9, 3, 2, 4, 1, 5];
	let arr = [...nodes];
	activeLine.set(-1);

	let nodePositions = [];

	$: totalSteps.set(heapSortCounter());

	onMount(() => {
		calculateNodePositions();
		resetParameters();
	});

	function resetParameters() {
		currentStep.set(0);
		algorithmStatus.set('idle');
		consoleLog.set([]);
		activeLine.set({ start: -1, end: -1 });

		nodes = [10, 8, 6, 7, 9, 3, 2, 4, 1, 5];
		arr = [...nodes];
		activeNodes = [];
		swapNodes = [];
		shuffle(nodes);
		calculateNodePositions();
	}

	// ==== Vizualizációs indexek ====

	let activeNodes = [];
	let swapNodes = [];

	function calculateNodePositions() {
		nodePositions = [];
		const spacingX = 500;
		const spacingY = 70;

		for (let i = 0; i < nodes.length; i++) {
			const level = Math.floor(Math.log2(i + 1));
			const maxNodesAtLevel = 2 ** level;
			const posInLevel = i - (2 ** level - 1);
			const x = (spacingX / (maxNodesAtLevel + 1)) * (posInLevel + 1);
			const y = level * spacingY + 40;
			nodePositions.push({ x, y, value: nodes[i], index: i });
		}
	}

	// ==== Adattömb randomizálása ====
	function shuffle(array) {
		let currentIndex = array.length;
		while (currentIndex != 0) {
			let randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex--;

			[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
		}
	}

	// ==== Keverés gomb funkció ====
	function reshuffleData() {
		if (get(algorithmStatus) !== 'idle') return;

		shuffle(nodes);
		arr = [...nodes];
		calculateNodePositions();
		totalSteps.set(heapSortCounter());

		consoleLog.set([]);
		currentStep.set(0);
		activeNodes = [];
		swapNodes = [];
		consoleLog.update((logs) => [...logs, 'Adatok újrakeverve, algoritmus visszaállítva.']);
		activeLine.set({ start: -1, end: -1 });
	}

	function heapSortCounter() {
		let steps = 0;
		const n = arr.length;

		for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
			steps += heapifyCounter(n, i);
		}

		for (let i = n - 1; i > 0; i--) {
			steps++;
			swapCount(0, i);
			steps += heapifyCounter(i, 0);
		}
		return steps;
	}

	function swapCount(i: number, j: number) {
		[arr[i], arr[j]] = [arr[j], arr[i]];
		calculateNodePositions();
	}

	function heapifyCounter(n, i) {
		let steps = 0;
		let largest = i;
		const l = 2 * i + 1;
		const r = 2 * i + 2;

		if (l < n) {
			steps++;
			if (arr[l] > arr[largest]) {
				largest = l;
			}
		}

		if (r < n) {
			steps++;
			if (arr[r] > arr[largest]) {
				largest = r;
			}
		}

		if (largest !== i) {
			steps++;
			swapCount(i, largest);
			steps += heapifyCounter(n, largest);
		}
		return steps;
	}

	// ==== Vezérlés ====
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

	// ==== Algoritmus indítása ====

	async function startAlgorithm() {
		consoleLog.set([]);
		currentStep.set(0);
		algorithmStatus.set('running');
		consoleLog.update((logs) => [...logs, `${displayName} indítása...`]);

		await heapSort();
		activeLine.set({ start: -1, end: -1 });

		consoleLog.update((logs) => [...logs, 'A futás befejeződött!']);
		algorithmStatus.set('finished');
		await restartAlgorithm();
	}

	// ==== Algoritmusok ====

	async function heapSort() {
		const n = nodes.length;

		for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
			await heapify(n, i);
		}

		for (let i = n - 1; i > 0; i--) {
			log(`Gyökér és utolsó csere: ${nodes[0]} ⇄ ${nodes[i]}`);
			activeLine.set({ start: 8, end: 11 });
			await delay(900 - get(speed) * 8);
			await pauseIfNeeded();
			await swap(0, i);
			await heapify(i, 0);
		}
		swapNodes = [];
	}

	async function swap(i: number, j: number) {
		activeNodes = [i, j];
		swapNodes = [];

		activeLine.set({ start: 15, end: 17 });
		await delay(900 - get(speed) * 8);
		await pauseIfNeeded();

		activeNodes = [];
		swapNodes = [i, j];

		await delay(900 - get(speed) * 8);
		await pauseIfNeeded();

		[nodes[i], nodes[j]] = [nodes[j], nodes[i]];
		calculateNodePositions();

		await delay(900 - get(speed) * 8);
		await pauseIfNeeded();

		swapNodes = [];
	}

	async function heapify(n, i) {
		let largest = i;
		const l = 2 * i + 1;
		const r = 2 * i + 2;

		if (l < n) {
			log(`Összehasonlítás: ${nodes[l]} (bal) és ${nodes[largest]} (jelenlegi legnagyobb)`);
			activeNodes = [l, largest];
			swapNodes = [];

			if (nodes[l] > nodes[largest]) {
				largest = l;
				activeLine.set({ start: 24, end: 26 });
			}
			await delay(900 - get(speed) * 8);
			await pauseIfNeeded();
		}

		if (r < n) {
			log(`Összehasonlítás: ${nodes[r]} (jobb) és ${nodes[largest]} (jelenlegi legnagyobb)`);
			activeNodes = [r, largest];
			swapNodes = [];

			if (nodes[r] > nodes[largest]) {
				largest = r;
				activeLine.set({ start: 28, end: 30 });
			}
			await delay(900 - get(speed) * 8);
			await pauseIfNeeded();
		}

		activeNodes = [];
		if (largest !== i) {
			log(`Csere: ${nodes[i]} ⇄ ${nodes[largest]}`);
			await swap(i, largest);
			await heapify(n, largest);
		}
	}

	selectedAlgorithmSourceCode.set(`
function heapSort() {
  const n = nodes.length;
 
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    heapify(n, i);
  }
 
  for (let i = n - 1; i > 0; i--) {
    swap(0, i);
    heapify(i, 0);
  }
}
 
function swap(i, j) {
  [nodes[i], nodes[j]] = [nodes[j], nodes[i]];
}
 
function heapify(n, i) {
  let largest = i;
  const l = 2 * i + 1;
  const r = 2 * i + 2;
 
  if (l < n && nodes[l] > nodes[largest]) {
    largest = l;
  }
 
  if (r < n && nodes[r] > nodes[largest]) {
    largest = r;
  }
 
  if (largest !== i) {
    swap(i, largest);
    heapify(n, largest);
  }
}
`);
</script>

<div class="custom-buttons button-group">
	<button disabled={$algorithmStatus !== 'idle'} on:click={reshuffleData}>Keverés</button>
</div>

<!-- ==== Vizualizáció ==== -->
<Controls {currentStep} {totalSteps} on:start={startAlgorithm} />
<div class="graph-container">
	<svg class="svg" width="500" height="300" style="border: 1px solid #ccc">
		{#each nodePositions as node, i}
			{#if 2 * node.index + 1 < nodes.length}
				<line
					x1={node.x}
					y1={node.y}
					x2={nodePositions[2 * node.index + 1].x}
					y2={nodePositions[2 * node.index + 1].y}
					stroke="#484848"
					stroke-width="2"
				/>
			{/if}
			{#if 2 * node.index + 2 < nodes.length}
				<line
					x1={node.x}
					y1={node.y}
					x2={nodePositions[2 * node.index + 2].x}
					y2={nodePositions[2 * node.index + 2].y}
					stroke="#484848"
					stroke-width="2"
				/>
			{/if}
		{/each}

		{#each nodePositions as node}
			<circle
				cx={node.x}
				cy={node.y}
				r="20"
				fill={swapNodes.includes(node.index)
					? '#45a049'
					: activeNodes.includes(node.index)
						? '#ffd700'
						: '#2f4f4f'}
				stroke="aliceblue"
				stroke-width="2"
			/>
			<text
				x={node.x}
				y={node.y + 5}
				text-anchor="middle"
				fill={activeNodes.includes(node.index) ? 'black' : 'aliceblue'}
				font-size="14"
			>
				{node.value}
			</text>
		{/each}
	</svg>
</div>

<style>
	.graph-container {
		margin: 1rem;
		display: flex;
		justify-content: center;
		align-items: center;
	}
	.svg {
		border: 1px solid #ccc;
		border-radius: 4px;
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
