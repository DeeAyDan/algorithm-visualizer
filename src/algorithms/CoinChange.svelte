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
	let exchangeCoins = [0.01, 0.02, 0.05, 0.1, 0.25, 0.5, 1, 5, 10];
	const displayName = algorithmDisplayNames[get(selectedAlgorithm)];

	let moneyToExchange = 1.29;

	// ==== Vizualizációs indexek ====

	// ==== Előkalkulált lépésszám ====
	onMount(() => {
		totalSteps.set(0);
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

					// adatok vissza allitasa ide

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

		// Algoritmust indito fuggveny ide

		consoleLog.update((logs) => [...logs, 'A futás befejeződött!']);
		algorithmStatus.set('finished');
		await restartAlgorithm();
	}

	// ==== Forráskód megjelenítés ====
	selectedAlgorithmSourceCode.set(`Algoritmus neve`);
</script>

<!-- Controls -->
<div class="custom-input">
	<div>
		<label for="order">Felváltandó:</label>
		<input id="order" bind:value={moneyToExchange} />
	</div>
	<div>
		<input id="order" />
		<button>Beszúrás</button>
	</div>
	<div>
		<input id="order" />
		<button>Kivétel</button>
	</div>
</div>

<!-- ==== Komponens markup ==== -->
<div class="algorithm-container">
	<Controls {currentStep} {totalSteps} on:start={startAlgorithm} />
	<div class="tag">Canvas</div>
	<div class="coin-visual">
		<div>Felhasználható érmék</div>
		<div class="exchangeCoins">
			{#each exchangeCoins as coin}
				<div class="coin">
					{coin}
				</div>
			{/each}
		</div>
		<div class="exchangeField">
			<div>Felváltandó: {moneyToExchange}</div>
			<div>Felhasznált érmék:</div>
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
	.coin-visual {
		display: flex;
		gap: 4px;
		justify-content: center;
		align-items: flex-end;
		min-height: 200px;
		margin: 1rem 0 0 0;
	}

	.exchangeCoins {
		display: grid;
		grid-template-columns: 33% 33% 33%;
		gap: 5px;
	}

	.coin {
		background-color: gold;
		color: black;
		display: flex;
		justify-content: center;
		align-items: center;
		border-radius: 100%;
		border: 3px solid orange;
		width: 70px;
		height: 70px;
	}

	.custom-input {
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
		gap: 10px;
		padding: 1rem;
		border-bottom: 3px solid #505050;
	}
	.custom-input input {
		text-align: center;
		width: 60px;
		padding: 5px;
		font-size: 1rem;
		background-color: #2f2f2f;
		border: 3px solid #505050;
	}
	.custom-input button {
		width: 150px;
		text-align: center;
		padding: 5px;
		font-size: 1rem;
		background-color: #2f2f2f;
		cursor: pointer;
	}
	.custom-input label {
		width: 150px;
		text-align: center;
		padding: 5px;
		font-size: 1rem;
		background-color: #2f2f2f;
		cursor: pointer;
	}
</style>
