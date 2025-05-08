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

	// ==== Alapadatok ====

	currentStep.set(0);
	algorithmStatus.set('idle');
	consoleLog.set([]);
	const displayName = algorithmDisplayNames[get(selectedAlgorithm)];
	let inputNumber = 5;
	let steps: number[] = [];
	activeLine.set(-1);

	// ==== Előkalkulált lépésszám ====
	onMount(() => {
		let steps = 0;
		totalSteps.set(recursiveFactorialCounting(inputNumber));
	});

	function recursiveFactorialCounting(n: number) {
		steps++;

		if (n === 0 || n === 1) {
			steps++;
			return 1;
		}

		steps++;
		const partial = recursiveFactorialCounting(n - 1);
		const result = n * partial;

		return steps;
	}

	// ==== Késleltetés és vezérlés ====
	async function log(message: string) {
		consoleLog.update((logs) => [...logs, message]);
		currentStep.update((n) => n + 1);
		await pauseIfNeeded();
		await delay(900 - get(speed) * 8);
	}

	function delay(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	function waitUntilResume() {
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
			await waitUntilRestart();
		}
	}

	function waitUntilRestart(): Promise<void> {
		return new Promise((resolve) => {
			const unsub = resumeSignal.subscribe(() => {
				if (get(algorithmStatus) === 'idle') {
					consoleLog.set([]);
					currentStep.set(0);
					inputNumber = 5;
					unsub();
					resolve();
				}
			});
		});
	}

	// ==== InsersionSort futás ====
	async function startAlgorithm(event) {
		consoleLog.set([]);
		currentStep.set(0);
		consoleLog.update((logs) => [...logs, `${displayName} indítása...`]);

		steps = 0;
		totalSteps.set(recursiveFactorialCounting(inputNumber));
		let result = await recursiveFactorial(inputNumber);
		consoleLog.update((logs) => [...logs, `Végeredmény: ${inputNumber}! = ${result}`]);

		activeLine.set(-1);
		algorithmStatus.set('finished');
		await restartAlgorithm();
	}

	async function recursiveFactorial(n: number): Promise<number> {
		activeLine.set(4);
		await log(`Belépés: factorial(${n})`);

		if (n === 0 || n === 1) {
			activeLine.set(2);
			await log(`Alapeset: ${n}! = 1`);
			return 1;
		}
		const partial = await recursiveFactorial(n - 1);
		const result = n * partial;

		activeLine.set(4);
		await log(`Visszatérés: ${n}! = ${n} * ${partial} = ${result}`);

		return result;
	}

	// ==== Forráskód megjelenítés ====
	selectedAlgorithmSourceCode.set(
		`function recursiveFactorial(n) {
  if (n === 0 || n === 1) {
    return 1;
  }
  return n * recursiveFactorial(n - 1);
}`
	);
</script>

<!-- ===== Bemeneti mező a Controls alatt ===== -->
<div class="custom-input">
	<label for="inputNumber">Szám (n):</label>
	<input
		id="inputNumber"
		type="number"
		bind:value={inputNumber}
		min="0"
		placeholder="Adj meg egy számot"
	/>
</div>

<!-- ==== Komponens markup ==== -->
<div class="algorithm-container">
	<Controls {currentStep} {totalSteps} on:start={startAlgorithm} />
</div>

<!-- ==== Stílus ==== -->
<style>
	.custom-input {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 10px;
		padding: 1rem;
		border-bottom: 6px solid #505050;
	}
	.custom-input input {
		width: 60px;
		padding: 5px;
		font-size: 1rem;
		background-color: #2f2f2f;
		border: 3px solid #505050;
	}
</style>
