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

	let points = [
		{ x: 100, y: 100 },
		{ x: 200, y: 50 },
		{ x: 300, y: 150 },
		{ x: 250, y: 250 },
		{ x: 150, y: 300 },
		{ x: 80, y: 200 },
		{ x: 180, y: 200 },
		{ x: 220, y: 120 }
	];

	let hullPoints = [];
	let highlightedEdge = null;

	onMount(() => {
		totalSteps.set(0);
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
					hullPoints = [];
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

	function cross(a, b, c) {
		return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
	}

	async function startAlgorithm() {
		consoleLog.set([]);
		currentStep.set(0);
		hullPoints = [];
		consoleLog.update((logs) => [...logs, `${displayName} indítása...`]);

		// 1. Legalacsonyabb pont
		let start = points.reduce((lowest, p) =>
			p.y < lowest.y || (p.y === lowest.y && p.x < lowest.x) ? p : lowest
		);

		log(`Kezdőpont: (${start.x}, ${start.y})`);
		await delay(800 - get(speed) * 8);
		await pauseIfNeeded();

		// 2. Szög szerinti rendezés
		let sorted = [...points].sort((a, b) => {
			if (a === start) return -1;
			if (b === start) return 1;
			let angleA = Math.atan2(a.y - start.y, a.x - start.x);
			let angleB = Math.atan2(b.y - start.y, b.x - start.x);
			return angleA - angleB;
		});

		log(`Pontok szög szerinti rendezése...`);
		await delay(800 - get(speed) * 8);
		await pauseIfNeeded();

		// 3. Verem inicializálása
		hullPoints.push(sorted[0], sorted[1]);

		// 4. Graham-scan
		for (let i = 2; i < sorted.length; i++) {
			let top = hullPoints[hullPoints.length - 1];
			let nextToTop = hullPoints[hullPoints.length - 2];
			let current = sorted[i];

			highlightedEdge = [top, current];
			log(`Él vizsgálata: (${top.x}, ${top.y}) → (${current.x}, ${current.y})`);
			await delay(800 - get(speed) * 8);
			await pauseIfNeeded();

			while (
				hullPoints.length >= 2 &&
				cross(nextToTop, top, current) <= 0
			) {
				log(`Jobbra fordulás → visszalépés`);
				hullPoints.pop();
				top = hullPoints[hullPoints.length - 1];
				nextToTop = hullPoints[hullPoints.length - 2];
				highlightedEdge = [top, current];
				await delay(600 - get(speed) * 8);
				await pauseIfNeeded();
			}
			hullPoints.push(current);
			log(`Hozzáadás a burokhoz: (${current.x}, ${current.y})`);
			await delay(600 - get(speed) * 8);
			await pauseIfNeeded();
		}

		highlightedEdge = null;

		consoleLog.update((logs) => [...logs, 'A futás befejeződött!']);
		algorithmStatus.set('finished');
		await restartAlgorithm();
	}

	selectedAlgorithmSourceCode.set(`Graham pásztázás algoritmus`);
</script>

<div class="algorithm-container">
	<Controls {currentStep} {totalSteps} on:start={startAlgorithm} />
	<div class="tag">Canvas</div>
	<svg width="500" height="500" style="background: #fff; border: 1px solid #ccc;">
		<!-- Pontok -->
		{#each points as p}
			<circle cx={p.x} cy={p.y} r="5" fill="black" />
		{/each}

		<!-- Aktuálisan vizsgált él -->
		{#if highlightedEdge}
			<line
				x1={highlightedEdge[0].x}
				y1={highlightedEdge[0].y}
				x2={highlightedEdge[1].x}
				y2={highlightedEdge[1].y}
				stroke="red"
				stroke-width="2"
			/>
		{/if}

		<!-- Burok élei -->
		{#each hullPoints as p, i (p)}
			{#if i > 0}
				<line
					x1={hullPoints[i - 1].x}
					y1={hullPoints[i - 1].y}
					x2={p.x}
					y2={p.y}
					stroke="green"
					stroke-width="2"
				/>
			{/if}
		{/each}
	</svg>
</div>

<style>
	.tag {
		display: inline-block;
		top: 0;
		left: 0;
		background-color: #484848;
		color: white;
		padding: 3px;
	}
</style>
