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

	// ==== Alapadatok ====

	currentStep.set(0);
	algorithmStatus.set('idle');
	consoleLog.set([]);
	const displayName = algorithmDisplayNames[get(selectedAlgorithm)];

	// === Városok ===
	type City = { x: number; y: number };
	let cities: City[] = [];
	let tspPath: number[] = [];
	let currentCityIndex: number | null = null;
	let nextCityIndex: number | null = null;

	// === Vizualizáció és adatok ===
	function generateCities(count = 8) {
		cities = Array.from({ length: count }, () => ({
			x: Math.random() * 500 + 50,
			y: Math.random() * 300 + 50
		}));
	}

	function euclideanDistance(a: City, b: City) {
		return Math.hypot(a.x - b.x, a.y - b.y);
	}

	// ==== Előkalkulált lépésszám ====
	onMount(() => {
		totalSteps.set(8);
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
					tspPath = [];
					currentCityIndex = null;
					nextCityIndex = null;
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

	// ==== TSP futás ====
	async function startAlgorithm(event) {
		consoleLog.set([]);
		currentStep.set(0);
		consoleLog.update((logs) => [...logs, `${displayName} indítása...`]);
		generateCities();
		await greedyTSP(cities);
		consoleLog.update((logs) => [...logs, 'A futás befejeződött!']);
		algorithmStatus.set('finished');
		await restartAlgorithm();
	}

	async function greedyTSP(cities: City[]) {
		const n = cities.length;
		const visited = new Set<number>();
		let current = 0;
		tspPath = [current];
		visited.add(current);

		while (visited.size < n) {
			let nearest = null;
			let minDist = Infinity;

			for (let i = 0; i < n; i++) {
				if (!visited.has(i)) {
					let dist = euclideanDistance(cities[current], cities[i]);
					if (dist < minDist) {
						minDist = dist;
						nearest = i;
					}
				}
			}

			if (nearest !== null) {
				currentCityIndex = current;
				nextCityIndex = nearest;
				log(`Lépés: ${current} → ${nearest}, távolság: ${minDist.toFixed(2)}`);
				await pauseIfNeeded();
				await delay(900 - get(speed) * 8);

				current = nearest;
				tspPath.push(current);
				visited.add(current);
			}
		}

		// visszatérés a kezdőpontra
		currentCityIndex = current;
		nextCityIndex = tspPath[0];
		log(`Visszatérés: ${current} → ${tspPath[0]}`);
		tspPath.push(tspPath[0]);
		await pauseIfNeeded();
		await delay(900 - get(speed) * 8);

		currentCityIndex = null;
		nextCityIndex = null;
	}

	// ==== Forráskód megjelenítés ====
	selectedAlgorithmSourceCode.set(`Algoritmus neve`);
</script>

<!-- ==== Komponens markup ==== -->
<div class="algorithm-container">
	<Controls {currentStep} {totalSteps} on:start={startAlgorithm} />
	<div class="tag">Canvas</div>
	<svg width="600" height="400" style="border: 1px solid gray;">
		{#if tspPath.length > 1}
			{#each tspPath.slice(0, -1) as cityIndex, i}
				<line
					x1={cities[cityIndex].x}
					y1={cities[cityIndex].y}
					x2={cities[tspPath[i + 1]].x}
					y2={cities[tspPath[i + 1]].y}
					stroke="orange"
					stroke-width="2"
				/>
			{/each}
		{/if}

		{#each cities as city, i}
			<circle
				cx={city.x}
				cy={city.y}
				r="6"
				fill={i === currentCityIndex ? 'red' : i === nextCityIndex ? 'yellow' : 'blue'}
			/>
			<text x={city.x + 8} y={city.y - 8} font-size="12" fill="white">{i}</text>
		{/each}
	</svg>
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
</style>
