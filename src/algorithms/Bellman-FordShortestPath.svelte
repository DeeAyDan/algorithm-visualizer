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

	let nodes = [
		{ id: 0, x: 100, y: 100 },
		{ id: 1, x: 300, y: 100 },
		{ id: 2, x: 500, y: 100 },
		{ id: 3, x: 200, y: 300 },
		{ id: 4, x: 400, y: 300 }
	];

	let edges = [
		{ from: 0, to: 1, weight: 6 },
		{ from: 0, to: 3, weight: 7 },
		{ from: 1, to: 2, weight: 5 },
		{ from: 1, to: 3, weight: 8 },
		{ from: 1, to: 4, weight: -4 },
		{ from: 2, to: 1, weight: -2 },
		{ from: 3, to: 2, weight: -3 },
		{ from: 3, to: 4, weight: 9 },
		{ from: 4, to: 0, weight: 2 },
		{ from: 4, to: 2, weight: 7 }
	];

	let distances = [];
	let source = 0;

	onMount(() => {
		totalSteps.set(0);
		distances = Array(nodes.length).fill(Infinity);
		distances[source] = 0;
	});

	function log(message: string) {
		consoleLog.update((logs) => [...logs, message]);
		currentStep.update((n) => n + 1);
	}
	function delay(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
	function waitUntilResume(): Promise<void> {
		return new Promise((resolve) => {
			const unsub = resumeSignal.subscribe(() => {
				if (get(algorithmStatus) === 'running') {
					unsub();
					resolve();
				}
			});
		});
	}
	function waitUntilRestart(): Promise<void> {
		return new Promise((resolve) => {
			const unsub = resumeSignal.subscribe(() => {
				if (get(algorithmStatus) === 'idle') {
					consoleLog.set([]);
					currentStep.set(0);
					distances = Array(nodes.length).fill(Infinity);
					distances[source] = 0;
					unsub();
					resolve();
				}
			});
		});
	}
	async function pauseIfNeeded() {
		if (get(algorithmStatus) === 'paused') {
			await waitUntilResume();
		}
	}
	async function restartAlgorithm() {
		if (get(algorithmStatus) === 'finished') {
			await waitUntilRestart();
		}
	}

	async function startAlgorithm() {
		consoleLog.set([]);
		currentStep.set(0);
		algorithmStatus.set('running');
		log(`${displayName} indítása...`);

		const V = nodes.length;
		for (let i = 1; i < V; i++) {
			for (const { from, to, weight } of edges) {
				if (distances[from] + weight < distances[to]) {
					distances[to] = distances[from] + weight;
					log(`Frissítés: dist[${to}] = ${distances[to]}`);
					await pauseIfNeeded();
					await delay(get(speed));
				}
			}
		}

		// Negatív kör ellenőrzés (opcionális)
		for (const { from, to, weight } of edges) {
			if (distances[from] + weight < distances[to]) {
				log(`Hiba: negatív súlyú kör található!`);
			}
		}

		log('A futás befejeződött!');
		algorithmStatus.set('finished');
		await restartAlgorithm();
	}

	selectedAlgorithmSourceCode.set(`// Bellman-Ford algoritmus implementáció...`);
</script>

<!-- ==== UI ==== -->
<div class="algorithm-container">
	<Controls {currentStep} {totalSteps} on:start={startAlgorithm} />
	<svg width="600" height="400">
		{#each edges as edge}
			<line
				x1={nodes[edge.from].x}
				y1={nodes[edge.from].y}
				x2={nodes[edge.to].x}
				y2={nodes[edge.to].y}
				stroke="#ccc"
				stroke-width="2" />
			<text
				x={(nodes[edge.from].x + nodes[edge.to].x) / 2}
				y={(nodes[edge.from].y + nodes[edge.to].y) / 2 - 5}
				fill="black"
				font-size="14">
				{edge.weight}
			</text>
		{/each}
		{#each nodes as node, i}
			<circle cx={node.x} cy={node.y} r="20" fill="steelblue" />
			<text x={node.x} y={node.y + 5} text-anchor="middle" fill="white" font-size="16">
				{i} ({distances[i] === Infinity ? '∞' : distances[i]})
			</text>
		{/each}
	</svg>
</div>

<style>
	svg {
		border: 1px solid #ccc;
		margin-top: 1rem;
	}
</style>
