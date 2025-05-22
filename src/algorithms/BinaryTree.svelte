<script lang="ts">
	// @ts-nocheck
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import {
		selectedAlgorithmSourceCode,
		currentStep,
		totalSteps,
		consoleLog,
		algorithmStatus,
		resumeSignal,
		selectedAlgorithm,
		activeLine
	} from '../stores/store.svelte.js';
	import { algorithmDisplayNames } from '../stores/algorithmMap.js';
	import { waitUntilResume, delay, pauseIfNeeded, log } from '../stores/utils.js';
	import SourceCode from '../routes/SourceCode.svelte';

	// Tree node interface
	interface TreeNode {
		value: number;
		left?: TreeNode | null;
		right?: TreeNode | null;
		x: number;
		y: number;
		prevX?: number; // For animation tracking
		prevY?: number; // For animation tracking
		isNew?: boolean; // Flag for newly inserted nodes
	}

	// Layout constants
	const LAYOUT = {
		startX: 250,
		startY: 25,
		levelGapY: 80,
		nodeRadius: 18,
		maxDepth: 4
	};

	// Animation constants
	const ANIMATION = {
		delay: 900,
		duration: 600,
		easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)'
	};

	// State variables
	let tree: TreeNode | null = null;
	let highlightedNode: TreeNode | null = null;
	let elementValue: number | null = null;
	let animating = false;

	// Initialize stores
	function initStores(): void {
		currentStep.set(0);
		algorithmStatus.set('idle');
		consoleLog.set([]);
		activeLine.set({ start: -1, end: -1 });
		selectedAlgorithmSourceCode.set('Válassz egy műveletet!');
	}

	onMount(initStores);

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

	function getAllNodes(root: TreeNode | null): TreeNode[] {
		const result: TreeNode[] = [];
		function traverse(node: TreeNode | null): void {
			if (!node) return;
			result.push(node);
			traverse(node.left);
			traverse(node.right);
		}
		traverse(root);
		return result;
	}

	// Calculate width based on max depth
	function getOffsetX(depth: number): number {
		return 500 / Math.pow(2, depth + 1);
	}

	// Tree position management
	function saveCurrentPositions(node: TreeNode | null): void {
		if (!node) return;

		// Save current position for animation only if not already saved
		if (node.prevX === undefined) node.prevX = node.x;
		if (node.prevY === undefined) node.prevY = node.y;

		// Process children
		saveCurrentPositions(node.left);
		saveCurrentPositions(node.right);
	}

	function calculatePositions(
		node: TreeNode | null,
		depth = 0,
		offset = 0,
		parentX = LAYOUT.startX
	): void {
		if (!node) return;

		// For new nodes, set starting position at (25, 25) for animation
		if (node.isNew && node.prevX === undefined && node.prevY === undefined) {
			node.prevX = 25;
			node.prevY = 25;
		}

		// Calculate X position based on depth and offset
		const xOffset = getOffsetX(depth);
		node.x = parentX + offset * xOffset;
		node.y = LAYOUT.startY + depth * LAYOUT.levelGapY;

		// Calculate positions for children
		calculatePositions(node.left, depth + 1, -1, node.x);
		calculatePositions(node.right, depth + 1, 1, node.x);
	}

	// Animation functions
	async function animateNodeMovements(): Promise<void> {
		if (!tree) return;

		animating = true;

		// Wait for animation to complete then reset flags
		setTimeout(() => {
			const nodes = getAllNodes(tree);
			nodes.forEach((node) => {
				if (node.isNew) node.isNew = false;
				// Clear previous positions to prepare for next animation
				node.prevX = undefined;
				node.prevY = undefined;
			});
			animating = false;
		}, ANIMATION.duration);
	}

	// Source code management
	function updateInsertSourceCode(): void {
		selectedAlgorithmSourceCode.set(
			`function insertElement(tree, value) {
  const insert = (node, value, depth = 0) => {
    if (depth > ${LAYOUT.maxDepth - 1}) {
      return node;
    }

    if (!node) {
      return { value, x: 0, y: 0, isNew: true };
    }

    if (value < node.value) {
      node.left = insert(node.left, value, depth + 1);
    }
    else if (value > node.value) {
      node.right = insert(node.right, value, depth + 1);
    }
    
    return node;
  };

}`
		);
	}

	function updateSearchSourceCode(): void {
		selectedAlgorithmSourceCode.set(
			`function searchElement(tree, value) {
  const search = (node, value) => {
    if (!node) {
      return false;
    }
    
    if (value === node.value) {
      return true;
    } 
    else if (value < node.value) {
      return search(node.left, value);
    } 
    else {
      return search(node.right, value);
    }
  };

  return search(tree, value);
}`
		);
	}

	function updateDeleteSourceCode(): void {
		selectedAlgorithmSourceCode.set(
			`function deleteElement(tree, value) {
  const findMin = (node) => {
    let current = node;
    while (current.left) {
      current = current.left;
    }
    return current;
  };

  const remove = (node, value) => {
    if (!node) {
      return null;
    }

    if (value < node.value) {
      node.left = remove(node.left, value);
    }
    else if (value > node.value) {
      node.right = remove(node.right, value);
    } 
    else {
      if (!node.left && !node.right) {
        return null;
      }
      else if (!node.left) {
        return node.right;
      }
      else if (!node.right) {
        return node.left;
      }
      else {
        const successor = findMin(node.right);
        node.value = successor.value;
        node.right = remove(node.right, successor.value);
      }
    }
    return node;
  };

}`
		);
	}

	// Tree operations
	async function insertElement(): Promise<void> {
		if (!validateInput() || animating) return;

		algorithmStatus.set('running');
		consoleLog.set([]);
		currentStep.set(0);
		log(`Beszúrás: ${elementValue}`);
		updateInsertSourceCode();

		const insert = async (node: TreeNode | null, value: number, depth = 0): Promise<TreeNode> => {
			if (depth > LAYOUT.maxDepth - 1) {
				activeLine.set({ start: 3, end: 5 });
				log(`A fa mélysége nem lehet nagyobb, mint ${LAYOUT.maxDepth}.`);
				await delay(ANIMATION.delay);
				await pauseIfNeeded();
				return node;
			}

			await delay(ANIMATION.delay);
			await pauseIfNeeded();

			if (!node) {
				activeLine.set({ start: 7, end: 9 });
				log(`Beszúrt érték: ${value}`);
				return { value, x: 25, y: 25, isNew: true };
			}

			highlightedNode = node;
			log(`Vizsgált csúcs: ${node.value}`);

			if (value < node.value) {
				activeLine.set({ start: 11, end: 13 });
				log(`${value} < ${node.value}, balra haladunk`);
				node.left = await insert(node.left, value, depth + 1);
			} else if (value > node.value) {
				activeLine.set({ start: 14, end: 16 });
				log(`${value} > ${node.value}, jobbra haladunk`);
				node.right = await insert(node.right, value, depth + 1);
			} else {
				activeLine.set({ start: 17, end: 19 });
				log('Az érték már szerepel a fában.');
			}
			return node;
		};

		tree = await insert(tree, elementValue);
		saveCurrentPositions(tree);
		calculatePositions(tree);
		await animateNodeMovements();

		highlightedNode = null;
		activeLine.set({ start: -1, end: -1 });
		algorithmStatus.set('idle');
	}

	async function searchElement(): Promise<void> {
		if (!validateInput() || animating) return;

		algorithmStatus.set('running');
		consoleLog.set([]);
		currentStep.set(0);
		log(`Keresés: ${elementValue}`);
		updateSearchSourceCode();

		const search = async (node: TreeNode | null, value: number): Promise<boolean> => {
			if (!node) {
				activeLine.set({ start: 3, end: 5 });
				log('Elem nem található.');
				return false;
			}

			highlightedNode = node;
			log(`Vizsgált csúcs: ${node.value}`);
			await delay(ANIMATION.delay);
			await pauseIfNeeded();

			if (value === node.value) {
				activeLine.set({ start: 7, end: 9 });
				log(`Érték megtalálva: ${value}`);
				await delay(ANIMATION.delay);
				await pauseIfNeeded();
				return true;
			} else if (value < node.value) {
				activeLine.set({ start: 10, end: 12 });
				log(`${value} < ${node.value}, balra keresünk`);
				return await search(node.left, value);
			} else {
				activeLine.set({ start: 13, end: 15 });
				log(`${value} > ${node.value}, jobbra keresünk`);
				return await search(node.right, value);
			}
		};

		await search(tree, elementValue);
		highlightedNode = null;
		activeLine.set({ start: -1, end: -1 });
		algorithmStatus.set('idle');
	}

	async function deleteElement(): Promise<void> {
		if (!validateInput() || animating) return;

		algorithmStatus.set('running');
		consoleLog.set([]);
		log(`Törlés: ${elementValue}`);
		updateDeleteSourceCode();

		const findMin = (node: TreeNode): TreeNode => {
			let current = node;
			while (current.left) {
				current = current.left;
			}
			return current;
		};

		if (tree) {
			const nodes = getAllNodes(tree);
			nodes.forEach((node) => {
				node.prevX = node.x;
				node.prevY = node.y;
			});
		}

		const remove = async (node: TreeNode | null, value: number): Promise<TreeNode | null> => {
			if (!node) {
				activeLine.set({ start: 11, end: 13 });
				log('Elem nem található.');
				return null;
			}

			highlightedNode = node;
			log(`Vizsgált csúcs: ${node.value}`);
			await delay(ANIMATION.delay);
				await pauseIfNeeded();

			if (value < node.value) {
				activeLine.set({ start: 15, end: 17 });
				log(`${value} < ${node.value}, balra keresünk`);
				node.left = await remove(node.left, value);
				await delay(ANIMATION.delay);
				await pauseIfNeeded();
			} else if (value > node.value) {
				activeLine.set({ start: 18, end: 20 });
				log(`${value} > ${node.value}, jobbra keresünk`);
				node.right = await remove(node.right, value);
				await delay(ANIMATION.delay);
				await pauseIfNeeded();
			} else {
				if (!node.left && !node.right) {
					activeLine.set({ start: 22, end: 24 });
					log(`Levél csúcs törölve: ${value}`);
					await delay(ANIMATION.delay);
					await pauseIfNeeded();
					return null;
				} else if (!node.left) {
					activeLine.set({ start: 25, end: 27 });
					log(`Csúcs törölve (${value}), jobb gyerek helyettesíti`);

					if (node.right && node.right.prevX === undefined) {
						node.right.prevX = node.right.x;
						node.right.prevY = node.right.y;
					}

					await delay(ANIMATION.delay);
					await pauseIfNeeded();
					return node.right;
				} else if (!node.right) {
					activeLine.set({ start: 28, end: 30 });
					log(`Csúcs törölve (${value}), bal gyerek helyettesíti`);

					if (node.left && node.left.prevX === undefined) {
						node.left.prevX = node.left.x;
						node.left.prevY = node.left.y;
					}

					await delay(ANIMATION.delay);
					await pauseIfNeeded();
					return node.left;
				} else {
					activeLine.set({ start: 31, end: 35 });
					const successor = findMin(node.right);
					log(`Két gyermekes csúcs (${value}) helyettesítése ${successor.value} értékkel`);

					node.value = successor.value;

					await delay(ANIMATION.delay);
					await pauseIfNeeded();
					node.right = await remove(node.right, successor.value);
				}
			}
			return node;
		};

		tree = await remove(tree, elementValue);
		calculatePositions(tree);
		await animateNodeMovements();

		highlightedNode = null;
		activeLine.set({ start: -1, end: -1 });
		algorithmStatus.set('idle');
	}

	function resetTree(): void {
		tree = null;
		consoleLog.set([]);
		currentStep.set(0);
		log('Fa törölve.');
		selectedAlgorithmSourceCode.set('Válassz egy műveletet!');
	}

	function createSampleTree(): void {
		tree = { value: 50, x: 0, y: 0 };
		tree.left = { value: 25, x: 0, y: 0 };
		tree.right = { value: 75, x: 0, y: 0 };
		tree.left.left = { value: 12, x: 0, y: 0 };
		tree.left.right = { value: 37, x: 0, y: 0 };
		tree.right.left = { value: 62, x: 0, y: 0 };
		tree.right.right = { value: 87, x: 0, y: 0 };

		calculatePositions(tree);
		consoleLog.set([]);
		currentStep.set(0);
		log('Minta fa létrehozva.');
		selectedAlgorithmSourceCode.set('Válassz egy műveletet!');
	}
