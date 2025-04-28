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

	let newCoin = 0;
	let showInsertForm = false;
	let showDeleteList = false;

	function openInsertForm() {
		showInsertForm = true;
		showDeleteList = false;
	}

	function openDeleteList() {
		showDeleteList = true;
		showInsertForm = false;
	}

	function insertNewCoin() {
		if (newCoin > 0) {
			exchangeCoins = [...exchangeCoins, Number(newCoin)].sort((a, b) => a - b);
			newCoin = 0;
			showInsertForm = false;
		}
	}

	function deleteCoin(index) {
	const newArray = [...exchangeCoins];
	newArray.splice(index, 1);
	exchangeCoins = newArray;
	showDeleteList = false;
}


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

	let usedCoins = [];

	// ==== InsersionSort futás ====
	async function startAlgorithm(event) {
		consoleLog.set([]);
		currentStep.set(0);
		consoleLog.update((logs) => [...logs, `${displayName} indítása...`]);

		let amount = Math.round(moneyToExchange * 100); // Centekben számolunk az egyszerűség kedvéért
		let coins = exchangeCoins.map((c) => Math.round(c * 100)); // szintén centekben

		let dp = Array(amount + 1).fill(Infinity);
		let lastCoin = Array(amount + 1).fill(-1);

		dp[0] = 0;

		totalSteps.set(amount); // minden cent egy lépés lehet

		for (let i = 1; i <= amount; i++) {
			for (let coin of coins) {
				if (i - coin >= 0 && dp[i - coin] + 1 < dp[i]) {
					dp[i] = dp[i - coin] + 1;
					lastCoin[i] = coin;
				}
			}
			await pauseIfNeeded();
			await delay(40 - get(speed) * 2); // gyors kis lépések
			currentStep.update((n) => n + 1);
		}

		// Visszafejtjük a megoldást
		usedCoins = [];
		let current = amount;
		while (current > 0) {
			let coin = lastCoin[current];
			if (coin === -1) {
				consoleLog.update((logs) => [...logs, 'Nem lehet pontosan felváltani!']);
				break;
			}
			usedCoins.push(coin / 100); // Vissza váltjuk forintra
			current -= coin;
		}

		// Megjelenítjük
		log(`Minimum érme szám: ${usedCoins.length}`);
		usedCoins.forEach((coin) => log(`Érme felhasználva: ${coin.toFixed(2)} Ft`));

		totalSteps.set(usedCoins.length);

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

	<div class="custom-buttons">
		<div class="button-group">
			<button on:click={openInsertForm}>Beszúrás</button>
			{#if showInsertForm}
				<div class="dropdown">
					<input type="number" placeholder="Érme értéke" bind:value={newCoin} />
					<button on:click={insertNewCoin}>Hozzáadás</button>
				</div>
			{/if}
		</div>

		<div class="button-group">
			<button on:click={openDeleteList}>Kivétel</button>
			{#if showDeleteList}
				<div class="dropdown">
					{#each exchangeCoins as coin, index}
						<div class="delete-item">
							{coin.toFixed(2)} Ft
							<button on:click={() => deleteCoin(index)}>Törlés</button>
						</div>
					{/each}
				</div>
			{/if}
		</div>
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
			<div class="used-coins">
				{#each usedCoins as coin}
					<div class="coin">{coin}</div>
				{/each}
			</div>
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
	.custom-buttons {
	display: flex;
	gap: 20px;
	position: relative;
}

.button-group {
	position: relative;
}

.dropdown {
	position: absolute;
	top: 110%;
	left: 0;
	background-color: #2f2f2f;
	border: 2px solid #505050;
	padding: 10px;
	display: flex;
	flex-direction: column;
	gap: 8px;
	min-width: 200px;
	z-index: 10;
}

.dropdown input, .dropdown button {
	width: 100%;
	padding: 5px;
	background-color: #3a3a3a;
	color: white;
	border: 1px solid #666;
}

.delete-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	background-color: #3a3a3a;
	padding: 5px;
	border-radius: 4px;
}

</style>
