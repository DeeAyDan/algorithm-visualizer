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
		{ id: 2, x: 200, y: 200 },
		{ id: 3, x: 100, y: 300 },
		{ id: 4, x: 300, y: 300 }
	];

	let edges = [
		{ from: 0, to: 1, weight: 2 },
		{ from: 0, to: 2, weight: 4 },
		{ from: 1, to: 2, weight: 1 },
		{ from: 1, to: 4, weight: 7 },
		{ from: 2, to: 3, weight: 3 },
		{ from: 3, to: 4, weight: 1 },
		{ from: 2, to: 4, weight: 2 }
	];

	let mstEdges: number[][] = [];

	onMount(() => {
		totalSteps.set(0);
	});

	function log(msg: string) {
		consoleLog.update(logs => [...logs, msg]);
		currentStep.update(n => n + 1);
	}

	function delay(ms: number) {
		return new Promise(res => setTimeout(res, ms));
	}

	async function pauseIfNeeded() {
		if (get(algorithmStatus) === 'paused') {
			await new Promise<void>((resolve) => {
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
			await new Promise<void>((resolve) => {
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

	async function startAlgorithm() {
		consoleLog.set([]);
		currentStep.set(0);
		mstEdges = [];

		log(`${displayName} indítása...`);
		algorithmStatus.set('running');

		let visited = new Set();
		let edgeQueue = [];
		visited.add(0);
		edges.forEach(e => {
			if (e.from === 0 || e.to === 0)
				edgeQueue.push({ ...e, from: e.from, to: e.to });
		});

		while (visited.size < nodes.length) {
			await pauseIfNeeded();
			await delay(get(speed));

			edgeQueue = edgeQueue.filter(e => !(visited.has(e.from) && visited.has(e.to)));
			edgeQueue.sort((a, b) => a.weight - b.weight);

			const edge = edgeQueue.shift();
			if (!edge) break;

			const u = edge.from;
			const v = edge.to;

			if (visited.has(u) && visited.has(v)) continue;

			const newNode = visited.has(u) ? v : u;
			visited.add(newNode);
			mstEdges.push([u, v]);
			log(`Él hozzáadva: ${u} - ${v} (${edge.weight})`);

			for (let e of edges) {
				if ((e.from === newNode && !visited.has(e.to)) || (e.to === newNode && !visited.has(e.from))) {
					edgeQueue.push(e);
				}
			}
		}

		log('A futás befejeződött!');
		algorithmStatus.set('finished');
		await restartAlgorithm();
	}

	selectedAlgorithmSourceCode.set(`Prim's Algorithm (greedy MST)`);

</script>

<div class="algorithm-container">
	<Controls {currentStep} {totalSteps} on:start={startAlgorithm} />
	<svg width="400" height="400" style="background: #f0f0f0; border: 1px solid #ccc;">
		{#each edges as edge}
			<line
				x1={nodes[edge.from].x}
				y1={nodes[edge.from].y}
				x2={nodes[edge.to].x}
				y2={nodes[edge.to].y}
				stroke={mstEdges.some(([f, t]) => (f === edge.from && t === edge.to) || (f === edge.to && t === edge.from)) ? 'green' : 'gray'}
				stroke-width="3"
			/>
			<text
				x={(nodes[edge.from].x + nodes[edge.to].x) / 2}
				y={(nodes[edge.from].y + nodes[edge.to].y) / 2 - 5}
				font-size="12"
				fill="black"
			>
				{edge.weight}
			</text>
		{/each}

		{#each nodes as node}
			<circle cx={node.x} cy={node.y} r="15" fill="#5c5cff" />
			<text x={node.x} y={node.y + 4} text-anchor="middle" fill="white">{node.id}</text>
		{/each}
	</svg>
</div>

<style>
	.algorithm-container {
		margin-top: 1rem;
	}
</style>
