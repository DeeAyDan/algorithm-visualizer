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
	import { waitUntilResume, delay, pauseIfNeeded, log } from '../stores/utils.js';

	// ==== Alapadatok ====

	currentStep.set(0);
	algorithmStatus.set('idle');
	consoleLog.set([]);
	const displayName = algorithmDisplayNames[get(selectedAlgorithm)];

	let elementValue;

	type Color = 'red' | 'black';

	class RBNode {
		value: number;
		color: Color;
		left: RBNode | null = null;
		right: RBNode | null = null;
		parent: RBNode | null = null;
		// Animation properties
		x: number = 0;
		y: number = 0;
		targetX: number = 0;
		targetY: number = 0;
		highlighted: boolean = false;

		constructor(value: number, color: Color = 'red') {
			this.value = value;
			this.color = color;
		}
	}

	let root: RBNode | null = null;
	let animationSpeed = 500; // Animation duration in ms
	let animationInProgress = false;
	
	// Animation frames tracking
	let animationFrameId: number | null = null;
	let lastTime = 0;
	let nodeAnimations = new Map();

	// ==== Vizualizációs indexek ====

	function validateInput() {
		if (!elementValue) {
			log('Kérlek adj meg egy értéket!');
			return false;
		}
		return true;
	}

	// Elem beszúrása
	async function insertElement() {
		if (validateInput() && !animationInProgress) {
			animationInProgress = true;
			await insert(Number(elementValue));
			log(`Elem hozzáadva: ${elementValue}`);
			animationInProgress = false;
		}
	}

	async function insert(value: number) {
		const newNode = new RBNode(value);
		if (!root) {
			newNode.color = 'black';
			root = newNode;
			await calculatePositions(root);
			await animateNewNode(newNode);
		} else {
			let current = root;
			let parent = null;
			
			// Highlight the path to insertion point
			let path = [];
			
			while (current) {
				path.push(current);
				await highlightNode(current, true);
				await delay(animationSpeed / 2);
				
				parent = current;
				if (value < current.value) {
					log(`Moving left from ${current.value}`);
					current = current.left;
				} else {
					log(`Moving right from ${current.value}`);
					current = current.right;
				}
			}
			
			newNode.parent = parent;
			if (value < parent.value) parent.left = newNode;
			else parent.right = newNode;

			// Pre-calculate positions
			await calculatePositions(root);
			await animateNewNode(newNode);
			
			// Un-highlight the path
			for (const node of path) {
				await highlightNode(node, false);
			}

			await fixInsert(newNode); // <-- ide jön a balanszolás
		}
		
		await calculatePositions(root);
		drawTree();
	}

	async function fixInsert(node: RBNode) {
		while (node !== root && node.parent?.color === 'red') {
			const parent = node.parent;
			const grandparent = parent.parent;

			if (!grandparent) break;

			await highlightNode(node, true);
			await highlightNode(parent, true);
			await highlightNode(grandparent, true);
			await delay(animationSpeed / 2);

			if (parent === grandparent.left) {
				const uncle = grandparent.right;

				if (uncle?.color === 'red') {
					// Eset 1: Szülő és nagybácsi is piros
					log('Case 1: Parent and uncle are red');
					if (uncle) await highlightNode(uncle, true);
					
					parent.color = 'black';
					if (uncle) uncle.color = 'black';
					grandparent.color = 'red';
					
					await drawTreeWithAnimation();
					await delay(animationSpeed);
					
					if (uncle) await highlightNode(uncle, false);
					node = grandparent;
				} else {
					if (node === parent.right) {
						// Eset 2: Bal-jobb eset – forgatás
						log('Case 2: Left-right case - rotation');
						await rotateLeft(parent);
						node = parent;
					}
					// Eset 3: Bal-bal eset
					log('Case 3: Left-left case');
					node.parent!.color = 'black';
					grandparent.color = 'red';
					await drawTreeWithAnimation();
					await delay(animationSpeed);
					await rotateRight(grandparent);
				}
			} else {
				const uncle = grandparent.left;

				if (uncle?.color === 'red') {
					// Tükör: Szülő és nagybácsi is piros
					log('Mirror Case 1: Parent and uncle are red');
					if (uncle) await highlightNode(uncle, true);
					
					parent.color = 'black';
					if (uncle) uncle.color = 'black';
					grandparent.color = 'red';
					
					await drawTreeWithAnimation();
					await delay(animationSpeed);
					
					if (uncle) await highlightNode(uncle, false);
					node = grandparent;
				} else {
					if (node === parent.left) {
						// Tükör: Jobb-bal eset – forgatás
						log('Mirror Case 2: Right-left case - rotation');
						await rotateRight(parent);
						node = parent;
					}
					// Tükör: Jobb-jobb eset
					log('Mirror Case 3: Right-right case');
					node.parent!.color = 'black';
					grandparent.color = 'red';
					await drawTreeWithAnimation();
					await delay(animationSpeed);
					await rotateLeft(grandparent);
				}
			}
			
			await highlightNode(node, false);
			if (parent && parent !== node) await highlightNode(parent, false);
			if (grandparent && grandparent !== node) await highlightNode(grandparent, false);
		}
		
		root!.color = 'black';
		await drawTreeWithAnimation();
	}

	async function rotateLeft(x: RBNode) {
		log(`Rotating left around ${x.value}`);
		const y = x.right;
		if (!y) return;

		x.right = y.left;
		if (y.left) y.left.parent = x;

		y.parent = x.parent;
		if (!x.parent) {
			root = y;
		} else if (x === x.parent.left) {
			x.parent.left = y;
		} else {
			x.parent.right = y;
		}
		y.left = x;
		x.parent = y;
		
		await calculatePositions(root);
		await drawTreeWithAnimation();
		await delay(animationSpeed);
	}

	async function rotateRight(y: RBNode) {
		log(`Rotating right around ${y.value}`);
		const x = y.left;
		if (!x) return;

		y.left = x.right;
		if (x.right) x.right.parent = y;

		x.parent = y.parent;
		if (!y.parent) {
			root = x;
		} else if (y === y.parent.left) {
			y.parent.left = x;
		} else {
			y.parent.right = x;
		}
		x.right = y;
		y.parent = x;
		
		await calculatePositions(root);
		await drawTreeWithAnimation();
		await delay(animationSpeed);
	}

	// Elem törlése
	async function deleteElement() {
		if (!validateInput() || animationInProgress) return;
		
		animationInProgress = true;
		const value = Number(elementValue);
		const z = await searchElement(value);
		
		if (!z) {
			animationInProgress = false;
			return;
		}

		let y = z;
		let yOriginalColor = y.color;
		let x: RBNode | null;

		await highlightNode(z, true);
		await delay(animationSpeed);
		
		log(`Deleting node: ${z.value}`);

		if (!z.left) {
			x = z.right;
			await transplant(z, z.right);
		} else if (!z.right) {
			x = z.left;
			await transplant(z, z.left);
		} else {
			y = minimum(z.right);
			await highlightNode(y, true);
			log(`Replacing with successor: ${y.value}`);
			await delay(animationSpeed);
			
			yOriginalColor = y.color;
			x = y.right;

			if (y.parent === z) {
				if (x) x.parent = y;
			} else {
				await transplant(y, y.right);
				y.right = z.right;
				if (y.right) y.right.parent = y;
			}
			await transplant(z, y);
			y.left = z.left;
			if (y.left) y.left.parent = y;
			y.color = z.color;
			
			await highlightNode(y, false);
		}

		if (yOriginalColor === 'black') {
			log('Fixing black height after deletion');
			await fixDelete(x, z.parent ?? null);
		}

		log(`Elem törölve: ${value}`);
		
		await calculatePositions(root);
		await drawTreeWithAnimation();
		animationInProgress = false;
	}

	async function fixDelete(x: RBNode | null, parent: RBNode | null) {
		while (x !== root && (!x || x.color === 'black')) {
			if (!parent) break;
			
			if (x === parent?.left) {
				let w = parent.right;
				
				if (w) await highlightNode(w, true);
				await delay(animationSpeed / 2);
				
				if (w?.color === 'red') {
					log('Delete Case 1: Sibling is red');
					w.color = 'black';
					parent.color = 'red';
					await drawTreeWithAnimation();
					await delay(animationSpeed);
					await rotateLeft(parent);
					w = parent.right;
					if (w) await highlightNode(w, true);
				}
				
				if ((!w?.left || w.left.color === 'black') && (!w?.right || w.right.color === 'black')) {
					log('Delete Case 2: Sibling has black children');
					if (w) w.color = 'red';
					await drawTreeWithAnimation();
					if (w) await highlightNode(w, false);
					x = parent;
					parent = x.parent;
				} else {
					if (!w?.right || w.right.color === 'black') {
						log('Delete Case 3: Sibling\'s right child is black');
						if (w?.left) {
							await highlightNode(w.left, true);
							w.left.color = 'black';
							await delay(animationSpeed / 2);
							await highlightNode(w.left, false);
						}
						if (w) {
							w.color = 'red';
							await drawTreeWithAnimation();
							await delay(animationSpeed);
							await rotateRight(w);
							w = parent.right;
							if (w) await highlightNode(w, true);
						}
					}
					
					log('Delete Case 4: Restructuring');
					if (w) w.color = parent.color;
					parent.color = 'black';
					if (w?.right) {
						await highlightNode(w.right, true);
						w.right.color = 'black';
						await delay(animationSpeed / 2);
						await highlightNode(w.right, false);
					}
					await drawTreeWithAnimation();
					await delay(animationSpeed);
					await rotateLeft(parent);
					if (w) await highlightNode(w, false);
					x = root;
				}
			} else {
				let w = parent?.left;
				
				if (w) await highlightNode(w, true);
				await delay(animationSpeed / 2);
				
				if (w?.color === 'red') {
					log('Delete Mirror Case 1: Sibling is red');
					w.color = 'black';
					if (parent) parent.color = 'red';
					await drawTreeWithAnimation();
					await delay(animationSpeed);
					await rotateRight(parent);
					w = parent?.left;
					if (w) await highlightNode(w, true);
				}
				
				if ((!w?.right || w.right.color === 'black') && (!w?.left || w.left.color === 'black')) {
					log('Delete Mirror Case 2: Sibling has black children');
					if (w) w.color = 'red';
					await drawTreeWithAnimation();
					if (w) await highlightNode(w, false);
					x = parent;
					parent = x?.parent ?? null;
				} else {
					if (!w?.left || w.left.color === 'black') {
						log('Delete Mirror Case 3: Sibling\'s left child is black');
						if (w?.right) {
							await highlightNode(w.right, true);
							w.right.color = 'black';
							await delay(animationSpeed / 2);
							await highlightNode(w.right, false);
						}
						if (w) {
							w.color = 'red';
							await drawTreeWithAnimation();
							await delay(animationSpeed);
							await rotateLeft(w);
							w = parent?.left;
							if (w) await highlightNode(w, true);
						}
					}
					
					log('Delete Mirror Case 4: Restructuring');
					if (w) w.color = parent.color;
					if (parent) parent.color = 'black';
					if (w?.left) {
						await highlightNode(w.left, true);
						w.left.color = 'black';
						await delay(animationSpeed / 2);
						await highlightNode(w.left, false);
					}
					await drawTreeWithAnimation();
					await delay(animationSpeed);
					await rotateRight(parent);
					if (w) await highlightNode(w, false);
					x = root;
				}
			}
		}
		if (x) x.color = 'black';
		await drawTreeWithAnimation();
	}

	async function transplant(u: RBNode, v: RBNode | null) {
		if (!u.parent) {
			root = v;
		} else if (u === u.parent.left) {
			u.parent.left = v;
		} else {
			u.parent.right = v;
		}
		if (v) {
			v.parent = u.parent;
		}
		
		await calculatePositions(root);
		await drawTreeWithAnimation();
		await delay(animationSpeed / 2);
	}

	function minimum(node: RBNode): RBNode {
		let current = node;
		while (current.left) {
			current = current.left;
		}
		return current;
	}

	// Elem keresés
	async function searchElement(value: number): Promise<RBNode | null> {
		let current = root;
		
		while (current) {
			await highlightNode(current, true);
			await delay(animationSpeed / 2);
			
			if (value === current.value) {
				log(`Elem megtalálva: ${value}`);
				await delay(animationSpeed / 2);
				return current;
			} else if (value < current.value) {
				log(`Keresés balra: ${current.value}`);
				await highlightNode(current, false);
				current = current.left;
			} else {
				log(`Keresés jobbra: ${current.value}`);
				await highlightNode(current, false);
				current = current.right;
			}
		}
		
		log(`Elem nem található: ${value}`);
		return null;
	}
	
	// Example tree generation
	async function createExampleTree() {
		if (animationInProgress) return;
		
		animationInProgress = true;
		await clearTree();
		
		log("Példa fa létrehozása...");
		
		// Create a balanced example tree
		const values = [10, 5, 15, 3, 7, 12, 20, 1, 4, 6, 8, 11, 13, 18, 25];
		
		for (const value of values) {
			elementValue = value;
			await insert(value);
			await delay(animationSpeed / 4); // Faster for example creation
		}
		
		log("Példa fa létrehozva!");
		animationInProgress = false;
	}
	
	// Clear the tree
	async function clearTree() {
		if (animationInProgress && root !== null) return;
		
		root = null;
		consoleLog.set([]);
		log("Fa törölve!");
		drawTree();
	}
	
	// Animation helpers
	async function animateNewNode(node: RBNode) {
		node.highlighted = true;
		await calculatePositions(root);
		drawTree();
		await delay(animationSpeed);
		node.highlighted = false;
		drawTree();
	}
	
	async function highlightNode(node: RBNode, highlight: boolean) {
		if (!node) return;
		node.highlighted = highlight;
		drawTree();
		if (highlight) {
			await delay(animationSpeed / 4);
		}
	}

	// ==== Előkalkulált lépésszám ====
	onMount(() => {
		totalSteps.set(0);
		drawTree();
		
		return () => {
			// Clean up animation frame when component unmounts
			if (animationFrameId !== null) {
				cancelAnimationFrame(animationFrameId);
			}
		};
	});

	// ==== Késleltetés és vezérlés ====
	async function restartAlgorithm() {
		if (get(algorithmStatus) === 'finished') {
			return new Promise((resolve) => {
				const unsub = resumeSignal.subscribe(() => {
					if (get(algorithmStatus) === 'idle') {
						consoleLog.set([]);
						currentStep.set(0);

						// adatok vissza allitasa ide
						root = null;
						drawTree();

						unsub();
						resolve();
					}
				});
			});
		}
	}

	let svg: SVGSVGElement;
	
	// Animation loop
	function animationLoop(timestamp: number) {
		if (!lastTime) lastTime = timestamp;
		const deltaTime = timestamp - lastTime;
		lastTime = timestamp;
		
		let allSettled = true;
		
		// Update node positions
		const updatePositions = (node: RBNode | null) => {
			if (!node) return;
			
			// Ease towards target position
			const easing = 0.2; // Lower number = slower animation
			const dx = node.targetX - node.x;
			const dy = node.targetY - node.y;
			
			if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
				node.x += dx * easing;
				node.y += dy * easing;
				allSettled = false;
			} else {
				node.x = node.targetX;
				node.y = node.targetY;
			}
			
			updatePositions(node.left);
			updatePositions(node.right);
		};
		
		updatePositions(root);
		drawTree();
		
		// If all nodes have reached their target positions, stop animation
		if (!allSettled) {
			animationFrameId = requestAnimationFrame(animationLoop);
		} else {
			animationFrameId = null;
		}
	}
	
	async function drawTreeWithAnimation() {
		// Calculate new positions
		await calculatePositions(root);
		
		// Start animation loop if not already running
		if (animationFrameId === null) {
			lastTime = 0;
			animationFrameId = requestAnimationFrame(animationLoop);
		}
		
		// Wait for animation to complete
		return new Promise<void>(resolve => {
			function checkAnimation() {
				if (animationFrameId === null) {
					resolve();
				} else {
					setTimeout(checkAnimation, 10);
				}
			}
			checkAnimation();
		});
	}
	
	// Layout constants for positioning
	const LAYOUT = {
		startX: 250,
		startY: 40,
		levelGapY: 60,
		nodeRadius: 15
	};

	function getOffsetX(depth: number): number {
		return 200 / Math.pow(2, depth + 1);
	}

	// Calculate node positions for the entire tree (Binary Tree style)
	function calculatePositions(
		node: RBNode | null,
		depth = 0,
		offset = 0,
		parentX = LAYOUT.startX
	) {
		if (!node) return;

		const xOffset = getOffsetX(depth);
		node.targetX = parentX + offset * xOffset;
		node.targetY = LAYOUT.startY + depth * LAYOUT.levelGapY;

		// For animation: set initial position if not set
		if (typeof node.x !== 'number' || typeof node.y !== 'number') {
			node.x = node.targetX;
			node.y = node.targetY;
		}

		calculatePositions(node.left, depth + 1, -1, node.targetX);
		calculatePositions(node.right, depth + 1, 1, node.targetX);
	}

	function drawTree() {
		if (!svg) return;
		svg.innerHTML = ''; // előző törlése
		
		// First draw the lines
		drawNodeLines(svg, root);
		
		// Then draw the nodes (so they appear on top of lines)
		drawNodeCircles(svg, root);
	}
	
	function drawNodeLines(
		svg: SVGSVGElement,
		node: RBNode | null
	) {
		if (!node) return;
		
		// vonalak gyermekekhez
		if (node.left) {
			drawLine(svg, node.x, node.y, node.left.x, node.left.y);
			drawNodeLines(svg, node.left);
		}
		if (node.right) {
			drawLine(svg, node.x, node.y, node.right.x, node.right.y);
			drawNodeLines(svg, node.right);
		}
	}
	
	function drawNodeCircles(
		svg: SVGSVGElement,
		node: RBNode | null
	) {
		if (!node) return;
		
		const radius = 15;
		
		// csúcs kör és érték
		const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
		circle.setAttribute('cx', node.x.toString());
		circle.setAttribute('cy', node.y.toString());
		circle.setAttribute('r', radius.toString());
		circle.setAttribute('fill', node.color === 'red' ? '#e74c3c' : '#2c3e50');
		
		// Add highlight glow for highlighted nodes
		if (node.highlighted) {
			circle.setAttribute('stroke', '#ffcc00');
			circle.setAttribute('stroke-width', '4');
		} else {
			circle.setAttribute('stroke', 'white');
			circle.setAttribute('stroke-width', '2');
		}
		
		svg.appendChild(circle);

		const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
		text.setAttribute('x', node.x.toString());
		text.setAttribute('y', (node.y + 5).toString());
		text.setAttribute('text-anchor', 'middle');
		text.setAttribute('fill', 'white');
		text.setAttribute('font-size', '12');
		text.textContent = node.value.toString();
		svg.appendChild(text);
		
		drawNodeCircles(svg, node.left);
		drawNodeCircles(svg, node.right);
	}

	function drawLine(svg: SVGSVGElement, x1: number, y1: number, x2: number, y2: number) {
		const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
		line.setAttribute('x1', x1.toString());
		line.setAttribute('y1', y1.toString());
		line.setAttribute('x2', x2.toString());
		line.setAttribute('y2', y2.toString());
		line.setAttribute('stroke', 'white');
		line.setAttribute('stroke-width', '2');
		svg.appendChild(line);
	}

	// Speed control
	function setAnimationSpeed(speed: string) {
		const speedValue = parseInt(speed);
		animationSpeed = 1000 - speedValue; // Invert value: higher = faster
	}
	
	// ==== Forráskód megjelenítés ====
	selectedAlgorithmSourceCode.set(`Piros-fekete fa algoritmus`);
