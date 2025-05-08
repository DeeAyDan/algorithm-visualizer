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

	// ==== Alapadatok ====

	currentStep.set(0);
	algorithmStatus.set('idle');
	consoleLog.set([]);
	const displayName = algorithmDisplayNames[get(selectedAlgorithm)];
	activeLine.set(-1);

	let order = 4;
	let canvas;
	let ctx;
	let size = 300;
	let points = [];
	let totalPointCount = 0;

	// ==== Vizualizációs indexek ====

	// ==== Előkalkulált lépésszám ====
	onMount(() => {
		totalPointCount = Math.pow(4, order);
		totalSteps.set(totalPointCount);
		ctx = canvas.getContext('2d');
	});

	// ==== Késleltetés és vezérlés ====
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
					ctx.clearRect(0, 0, size, size);
					points = [];

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

	// ==== Algoritmus futás ====
	async function startAlgorithm() {
		consoleLog.update((logs) => [...logs, `${displayName} indítása...`]);

		const count = Math.pow(4, order);
		totalSteps.set(count);
		await hilbertCurves(count);
		activeLine.set(-1);

		consoleLog.update((logs) => [...logs, 'A futás befejeződött!']);
		algorithmStatus.set('finished');
		await restartAlgorithm();
	}

	async function hilbertCurves(count) {
		for (let i = 0; i < count; i++) {
			activeLine.set(17);
			await delay(130 - get(speed) * 8);
			const p = await getHilbertPoint(i, order);
			points.push(p);
			if (i > 0) {
				ctx.strokeStyle = `hsl(${(i / count) * 360}, 100%, 50%)`;
				ctx.beginPath();
				ctx.moveTo(points[i - 1].x, points[i - 1].y);
				ctx.lineTo(p.x, p.y);
				activeLine.set(10);
				await delay(130 - get(speed) * 8);
				ctx.stroke();
			}
			log(`Lépés ${i + 1}: (${p.x.toFixed(1)}, ${p.y.toFixed(1)})`);
			await pauseIfNeeded();
		}
	}

	async function getHilbertPoint(index: number, order: number) {
		let v = { x: 0, y: 0 };
		let n = Math.pow(2, order);
		let tmp,
			rx,
			ry,
			s,
			t = index;

		for (s = 1; s < n; s *= 2) {
			rx = 1 & (t >> 1);
			ry = 1 & (t ^ rx);
			activeLine.set(40);
			await delay(130 - get(speed) * 8);
			tmp = rotate(rx, ry, v.x, v.y, s);
			v.x = tmp.x;
			v.y = tmp.y;
			v.x += s * rx;
			v.y += s * ry;
			t >>= 2;
		}

		return {
			x: (v.x + 0.5) * (size / n),
			y: (v.y + 0.5) * (size / n)
		};
	}

	function rotate(rx, ry, x, y, s) {
		if (ry === 0) {
			if (rx === 1) {
				x = s - 1 - x;
				y = s - 1 - y;
			}
			return { x: y, y: x };
		}
		return { x, y };
	}

	// ==== Forráskód megjelenítés ====
	selectedAlgorithmSourceCode.set(
		`function hilbertCurves(count) {
  for (let i = 0; i < count; i++) {
    const p = getHilbertPoint(i, order);
    points.push(p);

    if (i > 0) {
      ctx.strokeStyle = \`hsl($\{(i / count) * 360}, 100%, 50%)\`;
      ctx.beginPath();
      ctx.moveTo(points[i - 1].x, points[i - 1].y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
  }
}
 \n

function getHilbertPoint(index, order) {
  let v = { x: 0, y: 0 };
  let n = Math.pow(2, order);
  let tmp, rx, ry, s, t = index;

  for (s = 1; s < n; s *= 2) {
    rx = 1 & (t >> 1);
    ry = 1 & (t ^ rx);
    tmp = rotate(rx, ry, v.x, v.y, s);
    v.x = tmp.x;
    v.y = tmp.y;
    v.x += s * rx;
    v.y += s * ry;
    t >>= 2;
  }

    return {
      x: (v.x + 0.5) * (size / n),
      y: (v.y + 0.5) * (size / n)
    };
  }
 \n
function rotate(rx, ry, x, y, s) {
  if (ry === 0) {
    if (rx === 1) {
      x = s - 1 - x;
      y = s - 1 - y;
    }
    return { x: y, y: x };
  }
  return { x, y };
}`
	);
</script>

<!-- Input mező az order-hez -->
<div class="custom-input">
	<label for="order">Görbe rendje:</label>
	<input id="order" type="number" min="1" max="8" bind:value={order} />
</div>

<!-- ==== Komponens markup ==== -->
<div class="algorithm-container">
	<Controls {currentStep} {totalSteps} on:start={startAlgorithm} />
	<div class="tag">Vászon</div>
	<div class="array-visual">
		<canvas bind:this={canvas} width={size} height={size}></canvas>
	</div>
</div>

<!-- ==== Stílus ==== -->
<style>
	.tag {
		display: inline-block;
		top: 0;
		left: 0;
		background-color: #484848;
		color: white;
		padding: 3px;
	}

	.custom-input {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 10px;
		padding: 1rem;
		border-bottom: 3px solid #505050;
	}
	.custom-input input {
		width: 60px;
		padding: 5px;
		font-size: 1rem;
		background-color: #2f2f2f;
		border: 3px solid #505050;
	}
	canvas {
		display: block;
		margin: 1rem auto;
		background-color: #111;
		border: 2px solid #444;
	}
</style>
