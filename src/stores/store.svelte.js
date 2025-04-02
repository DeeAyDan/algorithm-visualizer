import { writable } from "svelte/store";

export const isOpen = writable(false);
export const selectedAlgorithm = $state({
    selectedAlgorithm: "",
    sourceCode: ""
});