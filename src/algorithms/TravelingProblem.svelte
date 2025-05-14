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

	// ==== Alapadatok ====
	let tspEdges: { from: number; to: number }[] = [];
	let checkingEdge: { from: number; to: number } | null = null;

	// === Városok ===
	type City = { x: number; y: number };
	let cities: City[] = [];
	let tspPath: number[] = [];
	let weight = [];
	let currentCityIndex: number | null = null;
	let nextCityIndex: number | null = null;

	$: elementValue = 8;
	$: generateCities(elementValue);
	$: totalSteps.set(tspGreedyCounter(cities));

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
		resetParameters();
	});

	function resetParameters() {
		currentStep.set(0);
		algorithmStatus.set('idle');
		consoleLog.set([]);

		tspPath = [];
		tspEdges = [];
		tspEdges = [...tspEdges];
		weight = [];
		weight = [...weight];
		currentCityIndex = null;
		nextCityIndex = null;
		activeLine.set({ start: -1, end: -1 });
	}

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

	// ==== TSP futás ====
	async function startAlgorithm(event) {
		consoleLog.set([]);
		currentStep.set(0);
		consoleLog.update((logs) => [...logs, `${displayName} indítása...`]);

		if (elementValue < 3) {
			elementValue = 3;
		}
		if (elementValue > 20) {
			elementValue = 20;
		}

		await tspGreedy(cities);
		activeLine.set({ start: -1, end: -1 });

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
				activeLine.set({ start: 13, end: 23 });
				await delay(900 - get(speed) * 8);
				await pauseIfNeeded();

				if (!visited.has(i)) {
					checkingEdge = { from: current, to: i };
					currentCityIndex = current;
					nextCityIndex = i;
					log(`Távolság ellenőrzés: ${current} → ${i}`);
					activeLine.set({ start: 15, end: 21 });
					await delay(900 - get(speed) * 8);
					await pauseIfNeeded();


					let dist = euclideanDistance(cities[current], cities[i]);
					if (dist < minDist) {
						activeLine.set({ start: 17, end: 20 });
						await delay(900 - get(speed) * 8);
						await pauseIfNeeded();
						minDist = dist;
						nearest = i;
					}
				}
			}

			if (nearest !== null) {
				activeLine.set({ start: 25, end: 31 });
				log(`Lépés: ${current} → ${nearest}, távolság: ${minDist.toFixed(2)}`);
				await delay(900 - get(speed) * 8);
				await pauseIfNeeded();
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
		activeLine.set({ start: -1, end: -1 });
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
      tspEdges.push({ from: current, to: nearest });

      current = nearest;
      tspPath.push(current);
      visited.add(current);
    }

  }
 
  tspEdges.push({ from: current, to: tspPath[0] });
  tspPath.push(tspPath[0]);
}`
	);
</script>

<div class="control-buttons">
	<div>Városok száma:</div>
	<input
		class="custom-input"
		type="number"
		disabled={$algorithmStatus !== 'idle'}
		min="3"
		max="20"
		bind:value={elementValue}
		placeholder="Pontok száma"
	/>
</div>

<!-- ==== Komponens markup ==== -->
<div class="algorithm-container">
	<Controls {currentStep} {totalSteps} on:start={startAlgorithm} />
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
		width: 50px;
		padding: 0.5rem;
		margin-right: 10px;
		border-radius: 5px;
		background-color: #2f2f2f;
		border: 3px solid #505050;
	}
	.control-buttons input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		border-color: #3a3a3a;
	}
</style>
