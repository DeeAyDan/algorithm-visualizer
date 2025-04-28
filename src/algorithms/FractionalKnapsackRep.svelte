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

	let items = [
		{ name: 'Tárgy 1', value: 10, weight: 5, color: getRandomColor(), ratio: 2 },
		{ name: 'Tárgy 2', value: 20, weight: 20, color: getRandomColor(), ratio: 1 }
	];

	function getRandomColor() {
		const r = Math.floor(Math.random() * 256);
		const g = Math.floor(Math.random() * 256);
		const b = Math.floor(Math.random() * 256);
		return `rgb(${r}, ${g}, ${b})`;
	}

	let sackSize = 50;
	let sackFilled = 30;
	let sackValue = 0;

	let sack = Array(sackSize).fill(null);

	function addItem(name, value, weight) {
		items = [
			...items,
			{
				name: newItemName,
				value: newItemValue,
				weight: newItemWeight,
				color: randomColor,
				ratio: value / weight
			}
		];
	}

	let showInsertForm = false;
	let showDeleteList = false;

	// Új tárgy adatainak ideiglenes tárolása
	let newItemName = '';
	let newItemValue = 0;
	let newItemWeight = 0;

	// Törléshez kijelölt index
	let selectedItemIndex = null;

	function openInsertForm() {
		showInsertForm = true;
		showDeleteList = false;
	}

	function openDeleteList() {
		showDeleteList = true;
		showInsertForm = false;
	}

	function insertNewItem() {
		if (newItemName && newItemValue > 0 && newItemWeight > 0) {
			const randomColor = `hsl(${Math.random() * 360}, 70%, 50%)`;
			const ratio = newItemValue / newItemWeight;

			items = [
				...items,
				{
					name: newItemName,
					value: newItemValue,
					weight: newItemWeight,
					color: randomColor,
					ratio: ratio
				}
			];

			newItemName = '';
			newItemValue = 0;
			newItemWeight = 0;
			showInsertForm = false;
		}
	}

	function deleteItem(index) {
		items = items.filter((_, i) => i !== index);
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

	// ==== InsersionSort futás ====
	async function startAlgorithm(event) {
		consoleLog.set([]);
		currentStep.set(0);
		consoleLog.update((logs) => [...logs, `${displayName} indítása...`]);

		// Reset zsák
		sack = Array(sackSize).fill(null);
		sackFilled = 0;
		sackValue = 0;

		// Frissítjük a ratio-kat (ha változott pl. kézi beírásnál)
		items = items.map((item) => ({
			...item,
			ratio: item.value / item.weight
		}));

		// Beállítjuk a total steps-t
		totalSteps.set(items.length);

		// Rendezzük a tárgyakat arány szerint
		let sortedItems = [...items].sort((a, b) => b.ratio - a.ratio);
		let item = sortedItems[0];
		let canTake = sackSize;

		 while(canTake > 0) {
			await pauseIfNeeded();
			await delay(900 - get(speed) * 8);

			canTake = Math.min(item.weight, sackSize - sackFilled);
			let fraction = canTake / item.weight;

			for (let i = 0; i < sack.length && canTake > 0; i++) {
				if (sack[i] === null) {
					sack[i] = item;
					canTake--;
					await delay(90 - get(speed) * 8);

				}
			}

			sackValue += item.value * fraction;
			log(`${item.name} hozzáadva (${(fraction * 100).toFixed(1)}%)`);

			if (sackFilled >= sackSize) {
				break;
			}

			sackFilled = sack.filter((x) => x !== null).length;
		}

		consoleLog.update((logs) => [...logs, 'A futás befejeződött!']);
		algorithmStatus.set('finished');
		await restartAlgorithm();
	}

	// ==== Forráskód megjelenítés ====
	selectedAlgorithmSourceCode.set(`Algoritmus neve`);
</script>

<div class="custom-input">
	<div>
		<label for="order">Méret:</label>
		<input id="order" type="number" bind:value={sackSize} />
	</div>
	<div class="custom-buttons">
		<div class="button-group">
			<button on:click={openInsertForm}>Beszúrás</button>
			{#if showInsertForm}
				<div class="dropdown insert-dropdown">
					<input placeholder="Tárgy neve" bind:value={newItemName} />
					<div>Tárgy értéke</div>
					<input type="number" placeholder="Érték" bind:value={newItemValue} />
					<div>Tárgy súlya</div>
					<input type="number" placeholder="Súly" bind:value={newItemWeight} />
					<button on:click={insertNewItem}>Hozzáadás</button>
				</div>
			{/if}
		</div>
		<div class="button-group">
			<button on:click={openDeleteList}>Törlés</button>
			{#if showDeleteList}
				<div class="dropdown">
					{#each items as item, index}
						<div class="delete-item">
							<span>{item.name}</span>
							<button on:click={() => deleteItem(index)}>Törlés</button>
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
	<div class="sack-visual">
		<div class="sack-container">
			<div>Táska mérete</div>
			<div class="sack">
				{#each sack as item}
					<div class="sack-space" style="background-color: {item ? item.color : 'white'};"></div>
				{/each}
			</div>

			<div>Táska értéke</div>
			<div class="sack-value">
				{sackValue}
			</div>
		</div>
		<div class="items-container">
			<div>Tárgyak</div>
			<div class="item-cards">
				{#each items as item}
					<div class="item">
						<div class="item-name">{item.name}</div>
						<div class="item-value">Érték: {item.value}</div>
						<div class="item-weight-text">Súly: {item.weight}</div>
						<div class="item-weight">
							{#each Array(item.weight) as _, j}
								<div class="item-space" style="background-color: {item.color};"></div>
							{/each}
						</div>
						<div class="item-ratio">Arány: {item.ratio.toFixed(2)}</div>
					</div>
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
	.sack-visual {
		display: flex;
		gap: 40px;
		justify-content: flex-start;
		height: 100%;
		margin: 1rem 1rem 1rem 2rem;
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
	.sack-container {
		display: flex;
		height: 100%;
		width: 200px;
		flex-direction: column;
		align-items: center;
	}
	.items-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100%;
	}
	.item-cards {
		width: 100%;
		display: flex;
		gap: 5px;
		margin: 10px;
	}
	.item {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 23%;
		border: 3px solid #484848;
	}
	.sack {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		gap: 2px;
		width: 100%;
		margin: 10px;
	}
	.item-weight {
		margin: 5px;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		gap: 2px;
		width: 50%;
	}
	.sack-space,
	.item-space {
		width: 10px;
		height: 10px;
		background-color: white;
	}
	.custom-buttons {
		display: flex;
		gap: 20px;
		position: relative;
	}

	.button-group {
		position: relative;
	}
	.insert-dropdown {
		align-items: center;
	}
	.dropdown {
		position: absolute;
		top: 110%; /* a gomb alá helyezzük */
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

	.dropdown input,
	.dropdown button {
		width: 90%;
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

	.delete-item {
		display: flex;
		flex-direction: column;
		gap: 5px;
		justify-content: space-between;
		align-items: center;
		background-color: #2f2f2f;
		padding: 5px;
		border: 1px solid #484848;
	}
</style>