</script>

<div class="control-buttons">
	<input class="custom-input" type="number" bind:value={elementValue} placeholder="Elem értéke" />
	<button on:click={insertElement}>Elem beszúrás</button>
	<button on:click={deleteElement}>Elem törlés</button>
	<button on:click={() => searchElement(Number(elementValue))}>Elem keresés</button>
	<button on:click={createExampleTree} class="special-button">Példa fa</button>
	<button on:click={clearTree} class="clear-button">Fa törlése</button>
</div>

<div class="speed-control">
	<label for="animationSpeed">Animáció sebessége:</label>
	<input 
		type="range" 
		id="animationSpeed" 
		min="100" 
		max="900" 
		step="100" 
		value={1000 - animationSpeed} 
		on:input={(e) => setAnimationSpeed(e.target.value)} 
	/>
	<span>{animationSpeed > 500 ? 'Lassú' : animationSpeed > 200 ? 'Közepes' : 'Gyors'}</span>
</div>

<!-- ==== Komponens markup ==== -->
<div class="algorithm-container">
	<div class="array-visual">
		<svg class="svg" width="500" height="300" bind:this={svg}></svg>
	</div>
</div>

<!-- ==== Stílus ==== -->
<style>
	.control-buttons {
		display: flex;
		justify-content: space-around;
		align-items: center;
		padding: 1rem;
		border-bottom: 3px solid #505050;
		flex-wrap: wrap;
		gap: 8px;
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
		transition: background-color 0.2s;
	}

	.control-buttons button:hover {
		background-color: #45a049;
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
	
	.svg {
		margin: 1rem auto;
		border: 1px solid #ccc;
		border-radius: 4px;
		display: block;
		background-color: #2f2f2f;
	}
	
	.speed-control {
		display: flex;
		align-items: center;
		padding: 0.5rem 1rem;
		gap: 10px;
		background-color: #3d3d3d;
		border-bottom: 2px solid #505050;
	}
	
	.speed-control label {
		color: white;
		font-size: 0.9rem;
	}
	
	.speed-control input[type="range"] {
		width: 150px;
	}
	
	.speed-control span {
		color: white;
		font-size: 0.9rem;
		width: 60px;
	}
</style>
