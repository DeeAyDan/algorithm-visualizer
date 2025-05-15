<script lang="ts">
	// @ts-nocheck
	import { onMount } from 'svelte';
	import { spring } from 'svelte/motion';
	import { fade, fly } from 'svelte/transition';
	import {
		currentStep,
		totalSteps,
		consoleLog,
		speed,
		algorithmStatus,
		resumeSignal,
		selectedAlgorithmSourceCode,
		activeLine
	} from '../stores/store.svelte.js';
	import Controls from '../routes/Controls.svelte';
	import { get } from 'svelte/store';
	import { flip } from 'svelte/animate';
	import { waitUntilResume, delay, pauseIfNeeded, log } from '../stores/utils.js';

	interface Node {
		value: number;
		left?: Node;
		right?: Node;
		height: number;
		x: number;
		y: number;
		id?: string; // Unique identifier for animation tracking
		isNew?: boolean; // Flag for newly inserted nodes
	}

	let root: Node | null = null;
	let highlightedNode: Node | null = null;
	let elementValue: number = null;
	let nodes: Node[] = []; // For tracking all nodes for animation
	activeLine.set(-1);

	const startX = 250;
	const startY = 25;
	const levelGapY = 80;
	const offsetX = 500;
	
	// Animation timing constants
	const NODE_TRANSITION_DURATION = 600;
	const ROTATION_TRANSITION_DURATION = 600;

	onMount(() => {
		currentStep.set(0);
		totalSteps.set(0);
		consoleLog.set([]);
		algorithmStatus.set('idle');
	});

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

	function height(n: Node | undefined): number {
		return n ? n.height : 0;
	}

	function updateHeight(n: Node) {
		n.height = Math.max(height(n.left), height(n.right)) + 1;
	}

	function balanceFactor(n: Node): number {
		return height(n.left) - height(n.right);
	}

	// Generate unique ID for nodes
	function generateNodeId(value: number): string {
		return `node-${value}-${Math.random().toString(36).substr(2, 9)}`;
	}

	async function rotateRight(y: Node): Promise<Node> {
		const x = y.left!;
		const t2 = x.right;
		
		// Perform rotation
		y.left = t2;
		x.right = y;
		
		updateHeight(y);
		updateHeight(x);
		
		log(`Jobbra forgatás: ${y.value}`);
		await delay(900 - get(speed) * 8);
		await pauseIfNeeded();
		
		// Update tree positions and trigger rerender
		positionTree(root);
		nodes = flatten(root);
		
		return x;
	}

	async function rotateLeft(x: Node): Promise<Node> {
		const y = x.right!;
		const t2 = y.left;
		
		// Perform rotation
		x.right = t2;
		y.left = x;
		
		updateHeight(x);
		updateHeight(y);
		
		log(`Balra forgatás: ${x.value}`);
		
		await delay(900 - get(speed) * 8);
		await pauseIfNeeded();
		
		// Update tree positions and trigger rerender
		positionTree(root);
		nodes = flatten(root);
		
		return y;
	}

	async function balance(n: Node): Promise<Node> {
		updateHeight(n);
		const bf = balanceFactor(n);

		if (bf > 1) {
			if (balanceFactor(n.left!) < 0) {
				n.left = await rotateLeft(n.left!);
				// Update positions after first rotation
				positionTree(root);
				nodes = flatten(root);
			}
			// Delay before second rotation
			await delay(900 - get(speed) * 8);
		await pauseIfNeeded();
			return await rotateRight(n);
		}

		if (bf < -1) {
			if (balanceFactor(n.right!) > 0) {
				n.right = await rotateRight(n.right!);
				// Update positions after first rotation
				positionTree(root);
				nodes = flatten(root);
			}
			// Delay before second rotation
			await delay(900 - get(speed) * 8);
		await pauseIfNeeded();
			return await rotateLeft(n);
		}

		return n;
	}

	async function insert(node: Node | null, value: number): Promise<Node | null> {
		if (!node) {
			const newNode = { 
				value, 
				height: 1, 
				x: startX, 
				y: startY, 
				id: generateNodeId(value),
				isNew: true 
			};
			log(`Beszúrt érték: ${value}`);
			return newNode;
		}

		highlightedNode = node;
		log(`Vizsgálat: ${node.value}`);
		await delay(900 - get(speed) * 8);
		await pauseIfNeeded();

		if (value < node.value) {
			node.left = await insert(node.left, value);
		} else if (value > node.value) {
			node.right = await insert(node.right, value);
		} else {
			log('Már létezik ilyen érték!');
			return node;
		}

		// Update positions after insertion
		positionTree(root);
		nodes = flatten(root);
		
		await delay(900 - get(speed) * 8);
		await pauseIfNeeded();

		return await balance(node);
	}

	async function insertElement() {
		consoleLog.set([]);

		if (!validateInput()) return;
		algorithmStatus.set('running');

		let testRoot = await insert(root, elementValue);
		highlightedNode = null;

		if (testRoot === null || height(testRoot) > 4) {
			log('A fa mélysége nem lehet nagyobb, mint 4. Az érték nem került beszúrásra.');
			algorithmStatus.set('finished');
			return;
		}

		root = testRoot;
		
		// Mark new nodes as not new after animation completes
		setTimeout(() => {
			const markNodesNotNew = (node) => {
				if (!node) return;
				node.isNew = false;
				if (node.left) markNodesNotNew(node.left);
				if (node.right) markNodesNotNew(node.right);
			};
			markNodesNotNew(root);
			nodes = flatten(root);
		}, NODE_TRANSITION_DURATION);
		
		positionTree(root);
		nodes = flatten(root);
		algorithmStatus.set('finished');
	}

	function positionTree(node: Node | null, depth = 0, index = 0, parentX = startX): void {
		if (!node) return;
		node.x = parentX + (index * offsetX) / Math.pow(2, depth + 1);
		node.y = startY + depth * levelGapY;
		positionTree(node.left, depth + 1, -1, node.x);
		positionTree(node.right, depth + 1, 1, node.x);
	}

	async function searchElement() {
		consoleLog.set([]);

		if (!validateInput()) return;
		algorithmStatus.set('running');
		await search(root, elementValue);
		algorithmStatus.set('finished');
	}

	async function search(node: Node | null, value: number) {
		if (!node) return;

		highlightedNode = node;
		log(`Vizsgálat: ${node.value}`);
		await delay(900 - get(speed) * 8);
		await pauseIfNeeded();

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
		consoleLog.set([]);

		if (!validateInput()) return;
		algorithmStatus.set('running');
		root = await remove(root, elementValue);
		highlightedNode = null;
		positionTree(root);
		nodes = flatten(root);
		algorithmStatus.set('finished');
	}

	async function remove(node: Node | null, value: number): Promise<Node | null> {
		if (!node) return null;

		highlightedNode = node;
		log(`Vizsgálat: ${node.value}`);
		await delay(900 - get(speed) * 8);
		await pauseIfNeeded();

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
		
		// Update positions after deletion
		if (root) {
			positionTree(root);
			nodes = flatten(root);
		}
		
		return await balance(node);
	}

	function flatten(node: Node | null): Node[] {
		if (!node) return [];
		return [node, ...flatten(node.left || null), ...flatten(node.right || null)];
	}

	// Update nodes array when root changes
	$: {
		if (root) {
			nodes = flatten(root);
		}
	}

	selectedAlgorithmSourceCode.set(
		`function insertElement(tree, value) {
  if (tree === null) {
    return { value, height: 1, left: null, right: null };
  }
  
  if (value < tree.value) {
    tree.left = insertElement(tree.left, value);
  } else if (value > tree.value) {
    tree.right = insertElement(tree.right, value);
  } else {
    return tree; // Duplikált érték
  }
  
  // Magasság frissítése
  tree.height = Math.max(height(tree.left), height(tree.right)) + 1;
  
  // Egyensúly ellenőrzése és helyreállítása
  return balance(tree);
}
\n
function searchElement(tree, value) {
  if (tree === null) {
    return false;
  }
  
  if (value === tree.value) {
    return true;
  } else if (value < tree.value) {
    return searchElement(tree.left, value);
  } else {
    return searchElement(tree.right, value);
  }
}
\n
function deleteElement(tree, value) {
  if (tree === null) {
    return null;
  }
  
  if (value < tree.value) {
    tree.left = deleteElement(tree.left, value);
  } else if (value > tree.value) {
    tree.right = deleteElement(tree.right, value);
  } else {
    // A törlendő csomópont megtalálva
    
    // Egy vagy nulla gyerek
    if (!tree.left) return tree.right;
    if (!tree.right) return tree.left;
    
    // Két gyerek esetén
    let successor = minValueNode(tree.right);
    tree.value = successor.value;
    tree.right = deleteElement(tree.right, successor.value);
  }
  
  // Magasság frissítése és kiegyensúlyozás
  return balance(tree);
}`
	);
