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

	currentStep.set(0);
	algorithmStatus.set('idle');
	consoleLog.set([]);
	const displayName = algorithmDisplayNames[get(selectedAlgorithm)];

	let nodes = [10, 8, 6, 7, 9, 3, 2, 4, 1, 5];
	let arr = [...nodes];
	activeLine.set(-1);

	let nodePositions = [];

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

	onMount(() => {
		calculateNodePositions();
		totalSteps.set(heapSortCounter());
	});

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

	function log(msg: string) {
		consoleLog.update((logs) => [...logs, msg]);
		currentStep.update((n) => n + 1);
	}

	function delay(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
	function waitUntilResume() {
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
		if (get(algorithmStatus) === 'paused') await waitUntilResume();
	}
	async function restartAlgorithm() {
		if (get(algorithmStatus) === 'finished') {
			return new Promise((resolve) => {
				const unsub = resumeSignal.subscribe(() => {
					if (get(algorithmStatus) === 'idle') {
						consoleLog.set([]);
						currentStep.set(0);
						nodes = [10, 8, 6, 7, 9, 3, 2, 4, 1, 5];
						activeNodes = [];
						swapNodes = [];
						shuffle(nodes);
						calculateNodePositions();
						arr = [...nodes];
						totalSteps.set(heapSortCounter());
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
		activeLine.set(-1);

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
			await swap(0, i);
			await heapify(i, 0);
		}
		swapNodes = [];
	}

	async function swap(i: number, j: number) {
		activeNodes = [i, j];
		swapNodes = [];

		activeLine.set(18)
		await delay(900 - get(speed) * 8);
		await pauseIfNeeded();


		activeNodes = [];
		swapNodes = [i, j];

		await delay(900 - get(speed) * 8);
		await pauseIfNeeded();

		[nodes[i], nodes[j]] = [nodes[j], nodes[i]];
		calculateNodePositions();

		await delay(900 - get(speed) * 8);
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
			
		activeLine.set(28);
			await delay(900 - get(speed) * 8);
			await pauseIfNeeded();
			if (nodes[l] > nodes[largest]) {
				largest = l;
			}
		}

		if (r < n) {
			log(`Összehasonlítás: ${nodes[r]} (jobb) és ${nodes[largest]} (jelenlegi legnagyobb)`);
			activeNodes = [r, largest];
			swapNodes = [];

			activeLine.set(33);
			await delay(900 - get(speed) * 8);
			await pauseIfNeeded();
			if (nodes[r] > nodes[largest]) {
				largest = r;
			}
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
 \n
   for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
      heapify(n, i);
   }
 \n
   for (let i = n - 1; i > 0; i--) {
      swap(0, i);
      heapify(i, 0);
   }
}
 \n
function swap(i, j) {
   [nodes[i], nodes[j]] = [nodes[j], nodes[i]];
}
 \n
function heapify(n, i) {
   let largest = i;
   const l = 2 * i + 1;
   const r = 2 * i + 2;
 \n
   if (l < n && nodes[l] > nodes[largest]) {
      largest = l;
   }
 \n 
   if (r < n && nodes[r] > nodes[largest]) {
      largest = r;
   }
 \n
   if (largest !== i) {
      swap(i, largest);
      heapify(n, largest);
   }
}
`);
</script>

<!-- ==== Vizualizáció ==== -->
<Controls {currentStep} {totalSteps} on:start={startAlgorithm} />
<div class="tag">Vászon</div>
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
	.tag {
		display: block;
		width: fit-content;
		top: 0;
		left: 0;
		background-color: #484848;
		color: white;
		padding: 3px;
	}
	.svg {
		border: 1px solid #ccc;
		border-radius: 4px;
	}
</style>
