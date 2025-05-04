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
		totalSteps.set(5);
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
						distances = []
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
		consoleLog.update((logs) => [...logs, `${displayName} indítása...`]);

		console.log(await dijkstra(0));
		
		activeLine.set(-1);

		consoleLog.update((logs) => [...logs, 'A futás befejeződött!']);
		algorithmStatus.set('finished');
		await restartAlgorithm();
	}

	let distances = Array(numVertices).fill(Infinity);
	let visited = [];

	async function dijkstra(start: number) {
		distances = Array(numVertices).fill(Infinity);
		visited = new Set();
		distances[start] = 0;

		while (nodes.length) {


			edges.sort((a, b) => a.weight - b.weight);
			let closestEdge = edges.shift();

			if (distances[closestEdge] === Infinity) break;

			visited.add(closestEdge.from);
			
			for (let neighbor in edges[closestEdge]) {


				if (!visited.has(neighbor)) {
                let newDistance = distances[closestEdge] + edges[closestEdge][neighbor];
                
                if (newDistance < distances[neighbor]) {
                    distances[neighbor] = newDistance;
                }
            }

				// if (distances[current] + weight < distances[neighbor]) {
				// 	distances[neighbor] = distances[current] + weight;
				// 	highlightedEdge = { from: current, to: neighbor };
				// 	log(`Távolság frissítése: ${current} → ${neighbor}, új távolság: ${distances[neighbor]}`);
				// 	await delay(900 - get(speed) * 8);
				// 	await pauseIfNeeded();
				// }
			}
		}

		highlightedEdge = null;
		return distances;
	}


	selectedAlgorithmSourceCode.set(`
function dijkstra(start: number) {
   const distances = Array(numVertices)
                     .fill(Infinity);
   const previous = Array(numVertices)
                     .fill(null);
   const visited = Array(numVertices)
                     .fill(false);
   distances[start] = 0;
 \n
   while (true) {
      let minDist = Infinity;
      let current = -1;
 \n
   for (let i = 0; i < numVertices; i++) {
      if (!visited[i] && distances[i] < minDist) {
         minDist = distances[i];
         current = i;
      }
   }
 \n
   if (current === -1) break;
   visited[current] = true;
 \n
   for (const edge of edges) {
      const { from, to, weight } = edge;
      const neighbor = from === current ? to : to === current ? from : -1;
      if (neighbor === -1 || visited[neighbor]) continue;

      const newDist = distances[current] + weight;
      if (newDist < distances[neighbor]) {
         distances[neighbor] = newDist;
         previous[neighbor] = current;
         highlightedEdge = { from: current, to: neighbor };
         }
      }
   }
}
`);
</script>

<Controls {currentStep} {totalSteps} on:start={startAlgorithm} />
<div class="tag">Vászon</div>

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
			<circle cx={x} cy={y} r="20" fill="#2f4f4f" stroke="#2f2f2f" />
			<text {x} y={y + 5} text-anchor="middle" fill="black" font-size="12">{id}</text>
			<text {x} y={y + 22} text-anchor="middle" font-size="10" fill="white">
				{#if distances[id] !== Infinity}
					{distances[id]}
				{/if}
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
