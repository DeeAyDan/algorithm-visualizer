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
		resumeSignal
	} from '../stores/store.svelte.js';
	import Controls from '../routes/Controls.svelte';
	import { get } from 'svelte/store';

	// ==== Alapadatok ====
	const size = 4;
	let matrix = generateMatrix(size);
	let solutionMatrix = [...matrix];
	let activeCell: [number, number] | null = null;

	currentStep.set(0);
	algorithmStatus.set('idle');
	consoleLog.set([]);

	// ==== Segédfüggvények ====
	function generateMatrix(n) {
		return Array.from({ length: n }, () =>
			Array.from({ length: n }, () => Math.floor(Math.random() * 19 + 1))
		);
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

	async function pauseIfNeeded() {
		if (get(algorithmStatus) === 'paused') {
			await waitUntilResume();
		}
	}

	async function restartAlgorithm() {
		if (get(algorithmStatus) === 'finished') {
			await new Promise((resolve) => {
				const unsub = resumeSignal.subscribe(() => {
					if (get(algorithmStatus) === 'idle') {
						consoleLog.set([]);
						currentStep.set(0);
						matrix = generateMatrix(size);
						path = [];
						solutionMatrix = [...matrix];
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
			await pauseIfNeeded();
			await delay(900 - get(speed) * 8);

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

			log(`Megoldás [${i},${j}] = ${solutionMatrix[i][j]} (${chosenFrom})`);
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
		consoleLog.update((logs) => [...logs, 'MaxSumPath indítása...']);
		await maxSumPath();
		consoleLog.update((logs) => [...logs, 'MaxSumPath kész!']);
		algorithmStatus.set('finished');
		reconstructPath();
		await restartAlgorithm();
	}

	// ==== Lépésszám beállítás (opcionális, ha számolni akarod később) ====
	onMount(() => {
		totalSteps.set(size * size); // jelenlegi logika szerint
	});

	// ==== Forráskód beállítás ====
	selectedAlgorithmSourceCode.set(`Max sum path`);
</script>

<!-- ==== Komponens markup ==== -->
<div class="algorithm-container">
	<Controls {currentStep} {totalSteps} on:start={startAlgorithm} />
	<div class="tag">Canvas</div>
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
	.tag {
		display: inline-block;
		top: 0;
		left: 0;
		background-color: #484848;
		color: white;
		padding: 3px;
	}
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
