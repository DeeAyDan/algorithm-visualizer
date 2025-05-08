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

	let maxDegree = 3;
	let elementValue: number;
	let highlightedNode = null;
	let svgNodes = [];

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
		
		svgNodes = [];
		drawTree(root);
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
		await bTreeSearch(root, elementValue);

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
		const middleKey = fullChild.keys[t - 1]; // ezt előbb mentsd ki

		fullChild.keys = fullChild.keys.slice(0, t - 1);
		fullChild.children = fullChild.children.slice(0, t);

		parent.children.splice(index + 1, 0, newNode);
		parent.keys.splice(index, 0, middleKey); // most jó helyre kerül
	}

	function drawTree(node, depth = 0, xOffset = { value: 0 }) {
		if (!node) return;

		const NODE_WIDTH = 40;
		const NODE_SPACING = 20;
		const LEVEL_HEIGHT = 80;

		let x = 0;

		if (node.isLeaf) {
			x = xOffset.value;
			xOffset.value += node.keys.length * NODE_WIDTH + NODE_SPACING;
		} else {
			// Rajzoljuk le előbb a gyerekeket, hogy kiszámolhassuk az x pozíciót
			for (let child of node.children) {
				drawTree(child, depth + 1, xOffset);
			}
			const firstChild = node.children[0];
			const lastChild = node.children[node.children.length - 1];
			x = (firstChild.x + lastChild.x) / 2;
		}

		node.x = x;
		node.y = depth * LEVEL_HEIGHT;

		svgNodes.push({ node });
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
<div class="tag">Vászon</div>
<svg class="svg" width="500" height="300">
	{#if root}
		{#if root}
			{#each svgNodes as { node }}
				<!-- Rajzold meg az éleket a gyerekekhez -->
				{#if !node.isLeaf}
					{#each node.children as child}
						<line
							x1={node.x}
							y1={node.y + 10}
							x2={child.x}
							y2={child.y - 10}
							stroke="white"
							stroke-width="2"
						/>
					{/each}
				{/if}

				<!-- Rajzold meg a csomópont kulcsait -->
				{#each node.keys as key, i}
					<rect
						x={node.x + i * 20 - node.keys.length * 10}
						y={node.y}
						width="20"
						height="20"
						fill="lightblue"
						rx="5"
					/>
					<text
						x={node.x + i * 20 - node.keys.length * 10 + 10}
						y={node.y + 15}
						text-anchor="middle"
						fill="black"
						font-size="12"
					>
						{key}
					</text>
				{/each}
			{/each}
		{/if}
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
		justify-content: space-around;
		align-items: center;
		padding: 1rem;
		border-bottom: 3px solid #505050;
	}
	.control-buttons .custom-input {
		width: 150px;
		padding: 0.5rem;
		margin-right: 10px;
		border-radius: 5px;
		background-color: #2f2f2f;
		border: 3px solid #505050;
		color: white;
	}

	.control-buttons button {
		padding: 0.5rem 1rem;
		background-color: #505050;
		color: white;
		border: none;
		border-radius: 5px;
		cursor: pointer;
	}

	.control-buttons button:hover {
		background-color: #45a049;
	}
	.svg {
		margin: 1rem auto;
		border: 1px solid #ccc;
		border-radius: 4px;
		display: block;
		background-color: #2f2f2f;
	}
</style>
