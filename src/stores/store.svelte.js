import { writable } from "svelte/store";

export const isOpen = writable(false);
export const selectedAlgorithm = writable("");
export const selectedAlgorithmSourceCode = writable("");
export const currentStep = writable(0);
export const totalSteps = writable(0);
export const consoleLog = writable([]);
export const speed = writable(50);
export const activeLine = writable(-1);

export const algorithmStatus = writable('idle');
export const resumeSignal = writable(0);