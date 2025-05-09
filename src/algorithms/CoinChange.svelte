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
	activeLine.set(-1);
	let exchangeCoins = [1, 4, 6, 10];
	const displayName = algorithmDisplayNames[get(selectedAlgorithm)];
	let dpTable: { index: number; value: number; coin: number }[] = [];
	let lastCoinTable = [];

	let moneyToExchange = 29;

	let newCoin = 0;
	let showInsertForm = false;
	let showDeleteList = false;

	function openInsertForm() {
		showInsertForm = !showInsertForm;
		showDeleteList = false;
	}

	function openDeleteList() {
		showDeleteList = !showDeleteList;
		showInsertForm = false;
	}

	function insertNewCoin() {
		if (newCoin > 0) {
			if (exchangeCoins.includes(Number(newCoin))) {
				consoleLog.update((logs) => [...logs, 'Ez az érme már szerepel a listában!']);
				showInsertForm = false;
				return;
			}
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

					usedCoins = [];
					dpTable = [];

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

		showInsertForm = false;
		showDeleteList = false;

		let amount = Math.floor(moneyToExchange);
		let coins = exchangeCoins.map((c) => Math.floor(c));
		dpTable = [];

		await coinExchange(amount, coins);

		consoleLog.update((logs) => [...logs, 'A futás befejeződött!']);
		algorithmStatus.set('finished');
		await restartAlgorithm();
	}

	async function coinExchange(amount, coins) {
		lastCoinTable = Array(amount + 1).fill(-1);
		dpTable[0] = 0;

		let dp = Array(amount + 1).fill(Infinity);
		let lastCoin = Array(amount + 1).fill(-1);

		dp[0] = 0;

		totalSteps.set(amount);

		for (let i = 1; i <= amount; i++) {
			activeLine.set(6);
			await pauseIfNeeded();
			await delay(700 - get(speed) * 8);
			for (let coin of coins) {
				activeLine.set(7);
				await pauseIfNeeded();
				await delay(700 - get(speed) * 8);
				if (i - coin >= 0 && dp[i - coin] + 1 < dp[i]) {
					dp[i] = dp[i - coin] + 1;
					lastCoin[i] = coin;
					activeLine.set(9);
					await pauseIfNeeded();
					await delay(700 - get(speed) * 8);
				}
			}

			dpTable = [...dpTable, { index: i, value: dp[i], coin: lastCoin[i] }];

			activeLine.set(12);
			await pauseIfNeeded();
			await delay(700 - get(speed) * 8);
			log(`Összeg: ${i}, Minimum érme: ${dp[i]}, Utolsó érme: ${lastCoin[i]}`);
		}

		usedCoins = [];
		let current = amount;
		while (current > 0) {
			let coin = lastCoin[current];
			if (coin === -1) {
				activeLine.set(20);
				await pauseIfNeeded();
				await delay(700 - get(speed) * 8);
				consoleLog.update((logs) => [...logs, 'Nem lehet pontosan felváltani!']);
				break;
			}
			usedCoins.push(coin);
			current -= coin;
		}

		activeLine.set(-1);

		consoleLog.update((logs) => [...logs, `Minimum érme szám: ${usedCoins.length}`]);
		consoleLog.update((logs) => [...logs, `Felhasznált érmék: ${usedCoins}`]);
	}

	// ==== Forráskód megjelenítés ====
	selectedAlgorithmSourceCode.set(
		`function coinExchange(amount, coins) {
  lastCoinTable = Array(amount + 1).fill(-1);
  let dp = Array(amount + 1).fill(Infinity);
  let lastCoin = Array(amount + 1).fill(-1);
  dp[0] = 0;
    for (let i = 1; i <= amount; i++) {
      for (let coin of coins) {
        if (i - coin >= 0 && dp[i - coin] + 1 < dp[i]) {
          dp[i] = dp[i - coin] + 1;
          lastCoin[i] = coin;
        }
      }
      dpTable = [...dpTable, { index: i, value: dp[i], coin: lastCoin[i] }];
    }

  usedCoins = [];
  let current = amount;
  while (current > 0) {
    let coin = lastCoin[current];
    if (coin === -1) {
      break;
    }
    usedCoins.push(coin);
    current -= coin;
  }
}`
	);
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
							{coin}
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
	<div class="tag">Vászon</div>
	<div class="coin-visual">
		<div class="left-container">
			<div>Felhasználható</div>
			<div>érmék</div>
			<div class="exchange-coins">
				{#each exchangeCoins as coin}
					<div class="coin">
						{coin}
					</div>
				{/each}
			</div>
		</div>
		<div class="change-table">
			<table>
				<thead>
					<tr>
						<th>Összeg</th>
						<th>Minimum érme</th>
						<th>Utolsó érme</th>
					</tr>
				</thead>
				<tbody>
					{#each dpTable as row}
						<tr>
							<td>{row.index}</td>
							<td>{row.value === Infinity ? '∞' : row.value}</td>
							<td>{row.coin === -1 ? '-' : row.coin}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<div class="right-container">
			<div class="exchange-field">
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
		gap: 40px;
		justify-content: space-between;
		align-items: flex-start;
		min-height: 200px;
		margin: 1rem;
	}
	.exchange-coins {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 5px;
		margin-top: 1rem;
	}
	.coin {
		background-color: gold;
		color: black;
		display: flex;
		justify-content: center;
		align-items: center;
		border-radius: 100%;
		border: 3px solid orange;
		width: 35px;
		height: 35px;
	}
	.custom-input {
		display: flex;
		flex-direction: row;
		justify-content: space-around;
		align-items: center;
		gap: 10px;
		padding: 0.5rem;
		border-bottom: 3px solid #505050;
	}
	.custom-input input {
		width: 55px;
		padding: 0.5rem;
		margin-right: 10px;
		border-radius: 5px;
		background-color: #2f2f2f;
		border: 3px solid #505050;
	}
	.custom-input button {
		padding: 0.5rem 1rem;
		background-color: #444;
		color: aliceblue;
		border: none;
		border-radius: 5px;
		cursor: pointer;
	}
	.custom-input button:hover {
		background-color: #5cb85c;
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
	.dropdown button {
		width: 100%;
		padding: 5px;
		background-color: #3a3a3a;
		color: white;
		border: 1px solid #666;
	}
	.dropdown input {
		align-self: center;
		width: 90%;
		padding: 5px;
		background-color: #3a3a3a;
		color: white;
		border: 1px solid #666;
	}
	.delete-item {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		align-items: center;
		background-color: #3a3a3a;
		padding: 5px;
		border-radius: 4px;
	}
	.left-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 200px;
	}
	.right-container {
		width: 200px;
	}
	.used-coins {
		display: flex;
		flex-wrap: wrap;
		margin-top: 1rem;
		gap: 4px;
	}
	.change-table {
		flex: 1;
		height: 200px;
		overflow: auto;
	}
	.change-table table {
		border-collapse: collapse;
		width: 100%;
		background-color: #2f2f2f;
		color: white;
	}
	.change-table th,
	.change-table td {
		border: 1px solid #505050;
		padding: 5px;
		text-align: center;
	}
</style>
