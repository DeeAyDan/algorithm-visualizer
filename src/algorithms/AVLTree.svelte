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
		prevX?: number;
		prevY?: number;
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
		delay: 600,
		duration: 800,
		easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)'
	};

	// State variables
	let root: Node | null = null;
	let highlightedNode: Node | null = null;
	let elementValue: number | null = null;
	let animating = false;
	let nodes: Node[] = []; // For tracking all nodes for animation
	activeLine.set({ start: -1, end: -1 });

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

	function getAllNodes(node: Node | null): Node[] {
		const result: Node[] = [];
		function traverse(n: Node | null): void {
			if (!n) return;
			result.push(n);
			traverse(n.left);
			traverse(n.right);
		}
		traverse(node);
		return result;
	}

	// Calculate width based on max depth
	function getOffsetX(depth: number): number {
		return 500 / Math.pow(2, depth + 1);
	}

	// Tree position management
	function saveCurrentPositions(node: Node | null): void {
		if (!node) return;
		node.prevX = node.x;
		node.prevY = node.y;
		saveCurrentPositions(node.left);
		saveCurrentPositions(node.right);
	}

	function calculatePositions(
		node: Node | null,
		depth = 0,
		offset = 0,
		parentX = LAYOUT.startX
	): void {
		if (!node) return;

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
		if (!root) return;

		animating = true;
		
		// Wait for the animation to complete
		await delay(ANIMATION.duration);
		
		const allNodes = getAllNodes(root);
		allNodes.forEach((node) => {
			node.prevX = undefined;
			node.prevY = undefined;
		});
		
		// Force a reactive update by reassigning the nodes array
		nodes = [...allNodes];
		
		animating = false;
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
      return { value, height: 1, left: null, right: null, isNew: true };
    }

    if (value < node.value) {
      node.left = insert(node.left, value, depth + 1);
    }
    else if (value > node.value) {
      node.right = insert(node.right, value, depth + 1);
    }
    
    // Update height and balance
    node.height = Math.max(height(node.left), height(node.right)) + 1;
    return balance(node);
  };

  return insert(tree, value);
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
    } else if (value > node.value) {
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

    // Update height and balance
    node.height = Math.max(height(node.left), height(node.right)) + 1;
    return balance(node);
  };

  return remove(tree, value);
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

		// Add initial delay before starting insertion
		await delay(ANIMATION.delay);
		await pauseIfNeeded();

		const insert = async (node: Node | null, value: number, depth = 0): Promise<Node> => {
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
				// Add delay before creating new node
				await delay(ANIMATION.delay);
				await pauseIfNeeded();
				return { value, height: 1, x: 25, y: 25 };
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

			// Update height
			node.height = Math.max(height(node.left), height(node.right)) + 1;
			
			// First animate the node to its position
			saveCurrentPositions(node);
			calculatePositions(root);
			await animateNodeMovements();
			
			// Then check for balancing
			const bf = balanceFactor(node);
			if (bf > 1 || bf < -1) {
				log(`Egyensúlyozás szükséges: ${node.value}`);
				await delay(ANIMATION.delay);
				await pauseIfNeeded();
				return await balance(node);
			}
			
			return node;
		};

		root = await insert(root, elementValue);
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

		const search = async (node: Node | null, value: number): Promise<boolean> => {
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
			}
			else if (value < node.value) {
				activeLine.set({ start: 10, end: 12 });
				log(`${value} < ${node.value}, balra keresünk`);
				return await search(node.left, value);
			}
			else {
				activeLine.set({ start: 13, end: 15 });
				log(`${value} > ${node.value}, jobbra keresünk`);
				return await search(node.right, value);
			}
		};

		await search(root, elementValue);
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

		const findMin = (node: Node): Node => {
			let current = node;
			while (current.left) {
				current = current.left;
			}
			return current;
		};

		if (root) {
			const nodes = getAllNodes(root);
			nodes.forEach((node) => {
				node.prevX = node.x;
				node.prevY = node.y;
			});
		}

		const remove = async (node: Node | null, value: number): Promise<Node | null> => {
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
			} else if (value > node.value) {
				activeLine.set({ start: 18, end: 20 });
				log(`${value} > ${node.value}, jobbra keresünk`);
				node.right = await remove(node.right, value);
			} else {
				if (!node.left && !node.right) {
					activeLine.set({ start: 22, end: 24 });
					log(`Levél csúcs törölve: ${value}`);
					return null;
				} else if (!node.left) {
					activeLine.set({ start: 25, end: 27 });
					log(`Csúcs törölve (${value}), jobb gyerek helyettesíti`);

					if (node.right && node.right.prevX === undefined) {
						node.right.prevX = node.right.x;
						node.right.prevY = node.right.y;
					}

					return node.right;
				} else if (!node.right) {
					activeLine.set({ start: 28, end: 30 });
					log(`Csúcs törölve (${value}), bal gyerek helyettesíti`);

					if (node.left && node.left.prevX === undefined) {
						node.left.prevX = node.left.x;
						node.left.prevY = node.left.y;
					}

					return node.left;
				} else {
					activeLine.set({ start: 31, end: 35 });
					const successor = findMin(node.right);
					log(`Két gyermekes csúcs (${value}) helyettesítése ${successor.value} értékkel`);

					node.value = successor.value;
					node.right = await remove(node.right, successor.value);
				}
			}

			// Update height and balance immediately after removal
			node.height = Math.max(height(node.left), height(node.right)) + 1;
			return await balance(node);
		};

		root = await remove(root, elementValue);
		
		// Calculate new positions and animate immediately
		if (root) {
			calculatePositions(root);
			await animateNodeMovements();
		}

		highlightedNode = null;
		activeLine.set({ start: -1, end: -1 });
		algorithmStatus.set('idle');
	}

	function resetTree(): void {
		root = null;
		consoleLog.set([]);
		currentStep.set(0);
		log('Fa törölve.');
		selectedAlgorithmSourceCode.set('Válassz egy műveletet!');
	}

	function createSampleTree(): void {
		root = { value: 50, height: 3, x: 0, y: 0 };
		root.left = { value: 25, height: 2, x: 0, y: 0 };
		root.right = { value: 75, height: 2, x: 0, y: 0 };
		root.left.left = { value: 12, height: 1, x: 0, y: 0 };
		root.left.right = { value: 37, height: 1, x: 0, y: 0 };
		root.right.left = { value: 62, height: 1, x: 0, y: 0 };
		root.right.right = { value: 87, height: 1, x: 0, y: 0 };

		calculatePositions(root);
		consoleLog.set([]);
		currentStep.set(0);
		log('Minta fa létrehozva.');
		selectedAlgorithmSourceCode.set('Válassz egy műveletet!');
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
		
		log(`Jobbra forgatás: ${y.value}`);
		await delay(ANIMATION.delay);
		await pauseIfNeeded();
		
		// Save current positions of all affected nodes
		saveCurrentPositions(y);
		saveCurrentPositions(x);
		if (t2) saveCurrentPositions(t2);
		
		// Perform rotation
		y.left = t2;
		x.right = y;
		
		updateHeight(y);
		updateHeight(x);
		
		// Calculate new positions after rotation
		calculatePositions(root);
		
		// Animate the movement
		animating = true;
		await delay(ANIMATION.duration);
		await pauseIfNeeded();
		
		// Reset animation flags
		const nodes = getAllNodes(root);
		nodes.forEach((node) => {
			node.prevX = undefined;
			node.prevY = undefined;
		});
		animating = false;
		
		return x;
	}

	async function rotateLeft(x: Node): Promise<Node> {
		const y = x.right!;
		const t2 = y.left;
		
		log(`Balra forgatás: ${x.value}`);
		await delay(ANIMATION.delay);
		await pauseIfNeeded();
		
		// Save current positions of all affected nodes
		saveCurrentPositions(x);
		saveCurrentPositions(y);
		if (t2) saveCurrentPositions(t2);
		
		// Perform rotation
		x.right = t2;
		y.left = x;
		
		updateHeight(x);
		updateHeight(y);
		
		// Calculate new positions after rotation
		calculatePositions(root);
		
		// Animate the movement
		animating = true;
		await delay(ANIMATION.duration);
		await pauseIfNeeded();
		
		// Reset animation flags
		const nodes = getAllNodes(root);
		nodes.forEach((node) => {
			node.prevX = undefined;
			node.prevY = undefined;
		});
		animating = false;
		
		return y;
	}

	async function balance(n: Node): Promise<Node> {
		const bf = balanceFactor(n);

		if (bf > 1) {
			if (balanceFactor(n.left!) < 0) {
				// Left-Right case
				log(`Bal-Jobb eset: ${n.value}`);
				await delay(ANIMATION.delay);
				await pauseIfNeeded();
				
				// First rotation
				n.left = await rotateLeft(n.left!);
				
				// Display intermediate state
				await delay(ANIMATION.delay);
				await pauseIfNeeded();
				
				// Second rotation
				return await rotateRight(n);
			}
			// Left-Left case
			return await rotateRight(n);
		}

		if (bf < -1) {
			if (balanceFactor(n.right!) > 0) {
				// Right-Left case
				log(`Jobb-Bal eset: ${n.value}`);
				await delay(ANIMATION.delay);
				await pauseIfNeeded();
				
				// First rotation
				n.right = await rotateRight(n.right!);
				
				// Display intermediate state
				await delay(ANIMATION.delay);
				await pauseIfNeeded();
				
				// Second rotation
				return await rotateLeft(n);
			}
			// Right-Right case
			return await rotateLeft(n);
		}

		return n;
	}

	function positionTree(node: Node | null, depth = 0, index = 0, parentX = LAYOUT.startX): void {
		if (!node) return;
		node.x = parentX + (index * getOffsetX(depth)) / Math.pow(2, depth + 1);
		node.y = LAYOUT.startY + depth * LAYOUT.levelGapY;
		positionTree(node.left, depth + 1, -1, node.x);
		positionTree(node.right, depth + 1, 1, node.x);
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

	// Custom transitions
	function rotateTransition(node: HTMLElement, { 
		delay = 0, 
		duration = ANIMATION.duration,
		easing = ANIMATION.easing,
		angle = 0
	}) {
		return {
			delay,
			duration,
			easing,
			css: (t: number) => {
				const rotation = angle * t;
				return `transform: rotate(${rotation}deg); transform-origin: center;`;
			}
		};
	}

	function subtreeTransition(node: HTMLElement, {
		delay = 0,
		duration = ANIMATION.duration,
		easing = ANIMATION.easing,
		fromX = 0,
		fromY = 0,
		toX = 0,
		toY = 0
	}) {
		return {
			delay,
			duration,
			easing,
			css: (t: number) => {
				const x = fromX + (toX - fromX) * t;
				const y = fromY + (toY - fromY) * t;
				return `transform: translate(${x}px, ${y}px);`;
			}
		};
	}

	// Tree visualization component
	function TreeVisualization({ node, depth = 0, offset = 0, parentX = LAYOUT.startX }) {
		if (!node) return null;

		const x = parentX + offset * getOffsetX(depth);
		const y = LAYOUT.startY + depth * LAYOUT.levelGapY;

		return `
			<g class="subtree" style="transform-origin: ${x}px ${y}px;">
				${node.left ? `
					<g class="edge-group">
						<line
							class="edge-line"
							x1="${x}"
							y1="${y}"
							x2="${x - getOffsetX(depth)}"
							y2="${y + LAYOUT.levelGapY}"
							stroke="#777"
							stroke-width="2"
						/>
					</g>
					${TreeVisualization({
						node: node.left,
						depth: depth + 1,
						offset: -1,
						parentX: x
					})}
				` : ''}
				
				${node.right ? `
					<g class="edge-group">
						<line
							class="edge-line"
							x1="${x}"
							y1="${y}"
							x2="${x + getOffsetX(depth)}"
							y2="${y + LAYOUT.levelGapY}"
							stroke="#777"
							stroke-width="2"
						/>
					</g>
					${TreeVisualization({
						node: node.right,
						depth: depth + 1,
						offset: 1,
						parentX: x
					})}
				` : ''}

				<g class="node-group" style="transform-origin: ${x}px ${y}px;">
					<circle
						cx="${x}"
						cy="${y}"
						r="${LAYOUT.nodeRadius}"
						fill="${highlightedNode === node ? '#ffd700' : '#2f4f4f'}"
						stroke="aliceblue"
						stroke-width="2"
						class="node-circle"
					/>
					<text
						x="${x}"
						y="${y + 5}"
						text-anchor="middle"
						font-size="14"
						fill="${highlightedNode === node ? 'black' : 'aliceblue'}"
						class="node-text"
					>
						${node.value}
					</text>
				</g>
			</g>
		`;
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
		<button on:click={resetTree} disabled={$algorithmStatus !== 'idle'}>Fa törlése</button>
		<button on:click={createSampleTree} disabled={$algorithmStatus !== 'idle'}>Minta fa</button>
	</div>
</div>

<div class="algorithm-container">
	<svg class="svg" width="500" height="300">
		{#if root}
			<!-- Draw edges first so they appear behind nodes -->
			{#each getAllNodes(root) as node (node.id || node.value)}
				{#if node.left}
					<line
						class="edge-line"
						x1={node.x}
						y1={node.y}
						x2={node.left.x}
						y2={node.left.y}
						stroke="#777"
						stroke-width="2"
					/>
				{/if}
				{#if node.right}
					<line
						class="edge-line"
						x1={node.x}
						y1={node.y}
						x2={node.right.x}
						y2={node.right.y}
						stroke="#777"
						stroke-width="2"
					/>
				{/if}
			{/each}

			<!-- Draw nodes on top of edges -->
			{#each getAllNodes(root) as node (node.id || node.value)}
				<g
					class="node-group"
					data-value={node.value}
				>
					<circle
						cx={node.x}
						cy={node.y}
						r={LAYOUT.nodeRadius}
						fill={highlightedNode === node ? '#ffd700' : '#2f4f4f'}
						stroke="aliceblue"
						stroke-width="2"
						class="node-circle"
					/>
					<text
						x={node.x}
						y={node.y + 5}
						text-anchor="middle"
						font-size="14"
						fill={highlightedNode === node ? 'black' : 'aliceblue'}
						class="node-text"
					>
						{node.value}
					</text>
				</g>
			{/each}
		{:else}
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
		transition: all 0.8s cubic-bezier(0.4, 0.0, 0.2, 1);
	}

	.node-text {
		user-select: none;
		pointer-events: none;
		transition: all 0.8s cubic-bezier(0.4, 0.0, 0.2, 1);
	}

	.edge-line {
		transition: all 0.8s cubic-bezier(0.4, 0.0, 0.2, 1);
	}

	.node-group {
		transition: all 0.8s cubic-bezier(0.4, 0.0, 0.2, 1);
	}
</style>