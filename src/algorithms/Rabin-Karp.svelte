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
	const displayName = algorithmDisplayNames[get(selectedAlgorithm)];

	let text = 'ABBBAABA';
	let pattern = 'AAB';
	let patternPosition = 0;
	activeLine.set(-1);

	// ==== Vizualizációs indexek ====
	let textIndex: number | null = null;

	// ==== Előkalkulált lépésszám ====
	onMount(() => {
		totalSteps.set(rabinKarpCounter(text, pattern));
	});

	function rabinKarpCounter(text: string, pattern: string) {
		const d = 256;
		const q = 101;

		let M = pattern.length;
		let N = text.length;
		let p = 0;
		let t = 0;
		let h = 1;

		let steps = 0;

		// h = pow(d, M-1) % q
		for (let i = 0; i < M - 1; i++) h = (h * d) % q;

		// kezdő hash-ek kiszámítása
		for (let i = 0; i < M; i++) {
			p = (d * p + pattern.charCodeAt(i)) % q;
			t = (d * t + text.charCodeAt(i)) % q;
		}

		for (let i = 0; i <= N - M; i++) {
			patternPosition = i;
			steps++;

			if (p === t) {
				steps++;

				let match = true;
				for (let j = 0; j < M; j++) {
					if (text[i + j] !== pattern[j]) {
						steps++;
						match = false;
						break;
					}
					steps++;
					textIndex = i + j;
				}
				if (match) {
					steps++;
				}
			}

			// Következő ablak hash-értékének frissítése
			if (i < N - M) {
				t = (d * (t - text.charCodeAt(i) * h) + text.charCodeAt(i + M)) % q;
				if (t < 0) t += q;
			}
		}
		patternPosition = 0;
		textIndex = null;

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

					patternPosition = 0;

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

		if (text.length === 0 || pattern.length === 0) {
			consoleLog.update((logs) => [...logs, `Szöveg vagy minta üres.`]);
			algorithmStatus.set('idle');
			return;
		}

		consoleLog.update((logs) => [...logs, `${displayName} indítása...`]);

		totalSteps.set(rabinKarpCounter(text, pattern));
		await rabinKarp(text, pattern);
		textIndex = null;
		activeLine.set(-1);
		
		consoleLog.update((logs) => [...logs, 'A futás befejeződött!']);
		algorithmStatus.set('finished');
		await restartAlgorithm();
	}

	async function rabinKarp(text: string, pattern: string) {
		const d = 256; // karakterkészlet mérete
		const q = 101; // prímszám a mod művelethez

		let M = pattern.length;
		let N = text.length;
		let p = 0; // pattern hash
		let t = 0; // text hash
		let h = 1;

		// h = pow(d, M-1) % q
		for (let i = 0; i < M - 1; i++) h = (h * d) % q;

		// kezdő hash-ek kiszámítása
		for (let i = 0; i < M; i++) {
			p = (d * p + pattern.charCodeAt(i)) % q;
			t = (d * t + text.charCodeAt(i)) % q;
		}

		activeLine.set(23);
		await delay(900 - get(speed) * 8);

		for (let i = 0; i <= N - M; i++) {
			patternPosition = i;
			textIndex = null;
			log(`Hash összehasonlítás: minta=${p}, szöveg=${t}`);
			activeLine.set(25);
			await pauseIfNeeded();
			await delay(900 - get(speed) * 8);

			if (p === t) {
				log(`Hash egyezik, karakter-összehasonlítás...`);
				activeLine.set(26);
				await pauseIfNeeded();
				await delay(900 - get(speed) * 8);

				let match = true;
				for (let j = 0; j < M; j++) {
					if (text[i + j] !== pattern[j]) {
						log(`Eltérés '${text[i + j]}' ≠ '${pattern[j]}'`);
						activeLine.set(30);
						match = false;
						break;
					}
					log(`Egyezés '${text[i + j]}' = '${pattern[j]}'`);
					activeLine.set(29);
					textIndex = i + j;
					await pauseIfNeeded();
					await delay(900 - get(speed) * 8);
				}
				if (match) {
					log(`Minta találat a(z) ${i}. pozíción!`);
				}
			}

			// Következő ablak hash-értékének frissítése
			if (i < N - M) {
				t = (d * (t - text.charCodeAt(i) * h) + text.charCodeAt(i + M)) % q;
				if (t < 0) t += q;
			}
		}
	}

	// ==== Forráskód megjelenítés ====
	selectedAlgorithmSourceCode.set(
`function rabinKarp(text: string, pattern: string){
 \n
   const d = 256;
   const q = 101;
 \n
   let M = pattern.length;
   let N = text.length;
   let p = 0;
   let t = 0;
   let h = 1;
 \n
   for (let i = 0; i < M - 1; i++) h = (h * d) % q;
 \n
   for (let i = 0; i < M; i++){
      p = (d * p + pattern.charCodeAt(i)) % q;
      t = (d * t + text.charCodeAt(i)) % q;
   }
 \n
   for (let i = 0; i <= N - M; i++){
      patternPosition = i;
      if (p === t){
         let match = true;
		 \n
         for (let j = 0; j < M; j++){
            if (text[i + j] !== pattern[j]){
               match = false;
               break;
            }
         }
      }
 \n
      if (i < N - M) {
         t = (d * (t - text.charCodeAt(i) * h) + text.charCodeAt(i + M)) % q;
         if (t < 0) t += q;
      }
   }
}`);
</script>

