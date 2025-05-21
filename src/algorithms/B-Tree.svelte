<script lang="ts">
	// @ts-nocheck
	import { onMount, tick } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { fade, fly } from 'svelte/transition';
	import { tweened } from 'svelte/motion';
	import {
		currentStep,
		totalSteps,
		consoleLog,
		speed,
		algorithmStatus,
		selectedAlgorithmSourceCode,
		activeLine
	} from '../stores/store.svelte.js';
	import { get } from 'svelte/store';
	import { waitUntilResume, delay, pauseIfNeeded, log } from '../stores/utils.js';

	let maxElements = 5; // Maximum number of elements per node
	let elementValue: number;
	let highlightedNode = null;
	let highlightedKeys = []; // Track highlighted keys within nodes
	let svgNodes = [];
	let animationInProgress = false;
	let lastOperation = ''; // Track the last operation performed
	let animationPath = []; // For path tracing animation
	let splitAnimation = null; // For split animation
	let insertKeyHighlight = null; // For insert key highlighting
	activeLine.set({ start: -1, end: -1 });
	
	// Set SVG dimensions based on tree size
	let svgWidth = 800;
	let svgHeight = 500;
	let canvasWidth = 800;

	// Animation parameters
	const animDuration = tweened(900 - get(speed) * 8, {
		duration: 0,
		easing: cubicOut
	});

	// B-tree root initialization
	let root = null;
	let animating = false;
	selectedAlgorithmSourceCode.set('Válassz egy műveletet!');

	// --- B-Tree Source Code Strings for Highlighting ---
	const btreeInsertSource = `function insert(node, key) {
  
  if (node.keys.length === maxElements) {
    const newRoot = createNode();
    newRoot.children.push(node);
    newRoot.isLeaf = false;
    splitChild(newRoot, 0);
    root = newRoot;
    insertNonFull(newRoot, key);
  }
  else {
    insertNonFull(node, key);
  }
}

function insertNonFull(node, key) {
  if (node.isLeaf) {
    let i = node.keys.length - 1;

    while (i >= 0 && key < node.keys[i]) {
      node.keys[i + 1] = node.keys[i];
      i--;
    }
    node.keys[i + 1] = key;
  }
  else {
    let i = node.keys.length - 1;
    while (i >= 0 && key < node.keys[i]) i--;
    i++;

    if (node.children[i].keys.length === maxElements) {
      splitChild(node, i);

      if (key > node.keys[i]) i++;
    }
    insertNonFull(node.children[i], key);
  }
}`;

	const btreeSearchSource = `function search(node, key) {
  let i = 0;
		
  while (i < node.keys.length && key > node.keys[i]) i++;
    
  if (i < node.keys.length && key === node.keys[i]) {
    return true;
  }
  if (node.isLeaf) {
    return false;
  }
  return search(node.children[i], key);
}`;

	const btreeDeleteSource = `function delete(node, key) {
  let idx = 0;

  while (idx < node.keys.length && key > node.keys[idx]) idx++;
		
  if (idx < node.keys.length && node.keys[idx] === key) {
    if (node.isLeaf) {
      node.keys.splice(idx, 1);
    }
    else {
      // Sikeres törlés
    }
  }
  else {
    if (node.isLeaf) return;
    if (node.children[idx].keys.length < minKeys) {
      fixChild(node, idx);
    }
    delete(node.children[idx], key);
  }
}`;
	// --- End Source Code Strings ---

	function resetTree() {
		root = null;
		highlightedNode = null;
		highlightedKeys = [];
		animationPath = [];
		splitAnimation = null;
		insertKeyHighlight = null;
		selectedAlgorithmSourceCode.set('Válassz egy műveletet!');
	}

	async function createSampleTree() {
		if (animationInProgress) return;
		animationInProgress = true;
		
		// Reset the tree first
		resetTree();
		algorithmStatus.set('running');
		consoleLog.set([]);
		currentStep.set(0);
		lastOperation = 'sample';
		
		// Generate random elements
		const numElements = maxElements * 2;
		const elements = new Set();
		while (elements.size < numElements) {
			elements.add(Math.floor(Math.random() * 99) + 1); // Random numbers between 1-99
		}
		const sortedElements = Array.from(elements).sort((a, b) => a - b);
		
		log('Minta fa generálása...');
		await delay(900 - get(speed) * 8);
		await pauseIfNeeded();
		
		// Insert elements into the tree
		for (const element of sortedElements) {
			log(`Beszúrás: ${element}`);
			if (!root) {
				root = createNode();
				root.keys = [element];
				highlightedKeys = [{node: root, keyIndex: 0}];
				await updateTreeLayout();
			} else {
				await insert(root, element);
				await updateTreeLayout();
			}
			await delay(900 - get(speed) * 8);
			await pauseIfNeeded();
		}
		
		log('Minta fa létrehozva.');
		highlightedNode = null;
		highlightedKeys = [];
		algorithmStatus.set('finished');
		animationInProgress = false;
		algorithmStatus.set('idle');
		selectedAlgorithmSourceCode.set('Minta B-fa létrehozva.');
	}

	function createNode() {
		return {
			keys: [],
			children: [],
			isLeaf: true,
			x: canvasWidth / 2,
			y: 60,
			prevX: canvasWidth / 2,
			prevY: 60,
			new: true // Flag for new node animation
		};
	}

	onMount(() => {
		totalSteps.set(0);
		consoleLog.set([]);
		algorithmStatus.set('idle');
		speed.subscribe(value => {
			animDuration.set(900 - value * 8, { duration: 0 });
		});
		
		// Set initial canvas size
		updateCanvasSize();
	});
	
	function updateCanvasSize() {
		const treeDepth = estimateTreeDepth();
		const treeWidth = estimateTreeWidth();
		
		svgHeight = Math.max(300, treeDepth * 120 + 100);
		svgWidth = Math.max(500, treeWidth * 80 + 100);
		canvasWidth = svgWidth;
	}
	
	function estimateTreeDepth() {
		if (!root) return 1;
		
		function getDepth(node) {
			if (!node) return 0;
			if (node.isLeaf) return 1;
			
			let maxChildDepth = 0;
			for (const child of node.children) {
				maxChildDepth = Math.max(maxChildDepth, getDepth(child));
			}
			return 1 + maxChildDepth;
		}
		
		return getDepth(root);
	}
	
	function estimateTreeWidth() {
		if (!root) return 3;
		
		function countLeaves(node) {
			if (!node) return 0;
			if (node.isLeaf) return 1;
			
			let leaves = 0;
			for (const child of node.children) {
				leaves += countLeaves(child);
			}
			return Math.max(1, leaves);
		}
		
		// Estimate width based on number of leaf nodes
		return countLeaves(root) * 2;
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

	async function insertElement() {
		if (!validateInput() || animationInProgress) return;
		animationInProgress = true;
		log(`Beszúrás: ${elementValue}`);
		algorithmStatus.set('running');
		consoleLog.set([]);
		currentStep.set(0);
		lastOperation = 'insert';
		insertKeyHighlight = elementValue;

		selectedAlgorithmSourceCode.set(btreeInsertSource);
		activeLine.set({ start: 0, end: 0 });

		if (!root) {
			root = createNode();
			root.keys = [elementValue];
			highlightedNode = root;
			highlightedKeys = [{node: root, keyIndex: 0}];
			await updateTreeLayout();
			await delay(900 - get(speed) * 8);
			algorithmStatus.set('finished');
			animationInProgress = false;
			elementValue = undefined;
			algorithmStatus.set('idle');
			activeLine.set({ start: -1, end: -1 });
			return;
		}

		await insert(root, elementValue);
		elementValue = undefined;
		await updateTreeLayout();
		setTimeout(() => {
			highlightedNode = null;
			highlightedKeys = [];
			animationPath = [];
		}, 1000);
		algorithmStatus.set('finished');
		animationInProgress = false;
		algorithmStatus.set('idle');
		activeLine.set({ start: -1, end: -1 });
	}

	async function insert(node, key) {
		selectedAlgorithmSourceCode.set(btreeInsertSource);
		activeLine.set({ start: 3, end: 3 });
		if (node.keys.length === maxElements) {
			log(`A gyökér tele van, felosztás történik`);
			highlightedNode = node;
			await delay(900 - get(speed) * 8);
			await pauseIfNeeded();
			const newRoot = createNode();
			newRoot.children.push(node);
			newRoot.isLeaf = false;
			root = newRoot;
			await updateTreeLayout();
			await delay(500 - get(speed) * 4);
			activeLine.set({ start: 7, end: 7 }); // splitChild
			await splitChild(newRoot, 0);
			await updateTreeLayout();
			activeLine.set({ start: 8, end: 8 }); // root = newRoot
			await insertNonFull(newRoot, key);
		} else {
			activeLine.set({ start: 11, end: 13 }); // insertNonFull
			await insertNonFull(node, key);
		}
	}

	async function searchElement() {
		if (!validateInput() || animationInProgress) return;
		animationInProgress = true;
		consoleLog.set([]);
		currentStep.set(0);
		algorithmStatus.set('running');
		lastOperation = 'search';
		selectedAlgorithmSourceCode.set(btreeSearchSource);
		activeLine.set({ start: 0, end: 0 }); // function search
		log(`Keresés indítása: ${elementValue}`);
		// Clear previous animation state
		animationPath = [];
		highlightedKeys = [];
		await bTreeSearch(root, elementValue);
		log('Keresés vége!');
		// Clear highlighting after a delay
		setTimeout(() => {
			highlightedNode = null;
			highlightedKeys = [];
			animationPath = [];
		}, 1000);
		algorithmStatus.set('finished');
		animationInProgress = false;
		algorithmStatus.set('idle');
		activeLine.set({ start: -1, end: -1 });
	}

	async function bTreeSearch(node, value) {
		selectedAlgorithmSourceCode.set(btreeSearchSource);
		activeLine.set({ start: 2, end: 2 }); // let i = 0; while ...
		if (!node) return false;
		// Clear previous highlights to avoid overlapping
		highlightedKeys = [];
		// Add this node to the animation path
		animationPath.push(node);
		await updateTreeLayout();
		highlightedNode = node;
		log(`Vizsgált csomópont: ${node.keys.join(', ')}`);
		await delay(900 - get(speed) * 8);
		await pauseIfNeeded();
		let i = 0;
		while (i < node.keys.length && value > node.keys[i]) {
			activeLine.set({ start: 4, end: 4 });
			highlightedKeys = [{node: node, keyIndex: i}];
			await delay(300 - get(speed) * 2);
			i++;
		}
		if (i < node.keys.length && value === node.keys[i]) {
			activeLine.set({ start: 6, end: 8 });
			highlightedKeys = [{node: node, keyIndex: i}];
			log(`Érték megtalálva: ${value}`);
			await delay(900 - get(speed) * 8);
			return true;
		}
		if (node.isLeaf) {
			activeLine.set({ start: 9, end: 11 });
			log(`Nem találtuk meg a ${value} értéket - levélszint.`);
			await delay(900 - get(speed) * 8);
			return false;
		}
		activeLine.set({ start: 12, end: 12 });
		log(`Tovább a(z) ${i}. gyerekbe...`);
		await delay(500 - get(speed) * 4);
		return await bTreeSearch(node.children[i], value);
	}

	async function insertNonFull(node, key) {
		selectedAlgorithmSourceCode.set(btreeInsertSource);
		activeLine.set({ start: 16, end: 16 }); // function insertNonFull
		log(`Beszúrás csomópontba: [${node.keys.join(', ')}]`);
		await delay(900 - get(speed) * 8);
		await pauseIfNeeded();
		let i = node.keys.length - 1;
		if (node.isLeaf) {
			activeLine.set({ start: 17, end: 18 }); // if (node.isLeaf)
			log(`Levél csomópontba szúrunk be`);
			node.keys.push(0); // Temporary placeholder
			await updateTreeLayout();
			while (i >= 0 && key < node.keys[i]) {
				activeLine.set({ start: 20, end: 23 }); // while (i >= 0 ...)
				highlightedKeys = [{node: node, keyIndex: i}];
				await delay(300 - get(speed) * 2);
				node.keys[i + 1] = node.keys[i];
				i--;
			}
			node.keys[i + 1] = key;
			highlightedKeys = [{node: node, keyIndex: i + 1}];
			insertKeyHighlight = null;
			await tick();
			await delay(900 - get(speed) * 8);
			await pauseIfNeeded();
		} else {
			activeLine.set({ start: 26, end: 27 }); // else
			while (i >= 0 && key < node.keys[i]) {
				activeLine.set({ start: 28, end: 28});
				highlightedKeys = [{node: node, keyIndex: i}];
				await delay(300 - get(speed) * 2);
				i--;
			}
			i++;
			activeLine.set({ start: 31, end: 31 }); // if (node.children[i].keys.length ...)
			if (node.children[i].keys.length === maxElements) {
				await splitChild(node, i);
				if (key > node.keys[i]) i++;
			}
			activeLine.set({ start: 36, end: 36 }); // insertNonFull(node.children[i], key)
			await insertNonFull(node.children[i], key);
		}
	}

	async function splitChild(parent, index) {
		const t = Math.floor(maxElements / 2);
		const fullChild = parent.children[index];
		
		// Store the initial state for animation
		splitAnimation = {
			parent: parent,
			childIndex: index,
			fullChild: {...fullChild}
		};
		
		log(`Csomópont felosztása: [${fullChild.keys.join(', ')}]`);
		
		highlightedNode = fullChild;
		highlightedKeys = []; // Clear any previous key highlights
		await delay(900 - get(speed) * 8);
		
		const newNode = createNode();
		newNode.new = true; // For animation
		newNode.isLeaf = fullChild.isLeaf;
		const middleKey = fullChild.keys[t];
		
		// Highlight the middle key that will move up
		highlightedKeys = [{node: fullChild, keyIndex: t}];
		await delay(900 - get(speed) * 8);
		
		newNode.keys = fullChild.keys.slice(t + 1);
		if (!fullChild.isLeaf) {
			newNode.children = fullChild.children.slice(t + 1);
		}
		fullChild.keys = fullChild.keys.slice(0, t);
		if (!fullChild.isLeaf) {
			fullChild.children = fullChild.children.slice(0, t + 1);
		}
		
		parent.children.splice(index + 1, 0, newNode);
		parent.keys.splice(index, 0, middleKey);
		
		// Highlight the new nodes structure
		highlightedNode = parent;
		highlightedKeys = [{node: parent, keyIndex: index}]; // Highlight the promoted key
		
		await updateTreeLayout();
		await delay(900 - get(speed) * 8);
		await pauseIfNeeded();
		
		// Clear split animation
		splitAnimation = null;
	}

	async function updateTreeLayout() {
		updateCanvasSize(); // Adjust canvas size based on tree
		svgNodes = [];
		calculateTreeLayout(root);
		await tick();
	}

	function calculateTreeLayout(root) {
		const NODE_WIDTH = 70;
		const NODE_GAP = 30;
		const LEVEL_HEIGHT = 120;

		// Recursively calculate the width of each subtree
		function calculateNodeWidth(node) {
			if (!node) return 0;
			if (node.isLeaf) {
				return Math.max(node.keys.length * NODE_WIDTH, NODE_WIDTH);
			}
			let width = 0;
			for (let child of node.children) {
				width += calculateNodeWidth(child) + NODE_GAP;
			}
			width -= NODE_GAP; // Remove extra gap after last child
			return Math.max(width, node.keys.length * NODE_WIDTH);
		}

		// Recursively position nodes
		function positionNodes(node, depth = 0, xStart = 0) {
			if (!node) return { width: 0, center: 0 };
			if (node.isLeaf) {
				const width = Math.max(node.keys.length * NODE_WIDTH, NODE_WIDTH);
				node.prevX = node.x || xStart + width / 2;
				node.prevY = node.y || depth * LEVEL_HEIGHT + 60;
				node.x = xStart + width / 2;
				node.y = depth * LEVEL_HEIGHT + 60;
				svgNodes.push({ node });
				return { width, center: node.x };
			}
			let currentX = xStart;
			const childCenters = [];
			let totalWidth = 0;
			for (let i = 0; i < node.children.length; i++) {
				const child = node.children[i];
				const childResult = positionNodes(child, depth + 1, currentX);
				childCenters.push(childResult.center);
				currentX += childResult.width + NODE_GAP;
				totalWidth += childResult.width + NODE_GAP;
			}
			totalWidth -= NODE_GAP; // Remove extra gap after last child
			const nodeWidth = Math.max(totalWidth, node.keys.length * NODE_WIDTH);
			const leftMost = childCenters.length > 0 ? childCenters[0] : xStart + nodeWidth / 2;
			const rightMost = childCenters.length > 0 ? childCenters[childCenters.length - 1] : xStart + nodeWidth / 2;
			node.prevX = node.x || (leftMost + rightMost) / 2;
			node.prevY = node.y || depth * LEVEL_HEIGHT + 60;
			node.x = (leftMost + rightMost) / 2;
			node.y = depth * LEVEL_HEIGHT + 60;
			svgNodes.push({ node });
			return { width: nodeWidth, center: node.x };
		}

		const totalWidth = calculateNodeWidth(root);
		const xOffset = (svgWidth - totalWidth) / 2;
		positionNodes(root, 0, xOffset);
	}

	function getNodeColor(node) {
		if (node === highlightedNode) {
			return "#ffcc00";
		}
		return "#4CAF50";
	}

	function getNodeGradient(node) {
		if (node === highlightedNode) {
			return "url(#highlightGradient)";
		}
		if (node.new) {
			return "url(#newNodeGradient)";
		}
		return "url(#nodeGradient)";
	}

	function isKeyHighlighted(node, keyIndex) {
		return highlightedKeys.some(k => k.node === node && k.keyIndex === keyIndex);
	}

	function isNodeInPath(node) {
		return animationPath.includes(node);
	}

	// Reset tree when maxElements changes
	function handleMaxElementsChange(e) {
		maxElements = +e.target.value;
		resetTree();
		consoleLog.set([]);
		log(`B-fa maximális elemszáma megváltoztatva: ${maxElements}. Új fa létrehozva.`);
	}

	// Basic skeleton for deletion with status handling
	async function deleteElement() {
		if (!validateInput() || animationInProgress) return;
		animationInProgress = true;
		log(`Törlés: ${elementValue}`);
		algorithmStatus.set('running');
		consoleLog.set([]);
		currentStep.set(0);
		lastOperation = 'delete';
		selectedAlgorithmSourceCode.set(btreeDeleteSource);
		activeLine.set({ start: 1, end: 1 });
		if (!root) {
			log('A fa üres.');
			animationInProgress = false;
			algorithmStatus.set('idle');
			activeLine.set({ start: -1, end: -1 });
			return;
		}
		await bTreeDelete(root, elementValue);
		await updateTreeLayout();
		log('Törlés vége!');
		setTimeout(() => {
			highlightedNode = null;
			highlightedKeys = [];
			animationPath = [];
		}, 1000);
		algorithmStatus.set('finished');
		animationInProgress = false;
		algorithmStatus.set('idle');
		activeLine.set({ start: -1, end: -1 });
	}

	// B-Tree delete implementation
	async function bTreeDelete(node, key) {
		selectedAlgorithmSourceCode.set(btreeDeleteSource);
		if (!node) return;
		// Clear previous highlights to avoid overlapping
		highlightedKeys = [];
		animationPath.push(node);
		highlightedNode = node;
		let idx = 0;
		while (idx < node.keys.length && key > node.keys[idx]) {
			highlightedKeys = [{node, keyIndex: idx}];
			await delay(300 - get(speed) * 2);
			idx++;
		}
		if (idx < node.keys.length && node.keys[idx] === key) {
			if (node.isLeaf) {
				log(`Kulcs törlése levélből: ${key}`);
				highlightedNode = node;
				highlightedKeys = [{node, keyIndex: idx}];
				await delay(900 - get(speed) * 8);
				node.keys.splice(idx, 1);
				await updateTreeLayout();
				return;
			} else {
				log(`Kulcs törlése belső csomópontból: ${key}`);
				highlightedNode = node;
				highlightedKeys = [{node, keyIndex: idx}];
				await delay(900 - get(speed) * 8);
				// Predecessor
				if (node.children[idx].keys.length >= Math.ceil(maxElements / 2)) {
					let pred = node.children[idx];
					while (!pred.isLeaf) {
						highlightedNode = pred;
						await updateTreeLayout();
						await delay(300 - get(speed) * 2);
						pred = pred.children[pred.keys.length];
					}
					const predKey = pred.keys[pred.keys.length - 1];
					log(`Előd kulcs cseréje: ${predKey}`);
					node.keys[idx] = predKey;
					await bTreeDelete(node.children[idx], predKey);
				} else if (node.children[idx + 1].keys.length >= Math.ceil(maxElements / 2)) {
					let succ = node.children[idx + 1];
					while (!succ.isLeaf) {
						highlightedNode = succ;
						await updateTreeLayout();
						await delay(300 - get(speed) * 2);
						succ = succ.children[0];
					}
					const succKey = succ.keys[0];
					log(`Utód kulcs cseréje: ${succKey}`);
					node.keys[idx] = succKey;
					await bTreeDelete(node.children[idx + 1], succKey);
				} else {
					log('Összefésülés szükséges');
					await mergeChildren(node, idx);
					await bTreeDelete(node.children[idx], key);
				}
				await updateTreeLayout();
				return;
			}
		}
		if (node.isLeaf) {
			log('Kulcs nem található a fában.');
			await delay(900 - get(speed) * 8);
			return;
		}
		log(`Tovább a(z) ${idx}. gyerekbe...`);
		let child = node.children[idx];
		if (child.keys.length < Math.ceil(maxElements / 2)) {
			await fixChild(node, idx);
			child = node.children[idx];
		}
		await bTreeDelete(child, key);
		await updateTreeLayout();
	}

	// Merge children[idx] and children[idx+1] into one
	async function mergeChildren(node, idx) {
		const child = node.children[idx];
		const sibling = node.children[idx + 1];
		log(`Összefésülés: ${child.keys.join(', ')} + ${node.keys[idx]} + ${sibling.keys.join(', ')}`);
		
		// Now perform the merge
		child.keys.push(node.keys[idx], ...sibling.keys);
		if (!child.isLeaf) child.children.push(...sibling.children);
		node.keys.splice(idx, 1);
		node.children.splice(idx + 1, 1);
		
		await updateTreeLayout();
	}

	// Fix child before delete recursion
	async function fixChild(node, idx) {
		const minKeys = Math.ceil(maxElements / 2);
		let child = node.children[idx];
		
		// Try left sibling
		if (idx > 0 && node.children[idx - 1].keys.length >= minKeys) {
			const left = node.children[idx - 1];
			log('Kölcsönzés balról');
			
			// Perform the rotation
			child.keys.unshift(node.keys[idx - 1]);
			node.keys[idx - 1] = left.keys.pop();
			if (!left.isLeaf) child.children.unshift(left.children.pop());
			
			await updateTreeLayout();
		} else if (idx < node.children.length - 1 && node.children[idx + 1].keys.length >= minKeys) {
			// Try right sibling
			const right = node.children[idx + 1];
			log('Kölcsönzés jobbról');
			
			// Perform the rotation
			child.keys.push(node.keys[idx]);
			node.keys[idx] = right.keys.shift();
			if (!right.isLeaf) child.children.push(right.children.shift());
			
			await updateTreeLayout();
		} else {
			// Merge with sibling
			log('Összefésülés szükséges');
			
			if (idx < node.children.length - 1) {
				await mergeChildren(node, idx);
			} else {
				await mergeChildren(node, idx - 1);
			}
		}
	}
</script>

<div class="visualizer-container">
	<div class="control-buttons">
		<input
			class="custom-input"
			type="number"
			bind:value={elementValue}
			placeholder="Elem értéke"
			disabled={$algorithmStatus !== 'idle'}
		/>
		<div class="degree-container">
			<label for="max-elements-select">Max elem:</label>
			<select
				id="max-elements-select"
				value={maxElements}
				on:change={handleMaxElementsChange}
				disabled={$algorithmStatus !== 'idle'}
				class="degree-select"
			>
				{#each [2, 3, 4, 5] as elements}
					<option value={elements}>{elements}</option>
				{/each}
			</select>
		</div>
		<div>
			<button on:click={insertElement} disabled={$algorithmStatus !== 'idle'}>Elem beszúrás</button>
			<button on:click={searchElement} disabled={$algorithmStatus !== 'idle'}>Elem keresés</button>
			<button on:click={deleteElement} disabled={$algorithmStatus !== 'idle'}>Elem törlés</button>

			<button on:click={createSampleTree} disabled={$algorithmStatus !== 'idle'}>Minta fa</button>
			<button on:click={resetTree} disabled={$algorithmStatus !== 'idle'}>Fa törlése</button>

		</div>
	</div>

	<div class="canvas-container">
		<svg class="svg" width="700" height="300">
			<defs>
				<linearGradient id="nodeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stop-color="#2f4f4f" />
					<stop offset="100%" stop-color="#1a2f2f" />
				</linearGradient>
				<linearGradient id="highlightGradient" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stop-color="#ffd700" />
					<stop offset="100%" stop-color="#ffcc00" />
				</linearGradient>
				<linearGradient id="newNodeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stop-color="#45a049" />
					<stop offset="100%" stop-color="#2E7D32" />
				</linearGradient>
				<linearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stop-color="#ffd700" />
					<stop offset="100%" stop-color="#ffcc00" />
				</linearGradient>
				<filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
					<feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
					<feOffset dx="2" dy="2" result="offsetblur"/>
					<feComponentTransfer>
						<feFuncA type="linear" slope="0.5"/>
					</feComponentTransfer>
					<feMerge> 
						<feMergeNode/>
						<feMergeNode in="SourceGraphic"/> 
					</feMerge>
				</filter>
				<!-- Animation markers -->
				<marker id="arrowHead" viewBox="0 0 10 10" refX="5" refY="5"
						markerWidth="6" markerHeight="6" orient="auto-start-reverse">
					<path d="M 0 0 L 10 5 L 0 10 z" fill="#ff9800"/>
				</marker>
			</defs>
			
			{#if lastOperation === 'search' && animationPath.length > 1}
				{#each animationPath as node, i}
					{#if i < animationPath.length - 1}
						<line
							x1={node.x}
							y1={node.y + 25}
							x2={animationPath[i+1].x}
							y2={animationPath[i+1].y - 25}
							stroke="#ff9800"
							stroke-width="3"
							stroke-dasharray="5,3"
							marker-end="url(#arrowHead)"
							opacity="0.7"
						/>
					{/if}
				{/each}
			{/if}
			
			{#if root}
				{#each svgNodes as { node }}
					{#if !node.isLeaf}
						{#each node.children as child}
							<line
								x1={node.x}
								y1={node.y + 25}
								x2={child.x}
								y2={child.y - 25}
								stroke={isNodeInPath(node) && isNodeInPath(child) ? "#ffd700" : "#777"}
								stroke-width={isNodeInPath(node) && isNodeInPath(child) ? "3" : "2"}
								opacity={isNodeInPath(node) && isNodeInPath(child) ? "0.8" : "0.5"}
							/>
						{/each}
					{/if}
				{/each}
				
				{#each svgNodes as { node }}
					<g 
						transform="translate({node.x}, {node.y})"
						class:node-animated={node === highlightedNode || node.new}
					>
						<!-- Node background -->
						<rect
							x={-(node.keys.length * 27.5 + 20) / 2}
							y="-25"
							width={node.keys.length * 27.5 + 20}
							height="50"
							rx="10"
							fill={node.new ? "url(#newNodeGradient)" : (node === highlightedNode ? "url(#highlightGradient)" : "url(#nodeGradient)")}
							filter="url(#dropShadow)"
							class:pulse-animation={node.new}
						/>
						
						<!-- Keys -->
						{#each node.keys as key, i}
							<g class:key-highlight={isKeyHighlighted(node, i) || (insertKeyHighlight === key && lastOperation === 'insert')}>
								{#if isKeyHighlighted(node, i) || (insertKeyHighlight === key && lastOperation === 'insert')}
									<circle
										cx={(i - (node.keys.length - 1) / 2) * 27.5}
										cy="0"
										r="15"
										fill="#ffd700"
										opacity="0.6"
										class="pulse-circle"
									/>
								{/if}
								<text
									x={(i - (node.keys.length - 1) / 2) * 27.5}
									y="6"
									text-anchor="middle"
									font-size="16"
									font-weight="bold"
									fill={isKeyHighlighted(node, i) || (insertKeyHighlight === key && lastOperation === 'insert') ? "black" : "aliceblue"}
									style="paint-order: stroke; stroke: white; stroke-width: 2px;"
								>
									{key}
								</text>
							</g>
						{/each}
					</g>
				{/each}
				
				<!-- For animations during node split -->
				{#if splitAnimation}
					<g opacity="0.7">
						<!-- Show animation for middle key moving up -->
						<path
							d="M {splitAnimation.fullChild.x},{splitAnimation.fullChild.y} 
							   Q {splitAnimation.fullChild.x},{splitAnimation.parent.y - 20} 
							     {splitAnimation.parent.x},{splitAnimation.parent.y}"
							fill="none"
							stroke="#ff9800"
							stroke-width="2"
							stroke-dasharray="5,3"
							marker-end="url(#arrowHead)"
						/>
					</g>
				{/if}
			{/if}
		</svg>
	</div>
</div>

<style>
	.visualizer-container {
		width: 100%;
		max-width: 1000px;
		margin: 0 auto;
	}
	
	.canvas-container {
		position: relative;
		margin-top: 20px;
	}
	
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
		margin: 0 auto;
		border: 1px solid #555;
		border-radius: 4px;
		display: block;
		background-color: #2f2f2f;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
	}
	
	.degree-container {
		display: flex;
		align-items: center;
		background-color: #333;
		padding: 0.5rem;
		border-radius: 5px;
		margin-left: 0.5rem;
		border: 1px solid #555;
	}
	
	.degree-container label {
		color: white;
		margin-right: 0.5rem;
	}
	
	.degree-select {
		background-color: #505050;
		color: white;
		border: 1px solid #757575;
		border-radius: 4px;
		padding: 0.3rem;
		font-size: 0.9rem;
	}
	
	.degree-select option {
		background-color: #333;
		color: white;
	}
	
	/* Animation styles */
	.node-animated {
		transition: transform 0.5s ease-out;
	}
	
	.key-highlight {
		animation: highlight-pop 0.5s ease-out;
	}
	
	@keyframes highlight-pop {
		0% { transform: scale(1); }
		50% { transform: scale(1.2); }
		100% { transform: scale(1); }
	}
</style>