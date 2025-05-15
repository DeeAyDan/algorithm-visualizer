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

	let points = [];

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

	let highlightedEdge: [Point, Point] | null = null;
	let hullEdges: [Point, Point][] = [];

	onMount(() => {
		generatePoints(elementValue);
		arr = [...points];
		totalSteps.set(jarvisMarchCounter(arr));
	});

	function jarvisMarchCounter(points: Point[]) {
		let steps = 0;
		if (points.length < 3) return;

		let hull: Point[] = [];

		let leftmost = points.reduce((min, p) => (p.x < min.x ? p : min), points[0]);
		let p = leftmost;

		do {
			hull.push(p);
			let q = points[0] === p ? points[1] : points[0];

			for (let r of points) {
				highlightedEdge = [p, r];
				steps++;
				if (crossProduct(p, q, r) < 0) {
					q = r;
				}
			}
			steps++;
			hullEdges.push([p, q]);
			p = q;
		} while (p !== leftmost);

		if (hull.length > 1) {
			hullEdges.push([hull[hull.length - 1], hull[0]]);
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
					selectedEdges = [];
					selectedEdges = [...selectedEdges];
					unsub();
					resolve();
				}
			});
		});		}
	}

	async function startAlgorithm() {
		consoleLog.set([]);
		currentStep.set(0);
		hullEdges = [];
		consoleLog.update((logs) => [...logs, `${displayName} indítása...`]);

		await jarvisMarch(points);
		activeLine.set(-1);

		consoleLog.update((logs) => [...logs, 'A futás befejeződött!']);
		algorithmStatus.set('finished');
		await restartAlgorithm();
	}

	async function jarvisMarch(points: Point[]) {
		if (points.length < 3) return;

		let hull: Point[] = [];

		let leftmost = points.reduce((min, p) => (p.x < min.x ? p : min), points[0]);
		let p = leftmost;

		do {
			hull.push(p);
			let q = points[0] === p ? points[1] : points[0];

			for (let r of points) {
				highlightedEdge = [p, r];
				log(
					`Vizsgálat: (${p.x.toFixed(2)}, ${p.y.toFixed(2)}) → (${r.x.toFixed(2)}, ${r.y.toFixed(2)})`
				);
				activeLine.set(13);
				await pauseIfNeeded();
				await delay(900 - get(speed) * 8);

				if (crossProduct(p, q, r) < 0) {
					q = r;
					activeLine.set(14);
				await delay(900 - get(speed) * 8);
				}
			}

			selectedEdges.push([p, q]);
			selectedEdges = [...selectedEdges];
			highlightedEdge = null;
			activeLine.set(25);

			log(
				`Kiválasztott él: (${p.x.toFixed(2)}, ${p.y.toFixed(2)}) → (${q.x.toFixed(2)}, ${q.y.toFixed(2)})`
			);
			await delay(900 - get(speed) * 8);
			hullEdges.push([p, q]);
			p = q;
		} while (p !== leftmost);

		if (hull.length > 1) {
			hullEdges.push([hull[hull.length - 1], hull[0]]);
		}
		highlightedEdge = null;
	}

	function crossProduct(a: Point, b: Point, c: Point): number {
		return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
	}

	selectedAlgorithmSourceCode.set(
		`function jarvisMarch(points) {
  if (points.length < 3) return;
  let hull = [];
  let leftmost = points.reduce((min, p) => (p.x < min.x ? p : min), points[0]);
  let p = leftmost;
 \n
  do {
    hull.push(p);
    let q = points[0] === p ? points[1] : points[0];
 \n
    for (let r of points) {
      if (crossProduct(p, q, r) < 0) {
        q = r;
      }
    }
 \n
    hullEdges.push([p, q]);
    p = q;
  } while (p !== leftmost);
 \n
  if (hull.length > 1) {
  hullEdges.push([hull[hull.length - 1], hull[0]]);
  }
}
\n
function crossProduct(a, b, c){
    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}`
	);
</script>

<div class="control-buttons">
	<div>Pontok száma:</div>
	<input class="custom-input" type="number" bind:value={elementValue} placeholder="Pontok száma" />
</div>

<div class="algorithm-container">
	<Controls {currentStep} {totalSteps} on:start={startAlgorithm} />
	<svg class="svg" width="500" height="300">
		{#each selectedEdges as [a, b]}
			<line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#45a049" stroke-width="2" />
		{/each}

		{#if highlightedEdge}
			<line
				x1={highlightedEdge[0].x}
				y1={highlightedEdge[0].y}
				x2={highlightedEdge[1].x}
				y2={highlightedEdge[1].y}
				stroke="#dc143c"
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
		border-bottom: 3px solid #484848;
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
