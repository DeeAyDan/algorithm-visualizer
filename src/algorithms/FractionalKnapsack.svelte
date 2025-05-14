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
	let selectedItem = null;
	let removedAmountFromSelectedItem = 0;

	let sackSize = 50;
	let sackFilled = 30;
	let sackValue = 0;

	let items = [
		{ name: 'Tárgy 1', value: 10, weight: 5, color: getRandomColor(), ratio: 2 },
		{ name: 'Tárgy 2', value: 20, weight: 20, color: getRandomColor(), ratio: 1 }
	];

	// Create reactive sack array
	$: sack = Array(sackSize).fill(null);
	$: totalSteps.set(
		Math.min(
			sackSize,
			items.reduce((acc, item) => acc + item.weight, 0)
		)
	);

	// ==== Előkalkulált lépésszám ====
	onMount(() => {
		resetParameters();
	});

	function resetParameters() {
		algorithmStatus.set('idle');
		currentStep.set(0);
		consoleLog.set([]);
		activeLine.set({ start: -1, end: -1 });

		sackFilled = 0;
		sackValue = 0;
		sack = Array(sackSize).fill(null);
		items.forEach((item) => {
			item.color = getRandomColor();
		});
		items = [...items];
	}

	function getRandomColor() {
		const r = Math.floor(Math.random() * 256);
		const g = Math.floor(Math.random() * 256);
		const b = Math.floor(Math.random() * 256);
		return `rgb(${r}, ${g}, ${b})`;
	}

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
		showInsertForm = !showInsertForm;
		showDeleteList = false;
	}

	function openDeleteList() {
		showDeleteList = !showDeleteList;
		showInsertForm = false;
	}

	function insertNewItem() {
		if (newItemName && newItemValue > 0 && newItemWeight > 0) {
			const randomColor = `hsl(${Math.random() * 360}, 70%, 50%)`;
			const ratio = newItemValue / newItemWeight;

			if (newItemWeight > 24) {
				consoleLog.update((logs) => [...logs, `A súly nem lehet nagyobb, mint 24!`]);
				return;
			}
			if (items.length > 4) {
				consoleLog.update((logs) => [...logs, `Túl sok tárgy van! Maximum 4 lehet!`]);
				showInsertForm = false;
				return;
			}

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

	// ==== InsersionSort futás ====
	async function startAlgorithm(event) {
		consoleLog.set([]);
		currentStep.set(0);
		consoleLog.update((logs) => [...logs, `${displayName} indítása...`]);

		await knapSack();
		activeLine.set({ start: -1, end: -1 });

		consoleLog.update((logs) => [...logs, 'A futás befejeződött!']);
		algorithmStatus.set('finished');
		await restartAlgorithm();
	}

	async function knapSack() {
		items = items.map((item) => ({
			...item,
			ratio: item.value / item.weight
		}));

		let sortedItems = [...items].sort((a, b) => b.ratio - a.ratio);

		for (let item of sortedItems) {
			let canTake = Math.min(item.weight, sackSize - sackFilled);
			let filledWeight = 0;
			selectedItem = item;
			removedAmountFromSelectedItem = 0;

			activeLine.set({ start: 5, end: 8 });
			await delay(900 - get(speed) * 8);
			await pauseIfNeeded();
			for (let i = 0; i < sack.length && canTake > 0; i++) {
				if (sack[i] === null) {
					sack[i] = { ...item };
					canTake--;
					filledWeight++;
					removedAmountFromSelectedItem++;

					let percentFilled = (filledWeight / item.weight) * 100;
					sackValue += item.value / item.weight;

					activeLine.set({ start: 12, end: 19 });
					await delay(900 - get(speed) * 8);
					await pauseIfNeeded();
					log(`Hozzáadva: ${item.name} (${percentFilled.toFixed(1)}%)`);
				}
			}
			item.color = `#484848`;

			let fraction = filledWeight / item.weight;
			consoleLog.update((logs) => [
				...logs,
				`${item.name} hozzáadva (${(fraction * 100).toFixed(1)}%)`
			]);

			if (sackFilled >= sackSize) break;
			sackFilled = sack.filter((x) => x !== null).length;
		}
		selectedItem = null;
	}

	// ==== Forráskód megjelenítés ====
	selectedAlgorithmSourceCode.set(
		`function knapSack() {
  items = items.map((item) => ({...item, ratio: item.value / item.weight}));
  let sortedItems = [...items].sort((a, b) => b.ratio - a.ratio);
 
  for (let item of sortedItems) {
    let canTake = Math.min(item.weight,
                  sackSize - sackFilled);
    let filledWeight = 0;

    for (let i = 0; i < sack.length && canTake > 0; i++) {

      if (sack[i] === null) {
        sack[i] = item;
        canTake--;
        filledWeight++;
        let percentFilled = (filledWeight 
                    / item.weight) * 100;
        sackValue += item.value * (percentFilled / 100);
      }

    }

    let fraction = filledWeight / item.weight;
    sackValue += item.value * fraction;

    if (sackFilled >= sackSize) break;
    sackFilled = sack.filter((x) => x !== null).length;
    }
}`
	);
</script>

<div class="custom-input">
	<div>
		<label for="order">Méret:</label>
		<input id="order" type="number" disabled={$algorithmStatus !== 'idle'} bind:value={sackSize} />
	</div>
	<div class="custom-buttons">
		<div class="button-group">
			<button disabled={$algorithmStatus !== 'idle'} on:click={openInsertForm}>Beszúrás</button>
			{#if showInsertForm}
				<div class="dropdown insert-dropdown">
					<input placeholder="Tárgy neve" maxlength="12" bind:value={newItemName} />
					<div>Tárgy értéke</div>
					<input type="number" placeholder="Érték" max="1000" bind:value={newItemValue} />
					<div>Tárgy súlya</div>
					<input type="number" placeholder="Súly" max="24" bind:value={newItemWeight} />
					<button on:click={insertNewItem}>Hozzáadás</button>
				</div>
			{/if}
		</div>
		<div class="button-group">
			<button disabled={$algorithmStatus !== 'idle'} on:click={openDeleteList}>Törlés</button>
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
	<div class="sack-visual">
		<div class="sack-container">
			<div class="sack-text">Táska mérete</div>
			<div class="sack">
				{#each sack as cell, i}
					<div
						class="sack-space {cell ? 'filled' : ''}"
						style="background-color: {cell
							? cell.color
							: 'white'}; transition: background-color 0.4s ease;"
					></div>
				{/each}
			</div>

			<div class="sack-text">Táska értéke</div>
			<div class="sack-text sack-value-text">
				{sackValue.toFixed(2)}
			</div>
		</div>
		<div class="items-container">
			<div>Tárgyak</div>
			<div class="item-cards">
				{#each items as item}
					<div
						class="item {selectedItem === item ? 'active' : ''}"
						style=" border: {item === selectedItem ? '3px solid #ffd700' : '3px solid #484848;'};"
					>
						<div class="item-name">{item.name}</div>
						<div class="item-value">Érték: {item.value}</div>
						<div class="item-weight-text">Súly: {item.weight}</div>
						<div class="item-weight">
							{#each Array(item.weight) as _, j}
								<div
									class="item-space"
									style="background-color: {item === selectedItem &&
									removedAmountFromSelectedItem > j
										? '#484848'
										: item.color};"
								></div>
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
	.sack-visual {
		display: flex;
		gap: 40px;
		justify-content: flex-start;
		height: 100%;
		margin: 1rem 1rem 1rem 2rem;
	}
	.sack-text {
		text-align: center;
		font-weight: bold;
		margin-bottom: 2px;
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
		flex-wrap: wrap;
		display: flex;
		gap: 5px;
		margin: 10px;
	}
	.item.active {
		border: 3px solid #222;
		transform: scale(1.05);
		box-shadow: 0 0 10px rgba(0, 0, 0, 0.4);
		transition: all 0.3s ease;
	}
	.item {
		min-width: 140px;
		min-height: 140px;
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 23%;
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
		flex: 1;
		justify-content: center;
		align-items: flex-start;
		gap: 2px;
		width: 50%;
	}
	.sack-space,
	.item-space {
		width: 10px;
		height: 10px;
		background-color: white;
		transition: transform 0.2s;
	}
	.sack-space.filled {
		transform: scale(1.1);
		animation: pop 0.3s ease;
	}
	@keyframes pop {
		0% {
			transform: scale(0.8);
		}
		50% {
			transform: scale(1.1);
		}
		100% {
			transform: scale(1);
		}
	}
	.insert-dropdown {
		align-items: center;
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
		text-align: center;
		font-size: 1rem;
		width: 55px;
		padding: 0.5rem;
		border-radius: 5px;
		background-color: #2f2f2f;
		border: 3px solid #505050;
	}
	.custom-input input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		border-color: #3a3a3a;
	}
	.custom-input button {
		padding: 0.5rem 1rem;
		background-color: #444;
		color: aliceblue;
		border: none;
		border-radius: 5px;
		cursor: pointer;
	}
	.custom-input button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		border-color: #3a3a3a;
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
</style>
