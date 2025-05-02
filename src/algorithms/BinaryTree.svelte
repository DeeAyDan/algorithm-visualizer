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
		selectedAlgorithm
	} from '../stores/store.svelte.js';
	import Controls from '../routes/Controls.svelte';
	import { get } from 'svelte/store';
	import { algorithmDisplayNames } from '../stores/algorithmMap.js';

	currentStep.set(0);
	algorithmStatus.set('idle');
	consoleLog.set([]);
	const displayName = algorithmDisplayNames[get(selectedAlgorithm)];

	interface TreeNode {
		value: number;
		left?: TreeNode;
		right?: TreeNode;
		x: number;
		y: number;
	}

	let tree: TreeNode | null = null;
	let highlightedNode: TreeNode | null = null;
	let elementValue: number | null = null;

	const startX = 250;
	const startY = 50;
	const levelGapY = 80;
	const offsetX = 60;

	onMount(() => {
		totalSteps.set(0);
	});

	function log(message: string) {
		consoleLog.update((logs) => [...logs, message]);
		currentStep.update((n) => n + 1);
	}
	function delay(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
	async function pauseIfNeeded() {
		if (get(algorithmStatus) === 'paused') {
			await new Promise((resolve) => {
				const unsub = resumeSignal.subscribe(() => {
					if (get(algorithmStatus) === 'running') {
						unsub();
						resolve();
					}
				});
			});
		}
	}

	function validateInput(): boolean {
		if (elementValue === null || elementValue === undefined) {
			log('Kérlek adj meg egy értéket!');
			return false;
		} else if (typeof elementValue !== 'number') {
			log('Kérlek adj meg egy számot!');
			return false;
		} else if (elementValue < 0) {
			log('Kérlek adj meg egy pozitív számot!');
			return false;
		} else if (elementValue > 100) {
			log('Kérlek adj meg egy 0 és 100 közötti számot!');
			return false;
		}
		return true;
	}

	function calculatePositions(node: TreeNode | null, depth = 0, index = 0, parentX = startX): void {
		if (!node) return;
		node.x = parentX + index * offsetX;
		node.y = startY + depth * levelGapY;
		calculatePositions(node.left, depth + 1, -1, node.x);
		calculatePositions(node.right, depth + 1, 1, node.x);
	}

	async function insertElement() {
		if (!validateInput()) return;
		algorithmStatus.set('running');
		consoleLog.set([]);
		currentStep.set(0);
		log(`Beszúrás: ${elementValue}`);

		const insert = async (node: TreeNode | null, value: number): Promise<TreeNode> => {
			await pauseIfNeeded();
			await delay(900 - get(speed) * 8);

			if (!node) {
				log(`Beszúrt érték: ${value}`);
				return { value, x: 0, y: 0 };
			}

			highlightedNode = node;
			log(`Vizsgált csúcs: ${node.value}`);

			if (value < node.value) {
				node.left = await insert(node.left, value);
			} else if (value > node.value) {
				node.right = await insert(node.right, value);
			} else {
				log('Az érték már szerepel a fában.');
			}
			return node;
		};

		tree = await insert(tree, elementValue);
		calculatePositions(tree);
		highlightedNode = null;
		algorithmStatus.set('idle');
	}

	async function searchElement() {
		if (!validateInput()) return;
		algorithmStatus.set('running');
		consoleLog.set([]);
		currentStep.set(0);
		log(`Keresés: ${elementValue}`);

		const search = async (node: TreeNode | null, value: number) => {
			if (!node) {
				log('Elem nem található.');
				return;
			}

			highlightedNode = node;
			log(`Vizsgált csúcs: ${node.value}`);
			await pauseIfNeeded();
			await delay(900 - get(speed) * 8);

			if (value === node.value) {
				log(`Érték megtalálva: ${value}`);
			} else if (value < node.value) {
				await search(node.left, value);
			} else {
				await search(node.right, value);
			}
		};

		await search(tree, elementValue);
		highlightedNode = null;
		algorithmStatus.set('idle');
	}

	async function deleteElement() {
		if (!validateInput()) return;
		algorithmStatus.set('running');
		consoleLog.set([]);
		currentStep.set(0);
		log(`Törlés: ${elementValue}`);

		const findMin = (node: TreeNode): TreeNode => {
			while (node.left) node = node.left;
			return node;
		};

		const remove = async (node: TreeNode | null, value: number): Promise<TreeNode | null> => {
			if (!node) {
				log('Elem nem található.');
				return null;
			}

			highlightedNode = node;
			log(`Vizsgált csúcs: ${node.value}`);
			await pauseIfNeeded();
			await delay(900 - get(speed) * 8);

			if (value < node.value) {
				node.left = await remove(node.left, value);
			} else if (value > node.value) {
				node.right = await remove(node.right, value);
			} else {
				log(`Csúcs törölve: ${value}`);
				if (!node.left) return node.right;
				if (!node.right) return node.left;

				const minLargerNode = findMin(node.right);
				node.value = minLargerNode.value;
				node.right = await remove(node.right, minLargerNode.value);
			}
			return node;
		};

		tree = await remove(tree, elementValue);
		calculatePositions(tree);
		highlightedNode = null;
		algorithmStatus.set('idle');
	}

	function getAllNodes(root: TreeNode): TreeNode[] {
		let result: TreeNode[] = [];
		function traverse(node: TreeNode | null) {
			if (!node) return;
			result.push(node);
			traverse(node.left);
			traverse(node.right);
		}
		traverse(root);
		return result;
	}

	selectedAlgorithmSourceCode.set('Bináris fa beszúrás / keresés / törlés');
</script>

<div class="control-buttons">
	<input class="custom-input" type="number" bind:value={elementValue} placeholder="Elem értéke" />
	<button on:click={insertElement}>Elem beszúrás</button>
	<button on:click={deleteElement}>Elem törlés</button>
	<button on:click={searchElement}>Elem keresés</button>
</div>

<div class="algorithm-container">
	<Controls {currentStep} {totalSteps} />
	<div class="tag">Bináris fa</div>
	<svg width="600" height="400" style="background: #fff; border: 1px solid #ccc;">
		{#if tree}
			{#each getAllNodes(tree) as node (node.value)}
				{#if node.left}
					<line x1={node.x} y1={node.y} x2={node.left.x} y2={node.left.y} stroke="black" />
				{/if}
				{#if node.right}
					<line x1={node.x} y1={node.y} x2={node.right.x} y2={node.right.y} stroke="black" />
				{/if}

				<circle cx={node.x} cy={node.y} r="18" fill={highlightedNode === node ? 'orange' : 'lightblue'} />
				<text x={node.x} y={node.y + 5} text-anchor="middle" font-size="14" fill="black">{node.value}</text>
			{/each}
		{/if}
	</svg>
</div>

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
		padding: 1rem;
		margin-bottom: 1rem;
	}

	.control-buttons input {
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
</style>
