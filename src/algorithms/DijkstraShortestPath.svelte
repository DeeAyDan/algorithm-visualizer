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
	let pathEdges = [];

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
		totalSteps.set(dijkstraCounter(0));
	});

	function dijkstraCounter(start: number) {
		let steps = 0;

		let distancesCounter = Array(numVertices).fill(Infinity);
		let visited = Array(numVertices).fill(false);
		let parent = Array(numVertices).fill(null);
		distancesCounter[start] = 0;

		for (let i = 0; i < numVertices; i++) {
			let minDist = Infinity;
			let current = -1;

			for (let j = 0; j < numVertices; j++) {
				if (!visited[j] && distancesCounter[j] < minDist) {
					minDist = distancesCounter[j];
					current = j;
				}
			}

			if (current === -1) break;

			visited[current] = true;
			steps++;

			for (const edge of edges) {
				const { from, to, weight } = edge;
				let neighbor = -1;
				if (from === current) neighbor = to;
				else if (to === current) neighbor = from;
				else continue;

				steps++;

				if (visited[neighbor]) continue;

				const newDist = distancesCounter[current] + weight;
				steps++;

				if (newDist < distancesCounter[neighbor]) {
					distancesCounter[neighbor] = newDist;
					parent[neighbor] = current;

					steps++;
				}
			}
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
						pathEdges = [];
						distances = [];
						randomizeEdgeWeights();
						distances = Array(numVertices).fill(Infinity);
						totalSteps.set(dijkstraCounter(0));
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

		await dijkstra(0);
		activeLine.set(-1);

		consoleLog.update((logs) => [...logs, 'A futás befejeződött!']);
		algorithmStatus.set('finished');
		await restartAlgorithm();
	}

	let distances = Array(numVertices).fill(Infinity);
	let visited = [];

	async function dijkstra(start: number) {
		distances = Array(numVertices).fill(Infinity);
		let visited = Array(numVertices).fill(false);
		let parent = Array(numVertices).fill(null); // <- új
		distances[start] = 0;

		for (let i = 0; i < numVertices; i++) {
			let minDist = Infinity;
			let current = -1;

			for (let j = 0; j < numVertices; j++) {
				if (!visited[j] && distances[j] < minDist) {
					minDist = distances[j];
					current = j;
				}
			}

			if (current === -1) break;
			visited[current] = true;

			activeLine.set(17);
			log(`Aktív csúcs: ${current} (távolság: ${distances[current]})`);
			await delay(900 - get(speed) * 8);
			await pauseIfNeeded();

			for (const edge of edges) {
				const { from, to, weight } = edge;
				let neighbor = -1;
				if (from === current) {
					neighbor = to;
					activeLine.set(30);
				} else if (to === current) {
					neighbor = from;
					activeLine.set(32);
				} else continue;

				log(`Csúcs kiválasztva: ${neighbor}`);
				await delay(900 - get(speed) * 8);
				await pauseIfNeeded();

				if (visited[neighbor]) continue;

				const newDist = distances[current] + weight;
				highlightedEdge = { from: current, to: neighbor };

				activeLine.set(41);
				log(`Távolságok összehasonlítása: ${newDist} < ${distances[neighbor]}`);
				await delay(900 - get(speed) * 8);
				await pauseIfNeeded();

				if (newDist < distances[neighbor]) {
					distances[neighbor] = newDist;
					parent[neighbor] = current;
					pathEdges = [];
					for (let i = 0; i < numVertices; i++) {
						if (parent[i] !== null) {
							pathEdges.push({ from: parent[i], to: i });
						}
					}

					activeLine.set(42);
					log(`Távolság frissítve: ${current} → ${neighbor}, új érték: ${newDist}`);
					await delay(900 - get(speed) * 8);
					await pauseIfNeeded();
				}
				highlightedEdge = null;
			}
		}
	}

	selectedAlgorithmSourceCode.set(`
function dijkstra(start) {
  const distances = Array(numVertices)
                    .fill(Infinity);
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
        current = j;
      }
    }
 \n
    if (current === -1) break;
    visited[current] = true;
 \n
    for (const edge of edges) {
      const { from, to, weight } = edge;
      let neighbor = -1;
      if (from === current) {
        neighbor = to;
      } else if (to === current) {
        neighbor = from;
      } else continue;
	  \n
      if (neighbor === -1 || visited[neighbor]) continue;

      const newDist = distances[current] + weight;
	\n
      if (newDist < distances[neighbor]) {
        distances[neighbor] = newDist;
        }
      }
    }
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
					: pathEdges.some(
								(edge) =>
									(edge.from === from && edge.to === to) || (edge.to === from && edge.from === to)
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
			<text {x} y={y + 35} text-anchor="middle" font-size="10" fill="aliceblue">
				({distances[id] === Infinity ? '∞' : distances[id]})
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
</style>
