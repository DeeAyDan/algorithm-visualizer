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

	const displayName = algorithmDisplayNames[get(selectedAlgorithm)];

	let elementValue = 6;

	// Reactive declaration - when elementValue changes, points will update automatically
	$: points = generateRandomPoints(elementValue);
	
	let highlightedEdge: [Point, Point] | null = null;
	let hullEdges: [Point, Point][] = [];

	type Point = {
		x: number;
		y: number;
	};

	function generateRandomPoints(n): Point[] {
		// Ensure input is within bounds
		n = Math.max(3, Math.min(20, n));
		
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

	// Update totalSteps when points change
	$: totalSteps.set(convexHullCounter(points));

	onMount(() => {
		resetParameters();
	});

	function resetParameters() {
		currentStep.set(0);
		algorithmStatus.set('idle');
		consoleLog.set([]);
		activeLine.set({ start: -1, end: -1 });

		hullEdges = [];
		hullEdges = [...hullEdges];
	}

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

	async function restartAlgorithm() {
		if (get(algorithmStatus) === 'finished') {
			return new Promise((resolve) => {
				const unsub = resumeSignal.subscribe(() => {
					if (get(algorithmStatus) === 'idle') {
						resetParameters();
						unsub();
						resolve();
					}
				});
			});
		}
	}

	async function startAlgorithm() {
		// No need to regenerate points here, as they're already reactive
		// No need to clamp elementValue here as it's done in generateRandomPoints
		
		consoleLog.update((logs) => [...logs, `${displayName} indítása...`]);

		totalSteps.set(convexHullCounter(points));
		await convexHull(points);
		activeLine.set({ start: -1, end: -1 });

		consoleLog.update((logs) => [...logs, 'A futás befejeződött!']);
		algorithmStatus.set('finished');
		await restartAlgorithm();
	}

	// Handle manual input validation
	function handleInputChange() {
		if (elementValue < 3) elementValue = 3;
		if (elementValue > 20) elementValue = 20;
	}

	async function convexHull(points: Point[]) {
		hullEdges = []; // Clear previous hull edges
		
		for (let i = 0; i < points.length; i++) {
			for (let j = i + 1; j < points.length; j++) {
				let a = points[i];
				let b = points[j];

				highlightedEdge = [a, b];
				log(`Vizsgálat: él (${a.x}, ${a.y}) → (${b.x}, ${b.y})`);
				activeLine.set({ start: 7, end: 8 });

				await delay(900 - get(speed) * 8);
				await pauseIfNeeded();

				let allOnOneSide = true;
				let side = null;

				for (let k = 0; k < points.length; k++) {
					activeLine.set({ start: 13, end: 13 });
					await delay(900 - get(speed) * 8);
					await pauseIfNeeded();
					if (k === i || k === j) {
						activeLine.set({ start: 15, end: 15 });
						await delay(900 - get(speed) * 8);
						await pauseIfNeeded();
						continue;
					}
					let p = points[k];
					let val = crossProduct(a, b, p);
					if (val !== 0) {
						if (side === null) {
							activeLine.set({ start: 21, end: 21 });
							await delay(900 - get(speed) * 8);
							await pauseIfNeeded();
							side = val > 0;
						} else if (val > 0 !== side) {
							activeLine.set({ start: 22, end: 25 });
							await delay(900 - get(speed) * 8);
							await pauseIfNeeded();
							allOnOneSide = false;
							break;
						}
					}
				}

				if (allOnOneSide) {
					activeLine.set({ start: 29, end: 31 });
					await delay(900 - get(speed) * 8);
					await pauseIfNeeded();
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

	selectedAlgorithmSourceCode.set(`function convexHull(points) {
  let hullEdges = [];
 
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++){
	
      let a = points[i];
      let b = points[j];
 
      let allOnOneSide = true;
      let side = null;
 
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
 
      if (allOnOneSide) {
        hullEdges.push([a, b]);
      }
    }
  }
}`);
</script>

<div class="custom-input">
	<div>Pontok száma:</div>
	<input
		class="custom-input"
		type="number"
		disabled={$algorithmStatus !== 'idle'}
		bind:value={elementValue}
		on:change={handleInputChange}
		max="20"
		min="3"
	/>
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
	.custom-input {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 10px;
		padding: 0.5rem;
		border-bottom: #484848 3px solid;
	}

	.custom-input input {
		width: 55px;
		padding: 0.5rem;
		margin-right: 10px;
		border-radius: 5px;
		background-color: #2f2f2f;
		border: 3px solid #505050;
	}
	.custom-input input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		border-color: #3a3a3a;
	}
</style>