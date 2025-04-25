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
		resumeSignal
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

	// ==== Vizualizációs indexek ====

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
					inputNumber = 5;
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

	// ==== InsersionSort futás ====
	async function startAlgorithm(event) {
		consoleLog.set([]);
		currentStep.set(0);
		consoleLog.update((logs) => [...logs, `${displayName} indítása...`]);

		steps = 0;
		totalSteps.set(recursiveFactorialCounting(inputNumber));
		let result = await recursiveFactorial(inputNumber);
		consoleLog.update((logs) => [...logs, `Végeredmény: ${inputNumber}! = ${result}`]);

		algorithmStatus.set('finished');
		await restartAlgorithm();
	}

	async function recursiveFactorial(n: number): Promise<number> {
		log(`Belépés: factorial(${n})`);
		await pauseIfNeeded();
		await delay(900 - get(speed) * 8);

		if (n === 0 || n === 1) {
			log(`Alapeset: ${n}! = 1`);
			await pauseIfNeeded();
			await delay(900 - get(speed) * 8);
			return 1;
		}

		const partial = await recursiveFactorial(n - 1);
		const result = n * partial;

		log(`Visszatérés: ${n}! = ${n} * ${partial} = ${result}`);
		await pauseIfNeeded();
		await delay(900 - get(speed) * 8);

		return result;
	}

	// ==== Forráskód megjelenítés ====
	selectedAlgorithmSourceCode.set(`function factorial(n) {
	let result = 1;
	for (let i = 1; i <= n; i++) {
		result *= i;
	}
	return result;
}`);
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
		justify-content: flex-start;
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
</style>
