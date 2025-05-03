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

	let text = 'BCCBCBBCBB';
	let pattern = 'BCB';
	let patternPosition = 0; // New variable to track the pattern position
	activeLine.set(-1);

	// ==== Vizualizációs indexek ====
	let textIndex: number | null = null;

	// ==== Előkalkulált lépésszám ====
	onMount(() => {
		totalSteps.set(KMPCounter(text, pattern));
	});

	function KMPCounter(text, pattern) {
		let steps = 0;
		let lps = new Array(pattern.length).fill(0);
		computeLPSCounter(pattern, lps);

		let i = 0;
		let j = 0;

		while (i < text.length) {
			steps++;

			if (pattern[j] == text[i]) {
				steps++;
				j++;
				i++;
			}

			if (j == pattern.length) {
				steps++;

				j = lps[j - 1];
			} else if (i < text.length && pattern[j] != text[i]) {
				steps++;

				if (j != 0) {
					j = lps[j - 1];
				} else {
					i++;
				}
			}
		}
		return steps;
	}

	function computeLPSCounter(pattern, lps) {
		let len = 0;
		let i = 1;

		while (i < pattern.length) {
			if (pattern[i] == pattern[len]) {
				len++;
				lps[i] = len;

				i++;
			} else {
				if (len != 0) {
					len = lps[len - 1];
				} else {
					lps[i] = 0;

					i++;
				}
			}
		}
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

					patternPosition = 0; // Reset pattern position

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

		totalSteps.set(KMPCounter(text, pattern));
		await KMP(text, pattern);
		textIndex = null;
		activeLine.set(-1);

		consoleLog.update((logs) => [...logs, 'A futás befejeződött!']);
		algorithmStatus.set('finished');
		await restartAlgorithm();
	}

	async function KMP(text, pattern) {
		let lps = new Array(pattern.length).fill(0);
		await computeLPS(pattern, lps);

		let i = 0;
		let j = 0;

		while (i < text.length) {
			patternPosition = i - j;

			log(`Vizsgálat: '${text[i]}' és '${pattern[j]}'`);
			textIndex = i;

			activeLine.set(8);
			await pauseIfNeeded();
			await delay(900 - get(speed) * 8);

			if (pattern[j] == text[i]) {
				log(`Egyezés.`);
				activeLine.set(9);
				await pauseIfNeeded();
				await delay(900 - get(speed) * 8);
				j++;
				i++;
				patternPosition = i - j;
			}

			if (j == pattern.length) {
				log(`Minta találat ${i - j}. indextől`);
				activeLine.set(14);
				await pauseIfNeeded();
				await delay(900 - get(speed) * 8);
				j = lps[j - 1];
				patternPosition = i - j;
			} else if (i < text.length && pattern[j] != text[i]) {
				log(`Eltérés. A minta visszaállítása.`);
				activeLine.set(16);
				await pauseIfNeeded();
				await delay(900 - get(speed) * 8);
				if (j != 0) {
					j = lps[j - 1];
					patternPosition = i - j;
				} else {
					i++;
					patternPosition = i - j;
				}
			}
		}
		textIndex = null;
	}

	async function computeLPS(pattern, lps) {
		let len = 0;
		let i = 1;

		while (i < pattern.length) {
			if (pattern[i] == pattern[len]) {
				len++;
				lps[i] = len;

				i++;
			} else {
				if (len != 0) {
					len = lps[len - 1];
				} else {
					lps[i] = 0;

					i++;
				}
			}
		}
	}

	// ==== Forráskód megjelenítés ====
	selectedAlgorithmSourceCode.set(
`
function KMP(text, pattern) {
    let lps = new Array(pattern.length).fill(0);
    computeLPS(pattern, lps);

    let i = 0;
    let j = 0;

    while (i < text.length) {
        if (pattern[j] == text[i]) {
            j++;
            i++;
        }
    
        if (j == pattern.length) {
            j = lps[j - 1];
        } else if (i < text.length && pattern[j] != text[i]) {
            if (j != 0) 
                j = lps[j - 1];
            else
                i = i + 1;
        }
    }
}

function computeLPS(pattern, lps) {
    let len = 0;
    let i = 1;

    while (i < pattern.length) {
        if (pattern[i] == pattern[len]) {
            len++;
            lps[i] = len;
            i++;
        } else {
            if (len != 0) {
                len = lps[len - 1];
            } else {
                lps[i] = 0;
                i++;
            }
        }
    }
}

`);
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
					style=" background-color: {i >= patternPosition && i < patternPosition + pattern.length
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
	.pattern {
		color: #2f2f2f;
	}
</style>
