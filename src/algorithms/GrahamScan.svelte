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

	currentStep.set(0);
	algorithmStatus.set('idle');
	consoleLog.set([]);
	const displayName = algorithmDisplayNames[get(selectedAlgorithm)];
	let elementValue = 6;
	activeLine.set(-1);
	let selectedEdges = [];

	let highlightedEdge: [Point, Point] | null = null; // piros
	let stackEdges: [Point, Point][] = []; // sárga (aktuális burok)
	let finalHullEdges: [Point, Point][] = []; // zöld (végső burok)

	let points = [];
	let arr = [];

	function generatePoints(count) {
		let minDistance = 50;
		points = [];
		while (points.length < count) {
			const newPoint = {
				x: Math.random() * 400 + 50,
				y: Math.random() * 200 + 50
			};

			if (points.every((point) => euclideanDistance(point, newPoint) >= minDistance)) {
				points.push(newPoint);
			}
		}
	}

	function euclideanDistance(p1, p2) {
		return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
	}

	let hullEdges: [Point, Point][] = [];

	onMount(() => {
		generatePoints(elementValue);
		arr = [...points];
		totalSteps.set(grahamScanCounter(arr));
	});

	function grahamScanCounter(points: Point[]) {
		let steps = 0;
		if (points.length < 3) return;

		const lowest = points.reduce((a, b) => (a.y > b.y || (a.y === b.y && a.x < b.x) ? a : b));
		steps++;

		const sorted = points
			.filter((p) => p !== lowest)
			.sort((a, b) => {
				const cp = crossProduct(lowest, a, b);
				if (cp === 0) {
					return euclideanDistance(lowest, a) - euclideanDistance(lowest, b);
				}
				return -cp;
			});
		steps++;

		const stack: Point[] = [lowest, sorted[0]];

		steps++;

		for (let i = 1; i < sorted.length; i++) {
			const current = sorted[i];
			let top = stack[stack.length - 1];
			let nextToTop = stack[stack.length - 2];

			steps++;

			while (stack.length >= 2 && crossProduct(nextToTop, top, current) <= 0) {
				steps++;
				stack.pop();
				top = stack[stack.length - 1];
				nextToTop = stack[stack.length - 2];
			}

			stack.push(current);
			steps++;
		}

		const last = stack[stack.length - 1];
		const first = stack[0];

		steps++;

		for (let i = 0; i < stack.length; i++) {
			const a = stack[i];
			const b = stack[(i + 1) % stack.length];
		}
		return steps;
	}
	async function restartAlgorithm() {
		if (get(algorithmStatus) === 'finished') {
			return new Promise((resolve) => {
				const unsub = resumeSignal.subscribe(() => {
					if (get(algorithmStatus) === 'idle') {
						consoleLog.set([]);
						currentStep.set(0);
						hullEdges = [];
						finalHullEdges = [];
						selectedEdges = [];
						selectedEdges = [...selectedEdges];
						generatePoints(elementValue);
						arr = [...points];
						totalSteps.set(grahamScanCounter(arr));
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
		hullEdges = [];
		selectedEdges = [];

		if (elementValue < 3) {
			elementValue = 3;
		} else if (elementValue > 20) {
			elementValue = 20;
		}

		consoleLog.update((logs) => [...logs, `${displayName} indítása...`]);

		generatePoints(elementValue);
		arr = [...points];
		totalSteps.set(grahamScanCounter(arr));
		await grahamScan(points);

		activeLine.set(-1);
		consoleLog.update((logs) => [...logs, 'A futás befejeződött!']);
		algorithmStatus.set('finished');
		await restartAlgorithm();
	}

	async function grahamScan(points: Point[]) {
		if (points.length < 3) return;

		finalHullEdges = [];
		stackEdges = [];
		highlightedEdge = null;

		// 1. Legalsó pont kiválasztása
		const lowest = points.reduce((a, b) => (a.y > b.y || (a.y === b.y && a.x < b.x) ? a : b));
		activeLine.set(2);
		log(`Legalsó pont: index: ${points.indexOf(lowest)}`);
		await delay(900 - get(speed) * 8);
		await pauseIfNeeded();

		// 2. Polárszög szerint rendezés
		const sorted = points
			.filter((p) => p !== lowest)
			.sort((a, b) => {
				const cp = crossProduct(lowest, a, b);
				if (cp === 0) {
					return euclideanDistance(lowest, a) - euclideanDistance(lowest, b);
				}
				return -cp;
			});
		activeLine.set(4);
		log(
			`Rendezett pontok indexei: ${[lowest, ...sorted].map((p) => points.indexOf(p)).join(', ')}`
		);
		await delay(900 - get(speed) * 8);
		await pauseIfNeeded();

		// 3. Stack inicializálása
		const stack: Point[] = [lowest, sorted[0]];
		stackEdges = [[lowest, sorted[0]]];
		stackEdges = [...stackEdges];

		activeLine.set(14);
		log(
			`Kezdő él: (${lowest.x.toFixed(2)}, ${lowest.y.toFixed(2)}) → (${sorted[0].x.toFixed(2)}, ${sorted[0].y.toFixed(2)})`
		);
		await delay(900 - get(speed) * 8);
		await pauseIfNeeded();

		for (let i = 1; i < sorted.length; i++) {
			const current = sorted[i];
			let top = stack[stack.length - 1];
			let nextToTop = stack[stack.length - 2];

			activeLine.set(17);
			log(`Vizsgált pont indexe: ${points.indexOf(current)}`);
			highlightedEdge = [top, current];
			await delay(900 - get(speed) * 8);
			await pauseIfNeeded();

			while (stack.length >= 2 && crossProduct(nextToTop, top, current) <= 0) {
				activeLine.set(22);
				log(`Nem balra fordul → töröljük: (${top.x.toFixed(2)}, ${top.y.toFixed(2)})`);
				stack.pop();
				highlightedEdge = null;

				stackEdges.pop();
				stackEdges = [...stackEdges];
				top = stack[stack.length - 1];
				nextToTop = stack[stack.length - 2];
				await delay(900 - get(speed) * 8);
				await pauseIfNeeded();
			}

			stack.push(current);
			stackEdges.push([top, current]);
			stackEdges = [...stackEdges];

			activeLine.set(26);
			log(
				`Hozzáadva a burokhoz: (${top.x.toFixed(2)}, ${top.y.toFixed(2)}) → (${current.x.toFixed(2)}, ${current.y.toFixed(2)})`
			);

			await delay(900 - get(speed) * 8);
			await pauseIfNeeded();
		}

		highlightedEdge = null;
		// Hozzáadjuk az utolsó élt is a stackEdges-hez, hogy ne "ugorjon" a vizualizáció
		const last = stack[stack.length - 1];
		const first = stack[0];
		stackEdges.push([last, first]);
		stackEdges = [...stackEdges];
		activeLine.set(29);
		log(
			`Záró él: (${last.x.toFixed(2)}, ${last.y.toFixed(2)}) → (${first.x.toFixed(2)}, ${first.y.toFixed(2)})`
		);

		await delay(900 - get(speed) * 8);
		await pauseIfNeeded();

		// 4. Végső burok összeállítása
		for (let i = 0; i < stack.length; i++) {
			const a = stack[i];
			const b = stack[(i + 1) % stack.length];
			stackEdges.shift();
			stackEdges = [...stackEdges];
			finalHullEdges.push([a, b]);
			finalHullEdges = [...finalHullEdges];
		}

		// 5. Stack eltüntetése
		stackEdges = [];
	}

	function crossProduct(a: Point, b: Point, c: Point): number {
		return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
	}

	selectedAlgorithmSourceCode.set(
		`function grahamScan(points) {
  if (points.length < 3) return;
  const lowest = points.reduce((a, b) => (a.y > b.y || (a.y === b.y && a.x < b.x) ? a : b));

  const sorted = points
    .filter((p) => p !== lowest)
    .sort((a, b) => {
      const cp = crossProduct(lowest, a, b);
      if (cp === 0) {
        return euclideanDistance(lowest, a) - euclideanDistance(lowest, b);
      }
      return -cp;
    });

  const stack: Point[] = [lowest, sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    let top = stack[stack.length - 1];
    let nextToTop = stack[stack.length - 2];

    while (stack.length >= 2 && crossProduct(nextToTop, top, current) <= 0) {
      stack.pop();
      top = stack[stack.length - 1];
      nextToTop = stack[stack.length - 2];
    }
    stack.push(current);
  }

  const last = stack[stack.length - 1];
  const first = stack[0];

  for (let i = 0; i < stack.length; i++) {
    const a = stack[i];
    const b = stack[(i + 1) % stack.length];
  }
}

function crossProduct(a: Point, b: Point, c: Point): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}`
	);
</script>

<div class="control-buttons">
	<div>Pontok száma:</div>
	<input class="custom-input" type="number" bind:value={elementValue} max="20" min="3" />
</div>

<div class="algorithm-container">
	<Controls {currentStep} {totalSteps} on:start={startAlgorithm} />
	<svg class="svg" width="500" height="300">
		<!-- Zöld: végleges burok -->
		{#each finalHullEdges as [a, b]}
			<line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="green" stroke-width="2" />
		{/each}

		<!-- Sárga: aktuális stack-beli élek -->
		{#each stackEdges as [a, b]}
			<line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="gold" stroke-width="2" />
		{/each}

		<!-- Piros: aktuálisan vizsgált él -->
		{#if highlightedEdge}
			<line
				x1={highlightedEdge[0].x}
				y1={highlightedEdge[0].y}
				x2={highlightedEdge[1].x}
				y2={highlightedEdge[1].y}
				stroke="crimson"
				stroke-width="2"
			/>
		{/if}

		{#each hullEdges as [a, b]}
			<line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="green" stroke-width="2" />
			<circle cx={a.x} cy={a.y} r="6" fill="limegreen" />
		{/each}

		{#each points as p, i}
			<circle cx={p.x} cy={p.y} r="8" fill="#2f4f4f" />
			<text x={p.x + 8} y={p.y - 8} font-size="12" fill="aliceblue">{i}</text>
		{/each}
	</svg>
</div>

<style>
	.svg {
		margin: 1rem auto;
		border: 1px solid #ccc;
		border-radius: 4px;
		display: block;
		background-color: #2f2f2f;
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
