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
	let tspEdges: { from: number; to: number }[] = [];
	let checkingEdge: { from: number; to: number } | null = null;
	const displayName = algorithmDisplayNames[get(selectedAlgorithm)];
	let elementValue = 8;
	activeLine.set(-1);

	// === Városok ===
	type City = { x: number; y: number };
	let cities: City[] = [];
	let tspPath: number[] = [];
	let weight = [];
	let currentCityIndex: number | null = null;
	let nextCityIndex: number | null = null;

	// === Vizualizáció és adatok ===
	function generateCities(count) {
		let minDistance = 50;
		cities = [];
		while (cities.length < count) {
			const newCity = {
				x: Math.random() * 400 + 50,
				y: Math.random() * 200 + 50
			};

			if (cities.every((city) => euclideanDistance(city, newCity) >= minDistance)) {
				cities.push(newCity);
			}
		}
	}

	function euclideanDistance(a: City, b: City) {
		return Math.hypot(a.x - b.x, a.y - b.y);
	}

	// ==== Előkalkulált lépésszám ====
	onMount(() => {
		generateCities(elementValue);
		totalSteps.set(tspGreedyCounter(cities));
	});

	function tspGreedyCounter(cities: City[]): number {
		let steps = 0;
		const n = cities.length;
		const visited = new Set<number>();
		let current = 0;
		visited.add(current);

		while (visited.size < n) {
			let nearest = null;
			let minDist = Infinity;

			for (let i = 0; i < n; i++) {
				if (!visited.has(i)) {
					let dist = euclideanDistance(cities[current], cities[i]);
					steps++;
					if (dist < minDist) {
						minDist = dist;
						nearest = i;
					}
				}
			}

			if (nearest !== null) {
				current = nearest;
				visited.add(current);
				steps++;
			}
		}

		// visszatérés a kezdőpontra
		return steps + 1;
	}

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
					tspEdges = [];
					tspEdges = [...tspEdges];
					weight = [];
					weight = [...weight];
					cities = [];
					totalSteps.set(0);
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

		generateCities(elementValue);
		totalSteps.set(tspGreedyCounter(cities));
		await tspGreedy(cities);
		activeLine.set(-1);

		consoleLog.update((logs) => [...logs, 'A futás befejeződött!']);
		algorithmStatus.set('finished');
		await restartAlgorithm();
	}

	async function tspGreedy(cities: City[]) {
		const n = cities.length;
		const visited = new Set<number>();
		let current = 0;
		tspPath = [current];
		tspEdges = [];
		visited.add(current);

		while (visited.size < n) {
			let nearest = null;
			let minDist = Infinity;

			for (let i = 0; i < n; i++) {
				activeLine.set(17);
				await delay(900 - get(speed) * 8);
				if (!visited.has(i)) {
					checkingEdge = { from: current, to: i };
					currentCityIndex = current;
					nextCityIndex = i;
					log(`Távolság ellenőrzés: ${current} → ${i}`);
					await pauseIfNeeded();
					await delay(900 - get(speed) * 8);

					let dist = euclideanDistance(cities[current], cities[i]);
					if (dist < minDist) {
						activeLine.set(18);
				await delay(900 - get(speed) * 8);
						minDist = dist;
						nearest = i;
					}
				}
			}

			if (nearest !== null) {

				activeLine.set(26);
				log(`Lépés: ${current} → ${nearest}, távolság: ${minDist.toFixed(2)}`);
				await pauseIfNeeded();
				await delay(900 - get(speed) * 8);
				checkingEdge = null;

				tspEdges.push({ from: current, to: nearest });

				tspEdges = [...tspEdges];
				current = nearest;
				weight.push(minDist.toFixed(2));
				weight = [...weight];
				tspPath.push(current);
				visited.add(current);
			}
		}

		currentCityIndex = current;
		nextCityIndex = tspPath[0];
		log(
			`Visszatérés: ${current} → ${tspPath[0]}, távolság: ${euclideanDistance(cities[current], cities[0]).toFixed(2)}`
		);
		activeLine.set(35);
		await pauseIfNeeded();
		await delay(900 - get(speed) * 8);

		tspEdges.push({ from: current, to: tspPath[0] });
		tspPath.push(tspPath[0]);
		tspEdges = [...tspEdges];
		checkingEdge = null;
		weight.push(euclideanDistance(cities[current], cities[0]).toFixed(2));
		weight = [...weight];

		consoleLog.update((logs) => [
			...logs,
			'Össztáv: ' + weight.reduce((a, b) => parseFloat(a) + parseFloat(b), 0).toFixed(2)
		]);

		currentCityIndex = null;
		nextCityIndex = null;
	}

	// ==== Forráskód megjelenítés ====
	selectedAlgorithmSourceCode.set(
`function tspGreedy(cities) {
  const n = cities.length;
  const visited = new Set<number>();
  let current = 0;
  tspPath = [current];
  tspEdges = [];
  visited.add(current);
 \n
  while (visited.size < n) {
    let nearest = null;
    let minDist = Infinity;
 \n
    for (let i = 0; i < n; i++) {
      if (!visited.has(i)) {
        let dist = euclideanDistance(cities[current], cities[i]);
        if (dist < minDist) {
          minDist = dist;
          nearest = i;
        }
      }
    }
 \n
    if (nearest !== null) {
      tspEdges.push({ from: current, to: nearest });

      current = nearest;
      tspPath.push(current);
      visited.add(current);
    }
  }
 \n
  tspEdges.push({ from: current, to: tspPath[0] });
  tspPath.push(tspPath[0]);
}`);
</script>