</script>

<div class="control-buttons">
	<input
		class="custom-input"
		type="number"
		bind:value={elementValue}
		placeholder="Elem értéke"
		disabled={$algorithmStatus !== 'idle'}
	/>
	<div>
		<button on:click={insertElement} disabled={$algorithmStatus !== 'idle'}>Elem beszúrás</button>
		<button on:click={deleteElement} disabled={$algorithmStatus !== 'idle'}>Elem törlés</button>
		<button on:click={searchElement} disabled={$algorithmStatus !== 'idle'}>Elem keresés</button>
		<button on:click={createSampleTree} disabled={$algorithmStatus !== 'idle'} class="special-button">Minta fa</button>
		<button on:click={resetTree} disabled={$algorithmStatus !== 'idle'} class="clear-button">Fa törlése</button>

	</div>
</div>

<div class="algorithm-container">
	<svg class="svg" width="500" height="300">
		{#if tree}
			<!-- Draw edges first so they appear behind nodes -->
			{#each getAllNodes(tree) as node (node.value)}
				{#if node.left}
					<g
						class="edge-group"
						style="transform: translate({node.left.prevX !== undefined && animating
							? node.left.prevX - node.left.x
							: 0}px, 
							{node.left.prevY !== undefined && animating ? node.left.prevY - node.left.y : 0}px); 
							transition: transform {ANIMATION.duration}ms {ANIMATION.easing};"
					>
						<line
							class="edge-line"
							x1={node.x}
							y1={node.y}
							x2={node.left.x}
							y2={node.left.y}
							stroke="#777"
							stroke-width="2"
						/>
					</g>
				{/if}
				{#if node.right}
					<g
						class="edge-group"
						style="transform: translate({node.right.prevX !== undefined && animating
							? node.right.prevX - node.right.x
							: 0}px, 
							{node.right.prevY !== undefined && animating ? node.right.prevY - node.right.y : 0}px); 
							transition: transform {ANIMATION.duration}ms {ANIMATION.easing};"
					>
						<line
							class="edge-line"
							x1={node.x}
							y1={node.y}
							x2={node.right.x}
							y2={node.right.y}
							stroke="#777"
							stroke-width="2"
						/>
					</g>
				{/if}
			{/each}

			<!-- Draw nodes on top of edges -->
			{#each getAllNodes(tree) as node (node.value)}
				<g
					class="node-group"
					data-value={node.value}
					style="transform: translate({node.prevX !== undefined && animating
						? node.prevX - node.x
						: 0}px, 
                                   {node.prevY !== undefined && animating
						? node.prevY - node.y
						: 0}px); 
                     transition: transform {ANIMATION.duration}ms {ANIMATION.easing};"
				>
					<circle
						cx={node.x}
						cy={node.y}
						r={LAYOUT.nodeRadius}
						fill={node.isNew ? '#45a049' : highlightedNode === node ? '#ffd700' : '#2f4f4f'}
						stroke="aliceblue"
						stroke-width="2"
						class="node-circle"
					/>
					<text
						x={node.x}
						y={node.y + 5}
						text-anchor="middle"
						font-size="14"
						fill={node.isNew ? 'white' : highlightedNode === node ? 'black' : 'aliceblue'}
						class="node-text"
					>
						{node.value}
					</text>
				</g>
			{/each}
		{:else}
			<!-- Empty tree message -->
			<text x="250" y="150" text-anchor="middle" fill="#aaa" font-size="16"> A fa üres. </text>
		{/if}
	</svg>
