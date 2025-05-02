<script lang="ts">
	// @ts-nocheck
	import { onMount } from 'svelte';
	import {
		currentStep,
		totalSteps,
		consoleLog,
		speed,
		algorithmStatus,
		resumeSignal,
		selectedAlgorithmSourceCode
	} from '../stores/store.svelte.js';
	import Controls from '../routes/Controls.svelte';
	import { get } from 'svelte/store';

	interface Node {
		value: number;
		left?: Node;
		right?: Node;
		height: number;
		x: number;
		y: number;
	}

	let root: Node | null = null;
	let highlightedNode: Node | null = null;
	let elementValue: number = 0;

	onMount(() => {
		currentStep.set(0);
		totalSteps.set(0);
		consoleLog.set([]);
		algorithmStatus.set('idle');
	});

	function log(msg: string) {
		consoleLog.update((logs) => [...logs, msg]);
		currentStep.update(n => n + 1);
	}

	function delay(ms: number) {
		return new Promise(res => setTimeout(res, ms));
	}

	async function pauseIfNeeded() {
		if (get(algorithmStatus) === 'paused') {
			await new Promise(resolve => {
				const unsub = resumeSignal.subscribe(() => {
					if (get(algorithmStatus) === 'running') {
						unsub();
						resolve();
					}
				});
			});
		}
	}

	function height(n: Node | undefined): number {
		return n ? n.height : 0;
	}

	function updateHeight(n: Node) {
		n.height = Math.max(height(n.left), height(n.right)) + 1;
	}

	function balanceFactor(n: Node): number {
		return height(n.left) - height(n.right);
	}

	function rotateRight(y: Node): Node {
		const x = y.left!;
		y.left = x.right;
		x.right = y;
		updateHeight(y);
		updateHeight(x);
		log(`Jobbra forgatás: ${y.value}`);
		return x;
	}

	function rotateLeft(x: Node): Node {
		const y = x.right!;
		x.right = y.left;
		y.left = x;
		updateHeight(x);
		updateHeight(y);
		log(`Balra forgatás: ${x.value}`);
		return y;
	}

	function balance(n: Node): Node {
		updateHeight(n);
		const bf = balanceFactor(n);
		if (bf > 1) {
			if (balanceFactor(n.left!) < 0) {
				n.left = rotateLeft(n.left!);
			}
			return rotateRight(n);
		}
		if (bf < -1) {
			if (balanceFactor(n.right!) > 0) {
				n.right = rotateRight(n.right!);
			}
			return rotateLeft(n);
		}
		return n;
	}

	async function insert(node: Node | null, value: number): Promise<Node> {
		if (!node) {
			log(`Beszúrt érték: ${value}`);
			await pauseIfNeeded();
			await delay(900 - get(speed) * 8);
			return { value, height: 1, x: 0, y: 0 };
		}
		highlightedNode = node;
		log(`Vizsgálat: ${node.value}`);
		await pauseIfNeeded();
		await delay(900 - get(speed) * 8);

		if (value < node.value) {
			node.left = await insert(node.left || null, value);
		} else if (value > node.value) {
			node.right = await insert(node.right || null, value);
		} else {
			log('Már létezik ilyen érték!');
			return node;
		}

		return balance(node);
	}

	function validateInput(): boolean {
		if (elementValue === null || elementValue === undefined || elementValue === '') {
			log('Kérlek adj meg egy értéket!');
			return false;
		} else if (typeof elementValue !== 'number') {
			log('Kérlek adj meg egy számot!');
			return false;
		} else if (elementValue < 0 || elementValue > 100) {
			log('0 és 100 közötti számot adj meg!');
			return false;
		}
		return true;
	}

	async function insertElement() {
		if (!validateInput()) return;
		algorithmStatus.set('running');
		root = await insert(root, elementValue);
		highlightedNode = null;
		positionTree(root, 250, 50, 100);
		algorithmStatus.set('finished');
	}

	function positionTree(node: Node | null, x: number, y: number, offset: number) {
		if (!node) return;
		node.x = x;
		node.y = y;
		positionTree(node.left || null, x - offset, y + 80, offset / 1.5);
		positionTree(node.right || null, x + offset, y + 80, offset / 1.5);
	}

	async function searchElement() {
		if (!validateInput()) return;
		algorithmStatus.set('running');
		await search(root, elementValue);
		highlightedNode = null;
		algorithmStatus.set('finished');
	}

	async function search(node: Node | null, value: number) {
		if (!node) return;

		highlightedNode = node;
		log(`Vizsgálat: ${node.value}`);
		await pauseIfNeeded();
		await delay(900 - get(speed) * 8);

		if (value === node.value) {
			log(`Érték megtalálva: ${value}`);
			return;
		} else if (value < node.value) {
			await search(node.left || null, value);
		} else {
			await search(node.right || null, value);
		}
	}

	async function deleteElement() {
		if (!validateInput()) return;
		algorithmStatus.set('running');
		root = await remove(root, elementValue);
		highlightedNode = null;
		positionTree(root, 250, 50, 100);
		algorithmStatus.set('finished');
	}

	async function remove(node: Node | null, value: number): Promise<Node | null> {
		if (!node) return null;

		highlightedNode = node;
		log(`Vizsgálat: ${node.value}`);
		await pauseIfNeeded();
		await delay(900 - get(speed) * 8);

		if (value < node.value) {
			node.left = await remove(node.left || null, value);
		} else if (value > node.value) {
			node.right = await remove(node.right || null, value);
		} else {
			log(`Törlés: ${value}`);
			if (!node.left) return node.right || null;
			if (!node.right) return node.left || null;

			let successor = node.right;
			while (successor.left) successor = successor.left;
			node.value = successor.value;
			node.right = await remove(node.right, successor.value);
		}
		return balance(node);
	}

	function flatten(node: Node | null): Node[] {
		if (!node) return [];
		return [node, ...flatten(node.left || null), ...flatten(node.right || null)];
	}

	selectedAlgorithmSourceCode.set('AVL Fa (beszúrás, törlés, keresés)');
</script>

<div class="control-buttons">
	<input class="custom-input" type="number" bind:value={elementValue} placeholder="Érték (0–100)" />
	<button on:click={insertElement}>Beszúrás</button>
	<button on:click={deleteElement}>Törlés</button>
	<button on:click={searchElement}>Keresés</button>
</div>

<div class="algorithm-container">
	<Controls {currentStep} {totalSteps} />
	<svg width="600" height="400" style="background: #fff; border: 1px solid #ccc;">
		{#if root}
			{#each flatten(root) as node (node.value)}
				{#if node.left}
					<line x1={node.x} y1={node.y} x2={node.left.x} y2={node.left.y} stroke="black" />
				{/if}
				{#if node.right}
					<line x1={node.x} y1={node.y} x2={node.right.x} y2={node.right.y} stroke="black" />
				{/if}

				<circle cx={node.x} cy={node.y} r="18" fill={highlightedNode === node ? 'orange' : 'lightblue'} />
				<text x={node.x} y={node.y + 5} text-anchor="middle" font-size="14" fill="black">
					{node.value}
				</text>
			{/each}
		{/if}
	</svg>
</div>

<style>
	.control-buttons {
		display: flex;
		justify-content: space-around;
		margin-bottom: 1rem;
	}
	input {
		width: 100px;
		padding: 0.4rem;
	}
	button {
		padding: 0.5rem 1rem;
		background-color: #444;
		color: aliceblue;
		border: none;
		border-radius: 5px;
		cursor: pointer;
	}
	button:hover {
		background-color: #5cb85c;
	}
</style>
