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


	// Tree node interface
	interface TreeNode {
		value: number;
		left?: TreeNode | null;
		right?: TreeNode | null;
		x: number;
		y: number;
		prevX?: number;  // For animation tracking
		prevY?: number;  // For animation tracking
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
		delay: 800,
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
		activeLine.set(-1);
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
  if (!validateInput()) return;

  const insert = (node, value, depth = 0) => {
    // Check depth limit
    if (depth > ${LAYOUT.maxDepth - 1}) {
      log("A fa mélysége nem lehet nagyobb, mint ${LAYOUT.maxDepth}.");
      return node;
    }

    // Create new node if empty
    if (!node) {
      return { value, x: 0, y: 0, isNew: true };
    }

    // Traverse tree
    if (value < node.value) {
      node.left = insert(node.left, value, depth + 1);
    } else if (value > node.value) {
      node.right = insert(node.right, value, depth + 1);
    } else {
      log('Az érték már szerepel a fában.');
    }
    
    return node;
  };

  tree = insert(tree, value);
  // Save current positions before recalculating
  saveCurrentPositions(tree);
  calculatePositions(tree);
  animateNodeMovements();
}`
		);
	}

	function updateSearchSourceCode(): void {
		selectedAlgorithmSourceCode.set(
			`function searchElement(tree, value) {
  const search = (node, value) => {
    // Base case - not found
    if (!node) {
      log('Elem nem található.');
      return false;
    }
    
    // Check current node
    if (value === node.value) {
      log('Érték megtalálva!');
      return true;
    } 
    // Search left
    else if (value < node.value) {
      log(\`\${value} < \${node.value}, balra keresünk\`);
      return search(node.left, value);
    } 
    // Search right
    else {
      log(\`\${value} > \${node.value}, jobbra keresünk\`);
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
  // Helper function to find minimum value node
  const findMin = (node) => {
    let current = node;
    while (current.left) {
      current = current.left;
    }
    return current;
  };

  const remove = (node, value) => {
    // Base case - not found
    if (!node) {
      log('Elem nem található.');
      return null;
    }

    // Traverse tree to find node
    if (value < node.value) {
      log(\`\${value} < \${node.value}, balra keresünk\`);
      node.left = remove(node.left, value);
    } else if (value > node.value) {
      log(\`\${value} > \${node.value}, jobbra keresünk\`);
      node.right = remove(node.right, value);
    } 
    // Found node to delete
    else {
      // Case 1: Leaf node (no children)
      if (!node.left && !node.right) {
        log(\`Levél csúcs törölve: \${value}\`);
        return null;
      }
      // Case 2: Node with only one child
      else if (!node.left) {
        log(\`Csúcs törölve (\${value}), jobb gyerek helyettesíti\`);
        return node.right;
      }
      else if (!node.right) {
        log(\`Csúcs törölve (\${value}), bal gyerek helyettesíti\`);
        return node.left;
      }
      // Case 3: Node with two children
      else {
        // Find successor (minimum value in right subtree)
        const successor = findMin(node.right);
        log(\`Két gyermekes csúcs (\${value}) helyettesítése \${successor.value} értékkel\`);
        
        // Replace node value with successor value
        node.value = successor.value;
        
        // Delete successor
        node.right = remove(node.right, successor.value);
      }
    }
    return node;
  };

  tree = remove(tree, value);
  // Save current positions before recalculating
  saveCurrentPositions(tree);
  calculatePositions(tree);
  animateNodeMovements();
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
			// Check depth limit
			if (depth > LAYOUT.maxDepth - 1) {
				activeLine.set(5);
				log(`A fa mélysége nem lehet nagyobb, mint ${LAYOUT.maxDepth}.`);
				await pauseIfNeeded();
				await delay(ANIMATION.delay);
				return node;
			}

			await pauseIfNeeded();
			await delay(ANIMATION.delay);

			// Create new node if empty
			if (!node) {
				activeLine.set(10);
				log(`Beszúrt érték: ${value}`);
				return { value, x: 25, y: 25, isNew: true };
			}

			// Highlight current node and log
			highlightedNode = node;
			log(`Vizsgált csúcs: ${node.value}`);

			// Traverse tree
			if (value < node.value) {
				activeLine.set(15);
				log(`${value} < ${node.value}, balra haladunk`);
				node.left = await insert(node.left, value, depth + 1);
			} else if (value > node.value) {
				activeLine.set(17);
				log(`${value} > ${node.value}, jobbra haladunk`);
				node.right = await insert(node.right, value, depth + 1);
			} else {
				activeLine.set(19);
				log('Az érték már szerepel a fában.');
			}
			return node;
		};

		tree = await insert(tree, elementValue);

		// Save current positions for nodes before recalculating
		saveCurrentPositions(tree);

		// Calculate new positions
		calculatePositions(tree);

		// Animate the movement of nodes to their new positions
		await animateNodeMovements();

		highlightedNode = null;
		algorithmStatus.set('idle');
		activeLine.set(-1);
	}

	async function searchElement(): Promise<void> {
		if (!validateInput() || animating) return;

		algorithmStatus.set('running');
		consoleLog.set([]);
		currentStep.set(0);
		log(`Keresés: ${elementValue}`);
		updateSearchSourceCode();

		const search = async (node: TreeNode | null, value: number): Promise<boolean> => {
			// Base case - not found
			if (!node) {
				activeLine.set(4);
				log('Elem nem található.');
				return false;
			}

			// Highlight current node and pause
			highlightedNode = node;
			log(`Vizsgált csúcs: ${node.value}`);
			await pauseIfNeeded();
			await delay(ANIMATION.delay);

			// Check current node
			if (value === node.value) {
				activeLine.set(9);
				log(`Érték megtalálva: ${value}`);
				await pauseIfNeeded();
				await delay(ANIMATION.delay);
				return true;
			}
			// Search left
			else if (value < node.value) {
				activeLine.set(13);
				log(`${value} < ${node.value}, balra keresünk`);
				return await search(node.left, value);
			}
			// Search right
			else {
				activeLine.set(18);
				log(`${value} > ${node.value}, jobbra keresünk`);
				return await search(node.right, value);
			}
		};

		await search(tree, elementValue);
		highlightedNode = null;
		activeLine.set(-1);
		algorithmStatus.set('idle');
	}

	async function deleteElement(): Promise<void> {
		if (!validateInput() || animating) return;

		algorithmStatus.set('running');
		consoleLog.set([]);
		currentStep.set(0);
		log(`Törlés: ${elementValue}`);
		updateDeleteSourceCode();

		// Helper function to find the minimum value node
		const findMin = (node: TreeNode): TreeNode => {
			let current = node;
			while (current.left) {
				current = current.left;
			}
			return current;
		};

		// Store positions for animation
		if (tree) {
			const nodes = getAllNodes(tree);
			nodes.forEach((node) => {
				node.prevX = node.x;
				node.prevY = node.y;
			});
		}

		const remove = async (node: TreeNode | null, value: number): Promise<TreeNode | null> => {
			// Base case - not found
			if (!node) {
				activeLine.set(11);
				log('Elem nem található.');
				return null;
			}

			// Highlight current node and pause
			highlightedNode = node;
			log(`Vizsgált csúcs: ${node.value}`);
			await pauseIfNeeded();
			await delay(ANIMATION.delay);

			// Traverse tree to find node
			if (value < node.value) {
				activeLine.set(16);
				log(`${value} < ${node.value}, balra keresünk`);
				node.left = await remove(node.left, value);
			} else if (value > node.value) {
				activeLine.set(19);
				log(`${value} > ${node.value}, jobbra keresünk`);
				node.right = await remove(node.right, value);
			} 
			// Found node to delete
			else {
				activeLine.set(24);
				
				// Case 1: Leaf node (no children)
				if (!node.left && !node.right) {
					log(`Levél csúcs törölve: ${value}`);
					await pauseIfNeeded();
					await delay(ANIMATION.delay);
					return null;
				}
				// Case 2: Node with only one child
				else if (!node.left) {
					activeLine.set(29);
					log(`Csúcs törölve (${value}), jobb gyerek helyettesíti`);
					
					// Preserve animation position for child node
					if (node.right && node.right.prevX === undefined) {
						node.right.prevX = node.right.x;
						node.right.prevY = node.right.y;
					}
					
					await pauseIfNeeded();
					await delay(ANIMATION.delay);
					return node.right;
				}
				else if (!node.right) {
					activeLine.set(33);
					log(`Csúcs törölve (${value}), bal gyerek helyettesíti`);
					
					// Preserve animation position for child node
					if (node.left && node.left.prevX === undefined) {
						node.left.prevX = node.left.x;
						node.left.prevY = node.left.y;
					}
					
					await pauseIfNeeded();
					await delay(ANIMATION.delay);
					return node.left;
				}
				// Case 3: Node with two children
				else {
					activeLine.set(39);
					
					// Find successor (minimum value in right subtree)
					const successor = findMin(node.right);
					log(`Két gyermekes csúcs (${value}) helyettesítése ${successor.value} értékkel`);
					
					// Replace node value with successor value
					node.value = successor.value;
					
					// Delete successor
					await pauseIfNeeded();
					await delay(ANIMATION.delay);
					activeLine.set(46);
					node.right = await remove(node.right, successor.value);
				}
			}
			return node;
		};

		tree = await remove(tree, elementValue);
		
		// Calculate new positions
		calculatePositions(tree);
		
		// Animate nodes to their new positions
		await animateNodeMovements();
		
		highlightedNode = null;
		activeLine.set(-1);
		algorithmStatus.set('idle');
	}

	function resetTree(): void {
		tree = null;
		consoleLog.set([]);
		currentStep.set(0);
		updateInsertSourceCode();
		log('Fa törölve.');
	}

	function createSampleTree(): void {
		// Create a sample balanced tree
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
	}
</script>

<div class="control-buttons">
	<input class="custom-input" type="number" bind:value={elementValue} placeholder="Elem értéke" />
	<div>
		<button on:click={insertElement} disabled={animating}>Elem beszúrás</button>
		<button on:click={deleteElement} disabled={animating}>Elem törlés</button>
		<button on:click={searchElement} disabled={animating}>Elem keresés</button>
		<button on:click={resetTree} disabled={animating}>Fa törlése</button>
		<button on:click={createSampleTree} disabled={animating}>Minta fa</button>
	</div>
</div>

<div class="algorithm-container">
	<svg class="svg" width="500" height="300">
		{#if tree}
			<!-- Draw edges first so they appear behind nodes -->
			{#each getAllNodes(tree) as node (node.value)}
				{#if node.left}
					<g class="edge-group">
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
					<g class="edge-group">
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

	.edge-line {
		will-change: transform;
	}
</style>