<script lang="ts">
	// @ts-nocheck
	import { onMount } from 'svelte';
	import {
		selectedAlgorithmSourceCode,
		selectedAlgorithm,
		currentStep,
		totalSteps,
		consoleLog,
		speed,
		algorithmStatus,
		resumeSignal,
		activeLine
	} from '../stores/store.svelte.js';
	import Controls from '../routes/Controls.svelte';
	import { get } from 'svelte/store';
	import { algorithmDisplayNames } from '../stores/algorithmMap.js';
	import { waitUntilResume, delay, pauseIfNeeded, log } from '../stores/utils.js';

	const displayName = algorithmDisplayNames[get(selectedAlgorithm)];

	// ==== Alapadatok ====
	const size = 5;
	let matrix = generateMatrix(size);
	let solutionMatrix = [...matrix];
	let activeCell: [number, number] | null = null;

	// ==== Lépésszám beállítás ====
	onMount(() => {
		totalSteps.set(size * size);
		resetParameters();
	});

	function resetParameters() {
		algorithmStatus.set('idle');
		currentStep.set(0);
		consoleLog.set([]);
		matrix = generateMatrix(size);
		path = [];
		solutionMatrix = [...matrix];
		activeCell = null;
		activeLine.set({ start: -1, end: -1 });
	}

	// ==== Segédfüggvények ====
	function generateMatrix(n) {
		return Array.from({ length: n }, () =>
			Array.from({ length: n }, () => Math.floor(Math.random() * 19 + 1))
		);
	}

	async function restartAlgorithm() {
		if (get(algorithmStatus) === 'finished') {
			await new Promise((resolve) => {
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

	// ==== Algoritmus ====
	async function maxSumPath() {
		for (let i = 0; i < size; i++) {
			for (let j = 0; j < size; j++) {
				activeCell = [i, j];

				let fromTop = i > 0 ? solutionMatrix[i - 1][j] : 0;
				let fromLeft = j > 0 ? solutionMatrix[i][j - 1] : 0;

				let chosenFrom = '';

				activeLine.set({ start: 3, end: 4 });
				await delay(900 - get(speed) * 8);
				await pauseIfNeeded();

				if (fromTop > fromLeft) {
					chosenFrom = 'fentről';
					activeLine.set({ start: 10, end: 11 });
					await delay(900 - get(speed) * 8);
					await pauseIfNeeded();
				} else if (fromLeft > fromTop) {
					chosenFrom = 'balról';
					activeLine.set({ start: 12, end: 13 });
					await delay(900 - get(speed) * 8);
					await pauseIfNeeded();
				} else {
					chosenFrom = i === 0 && j === 0 ? 'kezdőérték' : 'egyforma érték (fentről/balról)';

					activeLine.set({ start: 14, end: 16 });
					await delay(900 - get(speed) * 8);
					await pauseIfNeeded();
				}

				solutionMatrix[i][j] = matrix[i][j] + Math.max(fromTop, fromLeft);

				log(`Megoldás [${i},${j}] = ${solutionMatrix[i][j]} (${chosenFrom})`);
				activeLine.set({ start: 18, end: 18 });
				await delay(900 - get(speed) * 8);
				await pauseIfNeeded();
			}
		}
		activeCell = null;
	}

	let path: [number, number][] = [];

	async function reconstructPath() {
		let i = size - 1;
		let j = size - 1;

		path = [[i, j]];

		while (i > 0 || j > 0) {
			const fromTop = i > 0 ? solutionMatrix[i - 1][j] : -1;
			const fromLeft = j > 0 ? solutionMatrix[i][j - 1] : -1;

			if (fromTop > fromLeft) {
				i--;
			} else {
				j--;
			}

			path.unshift([i, j]);
		}
	}

	// ==== Start ====
	async function startAlgorithm(event) {
		consoleLog.set([]);
		currentStep.set(0);
		consoleLog.update((logs) => [...logs, `${displayName} indítása...`]);

		await maxSumPath();
		activeLine.set({ start: -1, end: -1 });

		consoleLog.update((logs) => [...logs, 'A futás befejeződött!']);
		algorithmStatus.set('finished');
		reconstructPath();
		await restartAlgorithm();
	}

	// ==== Forráskód beállítás ====
	selectedAlgorithmSourceCode.set(
		`function maxSumPath() {

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {

      let fromTop = i > 0 ? solutionMatrix[i - 1][j] : 0;
      let fromLeft = j > 0 ? solutionMatrix[i][j - 1] : 0;
      let chosenFrom = '';

      if (fromTop > fromLeft) {
        chosenFrom = 'fentről';
      } else if (fromLeft > fromTop) {
        chosenFrom = 'balról';
      } else {
        chosenFrom = i === 0 && j === 0 ? 'kezdőérték' : 'egyforma érték (fentről/balról)';
 	 }

      solutionMatrix[i][j] = matrix[i][j] + Math.max(fromTop, fromLeft);
    }
  }
}`
	);
</script>

<!-- ==== Komponens markup ==== -->
<div class="algorithm-container">
	<Controls {currentStep} {totalSteps} on:start={startAlgorithm} />
	<div class="matrix-container">
		<!-- Bemeneti mátrix -->
		<div class="matrix">
			<div class="matrix-label">Eredeti mátrix</div>
			{#each matrix as row, i}
				<div class="row">
					{#each row as cell, j}
						<div
							class="cell
						{activeCell?.[0] === i && activeCell?.[1] === j ? 'active' : ''}
						{path.some(([pi, pj]) => pi === i && pj === j) ? 'path' : ''}"
						>
							{cell}
						</div>
					{/each}
				</div>
			{/each}
		</div>

		<!-- Megoldás mátrix -->
		<div class="matrix">
			<div class="matrix-label">Megoldás mátrix</div>
			{#each solutionMatrix as row, i}
				<div class="row">
					{#each row as cell, j}
						<div
							class="cell
						{activeCell?.[0] === i && activeCell?.[1] === j ? 'active' : ''}
						{path.some(([pi, pj]) => pi === i && pj === j) ? 'path' : ''}"
						>
							{cell}
						</div>
					{/each}
				</div>
			{/each}
		</div>
	</div>
</div>

<!-- ==== Stílus ==== -->
<style>

	.matrix-container {
		display: flex;
		justify-content: center;
		gap: 40px;
		margin-top: 1rem;
	}

	.matrix {
		display: flex;
		flex-direction: column;
		gap: 5px;
		margin: 1rem;
	}

	.row {
		display: flex;
		gap: 5px;
	}

	.cell {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #2f4f4f;
		color: white;
		font-weight: bold;
		border-radius: 5px;
		transition: background-color 0.2s;
	}

	.cell.active {
		background-color: gold;
		color: black;
	}

	.matrix-label {
		text-align: center;
		color: #ccc;
		margin-bottom: 5px;
		font-size: 0.9rem;
	}
	.cell.path {
		background-color: limegreen;
		color: black;
	}
</style>
