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

		constructor(value: number, color: Color = 'red') {
			this.value = value;
			this.color = color;
		}
	}

	let root: RBNode | null = null;

	// ==== Vizualizációs indexek ====

	function validateInput() {
		if (!elementValue) {
			log('Kérlek adj meg egy értéket!');
			return false;
		}
		return true;
	}

	// Elem beszúrása
	function insertElement() {
		if (validateInput()) {
			insert(Number(elementValue));
			log(`Elem hozzáadva: ${elementValue}`);
		}
	}

	function insert(value: number) {
		const newNode = new RBNode(value);
		if (!root) {
			newNode.color = 'black';
			root = newNode;
		} else {
			let current = root;
			let parent = null;
			while (current) {
				parent = current;
				if (value < current.value) {
					current = current.left;
				} else {
					current = current.right;
				}
			}
			newNode.parent = parent;
			if (value < parent.value) parent.left = newNode;
			else parent.right = newNode;

			fixInsert(newNode); // <-- ide jön a balanszolás
		}
		drawTree();
	}

	function fixInsert(node: RBNode) {
		while (node !== root && node.parent?.color === 'red') {
			const parent = node.parent;
			const grandparent = parent.parent;

			if (!grandparent) break;

			if (parent === grandparent.left) {
				const uncle = grandparent.right;

				if (uncle?.color === 'red') {
					// Eset 1: Szülő és nagybácsi is piros
					parent.color = 'black';
					uncle.color = 'black';
					grandparent.color = 'red';
					node = grandparent;
				} else {
					if (node === parent.right) {
						// Eset 2: Bal-jobb eset – forgatás
						rotateLeft(parent);
						node = parent;
					}
					// Eset 3: Bal-bal eset
					node.parent!.color = 'black';
					grandparent.color = 'red';
					rotateRight(grandparent);
				}
			} else {
				const uncle = grandparent.left;

				if (uncle?.color === 'red') {
					// Tükör: Szülő és nagybácsi is piros
					parent.color = 'black';
					uncle.color = 'black';
					grandparent.color = 'red';
					node = grandparent;
				} else {
					if (node === parent.left) {
						// Tükör: Jobb-bal eset – forgatás
						rotateRight(parent);
						node = parent;
					}
					// Tükör: Jobb-jobb eset
					node.parent!.color = 'black';
					grandparent.color = 'red';
					rotateLeft(grandparent);
				}
			}
		}
		root!.color = 'black';
	}
	function rotateLeft(x: RBNode) {
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
		drawTree();
	}

	function rotateRight(y: RBNode) {
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
		drawTree();
	}

	// Elem törlése
	function deleteElement(value: number) {
		const z = searchElement(value);
		if (!z) return;

		let y = z;
		let yOriginalColor = y.color;
		let x: RBNode | null;

		if (!z.left) {
			x = z.right;
			transplant(z, z.right);
		} else if (!z.right) {
			x = z.left;
			transplant(z, z.left);
		} else {
			y = minimum(z.right);
			yOriginalColor = y.color;
			x = y.right;

			if (y.parent === z) {
				if (x) x.parent = y;
			} else {
				transplant(y, y.right);
				y.right = z.right;
				if (y.right) y.right.parent = y;
			}
			transplant(z, y);
			y.left = z.left;
			if (y.left) y.left.parent = y;
			y.color = z.color;
		}

		if (yOriginalColor === 'black') {
			fixDelete(x, z.parent ?? null);
		}

		log(`Elem törölve: ${value}`);

		drawTree();
	}

	function fixDelete(x: RBNode | null, parent: RBNode | null) {
		while (x !== root && (!x || x.color === 'black')) {
			if (x === parent?.left) {
				let w = parent.right;
				if (w?.color === 'red') {
					w.color = 'black';
					parent.color = 'red';
					rotateLeft(parent);
					w = parent.right;
				}
				if ((!w?.left || w.left.color === 'black') && (!w?.right || w.right.color === 'black')) {
					if (w) w.color = 'red';
					x = parent;
					parent = x.parent;
				} else {
					if (!w?.right || w.right.color === 'black') {
						if (w?.left) w.left.color = 'black';
						if (w) {
							w.color = 'red';
							rotateRight(w);
							w = parent.right;
						}
					}
					if (w) w.color = parent.color;
					parent.color = 'black';
					if (w?.right) w.right.color = 'black';
					rotateLeft(parent);
					x = root;
				}
			} else {
				let w = parent?.left;
				if (w?.color === 'red') {
					w.color = 'black';
					if (parent) parent.color = 'red';
					rotateRight(parent);
					w = parent?.left;
				}
				if ((!w?.right || w.right.color === 'black') && (!w?.left || w.left.color === 'black')) {
					if (w) w.color = 'red';
					x = parent;
					parent = x?.parent ?? null;
				} else {
					if (!w?.left || w.left.color === 'black') {
						if (w?.right) w.right.color = 'black';
						if (w) {
							w.color = 'red';
							rotateLeft(w);
							w = parent?.left;
						}
					}
					if (w) w.color = parent.color;
					if (parent) parent.color = 'black';
					if (w?.left) w.left.color = 'black';
					rotateRight(parent);
					x = root;
				}
			}
		}
		if (x) x.color = 'black';
	}

	function transplant(u: RBNode, v: RBNode | null) {
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
	}

	function minimum(node: RBNode): RBNode {
		while (node.left) {
			node = node.left;
		}
		return node;
	}

	// Elem keresés
	function searchElement(value: number): RBNode | null {
		let current = root;
		while (current) {
			if (value === current.value){
				log(`Elem megtalálva: ${value}`);
				return current;
			} else if (value < current.value) {
				log(`Keresés balra: ${current.value}`);
			} else {
				log(`Keresés jobbra: ${current.value}`);
			}
		}
		log(`Elem nem található: ${value}`);
		return null;
	}

	// ==== Előkalkulált lépésszám ====
	onMount(() => {
		totalSteps.set(0);
	});

	// ==== Késleltetés és vezérlés ====
	function log(message: string) {
		consoleLog.update((logs) => [...logs, message]);
		currentStep.update((n) => n + 1);
	}
	function delay(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
	function waitUntilResume(): Promise<void> {
		return new Promise((resolve) => {
			const unsub = resumeSignal.subscribe(() => {
				if (get(algorithmStatus) === 'running') {
					unsub();
					resolve();
				}
			});
		});
	}
	function waitUntilRestart(): Promise<void> {
		return new Promise((resolve) => {
			const unsub = resumeSignal.subscribe(() => {
				if (get(algorithmStatus) === 'idle') {
					consoleLog.set([]);
					currentStep.set(0);

					// adatok vissza allitasa ide

					unsub();
					resolve();
				}
			});
		});
	}
	async function pauseIfNeeded() {
		if (get(algorithmStatus) === 'paused') {
			await waitUntilResume();
		}
	}
	async function restartAlgorithm() {
		if (get(algorithmStatus) === 'finished') {
			await waitUntilRestart();
		}
	}

	let svg: SVGSVGElement;

	function drawTree() {
		if (!svg) return;
		svg.innerHTML = ''; // előző törlése
		const startX = 250;
		const startY = 40;
		const dx = 40;
		const dy = 60;

		drawNode(svg, root, startX, startY, dx, dy);
	}

	function drawNode(
		svg: SVGSVGElement,
		node: RBNode | null,
		x: number,
		y: number,
		dx: number,
		dy: number
	) {
		if (!node) return;

		const radius = 15;
		// vonalak gyermekekhez
		if (node.left) {
			const childX = x - dx;
			const childY = y + dy;
			drawLine(svg, x, y, childX, childY);
			drawNode(svg, node.left, childX, childY, dx * 0.7, dy);
		}
		if (node.right) {
			const childX = x + dx;
			const childY = y + dy;
			drawLine(svg, x, y, childX, childY);
			drawNode(svg, node.right, childX, childY, dx * 0.7, dy);
		}

		// csúcs kör és érték
		const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
		circle.setAttribute('cx', x.toString());
		circle.setAttribute('cy', y.toString());
		circle.setAttribute('r', radius.toString());
		circle.setAttribute('fill', node.color === 'red' ? '#e74c3c' : '#2c3e50');
		circle.setAttribute('stroke', 'white');
		circle.setAttribute('stroke-width', '2');
		svg.appendChild(circle);

		const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
		text.setAttribute('x', x.toString());
		text.setAttribute('y', (y + 5).toString());
		text.setAttribute('text-anchor', 'middle');
		text.setAttribute('fill', 'white');
		text.setAttribute('font-size', '12');
		text.textContent = node.value.toString();
		svg.appendChild(text);
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

	// ==== Forráskód megjelenítés ====
	selectedAlgorithmSourceCode.set(`Algoritmus neve`);
</script>

<div class="control-buttons">
	<input class="custom-input" type="number" bind:value={elementValue} placeholder="Elem értéke" />
	<button on:click={insertElement}>Elem beszúrás</button>
	<button on:click={deleteElement(elementValue)}>Elem törlés</button>
	<button on:click={searchElement(elementValue)}>Elem keresés</button>
</div>

<!-- ==== Komponens markup ==== -->
<div class="algorithm-container">
	<div class="tag">Vászon</div>
	<div class="array-visual">
		<svg class="svg" width="500" height="300" bind:this={svg}></svg>
	</div>
</div>

<!-- ==== Stílus ==== -->
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
