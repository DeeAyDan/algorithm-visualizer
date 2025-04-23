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

	currentStep.set(0);
	algorithmStatus.set('idle');
	consoleLog.set([]);

	let numDisks = 8;
	let towers: number[][] = [[], [], []];
	let initTowers: number[][] = [[], [], []];

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

	// ==== Vizualizációs indexek ====
	let insertedIndex: number | null = null;

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
		consoleLog.update((logs) => [...logs, 'Hanoi tornyai indítása...']);

		await hanoi(numDisks, 0, 2, 1);

		consoleLog.update((logs) => [...logs, 'Hanoi tornyai kész!']);
		algorithmStatus.set('finished');
		await restartAlgorithm();
	}

	async function hanoi(n: number, from: number, to: number, aux: number) {
		if (n === 0) return;

		await hanoi(n - 1, from, aux, to);

		// Vizualizált lépés
		await moveDisk(from, to);

		await hanoi(n - 1, aux, to, from);
	}

	async function moveDisk(from: number, to: number) {
		let disk = towers[from].pop();
		if (disk !== undefined) {
			towers[to].push(disk);
			log(`Lépés: ${disk} korong ${'ABC'[from]} → ${'ABC'[to]}`);
			towers = towers.map((t) => [...t]);
			await pauseIfNeeded();
			await delay(900 - get(speed) * 8);
		}
	}

	// ==== Forráskód megjelenítés ====
	selectedAlgorithmSourceCode.set(`Algoritmus neve`);
</script>

<!-- ==== Komponens markup ==== -->
<div class="algorithm-container">
	<Controls {currentStep} {totalSteps} on:start={startAlgorithm} />
	<div class="tag">Canvas</div>
	<div class="tower-visual">
		{#each towers as tower, towerIndex}
			<div class="tower">
				{#each [...tower] as disk}
					<div
						class="disk"
						style="width: {disk * 20 + 20}px; background-color: {getDiskColor(disk)}">
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
		border-radius: 4px;
		margin-top: 5px;
		z-index: 10;
	}
</style>
