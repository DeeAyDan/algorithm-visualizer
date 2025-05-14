// @ts-nocheck
import { get } from 'svelte/store';
import { algorithmStatus, resumeSignal, speed, activeLine, consoleLog, currentStep } from './store.svelte.js';

export function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function log(message: string) {
	consoleLog.update((logs) => [...logs, message]);
	currentStep.update((n) => n + 1);
}

export async function pauseIfNeeded(): Promise<void> {
	if (get(algorithmStatus) === 'paused') {
		await waitUntilResume();
	}
}

export function waitUntilResume(): Promise<void> {
	return new Promise((resolve) => {
		const unsub = resumeSignal.subscribe(() => {
			if (get(algorithmStatus) === 'running') {
				unsub();
				resolve();
			}
		});
	});
}