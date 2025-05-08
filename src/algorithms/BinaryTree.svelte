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
		selectedAlgorithm,
		activeLine
	} from '../stores/store.svelte.js';
	import Controls from '../routes/Controls.svelte';
	import { get } from 'svelte/store';
	import { algorithmDisplayNames } from '../stores/algorithmMap.js';

	currentStep.set(0);
	algorithmStatus.set('idle');
	consoleLog.set([]);
	activeLine.set(-1);
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
	const startY = 25;
	const levelGapY = 80;
	const offsetX = 500;

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
		node.x = parentX + (index * offsetX) / Math.pow(2, depth + 1);
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

		selectedAlgorithmSourceCode.set(
			`function insertElement(tree, value) {
  if (!validateInput()) return;

  const insert = (node, value, depth = 0) =>{
    if (depth > 4) {
      return node || { value, x: 0, y: 0 };
    }

  if (!node) {
    return { value, x: 0, y: 0 };
  }
  if (value < node.value) {
    node.left = await insert(node.left, value);
  } else if (value > node.value) {
    node.right = await insert(node.right, value);
  } else {
    log('Az érték már szerepel a fában.');
  }
    return node;
  };

  tree = insert(tree, elementValue);
}`
		);

		const insert = async (node: TreeNode | null, value: number, depth = 0): Promise<TreeNode> => {
			if (depth > 3) {
				activeLine.set(5);
				log('A fa mélysége nem lehet nagyobb, mint 4.');
				await pauseIfNeeded();
				await delay(900 - get(speed) * 8);
				return null;
			}

			await pauseIfNeeded();
			await delay(900 - get(speed) * 8);

			if (!node) {
				activeLine.set(9);
				log(`Beszúrt érték: ${value}`);
				return { value, x: 0, y: 0 };
			}

			highlightedNode = node;
			log(`Vizsgált csúcs: ${node.value}`);

			if (value < node.value) {
				activeLine.set(12);
				node.left = await insert(node.left, value, depth + 1);
			} else if (value > node.value) {
				activeLine.set(14);
				node.right = await insert(node.right, value, depth + 1);
			} else {
				activeLine.set(16);
				log('Az érték már szerepel a fában.');
			}
			return node;
		};

		tree = await insert(tree, elementValue);
		calculatePositions(tree);
		highlightedNode = null;
		algorithmStatus.set('idle');
		await pauseIfNeeded();
		await delay(900 - get(speed) * 8);
		activeLine.set(-1);
	}

	async function searchElement() {
		if (!validateInput()) return;
		algorithmStatus.set('running');
		consoleLog.set([]);
		currentStep.set(0);
		log(`Keresés: ${elementValue}`);

		selectedAlgorithmSourceCode.set(
			`function searchElement(tree, value) {
	
  const search = (node, value) => {
    if (!node) {
      return;
    }

    if (value === node.value) {
      log('Érték megtalálva');
    } else if (value < node.value) {
      search(node.left, value);
    } else {
      search(node.right, value);
    }
  };

  search(tree, value);
}`
		);

		const search = async (node: TreeNode | null, value: number) => {
			if (!node) {
				activeLine.set(4);
				log('Elem nem található.');
				return;
			}

			highlightedNode = node;
			activeLine.set(7);
			log(`Vizsgált csúcs: ${node.value}`);
			await pauseIfNeeded();
			await delay(900 - get(speed) * 8);

			if (value === node.value) {
				activeLine.set(8);
				log(`Érték megtalálva: ${value}`);
				await pauseIfNeeded();
				await delay(900 - get(speed) * 8);
			} else if (value < node.value) {
				activeLine.set(9);
				await search(node.left, value);
			} else {
				activeLine.set(11);
				await search(node.right, value);
			}
		};

		await search(tree, elementValue);
		activeLine.set(-1);
		algorithmStatus.set('idle');
	}

	async function deleteElement() {
		if (!validateInput()) return;
		algorithmStatus.set('running');
		consoleLog.set([]);
		currentStep.set(0);
		log(`Törlés: ${elementValue}`);

		selectedAlgorithmSourceCode.set(
			`function deleteElement(tree, value) {
  
  const findMin = (node) => {
    while (node.left) node = node.left;
    return node;
  };

  const remove = (node, value) => {
    if (!node) {
      return null;
    }


    if (value < node.value) {
      node.left = remove(node.left, value);
    } else if (value > node.value) {
      node.right = remove(node.right, value);
    } else {
      if (!node.left) return node.right;
      if (!node.right) return node.left;

      const minLargerNode = findMin(node.right);
      node.value = minLargerNode.value;
      node.right = remove(node.right, minLargerNode.value);
    }

    return node;
  };

  tree = remove(tree, value);
}`
		);

		const findMin = (node: TreeNode): TreeNode => {
			while (node.left) node = node.left;
			return node;
		};

		const remove = async (node: TreeNode | null, value: number): Promise<TreeNode | null> => {
			if (!node) {
				activeLine.set(9);
				log('Elem nem található.');
				return null;
			}

			highlightedNode = node;
			activeLine.set(13);
			log(`Vizsgált csúcs: ${node.value}`);
			await pauseIfNeeded();
			await delay(900 - get(speed) * 8);

			if (value < node.value) {
				activeLine.set(14);
				node.left = await remove(node.left, value);
				await pauseIfNeeded();
				await delay(900 - get(speed) * 8);
			} else if (value > node.value) {
				activeLine.set(16);
				node.right = await remove(node.right, value);
				await pauseIfNeeded();
				await delay(900 - get(speed) * 8);
			} else {
				activeLine.set(19);
				log(`Csúcs törölve: ${value}`);
				if (!node.left) {
					activeLine.set(18);
					await pauseIfNeeded();
					await delay(900 - get(speed) * 8);
					return node.right;
				}
				if (!node.right) {
					activeLine.set(19);
					await pauseIfNeeded();
					await delay(900 - get(speed) * 8);
					return node.left;
				}

				activeLine.set(29);
				await pauseIfNeeded();
				await delay(900 - get(speed) * 8);
				const minLargerNode = findMin(node.right);
				node.value = minLargerNode.value;
				node.right = await remove(node.right, minLargerNode.value);
			}

			return node;
		};

		tree = await remove(tree, elementValue);
		calculatePositions(tree);
		highlightedNode = null;
		activeLine.set(-1);
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

	selectedAlgorithmSourceCode.set(
		`function insertElement(tree, value) {
  ...
}
\n
function searchElement(tree, value) {
  ...
}
\n
function deleteElement(tree, value) {
  ...
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
	<div class="tag">Vászon</div>
	<svg class="svg" width="500" height="300">
		{#if tree}
			{#each getAllNodes(tree) as node (node.value)}
				{#if node.left}
					<line x1={node.x} y1={node.y} x2={node.left.x} y2={node.left.y} stroke="black" />
				{/if}
				{#if node.right}
					<line x1={node.x} y1={node.y} x2={node.right.x} y2={node.right.y} stroke="black" />
				{/if}

				<circle
					cx={node.x}
					cy={node.y}
					r="18"
					fill={highlightedNode === node ? '#ffd700' : '#2f4f4f'}
				/>
				<text x={node.x} y={node.y + 5} text-anchor="middle" font-size="14" fill="black"
					>{node.value}</text
				>
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
</style>