<div class="control-buttons">
	<input class="custom-input" type="number" bind:value={elementValue} placeholder="Pontok száma" />
</div>

<!-- ==== Komponens markup ==== -->
<div class="algorithm-container">
	<Controls {currentStep} {totalSteps} on:start={startAlgorithm} />
	<div class="tag">Vászon</div>
	<svg class="svg" width="500" height="300">
		{#each tspEdges as edge, i}
			<line
				x1={cities[edge.from].x}
				y1={cities[edge.from].y}
				x2={cities[edge.to].x}
				y2={cities[edge.to].y}
				stroke="#45a049"
				stroke-width="2"
			/>
		{/each}
		{#if checkingEdge}
			<line
				x1={cities[checkingEdge.from].x}
				y1={cities[checkingEdge.from].y}
				x2={cities[checkingEdge.to].x}
				y2={cities[checkingEdge.to].y}
				stroke="#dc143c"
				stroke-width="2"
				stroke-dasharray="4"
			/>
		{/if}

		{#each cities as city, i}
			<circle
				cx={city.x}
				cy={city.y}
				r="8"
				stroke="#2f2f2f"
				fill={i === currentCityIndex ? '#dc143c' : i === nextCityIndex ? '#ffd700' : '#2f4f4f'}
			/>
			<text x={city.x + 8} y={city.y - 8} font-size="12" fill="aliceblue">{i}</text>
		{/each}
	</svg>
</div>

<!-- ==== Stílus ==== -->
<style>
	.tag {
		display: block;
		width: fit-content;
		top: 0;
		left: 0;
		background-color: #484848;
		color: white;
		padding: 3px;
	}
	.svg {
		margin: 1rem auto;
		border: 1px solid #ccc;
		border-radius: 4px;
		display: block;
		background-color: #2f2f2f;
	}
	.control-buttons {
		display: flex;
		justify-content: space-around;
		padding: 0.5rem;
	}
	.control-buttons input {
		width: 150px;
		padding: 0.5rem;
		margin-right: 10px;
		border-radius: 5px;
		background-color: #2f2f2f;
		border: 3px solid #505050;
	}
</style>