<div class="custom-input">
	<div>
		<span>Szöveg:</span>
		<input class="text-input" bind:value={text} maxlength="15" />
	</div>
	<div>
		<span>Mintázat:</span>
		<input class="pattern-input" bind:value={pattern} maxlength="5" />
	</div>
</div>

<!-- ==== Komponens markup ==== -->
<div class="algorithm-container">
	<Controls {currentStep} {totalSteps} on:start={startAlgorithm} />
	<div class="tag">Vászon</div>
	<div class="array-visual">
		<div class="row">
			{#each Array.from({ length: text.length }) as _, i}
				<div class="bar {i === textIndex ? 'active' : ''}" style=" background-color: #2f4f4f;">
					{text[i]}
				</div>
			{/each}
		</div>
		<div class="row">
			{#each Array.from({ length: text.length }) as _, i}
				<div
					class="bar pattern {i === textIndex ? 'active' : ''}"
					style="background-color: {i >= patternPosition && i < patternPosition + pattern.length
						? '#ffd700'
						: 'transparent'};"
				>
					{i >= patternPosition && i < patternPosition + pattern.length
						? pattern[i - patternPosition]
						: ''}
				</div>
			{/each}
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
	.array-visual {
		display: flex;
		flex-direction: column;
		gap: 10px;
		justify-content: center;
		align-items: center;
		height: 200px;
		margin: 1rem 0 0 0;
	}
	.custom-input {
		display: flex;
		justify-content: space-around;
		padding: 1rem;
		margin-bottom: 1rem;
	}

	.text-input {
		width: 165px;
		padding: 0.5rem;
		margin-right: 10px;
		border-radius: 5px;
		background-color: #2f2f2f;
		border: 3px solid #505050;
	}

	.pattern-input {
		width: 55px;
		padding: 0.5rem;
		margin-right: 10px;
		border-radius: 5px;
		background-color: #2f2f2f;
		border: 3px solid #505050;
	}
	.row {
		display: flex;
		justify-content: flex-start;
		gap: 4px;
	}
	.bar {
		display: flex;
		justify-content: center;
		align-items: center;
		font-weight: bold;
		width: 30px;
		height: 30px;
		border: 3px solid #2f2f2f;
	}
	.bar.active {
		border: 3px solid #dc143c;
	}
	.pattern{
		color:#2f2f2f;
	}
</style>
