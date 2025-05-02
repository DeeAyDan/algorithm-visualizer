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


	// ==== Alapadatok ====

	currentStep.set(0);
	algorithmStatus.set('idle');
	consoleLog.set([]);
	activeLine.set(-1);
	const displayName = algorithmDisplayNames[get(selectedAlgorithm)];


	let numDisks = 6;
	let towers: number[][] = [[], [], []];
	let initTowers: number[][] = [[], [], []];
	let initArr = [...towers];
	let data;

	function initializeTowers() {
		towers = [[], [], []];
		for (let i = numDisks; i >= 1; i--) {
			towers[0].push(i);
		}
		initTowers = towers.map((t) => [...t]);
	}

	function getDiskColor(disk: number): string {
		const colors = ['#a3e4db', '#6ddccf', '#3ec6c1', '#2a9caa', '#197889', '#10505f'];
		return colors[disk - 1] || '#0b3c47';
	}

	initializeTowers();

	// ==== Előkalkulált lépésszám ====
	onMount(() => {
		totalSteps.set(Math.pow(2, numDisks) - 1);
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
					data = [...initArr];
					activeLine.set(-1);

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
			towers = initTowers.map((t) => [...t]);
		}
	}

	// ==== Hanoi Futás futás ====
	async function startAlgorithm(event) {
		consoleLog.set([]);
		currentStep.set(0);
		initializeTowers();
		consoleLog.update((logs) => [...logs, `${displayName} indítása...`]);

		totalSteps.set(Math.pow(2, numDisks) - 1);
		await hanoi(numDisks, 0, 2, 1);
		activeLine.set(-1);

		consoleLog.update((logs) => [...logs, 'A futás befejeződött!']);
		algorithmStatus.set('finished');
		await restartAlgorithm();
	}

	async function hanoi(n: number, from: number, to: number, aux: number) {
		if (n === 0) return;

		activeLine.set(3);
		await delay(600 - get(speed) * 8);
		await hanoi(n - 1, from, aux, to);

		activeLine.set(4);
		await delay(600 - get(speed) * 8);
		await moveDisk(from, to);

		activeLine.set(5);
		await delay(600 - get(speed) * 8);
		await hanoi(n - 1, aux, to, from);
	}

	async function moveDisk(from: number, to: number) {
		activeLine.set(8);
		await delay(600 - get(speed) * 8);
		let disk = towers[from].pop();
		if (disk !== undefined) {
			towers[to].push(disk);
			log(`Lépés: ${disk} korong ${'ABC'[from]} → ${'ABC'[to]}`);
			towers = towers.map((t) => [...t]);
			activeLine.set(10);
			await pauseIfNeeded();
			await delay(600 - get(speed) * 8);
		}
	}

	// ==== Forráskód megjelenítés ====
	selectedAlgorithmSourceCode.set(`
function hanoi(n, from, to, aux) {
   if (n === 0) return;
   hanoi(n - 1, from, aux, to);
   moveDisk(from, to);
   hanoi(n - 1, aux, to, from);
}
function moveDisk(from, to) {
   let disk = towers[from].pop();
   if (disk !== undefined) {
      towers[to].push(disk);
      towers = towers.map((t) => [...t]); 
   }
}
	`);
</script>

<!-- ===== Bemeneti mező a Controls alatt ===== -->
<div class="custom-input">
	<label for="inputNumber">Korongok száma:</label>
	<input
		id="inputNumber"
		type="number"
		bind:value={numDisks}
		min="0"
		placeholder="Adj meg egy számot"
	/>
</div>

<!-- ==== Komponens markup ==== -->
<div class="algorithm-container">
	<Controls {currentStep} {totalSteps} on:start={startAlgorithm} />
	<div class="tag">Vászon</div>
	<div class="tower-visual">
		{#each towers as tower, towerIndex}
			<div class="tower">
				{#each [...tower] as disk}
					<div
						class="disk"
						style="width: {disk * 20 + 20}px;">
						{disk}
					</div>
				{/each}
				<div class="bar"></div>
			</div>
		{/each}
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

	.bar {
		width: 5%;
		height: 100%;
		background-color: #888;
		position: absolute;
	}

	.tower-visual {
		display: flex;
		justify-content: space-around;
		align-items: flex-end;
		height: 250px;
		margin-top: 1rem;
	}

	.tower {
		display: flex;
		flex-direction: column-reverse;
		align-items: center;
		width: 30%;
		height: 100%;
		padding-bottom: 10px;
		position: relative;
	}

	.disk {
		height: 20px;
		background-color: #2f4f4f;
		border-radius: 4px;
		margin-top: 5px;
		z-index: 10;
	}
	.custom-input {
		display: flex;
		justify-content: center;
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
