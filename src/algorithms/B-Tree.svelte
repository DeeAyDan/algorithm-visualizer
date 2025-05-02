<script lang="ts">
	// @ts-nocheck
	import { onMount } from 'svelte';
	import {
		currentStep,
		totalSteps,
		consoleLog,
		speed,
		algorithmStatus,
		resumeSignal
	} from '../stores/store.svelte.js';

	import Controls from '../routes/Controls.svelte';
	import { get } from 'svelte/store';

	let maxDegree = 3; // alapértelmezett
	let elementValue: number;
	let highlightedNode = null;

	let root = createNode();

	function createNode() {
		return {
			keys: [],
			children: [],
			isLeaf: true,
			x: 250,
			y: 50
		};
	}

	onMount(() => {
		totalSteps.set(0);
		consoleLog.set([]);
	});

	function log(msg: string) {
		consoleLog.update((logs) => [...logs, msg]);
		currentStep.update((n) => n + 1);
	}

	function validateInput(): boolean {
		if (elementValue === undefined || elementValue === null) {
			log('Kérlek adj meg egy értéket!');
			return false;
		}
		if (typeof elementValue !== 'number') {
			log('Kérlek számot adj meg!');
			return false;
		}
		if (elementValue < 0 || elementValue > 100) {
			log('0 és 100 közötti szám legyen!');
			return false;
		}
		return true;
	}

	function insertElement() {
		if (!validateInput()) return;
		log(`Beszúrás: ${elementValue}`);
		insert(root, elementValue);
		elementValue = undefined;
	}

	function insert(node, key) {
		if (node.keys.length === 2 * maxDegree - 1) {
			const newRoot = createNode();
			newRoot.children.push(node);
			newRoot.isLeaf = false;
			splitChild(newRoot, 0);
			root = newRoot;
			insertNonFull(newRoot, key);
		} else {
			insertNonFull(node, key);
		}
	}

	async function searchElement() {
		if (!validateInput()) return;

		consoleLog.set([]);
		currentStep.set(0);
		algorithmStatus.set('running');

		log(`Keresés indítása: ${elementValue}`);
		await bTreeSearch(bTreeRoot, elementValue);

		log('Keresés vége!');
		highlightedNode = null;
		algorithmStatus.set('finished');
	}

	async function bTreeSearch(node: BTreeNode | null, value: number): Promise<boolean> {
		if (!node) return false;

		highlightedNode = node;
		log(`Vizsgált csomópont: ${node.keys.join(', ')}`);
		await pauseIfNeeded();
		await delay(900 - get(speed) * 8);

		let i = 0;
		while (i < node.keys.length && value > node.keys[i]) {
			i++;
		}

		if (i < node.keys.length && value === node.keys[i]) {
			log(`Érték megtalálva: ${value}`);
			return true;
		}

		if (node.leaf) {
			log(`Nem találtuk meg a ${value} értéket - levélszint.`);
			return false;
		}

		log(`Tovább a(z) ${i}. gyerekbe...`);
		return await bTreeSearch(node.children[i], value);
	}

	function insertNonFull(node, key) {
		let i = node.keys.length - 1;
		if (node.isLeaf) {
			node.keys.push(0);
			while (i >= 0 && key < node.keys[i]) {
				node.keys[i + 1] = node.keys[i];
				i--;
			}
			node.keys[i + 1] = key;
		} else {
			while (i >= 0 && key < node.keys[i]) {
				i--;
			}
			i++;
			if (node.children[i].keys.length === 2 * maxDegree - 1) {
				splitChild(node, i);
				if (key > node.keys[i]) {
					i++;
				}
			}
			insertNonFull(node.children[i], key);
		}
	}

	function splitChild(parent, index) {
		const t = maxDegree;
		const fullChild = parent.children[index];
		const newNode = createNode();
		newNode.isLeaf = fullChild.isLeaf;
		newNode.keys = fullChild.keys.slice(t);
		if (!fullChild.isLeaf) {
			newNode.children = fullChild.children.slice(t);
		}
		fullChild.keys = fullChild.keys.slice(0, t - 1);
		fullChild.children = fullChild.children.slice(0, t);
		parent.children.splice(index + 1, 0, newNode);
		parent.keys.splice(index, 0, fullChild.keys[t - 1]);
	}
</script>

<div class="control-buttons">
	<input class="custom-input" type="number" bind:value={elementValue} placeholder="Elem értéke" />
	<button on:click={insertElement}>Elem beszúrás</button>
	<label
		><input
			type="radio"
			name="degree"
			value="2"
			on:change={() => (maxDegree = 2)}
			checked={maxDegree === 2}
		/>Fok: 2</label
	>
	<label
		><input
			type="radio"
			name="degree"
			value="3"
			on:change={() => (maxDegree = 3)}
			checked={maxDegree === 3}
		/>Fok: 3</label
	>
	<label
		><input
			type="radio"
			name="degree"
			value="4"
			on:change={() => (maxDegree = 4)}
			checked={maxDegree === 4}
		/>Fok: 4</label
	>
</div>

<!-- Fa vizualizáció (egyszerű placeholder) -->
<div class="tag">B-fa</div>
<svg width="600" height="300" style="background: #fff; border: 1px solid #ccc;">
	{#if root}
		{#each root.keys as key, i}
			<circle cx={100 + i * 50} cy={50} r="18" fill="lightblue" />
			<text x={100 + i * 50} y={55} text-anchor="middle" fill="black">{key}</text>
		{/each}
	{/if}
</svg>

<style>
	.tag {
		display: inline-block;
		background-color: #484848;
		color: white;
		padding: 3px;
	}
	.control-buttons {
		display: flex;
		gap: 1rem;
		align-items: center;
		margin: 1rem 0;
	}
	input.custom-input {
		width: 120px;
		padding: 0.5rem;
		border-radius: 4px;
		border: 2px solid #555;
		background: #2e2e2e;
		color: white;
	}
	button {
		background-color: #505050;
		color: white;
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}
	button:hover {
		background-color: #45a049;
	}
</style>
