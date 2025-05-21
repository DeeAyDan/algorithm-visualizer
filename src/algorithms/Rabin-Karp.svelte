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

	// ==== Alapadatok ====

	currentStep.set(0);
	algorithmStatus.set('idle');
	consoleLog.set([]);
	const displayName = algorithmDisplayNames[get(selectedAlgorithm)];
	let matchPositions = new Set<number>();

	let text = 'ABBBAABA';
	let pattern = 'AAB';
	let patternPosition = 0;
	activeLine.set({start: -1, end: -1});

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
	async function restartAlgorithm() {
		if (get(algorithmStatus) === 'finished') {
			return new Promise((resolve) => {
				const unsub = resumeSignal.subscribe(() => {
					if (get(algorithmStatus) === 'idle') {
						consoleLog.set([]);
						currentStep.set(0);
						matchPositions = new Set<number>([]);

						patternPosition = 0;

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

		if (text.length === 0) {
			consoleLog.update((logs) => [...logs, `Szöveg üres.`]);
			algorithmStatus.set('idle');
			return;
		} else if (pattern.length === 0) {
			consoleLog.update((logs) => [...logs, `Minta üres.`]);
			algorithmStatus.set('idle');
			return;
		} else if (text.length > 15) {
			consoleLog.update((logs) => [...logs, 'Túl hosszú szöveg!']);
			algorithmStatus.set('idle');
			return;
		} else if (pattern.length > 5) {
			consoleLog.update((logs) => [...logs, 'Túl hosszú minta!']);
			algorithmStatus.set('idle');
			return;
		}

		consoleLog.update((logs) => [...logs, `${displayName} indítása...`]);

		totalSteps.set(rabinKarpCounter(text, pattern));
		await rabinKarp(text, pattern);
		textIndex = null;
		activeLine.set({start: -1, end: -1});

		consoleLog.update((logs) => [...logs, 'A futás befejeződött!']);
		algorithmStatus.set('finished');
		await restartAlgorithm();
	}

	async function rabinKarp(text: string, pattern: string) {
		const d = 256;
		const q = 101; 

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

		activeLine.set({start: 15, end: 18});
		await delay(900 - get(speed) * 8);
		await pauseIfNeeded();

		for (let i = 0; i <= N - M; i++) {
			patternPosition = i;
			textIndex = null;
			log(`Hash összehasonlítás: minta=${p}, szöveg=${t}`);
			activeLine.set({start: 20, end: 20});
			await delay(900 - get(speed) * 8);
			await pauseIfNeeded();

			if (p === t) {
				log(`Hash egyezik, karakter-összehasonlítás...`);
				activeLine.set({start: 21, end: 22});
				await delay(900 - get(speed) * 8);
				await pauseIfNeeded();

				let match = true;
				for (let j = 0; j < M; j++) {
					if (text[i + j] !== pattern[j]) {
						log(`Eltérés '${text[i + j]}' ≠ '${pattern[j]}'`);
						activeLine.set({start: 25, end: 28});
						match = false;
						break;
					}
					log(`Egyezés '${text[i + j]}' = '${pattern[j]}'`);
					activeLine.set({start: 32, end: 35});
					textIndex = i + j;
					await delay(900 - get(speed) * 8);
					await pauseIfNeeded();
				}
				if (match) {
					log(`Minta találat a(z) ${i}. pozíción!`);
					for (let k = 0; k < M; k++) matchPositions.add(i + k);
					matchPositions = new Set<number>([...matchPositions]);
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
		`function rabinKarp(text, pattern) {
  // karakterkészlet mérete
  const d = 256;
  // prímszám a mod művelethez
  const q = 101;
 
  let M = pattern.length;
  let N = text.length;
  let p = 0;
  let t = 0;
  let h = 1;
 
  for (let i = 0; i < M - 1; i++) h = (h * d) % q;
 
  for (let i = 0; i < M; i++){
    p = (d * p + pattern.charCodeAt(i)) % q;
    t = (d * t + text.charCodeAt(i)) % q;
  }
 
  for (let i = 0; i <= N - M; i++) {
    if (p === t) {
      let match = true;
		 
      for (let j = 0; j < M; j++) {
        if (text[i + j] !== pattern[j]) {
          match = false;
          break;
        }
      }
    }

    if (match) {
      for (let k = 0; k < M; k++) matchPositions.add(i + k);
      matchPositions = new Set<number>([...matchPositions]);
    }
 
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
		<input class="text-input" bind:value={text} maxlength="15" disabled={$algorithmStatus !== 'idle'} />
	</div>
	<div>
		<span>Mintázat:</span>
		<input class="pattern-input" bind:value={pattern} maxlength="5" disabled={$algorithmStatus !== 'idle'} />
	</div>
</div>

<!-- ==== Komponens markup ==== -->
<div class="algorithm-container">
	<Controls {currentStep} {totalSteps} on:start={startAlgorithm} />
	<div class="array-visual">
		<div class="visualization-container">
			<div class="row-container">
				<div class="row text-row">
					{#each Array.from({ length: text.length }) as _, i}
						<div
							class="bar {matchPositions.has(i) ? 'match' : ''} {i === textIndex ? 'active' : ''}"
							style=" background-color: #2f4f4f;"
						>
							{text[i]}
						</div>
					{/each}
				</div>
				<div class="row pattern-row" style="margin-left: {patternPosition * 48}px">
					{#each Array.from({ length: pattern.length }) as _, i}
						<div class="bar pattern" style="background-color: #ffd700;">
							{pattern[i]}
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
</div>

<!-- ==== Stílus ==== -->
<style>
	.array-visual {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 200px;
		margin: 1rem auto;
		width: 100%;
	}
	
	.visualization-container {
		position: relative;
		display: flex;
		justify-content: center;
		width: 100%;
		height: 120px;
	}
	
	.custom-input {
		display: flex;
		justify-content: space-around;
		padding: 0.5rem;
		border-bottom: #484848 3px solid;
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
	.row-container{
		width: fit-content;
		display: flex;
		flex-direction: column;
	}
	.row {
		display: flex;
		width: fit-content;
		justify-content: flex-start;
		gap: 5px;
	}
	
	.text-row {
		position: relative;
	}
	
	.pattern-row {
		margin-top: 5px;
		transition: margin-left 0.3s ease;
	}
	
	.bar {
		display: flex;
		justify-content: center;
		align-items: center;
		font-weight: bold;
		width: 35px;
		height: 35px;
		transition: background-color 0.3s ease;
		border: 4px solid transparent;
	}
	
	.bar:last-child {
		margin-right: 0;
	}
	
	.bar.active {
		border: 4px solid #dc143c;
	}
	
	.pattern {
		color: #2f2f2f;
	}
	
	.row .match {
		color: #2f2f2f;
		background-color: #45a049 !important;
	}
	
	.text-input:disabled,
	.pattern-input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		border-color: #3a3a3a;
	}
</style>