</div>

<style>
	.control-buttons {
		display: flex;
		justify-content: space-around;
		align-items: center;
		padding: 1rem;
		border-bottom: 3px solid #505050;
		flex-wrap: wrap;
		gap: 10px;
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

	.control-buttons div button {
		padding: 0.5rem 1rem;
		background-color: #505050;
		color: white;
		border: none;
		border-radius: 5px;
		cursor: pointer;
		transition: background-color 0.3s;
	}

	.control-buttons div button:hover:not([disabled]) {
		background-color: #45a049;
	}

	.control-buttons div button[disabled] {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.special-button {
		background-color: #3498db !important;
	}
	
	.special-button:hover {
		background-color: #2980b9 !important;
	}
	
	.clear-button {
		background-color: #e74c3c !important;
	}
	
	.clear-button:hover {
		background-color: #c0392b !important;
	}
	.control-buttons div {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
		justify-content: center;
	}
	.custom-input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		border-color: #3a3a3a;
	}

	.svg {
		margin: 1rem auto;
		border: 1px solid #666;
		border-radius: 4px;
		display: block;
		background-color: #2f2f2f;
	}

	.node-circle {
		transition: fill 0.3s;
	}

	.node-text {
		user-select: none;
		pointer-events: none;
	}

	.node-group {
		transform-origin: center;
		will-change: transform;
	}

	.edge-group {
		transform-origin: 0 0;
		will-change: transform;
	}

	.edge-line {
		will-change: transform;
	}
</style>
