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


	currentStep.set(0);
	algorithmStatus.set('idle');
	consoleLog.set([]);
	const displayName = algorithmDisplayNames[get(selectedAlgorithm)];
	activeLine.set(-1);

	let highlightedEdge = null;
	let pathEdges = [];

	let nodes = [
		{ id: 0, x: 50, y: 50 },
		{ id: 1, x: 250, y: 100 },
		{ id: 2, x: 450, y: 50 },
		{ id: 3, x: 50, y: 250 },
		{ id: 4, x: 450, y: 250 }
	];

	let edges = [
		{ from: 0, to: 1, weight: 6 },
		{ from: 0, to: 3, weight: 15 },
		{ from: 0, to: 4, weight: 2 },
		{ from: 1, to: 3, weight: 1 },
		{ from: 1, to: 4, weight: 4 },
		{ from: 2, to: 1, weight: 2 },
		{ from: 3, to: 4, weight: 9 },
		{ from: 4, to: 2, weight: 5 }
	];

	function randomizeEdgeWeights() {
		edges = edges.map(({ from, to }) => ({
			from,
			to,
			weight: Math.floor(Math.random() * 20) + 1
		}));
	}

	let distances = [];
	let source = 0;
	distances = Array(nodes.length).fill(Infinity);
	distances[source] = 0;

	onMount(() => {
		totalSteps.set(bellmanFordCounter(source));
		distances = Array(nodes.length).fill(Infinity);
		distances[source] = 0;
	});

	function bellmanFordCounter(start: number) {
		let steps = 0;
		distances = Array(nodes.length).fill(Infinity);
		distances[start] = 0;

		for (let i = 0; i < nodes.length - 1; i++) {
			for (const { from, to, weight } of edges) {
				steps++;
				if (distances[from] + weight < distances[to]) {
					distances[to] = distances[from] + weight;
					steps++;
				}
			}
		}

		for (const { from, to, weight } of edges) {
			let needToBreak = false;

			if (distances[from] + weight < distances[to]) {
				steps++;
				needToBreak = true;
			}
			if (needToBreak) break;
		}

		return steps;
	}
	
	async function restartAlgorithm() {
		if (get(algorithmStatus) === 'finished') {
			return new Promise((resolve) => {
			const unsub = resumeSignal.subscribe(() => {
				if (get(algorithmStatus) === 'idle') {
					consoleLog.set([]);
					currentStep.set(0);
					pathEdges = [];
					randomizeEdgeWeights();
					totalSteps.set(bellmanFordCounter(source));
					distances = Array(nodes.length).fill(Infinity);
					distances[source] = 0;
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
		algorithmStatus.set('running');
		consoleLog.update((logs) => [...logs, `${displayName} indítása...`]);

		await bellmanFord(source);
		activeLine.set(-1);

		consoleLog.update((logs) => [...logs, 'A futás befejeződött!']);
		algorithmStatus.set('finished');
		await restartAlgorithm();
	}

	async function bellmanFord(start: number) {
		distances = Array(nodes.length).fill(Infinity);
		const predecessor = Array(nodes.length).fill(null);
		distances[start] = 0;

		for (let i = 0; i < nodes.length - 1; i++) {
			for (const { from, to, weight } of edges) {

				activeLine.set(9);
				highlightedEdge = { from, to };
				log(`Ellenőrzés: ${from} → ${to}, távolság: ${distances[from] + weight} < ${distances[to]}`);
				await delay(900 - get(speed) * 8);
				await pauseIfNeeded();


				if (distances[from] + weight < distances[to]) {
					distances[to] = distances[from] + weight;
					pathEdges.push(highlightedEdge);
					predecessor[to] = from;
					activeLine.set(10);
					log(`Távolság frissítése: ${from} → ${to}, új távolság: ${distances[to]}`);
					await delay(900 - get(speed) * 8);
					await pauseIfNeeded();
				}
			}
			pathEdges = [];
	for (let i = 0; i < predecessor.length; i++) {
		if (predecessor[i] !== null) {
			pathEdges.push({ from: predecessor[i], to: i });
		}
	}
		}



		for (const { from, to, weight } of edges) {
			let needToBreak = false;
			if (distances[from] + weight < distances[to]) {
				highlightedEdge = { from, to };
				activeLine.set(19);

				log(`Negatív ciklus: ${from} → ${to}, új távolság: ${distances[to]}`);
				await delay(900 - get(speed) * 8);
				await pauseIfNeeded();
				needToBreak = true;
			}
			if (needToBreak) break;
		}

		highlightedEdge = null;
	}

	selectedAlgorithmSourceCode.set(`
async function bellmanFord(start) {
  distances = Array(nodes.length)
             .fill(Infinity);
    distances[start] = 0;
 \n
  for (let i = 0; i < nodes.length - 1; i++) {
    for (const { from, to, weight } of edges) {
      if (distances[from] + weight < distances[to]) {
        distances[to] = distances[from] + weight;
      }
    }
  }
 \n
  for (const { from, to, weight } of edges) {
    let needToBreak = false;
    if (distances[from] + weight < distances[to]) {
      needToBreak = true;
    }
    if (needToBreak) break;
  }
  highlightedEdge = null;
}`);
</script>

<!-- ==== UI ==== -->
<Controls {currentStep} {totalSteps} on:start={startAlgorithm} />

<div class="graph-container">
	<svg class="svg" width="500" height="300">
		{#each edges as edge}
			<defs>
				<marker
					id={nodes[edge.from].id + '' + nodes[edge.to].id}
					viewBox="0 0 10 10"
					refX="8"
					refY="5"
					markerWidth="6"
					markerHeight="6"
					orient="auto"
				>
					<path
						d="M 0 0 L 10 5 L 0 10 z"
						fill={highlightedEdge &&
						highlightedEdge.from === edge.from &&
						highlightedEdge.to === edge.to
							? '#ffd700'
							: pathEdges.some((e) => e.from === edge.from && e.to === edge.to)
								? '#45a049'
								: '#484848'}
					/>
				</marker>
			</defs>

			<line
				x1={nodes[edge.from].x}
				y1={nodes[edge.from].y}
				x2={nodes[edge.to].x -
					((nodes[edge.to].x - nodes[edge.from].x) * 20) /
						Math.hypot(
							nodes[edge.to].x - nodes[edge.from].x,
							nodes[edge.to].y - nodes[edge.from].y
						)}
				y2={nodes[edge.to].y -
					((nodes[edge.to].y - nodes[edge.from].y) * 20) /
						Math.hypot(
							nodes[edge.to].x - nodes[edge.from].x,
							nodes[edge.to].y - nodes[edge.from].y
						)}
				stroke={highlightedEdge &&
				highlightedEdge.from === edge.from &&
				highlightedEdge.to === edge.to
					? '#ffd700'
					: pathEdges.some((e) => e.from === edge.from && e.to === edge.to)
						? '#45a049'
						: '#484848'}
				stroke-width="2"
				marker-end="url(#{nodes[edge.from].id + '' + nodes[edge.to].id})"
			/>

			<text
				x={(nodes[edge.from].x + nodes[edge.to].x) / 2}
				y={(nodes[edge.from].y + nodes[edge.to].y) / 2}
				text-anchor="end"
				fill="aliceblue"
				font-size="12"
			>
				{edge.weight}
			</text>
		{/each}

		<!-- Csúcsok -->
		{#each nodes as { id, x, y }}
			<circle cx={x} cy={y} r="20" fill="#2f4f4f" stroke="aliceblue" stroke-width="2" />
			<text {x} y={y + 5} text-anchor="middle" fill="aliceblue" font-size="12">
				{id}
			</text>
			<text {x} y={y + 35} text-anchor="middle" fill="aliceblue" font-size="12">
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
