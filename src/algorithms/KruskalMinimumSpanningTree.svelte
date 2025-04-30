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

	currentStep.set(0);
	algorithmStatus.set('idle');
	consoleLog.set([]);
	const displayName = algorithmDisplayNames[get(selectedAlgorithm)];

	let edges = [
		{ from: 0, to: 1, weight: 4 },
		{ from: 0, to: 2, weight: 4 },
		{ from: 1, to: 2, weight: 2 },
		{ from: 1, to: 3, weight: 5 },
		{ from: 2, to: 3, weight: 5 },
		{ from: 2, to: 4, weight: 11 },
		{ from: 3, to: 4, weight: 2 }
	];

	let numVertices = 5;
	let mstEdges = [];

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
						unsub();
						resolve();
					}
				});
			});
		}
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

	async function kruskal() {
		edges.sort((a, b) => a.weight - b.weight);
		let parent = Array(numVertices).fill(0).map((_, i) => i);
		let rank = Array(numVertices).fill(0);
		let result = [];

		for (let i = 0; i < edges.length; i++) {
			let { from, to, weight } = edges[i];
			let x = find(parent, from);
			let y = find(parent, to);

			log(`Él vizsgálata: (${from}, ${to}) súly: ${weight}`);
			await delay(get(speed));
			await pauseIfNeeded();

			if (x !== y) {
				log(`Hozzáadás az MST-hez: (${from}, ${to})`);
				result.push(edges[i]);
				union(parent, rank, x, y);
			} else {
				log(`Ciklust alkotna, kihagyva: (${from}, ${to})`);
			}

			await delay(get(speed));
			await pauseIfNeeded();
		}

		mstEdges = result;
	}

	async function startAlgorithm() {
		consoleLog.set([]);
		currentStep.set(0);
		mstEdges = [];
		consoleLog.update((logs) => [...logs, `${displayName} indítása...`]);
		await kruskal();
		consoleLog.update((logs) => [...logs, 'A futás befejeződött!']);
		algorithmStatus.set('finished');
		await restartAlgorithm();
	}

	onMount(() => {
		totalSteps.set(edges.length * 2); // durva becslés
	});

	selectedAlgorithmSourceCode.set(`Kruskal algoritmus`);
</script>

<Controls {currentStep} {totalSteps} on:start={startAlgorithm} />

<div class="graph-container">
	<svg width="500" height="300">
		<!-- Csúcsok -->
		{#each Array(numVertices) as _, i}
			<circle
				cx={100 + 80 * i}
				cy={100 + (i % 2) * 50}
				r="15"
				fill="lightblue"
				stroke="black" />
			<text
				x={100 + 80 * i}
				y={105 + (i % 2) * 50}
				text-anchor="middle"
				fill="black"
				font-size="12">{i}</text>
		{/each}

		<!-- Élek -->
		{#each edges as { from, to, weight }}
			<line
				x1={100 + 80 * from}
				y1={100 + (from % 2) * 50}
				x2={100 + 80 * to}
				y2={100 + (to % 2) * 50}
				stroke={mstEdges.find(e => e.from === from && e.to === to || e.from === to && e.to === from) ? 'green' : '#999'}
				stroke-width="2" />
			<text
				x={(100 + 80 * from + 100 + 80 * to) / 2}
				y={(100 + (from % 2) * 50 + 100 + (to % 2) * 50) / 2 - 5}
				text-anchor="middle"
				font-size="12"
				fill="black">{weight}</text>
		{/each}
	</svg>
</div>

<style>
	.graph-container {
		margin-top: 2rem;
		display: flex;
		justify-content: center;
	}
</style>
