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

	// ==== Alapadatok ====

	currentStep.set(0);
	algorithmStatus.set('idle');
	consoleLog.set([]);
	activeLine.set(-1);
	const displayName = algorithmDisplayNames[get(selectedAlgorithm)];

	let edges = [
		{ from: 0, to: 1, weight: 2 },
		{ from: 1, to: 2, weight: 2 },
		{ from: 1, to: 3, weight: 5 },
		{ from: 2, to: 3, weight: 5 },
		{ from: 2, to: 4, weight: 11 },
		{ from: 3, to: 4, weight: 2 }
	];

	let numVertices = 5;
	let mstEdges = [];

	let highlightedEdge = null;

	function randomizeEdgeWeights() {
		edges = edges.map(({ from, to }) => ({
			from,
			to,
			weight: Math.floor(Math.random() * 20) + 1 // 1–20 közötti súly
		}));
	}

	// ==== Előkalkulált lépésszám ====

	onMount(() => {
		totalSteps.set((numVertices - 1) * 2);
	});

	// ==== Késleltetés és vezérlés ====

	function log(message: string) {
		consoleLog.update((logs) => [...logs, message]);
		currentStep.update((n) => n + 1);
	}
	function delay(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
	async function pauseIfNeeded() {
		if (get(algorithmStatus) === 'paused') {
			await new Promise((resolve) => {
				const unsub = resumeSignal.subscribe(() => {
					if (get(algorithmStatus) === 'running') {
						unsub();
						resolve();
					}
				});
			});
		}
	}
	async function restartAlgorithm() {
		if (get(algorithmStatus) === 'finished') {
			await new Promise((resolve) => {
				const unsub = resumeSignal.subscribe(() => {
					if (get(algorithmStatus) === 'idle') {
						consoleLog.set([]);
						currentStep.set(0);
						mstEdges = [];
						randomizeEdgeWeights();
						unsub();
						resolve();
					}
				});
			});
		}
	}

	async function startAlgorithm() {
		consoleLog.set([]);
		currentStep.set(0);
		mstEdges = [];
		consoleLog.update((logs) => [...logs, `${displayName} indítása...`]);

		await prim(0); // indulás az első csúcsból
		activeLine.set(-1);

		consoleLog.update((logs) => [...logs, 'A futás befejeződött!']);
		algorithmStatus.set('finished');
		await restartAlgorithm();
	}

	async function prim(start: number) {
		let visited = Array(numVertices).fill(false);
		let edgeQueue = [...edges].sort((a, b) => a.weight - b.weight);
		let result = [];

		visited[start] = true;

		while (result.length < numVertices - 1) {
			let found = false;

			for (let i = 0; i < edgeQueue.length; i++) {
				const { from, to, weight } = edgeQueue[i];

				if ((visited[from] && !visited[to]) || (visited[to] && !visited[from])) {
					highlightedEdge = { from, to };
					log(`Él vizsgálata: (${from}, ${to}) súly: ${weight}`);
					activeLine.set(11);
					await delay(900 - get(speed) * 8);
					await pauseIfNeeded();

					result.push(edgeQueue[i]);
					mstEdges = [...result];
					log(`Hozzáadás az feszítőfához: (${from}, ${to})`);
					activeLine.set(15);

					visited[from] = true;
					visited[to] = true;
					edgeQueue.splice(i, 1);
					found = true;
					break;
				}
			}

			highlightedEdge = null;
			await delay(900 - get(speed) * 8);
			await pauseIfNeeded();

			if (!found) break; // Nem található új él, izolált komponens
		}

		mstEdges = result;
	}

	selectedAlgorithmSourceCode.set(`
function prim(start) {
   let visited = Array(numVertices).fill(false);
   let result = [];

   visited[start] = true;

   while (result.length < numVertices - 1) {
      for (let edge of edges) {
         let {from, to, weight} = edge;
         if ((visited[from] && !visited[to]) || 
             (visited[to] && !visited[from])) {
            result.push(edge);
            visited[from] = true;
            visited[to] = true;
            break;
         }
      }
   }
   mstEdges = result;
}`);
</script>

<Controls {currentStep} {totalSteps} on:start={startAlgorithm} />
<div class="tag">Vászon</div>

<div class="graph-container">
	<svg class="svg" width="500" height="300">
		<!-- Élek -->
		{#each edges as { from, to, weight }}
			<line
				x1={100 + 80 * from}
				y1={100 + (from % 2) * 50}
				x2={100 + 80 * to}
				y2={100 + (to % 2) * 50}
				stroke={highlightedEdge &&
				((highlightedEdge.from === from && highlightedEdge.to === to) ||
					(highlightedEdge.to === from && highlightedEdge.from === to))
					? '#ffd700'
					: mstEdges.find(
								(e) => (e.from === from && e.to === to) || (e.from === to && e.to === from)
						  )
						? '#45a049'
						: '#484848'}
				stroke-width="2"
			/>
			<text
				x={(100 + 80 * from + 100 + 80 * to) / 2}
				y={(100 + (from % 2) * 50 + 100 + (to % 2) * 50) / 2 - 5}
				text-anchor="middle"
				font-size="12"
				fill="aliceblue">{weight}</text
			>
		{/each}
		<!-- Csúcsok -->
		{#each Array(numVertices) as _, i}
			<circle cx={100 + 80 * i} cy={100 + (i % 2) * 50} r="20" fill="#2f4f4f" stroke="#2f2f2f" />
			<text x={100 + 80 * i} y={105 + (i % 2) * 50} text-anchor="middle" fill="black" font-size="12"
				>{i}</text
			>
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
