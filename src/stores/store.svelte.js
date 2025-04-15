import { writable } from "svelte/store";

export const isOpen = writable(false);
export const selectedAlgorithm = writable("");
export const selectedAlgorithmSourceCode = writable("");
export const currentStep = writable(0);
export const totalSteps = writable(0);
export const consoleLog = writable([]);