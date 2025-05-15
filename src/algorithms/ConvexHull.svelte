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

	currentStep.set(0);
	algorithmStatus.set('idle');
	consoleLog.set([]);
	const displayName = algorithmDisplayNames[get(selectedAlgorithm)];
	activeLine.set(-1);

	let elementValue = 6;

	let points = [
		{ x: 50, y: 50 },
		{ x: 450, y: 50 },
		{ x: 250, y: 100 },
		{ x: 400, y: 250 },
		{ x: 100, y: 200 },
		{ x: 250, y: 280 }
	];

	let highlightedEdge: [Point, Point] | null = null;
	let hullEdges: [Point, Point][] = [];

	type Point = {
		x: number;
		y: number;
	};

	function generateRandomPoints(n): Point[] {
		const width = 500;
		const height = 300;
		const margin = 20;
		const points: Point[] = [];
		for (let i = 0; i < n; i++) {
			points.push({
				x: Math.floor(Math.random() * (width - 2 * margin)) + margin,
				y: Math.floor(Math.random() * (height - 2 * margin)) + margin
			});
		}
		return points;
	}

	onMount(() => {
		totalSteps.set(convexHullCounter(points));
	});

	function convexHullCounter(points: Point[]): number {
		let steps = 0;
		for (let i = 0; i < points.length; i++) {
			for (let j = i + 1; j < points.length; j++) {
				steps++; // vizsgálat logolása
				let a = points[i];
				let b = points[j];
				let allOnOneSide = true;
				let side = null;

				for (let k = 0; k < points.length; k++) {
					if (k === i || k === j) continue;
					let p = points[k];
					let val = crossProduct(a, b, p);
					if (val !== 0) {
						if (side === null) side = val > 0;
						else if (val > 0 !== side) {
							allOnOneSide = false;
							break;
						}
					}
				}

				if (allOnOneSide) {
					steps++; // él hozzáadása logolva lenne
				}
			}
		}
		return steps;
	}

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
					hullEdges = [...hullEdges];

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

		if (elementValue < 3) {
			elementValue = 3;
		} else if (elementValue > 20) {
			elementValue = 20;
		}

		consoleLog.update((logs) => [...logs, `${displayName} indítása...`]);

		points = generateRandomPoints(elementValue);
		totalSteps.set(convexHullCounter(points));
		await convexHull(points);
		activeLine.set(-1);

		consoleLog.update((logs) => [...logs, 'A futás befejeződött!']);
		algorithmStatus.set('finished');
		await restartAlgorithm();
	}

	async function convexHull(points: Point[]) {
		for (let i = 0; i < points.length; i++) {
			for (let j = i + 1; j < points.length; j++) {
				let a = points[i];
				let b = points[j];

				highlightedEdge = [a, b];
				log(`Vizsgálat: él (${a.x}, ${a.y}) → (${b.x}, ${b.y})`);
				await pauseIfNeeded();
				await delay(Math.max(100, 900 - get(speed) * 8));

				let allOnOneSide = true;
				let side = null;

				for (let k = 0; k < points.length; k++) {
					activeLine.set(17);
					await delay(Math.max(100, 900 - get(speed) * 8));
					if (k === i || k === j) {
						activeLine.set(18);
						await delay(Math.max(100, 900 - get(speed) * 8));
						continue;
					}
					let p = points[k];
					let val = crossProduct(a, b, p);
					if (val !== 0) {
						if (side === null) {
							activeLine.set(22);
							await delay(Math.max(100, 900 - get(speed) * 8));
							side = val > 0;
						} else if (val > 0 !== side) {
							activeLine.set(23);
							await delay(Math.max(100, 900 - get(speed) * 8));
							allOnOneSide = false;
							break;
						}
					}
				}

				if (allOnOneSide) {
					activeLine.set(32);
					await delay(Math.max(200, 900 - get(speed) * 8));
					log(`Él hozzáadva a konvex burokhoz`);
					hullEdges.push([a, b]);
					hullEdges = [...hullEdges];
				}
			}
		}
		highlightedEdge = null;
	}

	function crossProduct(a: Point, b: Point, c: Point): number {
		return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
	}

	selectedAlgorithmSourceCode.set(`
function convexHull(points) {
  let hullEdges = [];
 \n
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++){
	\n
      let a = points[i];
      let b = points[j];
 \n
      let allOnOneSide = true;
      let side = null;
 \n
      for (let k = 0; k < points.length; k++){
        if (k === i || k === j) continue;
        let p = points[k];
        let val = crossProduct(a, b, p);
        if (val !== 0) {
          if (side === null) side = val > 0;
          else if (val > 0 !== side) {
            allOnOneSide = false;
            break;
          }
        }
     }
 \n
      if (allOnOneSide) {
        hullEdges.push([a, b]);
      }
    }
  }
}`);
</script>

<div class="control-buttons">
	<div>Pontok száma:</div>
	<input class="custom-input" type="number" bind:value={elementValue} max="20" min="3" />
</div>

<Controls {currentStep} {totalSteps} on:start={startAlgorithm} />

<div class="graph-container">
	<svg class="svg" width="500" height="300">
		

		<!-- Aktuálisan vizsgált él -->
		{#if highlightedEdge}
			<line
				x1={highlightedEdge[0].x}
				y1={highlightedEdge[0].y}
				x2={highlightedEdge[1].x}
				y2={highlightedEdge[1].y}
				stroke="#dc143c"
				stroke-dasharray="4"
				stroke-width="2"
			/>
		{/if}

		<!-- Konvex burok élek -->
		{#each hullEdges as [a, b]}
			<line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#45a049" stroke-width="2" />
		{/each}

		<!-- Összes pont -->
		{#each points as p}
			<circle cx={p.x} cy={p.y} r="8" fill="#2f4f4f" />
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
	.control-buttons {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 10px;
		padding: 0.5rem;
		border-bottom: #484848 3px solid;
	}

	.control-buttons input {
		width: 55px;
		padding: 0.5rem;
		margin-right: 10px;
		border-radius: 5px;
		background-color: #2f2f2f;
		border: 3px solid #505050;
	}
</style>
