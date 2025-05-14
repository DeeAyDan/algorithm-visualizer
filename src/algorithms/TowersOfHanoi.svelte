<script lang="ts">
	// @ts-nocheck
	import { onMount } from 'svelte';
	import {
		selectedAlgorithmSourceCode,
		currentStep,
		totalSteps,
		selectedAlgorithm,
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

	// ==== Algorithm Parameters ====
	let numDisks = 5;
	let towers: number[][] = [[], [], []];
	let initTowers: number[][] = [[], [], []];
	let movingDisk = null;
	let sourcePosition = null;
	let targetPosition = null;
	let animationInProgress = false;

	// Configuration
	const TOWER_NAMES = ['A', 'B', 'C'];
	const DISK_COLORS = [
		'#FF5252',
		'#FF7F50',
		'#FFEB3B',
		'#66BB6A',
		'#29B6F6',
		'#5C6BC0',
		'#AB47BC',
		'#EC407A',
		'#26A69A'
	];

	function initializeTowers() {
		if (numDisks < 1) {
			numDisks = 1;
		} else if (numDisks > 9) {
			numDisks = 9;
		}
		towers = [[], [], []];
		for (let i = numDisks; i >= 1; i--) {
			towers[0].push(i);
		}
		initTowers = JSON.parse(JSON.stringify(towers));
		totalSteps.set(Math.pow(2, numDisks) - 1);
	}

	// ==== Initialize on mount ====
	onMount(() => {
		resetParameters();
	});

	function resetParameters() {
		currentStep.set(0);
		consoleLog.set([]);
		activeLine.set({ start: -1, end: -1 });

		movingDisk = null;
		sourcePosition = null;
		targetPosition = null;
		animationInProgress = false;
		initializeTowers();
	}

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

	// ==== Hanoi Algorithm ====
	async function startAlgorithm(event) {
		consoleLog.set([]);
		currentStep.set(0);
		initializeTowers();
		consoleLog.update((logs) => [
			...logs,
			`${displayName} algoritmus indítása ${numDisks} koronggal...`
		]);

		await hanoi(numDisks, 0, 2, 1);
		activeLine.set({ start: -1, end: -1 });

		consoleLog.update((logs) => [...logs, 'A futás sikeresen befejeződött!']);
		algorithmStatus.set('finished');
		await restartAlgorithm();
	}

	async function hanoi(n: number, from: number, to: number, aux: number) {
		if (n === 0) return;

		activeLine.set({ start: 1, end: 1 });
		await delay(300 - get(speed) * 3);
		await pauseIfNeeded();

		activeLine.set({ start: 3, end: 3 });
		await delay(300 - get(speed) * 3);
		await pauseIfNeeded();
		await hanoi(n - 1, from, aux, to);

		activeLine.set({ start: 4, end: 4 });
		await delay(300 - get(speed) * 3);
		await pauseIfNeeded();
		await moveDisk(from, to);

		activeLine.set({ start: 5, end: 5 });
		await delay(300 - get(speed) * 3);
		await pauseIfNeeded();
		await hanoi(n - 1, aux, to, from);
	}

	async function moveDisk(from: number, to: number) {
		await pauseIfNeeded();

		let disk = towers[from].pop();
		if (disk !== undefined) {
			// Start animation
			animationInProgress = true;
			movingDisk = disk;
			sourcePosition = from;
			targetPosition = to;

			// Wait for animation
			await delay(500 - get(speed) * 5);
			await pauseIfNeeded();

			// End animation and update state
			towers[to].push(disk);
			log(`Lépés: ${disk} korong ${TOWER_NAMES[from]} → ${TOWER_NAMES[to]}`);
			animationInProgress = false;
			movingDisk = null;

			// Update the reactive towers array
			towers = [...towers];

			activeLine.set({ start: 9, end: 12 });
			await delay(600 - get(speed) * 6);
			await pauseIfNeeded();
		}
	}

	// ==== Source Code Display ====
	selectedAlgorithmSourceCode.set(
		`function hanoi(n, from, to, aux) {
  if (n === 0) return;
  hanoi(n - 1, from, aux, to);
  moveDisk(from, to);
  hanoi(n - 1, aux, to, from);
}

function moveDisk(from, to) {
  let disk = towers[from].pop();
  if (disk !== undefined) {
    towers[to].push(disk);
  }
}`
	);

	// Helper function to get disk position for animation
	function getDiskAnimationStyle(disk) {
		if (!animationInProgress || movingDisk !== disk) return '';

		const fromTower = sourcePosition;
		const toTower = targetPosition;
		const direction = toTower - fromTower;
		const moveDistance = direction * 33.3; // % of container width

		return `
			position: absolute;
			transform: translateY(-100px) translateX(${moveDistance}%);
			transition: transform 0.5s ease-out;
			z-index: 20;
		`;
	}

	// Helper function to determine disk color
	function getDiskColor(diskSize) {
		return DISK_COLORS[diskSize - 1] || '#2f4f4f';
	}
</script>

<!-- ===== Input Controls ===== -->
<div class="custom-input">
	<label for="inputNumber">Korongok száma:</label>
	<input
		id="inputNumber"
		type="number"
		bind:value={numDisks}
		min="1"
		max="9"
		on:change={() => initializeTowers()}
		disabled={$algorithmStatus !== 'idle'}
	/>
</div>

<!-- ==== Component Markup ==== -->
<div class="algorithm-container">
	<Controls {currentStep} {totalSteps} on:start={startAlgorithm} />

	<div class="tower-visual">
		{#each towers as tower, towerIndex}
			<div class="tower">
				<div class="base-plate"></div>
				<div class="bar"></div>

				{#each tower as disk, diskIndex}
					<div
						class="disk"
						style="
							width: {disk * 20 + 20}px; 
							background-color: {getDiskColor(disk)};
							{animationInProgress && movingDisk === disk ? getDiskAnimationStyle(disk) : ''}
						"
					>
						{disk}
					</div>
				{/each}

				{#if animationInProgress && sourcePosition === towerIndex && movingDisk !== null}
					<div
						class="disk moving-disk"
						style="
							width: {movingDisk * 20 + 20}px;
							background-color: {getDiskColor(movingDisk)};
							{getDiskAnimationStyle(movingDisk)}
						"
					>
						{movingDisk}
					</div>
				{/if}
			</div>
		{/each}
	</div>
	<div class="tower-labels">
		{#each TOWER_NAMES as name, index}
			<div class="tower-label">{name} torony</div>
		{/each}
	</div>
</div>

<!-- ==== Styles ==== -->
<style>
	.algorithm-container {
		display: flex;
		flex-direction: column;
		margin-bottom: 1rem;
	}

	.tower-visual {
		display: flex;
		justify-content: space-around;
		align-items: flex-end;
		height: 300px;
		position: relative;
	}

	.tower {
		display: flex;
		flex-direction: column-reverse;
		align-items: center;
		width: 33.3%;
		height: 100%;
		position: relative;
	}

	.bar {
		width: 8px;
		height: 80%;
		background-color: #888;
		position: absolute;
		bottom: 10px;
		z-index: 1;
		border-radius: 4px;
	}

	.base-plate {
		width: 80%;
		height: 10px;
		background-color: #666;
		position: absolute;
		bottom: 0;
		border-radius: 4px;
		z-index: 1;
	}

	.disk {
		height: 30px;
		background-color: #2f4f4f;
		border-radius: 8px;
		margin-top: 5px;
		z-index: 10;
		display: flex;
		justify-content: center;
		align-items: center;
		color: white;
		font-weight: bold;
		text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	}

	.moving-disk {
		position: absolute;
		bottom: 0;
	}

	.custom-input {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 15px;
		padding: 0.5rem;
		border-bottom: 3px solid #505050;
	}

	.custom-input input {
		width: 70px;
		padding: 0.5rem;
		border-radius: 5px;
		background-color: #2f2f2f;
		border: 3px solid #505050;
		color: white;
		font-size: 1rem;
		text-align: center;
	}

	.custom-input input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		border-color: #3a3a3a;
	}

	.tower-labels {
		display: flex;
		width: 100%;
		justify-content: space-around;
	}

	.tower-label {
		font-weight: bold;
		font-size: 1.2rem;
	}
</style>