</script>

<div class="control-buttons">
	<input class="custom-input" type="number" bind:value={elementValue} placeholder="Elem értéke" />
	<button on:click={insertElement}>Elem beszúrás</button>
	<button on:click={deleteElement}>Elem törlés</button>
	<button on:click={searchElement}>Elem keresés</button>
</div>

<div class="algorithm-container">
	<svg class="svg" width="500" height="300">
		<!-- Edge connections (drawn first) -->
		{#each nodes as node (node.id || node.value)}
			{#if node.left}
				<line 
					x1={node.x} 
					y1={node.y} 
					x2={node.left.x} 
					y2={node.left.y} 
					stroke="black"
					transition:fade={{ duration: NODE_TRANSITION_DURATION }}
				/>
			{/if}
			{#if node.right}
				<line 
					x1={node.x} 
					y1={node.y} 
					x2={node.right.x} 
					y2={node.right.y} 
					stroke="black"
					transition:fade={{ duration: NODE_TRANSITION_DURATION }}
				/>
			{/if}
		{/each}

		<!-- Nodes (drawn above edges) -->
		{#each nodes as node (node.id || node.value)}
			<g
				animate:flip={{ duration: NODE_TRANSITION_DURATION }}
			>
				<circle
					cx={node.x}
					cy={node.y}
					r={node.isNew ? "0" : "18"}
					in:fly={{ y: 20, duration: NODE_TRANSITION_DURATION, easing: t => t }}
					out:fade
					fill={highlightedNode === node 
						? '#ffd700' 
						: '#2f4f4f'}
					stroke="aliceblue"
					stroke-width="2"
					style="transition: r {NODE_TRANSITION_DURATION}ms, cx {NODE_TRANSITION_DURATION}ms, cy {NODE_TRANSITION_DURATION}ms, fill {NODE_TRANSITION_DURATION / 2}ms;"
				/>
				<text
					x={node.x}
					y={node.y + 5}
					opacity={node.isNew ? 0 : 1}
					text-anchor="middle"
					font-size="14"
					fill={highlightedNode === node ? 'black' : 'aliceblue'}
					style="transition: x {NODE_TRANSITION_DURATION}ms, y {NODE_TRANSITION_DURATION}ms, opacity {NODE_TRANSITION_DURATION}ms;"
				>
					{node.value}
				</text>
			</g>
		{/each}
	</svg>
</div>

<style>
	.control-buttons {
		display: flex;
		justify-content: space-around;
		align-items: center;
		padding: 1rem;
		border-bottom: 3px solid #505050;
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
	.svg {
		margin: 1rem auto;
		border: 1px solid #ccc;
		border-radius: 4px;
		display: block;
		background-color: #2f2f2f;
	}
	
	/* Animation styles */
	circle, text, line {
		transition-timing-function: ease-in-out;
	}
</style>