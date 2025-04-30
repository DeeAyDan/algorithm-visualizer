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
		{ x: 80, y: 200 }
	];

	let highlightedEdge: [Point, Point] | null = null;
	let hullEdges: [Point, Point][] = [];

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
					hullEdges = [];
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
		hullEdges = [];
		consoleLog.update((logs) => [...logs, `${displayName} indítása...`]);

		await jarvisMarch(points);

		consoleLog.update((logs) => [...logs, 'A futás befejeződött!']);
		algorithmStatus.set('finished');
		await restartAlgorithm();
	}

	async function jarvisMarch(points: Point[]) {
		if (points.length < 3) return;

		let hull: Point[] = [];

		// Kezdőpont: legbalabb
		let leftmost = points.reduce((min, p) => (p.x < min.x ? p : min), points[0]);
		let p = leftmost;

		do {
			hull.push(p);
			let q = points[0] === p ? points[1] : points[0]; // Kezdő tipp a következő pontra

			for (let r of points) {
				highlightedEdge = [p, r];
				log(`Vizsgálat: (${p.x}, ${p.y}) → (${r.x}, ${r.y})`);
				await pauseIfNeeded();
				await delay(900 - get(speed) * 8);

				if (crossProduct(p, q, r) < 0) {
					q = r;
				}
			}

			hullEdges.push([p, q]);
			p = q;
		} while (p !== leftmost);

		highlightedEdge = null;
	}

	function crossProduct(a: Point, b: Point, c: Point): number {
		return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
	}

	selectedAlgorithmSourceCode.set(`Brute Force Convex Hull`);
</script>

<div class="algorithm-container">
	<Controls {currentStep} {totalSteps} on:start={startAlgorithm} />
	<div class="tag">Canvas</div>
	<svg width="500" height="500" style="background: #fff; border: 1px solid #ccc;">
		<!-- Összes pont -->
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

		<!-- Konvex burok élek -->
		{#each hullEdges as [a, b]}
			<line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="green" stroke-width="2" />
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
