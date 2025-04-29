<script lang="ts">
	// @ts-nocheck
	import { onMount } from 'svelte';
	import {
		selectedAlgorithmSourceCode,
		currentStep,
		totalSteps,
		consoleLog,
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

	let nodes = [16, 14, 10, 8, 7, 9, 3, 2, 4, 1];

	let nodePositions = [];

	function calculateNodePositions() {
		nodePositions = [];
		const spacingX = 1000;
		const spacingY = 100;

		for (let i = 0; i < nodes.length; i++) {
			const level = Math.floor(Math.log2(i + 1));
			const maxNodesAtLevel = 2 ** level;
			const posInLevel = i - (2 ** level - 1);
			const x = spacingX / (maxNodesAtLevel + 1) * (posInLevel + 1);
			const y = level * spacingY;
			nodePositions.push({ x, y, value: nodes[i], index: i });
		}
	}

	function log(msg: string) {
		consoleLog.update((logs) => [...logs, msg]);
		currentStep.update((n) => n + 1);
	}

	function delay(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
	function waitUntilResume() {
		return new Promise((resolve) => {
			const unsub = resumeSignal.subscribe(() => {
				if (get(algorithmStatus) === 'running') {
					unsub();
					resolve();
				}
			});
		});
	}
	async function pauseIfNeeded() {
		if (get(algorithmStatus) === 'paused') await waitUntilResume();
	}
	async function restartAlgorithm() {
		if (get(algorithmStatus) === 'finished') {
			return new Promise((resolve) => {
				const unsub = resumeSignal.subscribe(() => {
					if (get(algorithmStatus) === 'idle') {
						consoleLog.set([]);
						currentStep.set(0);
						nodes = [16, 14, 10, 8, 7, 9, 3, 2, 4, 1];
						calculateNodePositions();
						unsub();
						resolve();
					}
				});
			});
		}
	}

	function swap(i, j) {
		[nodes[i], nodes[j]] = [nodes[j], nodes[i]];
		calculateNodePositions();
	}

	async function heapify(n, i) {
		let largest = i;
		const l = 2 * i + 1;
		const r = 2 * i + 2;

		if (l < n && nodes[l] > nodes[largest]) largest = l;
		if (r < n && nodes[r] > nodes[largest]) largest = r;

		if (largest !== i) {
			log(`Csere: ${nodes[i]} ⇄ ${nodes[largest]}`);
			swap(i, largest);
			await delay(500);
			await pauseIfNeeded();
			await heapify(n, largest);
		}
	}

	async function heapSort() {
		const n = nodes.length;
		for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
			await heapify(n, i);
			await pauseIfNeeded();
		}

		for (let i = n - 1; i > 0; i--) {
			log(`Gyökér és utolsó csere: ${nodes[0]} ⇄ ${nodes[i]}`);
			swap(0, i);
			await delay(500);
			await pauseIfNeeded();
			await heapify(i, 0);
		}
	}

	onMount(() => {
		calculateNodePositions();
		totalSteps.set(0); // opcionálisan kiszámolható
	});

	async function startAlgorithm() {
		consoleLog.set([]);
		currentStep.set(0);
		algorithmStatus.set('running');
		log(`${displayName} indítása...`);

		await heapSort();

		log('A futás befejeződött!');
		algorithmStatus.set('finished');
		await restartAlgorithm();
	}

	selectedAlgorithmSourceCode.set(`Heap Sort - Tree`);
</script>

<!-- ==== Vizualizáció ==== -->
<div class="algorithm-container">
	<Controls {currentStep} {totalSteps} on:start={startAlgorithm} />
	<svg width="1000" height="500" style="border: 1px solid #ccc">
		{#each nodePositions as node, i}
			{#if 2 * node.index + 1 < nodes.length}
				<line
					x1={node.x}
					y1={node.y}
					x2={nodePositions[2 * node.index + 1].x}
					y2={nodePositions[2 * node.index + 1].y}
					stroke="#888"
				/>
			{/if}
			{#if 2 * node.index + 2 < nodes.length}
				<line
					x1={node.x}
					y1={node.y}
					x2={nodePositions[2 * node.index + 2].x}
					y2={nodePositions[2 * node.index + 2].y}
					stroke="#888"
				/>
			{/if}
		{/each}

		{#each nodePositions as node}
			<circle cx={node.x} cy={node.y} r="20" fill="#48a9f8" />
			<text x={node.x} y={node.y + 5} text-anchor="middle" fill="white" font-size="14">
				{node.value}
			</text>
		{/each}
	</svg>
</div>

<style>
	svg {
		margin-top: 1rem;
	}
</style>
