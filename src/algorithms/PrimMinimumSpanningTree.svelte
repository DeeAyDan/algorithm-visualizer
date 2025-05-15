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

	// ==== Alapadatok ====
	let edges = [
		{ from: 0, to: 1, weight: 2 },
		{ from: 1, to: 2, weight: 2 },
		{ from: 1, to: 3, weight: 5 },
		{ from: 2, to: 3, weight: 5 },
		{ from: 2, to: 4, weight: 11 },
		{ from: 3, to: 4, weight: 2 }
	];

	const nodes = [
		{ id: 0, x: 450, y: 50 },
		{ id: 1, x: 50, y: 50 },
		{ id: 2, x: 250, y: 150 },
		{ id: 3, x: 50, y: 250 },
		{ id: 4, x: 450, y: 250 }
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
		resetParameters();
	});

	function resetParameters() {
		algorithmStatus.set('idle');
		currentStep.set(0);
		consoleLog.set([]);
		activeLine.set({ start: -1, end: -1 });

		mstEdges = [];
		randomizeEdgeWeights();
	}

	// ==== Késleltetés és vezérlés ====
	async function restartAlgorithm() {
		if (get(algorithmStatus) === 'finished') {
			await new Promise((resolve) => {
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

	async function startAlgorithm() {
		consoleLog.set([]);
		currentStep.set(0);
		mstEdges = [];
		consoleLog.update((logs) => [...logs, `${displayName} indítása...`]);

		await prim(0);
		activeLine.set({ start: -1, end: -1 });


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

				log(`Él vizsgálata: (${from}, ${to}) súly: ${weight}`);
					activeLine.set({ start: 10, end: 10 });
					await delay(900 - get(speed) * 8);
					await pauseIfNeeded();

				if ((visited[from] && !visited[to]) || (visited[to] && !visited[from])) {
					highlightedEdge = { from, to };
					

					result.push(edgeQueue[i]);
					mstEdges = [...result];
					log(`Hozzáadás az feszítőfához: (${from}, ${to})`);
					activeLine.set({ start: 12, end: 17 });

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

			if (!found) break;
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

      if ((visited[from] && !visited[to]) || (visited[to] && !visited[from])) {
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

<div class="graph-container">
	<svg class="svg" width="500" height="300">
		<!-- Élek -->
		{#each edges as { from, to, weight }}
			<line
				x1={nodes[from].x}
				y1={nodes[from].y}
				x2={nodes[to].x}
				y2={nodes[to].y}
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
				x={(nodes[from].x + nodes[to].x) / 2}
				y={(nodes[from].y + nodes[to].y) / 2 - 5}
				text-anchor="middle"
				font-size="12"
				fill="aliceblue">{weight}</text
			>
		{/each}
		<!-- Csúcsok -->
		{#each nodes as { id, x, y }}
			<circle cx={x} cy={y} r="20" fill="#2f4f4f" stroke="aliceblue" stroke-width="2" />
			<text {x} y={y + 5} text-anchor="middle" fill="aliceblue" font-size="12">{id}</text>
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
</style>
