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

	function randomizeEdgeWeights() {
		edges = edges.map(({ from, to }) => ({
			from,
			to,
			weight: Math.floor(Math.random() * 20) + 1 // 1–20 közötti súly
		}));
	}

	let highlightedEdge = null;

	// ==== Előkalkulált lépésszám ====

	onMount(() => {
		totalSteps.set(edges.length * 2);
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

		await kruskal();
		activeLine.set(-1);


		consoleLog.update((logs) => [...logs, 'A futás befejeződött!']);
		algorithmStatus.set('finished');
		await restartAlgorithm();
	}

	async function kruskal() {
		edges.sort((a, b) => a.weight - b.weight);
		let parent = Array(numVertices)
			.fill(0)
			.map((_, i) => i);
		let rank = Array(numVertices).fill(0);
		let result = [];

		for (let i = 0; i < edges.length; i++) {
			let { from, to, weight } = edges[i];
			let x = find(parent, from);
			let y = find(parent, to);

			log(`Él vizsgálata: (${from}, ${to}) súly: ${weight}`);
			activeLine.set(9);
			highlightedEdge = { from, to };
			await delay(900 - get(speed) * 8);
			await pauseIfNeeded();

			if (x !== y) {
				log(`Hozzáadás az feszítőfához: (${from}, ${to})`);
				activeLine.set(15);
				result.push(edges[i]);
				mstEdges = [...result];
				union(parent, rank, x, y);
			} else {
				log(`Ciklust alkotna, kihagyva: (${from}, ${to})`);
				activeLine.set(-1);
			}

			highlightedEdge = null;

			await delay(900 - get(speed) * 8);
			await pauseIfNeeded();
		}
		mstEdges = result;
	}

	function find(parent, i) {
		if (parent[i] === i) return i;
		return find(parent, parent[i]);
	}

	function union(parent, rank, x, y) {
		let xroot = find(parent, x);
		let yroot = find(parent, y);
		if (rank[xroot] < rank[yroot]) {
			parent[xroot] = yroot;
		} else if (rank[xroot] > rank[yroot]) {
			parent[yroot] = xroot;
		} else {
			parent[yroot] = xroot;
			rank[xroot]++;
		}
	}

	selectedAlgorithmSourceCode.set(
`function kruskal() {
  edges.sort((a, b) => a.weight - b.weight);
  let parent = Array(numVertices)
               .fill(0).map((_, i) => i);
  let rank = Array(numVertices).fill(0);
  let result = [];
 \n
  for (let i = 0; i < edges.length; i++) {
    let { from, to, weight } = edges[i];
    let x = find(parent, from);
    let y = find(parent, to);
 \n
    if (x !== y) {
      result.push(edges[i]);
      union(parent, rank, x, y);
    }
  }
  mstEdges = result;
}
 \n
function find(parent, i) {
  if (parent[i] === i) return i;
  return find(parent, parent[i]);
}
 \n
function union(parent, rank, x, y) {
  let xroot = find(parent, x);
  let yroot = find(parent, y);
  if (rank[xroot] < rank[yroot]) {
    parent[xroot] = yroot;
  } else if (rank[xroot] > rank[yroot]) {
    parent[yroot] = xroot;
  } else {
    parent[yroot] = xroot;
    rank[xroot]++;
  }
}`);
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
			<circle cx={x} cy={y} r="20" fill="#2f4f4f" stroke="aliceblue" stroke-width="2"/>
			<text x={x} y={y + 5} text-anchor="middle" fill="aliceblue" font-size="12"
				>{id}</text
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
