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

	const displayName = algorithmDisplayNames[get(selectedAlgorithm)];
	currentStep.set(0);
	algorithmStatus.set('idle');
	consoleLog.set([]);

	// ==== Gráf definiálása (fix gráf) ====
	const nodes = [
		{ id: 0, x: 100, y: 100 },
		{ id: 1, x: 300, y: 100 },
		{ id: 2, x: 200, y: 200 },
		{ id: 3, x: 100, y: 300 },
		{ id: 4, x: 300, y: 300 }
	];

	const edges = [
		{ from: 0, to: 1, weight: 4 },
		{ from: 0, to: 2, weight: 2 },
		{ from: 1, to: 2, weight: 5 },
		{ from: 1, to: 4, weight: 1 },
		{ from: 2, to: 3, weight: 8 },
		{ from: 2, to: 4, weight: 10 },
		{ from: 3, to: 4, weight: 2 }
	];

	let distances = Array(nodes.length).fill(Infinity);
	let visited = new Set();

	// ==== Megjelenítési segédfüggvények ====
	function getNodeColor(id) {
		return visited.has(id) ? '#3f3' : '#eee';
	}
	function getEdgeColor(from, to) {
		return visited.has(from) && visited.has(to) ? '#3f3' : '#aaa';
	}

	// ==== Vezérlőfüggvények ====
	function log(msg: string) {
		consoleLog.update((logs) => [...logs, msg]);
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
						distances.fill(Infinity);
						visited.clear();
						unsub();
						resolve();
					}
				});
			});
		}
	}

	// ==== Algoritmus futtatása ====
	async function startAlgorithm() {
		consoleLog.set([]);
		currentStep.set(0);
		distances.fill(Infinity);
		visited.clear();

		const start = 0;
		distances[start] = 0;

		let unvisited = new Set(nodes.map(n => n.id));

		while (unvisited.size > 0) {
			await pauseIfNeeded();

			let current = Array.from(unvisited).reduce((minNode, nodeId) => {
				return distances[nodeId] < distances[minNode] ? nodeId : minNode;
			}, Array.from(unvisited)[0]);

			unvisited.delete(current);
			visited.add(current);
			log(`Aktuális csúcs: ${current}`);

			for (const edge of edges) {
				if (edge.from === current && unvisited.has(edge.to)) {
					const alt = distances[current] + edge.weight;
					if (alt < distances[edge.to]) {
						log(`Távolság frissítése: ${edge.to}, új érték: ${alt}`);
						distances[edge.to] = alt;
					}
				}
				if (edge.to === current && unvisited.has(edge.from)) {
					const alt = distances[current] + edge.weight;
					if (alt < distances[edge.from]) {
						log(`Távolság frissítése: ${edge.from}, új érték: ${alt}`);
						distances[edge.from] = alt;
					}
				}
			}
			await delay(get(speed));
		}

		log('Algoritmus lefutott.');
		algorithmStatus.set('finished');
		await restartAlgorithm();
	}

	onMount(() => totalSteps.set(0));
	selectedAlgorithmSourceCode.set(`// Dijkstra algoritmus implementációja...`);
</script>

<!-- ==== UI ==== -->
<Controls {currentStep} {totalSteps} on:start={startAlgorithm} />

<svg width="400" height="400" style="border: 1px solid #ccc;">
	<!-- Élek -->
	{#each edges as { from, to, weight }}
		<line
			x1={nodes[from].x}
			y1={nodes[from].y}
			x2={nodes[to].x}
			y2={nodes[to].y}
			stroke={getEdgeColor(from, to)}
			stroke-width="2"
		/>
		<text
			x={(nodes[from].x + nodes[to].x) / 2}
			y={(nodes[from].y + nodes[to].y) / 2 - 5}
			font-size="12"
			text-anchor="middle"
			fill="black"
		>
			{weight}
		</text>
	{/each}

	<!-- Csúcsok -->
	{#each nodes as { id, x, y }}
		<circle cx={x} cy={y} r="20" fill={getNodeColor(id)} stroke="black" />
		<text x={x} y={y + 5} text-anchor="middle" font-size="14" fill="black">{id}</text>
	{/each}
</svg>

<style>
	svg {
		display: block;
		margin: 1rem auto;
	}
</style>
