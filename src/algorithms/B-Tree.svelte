<script lang="ts">
	// @ts-nocheck
	import { onMount, tick } from 'svelte';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import {
		currentStep,
		totalSteps,
		consoleLog,
		speed,
		algorithmStatus,
		resumeSignal
	} from '../stores/store.svelte.js';

	import Controls from '../routes/Controls.svelte';
	import { get } from 'svelte/store';

	let maxDegree = 3;
	let elementValue: number;
	let highlightedNode = null;
	let svgNodes = [];
	let svgWidth = 800;
	let svgHeight = 500;
	let animationInProgress = false;

	// Átméretezés figyelése
	let containerWidth;
	$: svgWidth = containerWidth || 800;

	// Treeened animációk
	const animationDuration = 400;
	
	// B-fa gyökér inicializálása
	let root = createNode();

	// Csomópont létrehozása
	function createNode() {
		return {
			keys: [],
			children: [],
			isLeaf: true,
			x: svgWidth / 2,
			y: 60,
			prevX: svgWidth / 2,
			prevY: 60
		};
	}

	onMount(() => {
		totalSteps.set(0);
		consoleLog.set([]);
		drawTree(root);
		
		// Ablak átméretezés figyelése
		const resizeObserver = new ResizeObserver(entries => {
			for (let entry of entries) {
				if (entry.contentRect) {
					containerWidth = entry.contentRect.width;
					// Újrarajzolás az új mérettel
					svgNodes = [];
					drawTree(root);
				}
			}
		});
		
		const container = document.querySelector('.visualizer-container');
		if (container) {
			resizeObserver.observe(container);
		}
		
		return () => {
			if (container) {
				resizeObserver.unobserve(container);
			}
		};
	});

	function log(msg: string) {
		consoleLog.update((logs) => [...logs, msg]);
		currentStep.update((n) => n + 1);
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
		
		await insert(root, elementValue);
		elementValue = undefined;
		
		// Újrarajzolás és animálás
		await updateTreeLayout();
		
		algorithmStatus.set('finished');
		animationInProgress = false;
	}

	async function insert(node, key) {
		if (node.keys.length === 2 * maxDegree - 1) {
			log(`A gyökér tele van, felosztás történik`);
			await pauseIfNeeded();
			
			const newRoot = createNode();
			newRoot.children.push(node);
			newRoot.isLeaf = false;
			await splitChild(newRoot, 0);
			root = newRoot;
			await insertNonFull(newRoot, key);
		} else {
			await insertNonFull(node, key);
		}
	}

	async function searchElement() {
		if (!validateInput() || animationInProgress) return;

		animationInProgress = true;
		consoleLog.set([]);
		currentStep.set(0);
		algorithmStatus.set('running');

		log(`Keresés indítása: ${elementValue}`);
		await bTreeSearch(root, elementValue);

		log('Keresés vége!');
		highlightedNode = null;
		algorithmStatus.set('finished');
		animationInProgress = false;
	}

	async function bTreeSearch(node, value) {
		if (!node) return false;

		highlightedNode = node;
		log(`Vizsgált csomópont: ${node.keys.join(', ')}`);
		await pauseIfNeeded();
		await delay(900 - get(speed) * 8);

		let i = 0;
		while (i < node.keys.length && value > node.keys[i]) {
			i++;
		}

		if (i < node.keys.length && value === node.keys[i]) {
			log(`Érték megtalálva: ${value}`);
			return true;
		}

		if (node.isLeaf) {
			log(`Nem találtuk meg a ${value} értéket - levélszint.`);
			return false;
		}

		log(`Tovább a(z) ${i}. gyerekbe...`);
		return await bTreeSearch(node.children[i], value);
	}

	async function insertNonFull(node, key) {
		log(`Beszúrás csomópontba: [${node.keys.join(', ')}]`);
		await pauseIfNeeded();
		await delay(600 - get(speed) * 5);
		
		let i = node.keys.length - 1;
		if (node.isLeaf) {
			log(`Levél csomópontba szúrunk be`);
			// Beszúrás levélbe
			node.keys.push(0);
			while (i >= 0 && key < node.keys[i]) {
				node.keys[i + 1] = node.keys[i];
				i--;
			}
			node.keys[i + 1] = key;
			highlightedNode = node;
			await tick();
			await pauseIfNeeded();
			await delay(500 - get(speed) * 4);
		} else {
			// Nem levél esetén, keressük meg a megfelelő gyereket
			while (i >= 0 && key < node.keys[i]) {
				i--;
			}
			i++;
			highlightedNode = node.children[i];
			log(`Gyermek csomópontba navigálunk: [${node.children[i].keys.join(', ')}]`);
			
			await tick();
			await pauseIfNeeded();
			await delay(500 - get(speed) * 4);
			
			if (node.children[i].keys.length === 2 * maxDegree - 1) {
				log(`Tele gyermek csomópont, felosztás történik`);
				await splitChild(node, i);
				if (key > node.keys[i]) {
					i++;
				}
			}
			await insertNonFull(node.children[i], key);
		}
	}

	async function splitChild(parent, index) {
		const t = maxDegree;
		const fullChild = parent.children[index];
		log(`Csomópont felosztása: [${fullChild.keys.join(', ')}]`);
		
		const newNode = createNode();
		newNode.isLeaf = fullChild.isLeaf;
		
		// Középső kulcs kimentése
		const middleKey = fullChild.keys[t - 1];
		
		// Új csomópontba másoljuk a második felet
		newNode.keys = fullChild.keys.slice(t);
		if (!fullChild.isLeaf) {
			newNode.children = fullChild.children.slice(t);
		}
		
		// Az eredeti csomópontban csak az első fél marad
		fullChild.keys = fullChild.keys.slice(0, t - 1);
		if (!fullChild.isLeaf) {
			fullChild.children = fullChild.children.slice(0, t);
		}
		
		// Beszúrjuk az új csomópontot és a középső kulcsot a szülőbe
		parent.children.splice(index + 1, 0, newNode);
		parent.keys.splice(index, 0, middleKey);
		
		highlightedNode = parent;
		await tick();
		await pauseIfNeeded();
		await delay(700 - get(speed) * 6);
	}

	async function delay(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	async function pauseIfNeeded() {
		if (get(algorithmStatus) === 'paused') {
			return new Promise(resolve => {
				const unsubscribe = resumeSignal.subscribe(signal => {
					if (signal) {
						unsubscribe();
						resolve();
					}
				});
			});
		}
	}

	async function updateTreeLayout() {
		// Elmentjük az előző pozíciókat animációhoz
		svgNodes.forEach(({node}) => {
			node.prevX = node.x;
			node.prevY = node.y;
		});
		
		// Újrarajzoljuk a fát
		svgNodes = [];
		calculateTreeLayout(root);
		
		// Frissítés és animálás
		await tick();
	}

	function calculateTreeLayout(root) {
		// Fa szélessége és magassága
		const NODE_WIDTH = 60;
		const LEVEL_HEIGHT = 100;
		
		// Rekurzív szélességszámító függvény
		function calculateNodeWidth(node) {
			if (!node) return 0;
			if (node.isLeaf) {
				return Math.max(node.keys.length * 40, 60);
			}
			
			let width = 0;
			for (let child of node.children) {
				width += calculateNodeWidth(child);
			}
			return Math.max(width, node.keys.length * 40);
		}
		
		// Rekurzív pozíciószámítás
		function positionNodes(node, depth = 0, xStart = 0) {
			if (!node) return { width: 0, center: 0 };
			
			if (node.isLeaf) {
				const width = Math.max(node.keys.length * 40, 60);
				node.x = xStart + width / 2;
				node.y = depth * LEVEL_HEIGHT + 60;
				svgNodes.push({ node });
				return { width, center: node.x };
			}
			
			// Az összes gyerek rekurzív pozicionálása
			let currentX = xStart;
			const childPositions = [];
			
			for (let child of node.children) {
				const childResult = positionNodes(child, depth + 1, currentX);
				childPositions.push(childResult.center);
				currentX += childResult.width + 20; // 20px térköz a csomópontok között
			}
			
			// A szülő pozícióját a gyerekek közé helyezzük
			node.x = (childPositions[0] + childPositions[childPositions.length - 1]) / 2;
			node.y = depth * LEVEL_HEIGHT + 60;
			
			svgNodes.push({ node });
			
			// Visszaadjuk a teljes alfaként foglalt szélességet
			return { width: currentX - xStart - 20, center: node.x };
		}
		
		// Fa kiszámítása a gyökértől
		const totalWidth = calculateNodeWidth(root);
		positionNodes(root, 0, (svgWidth - totalWidth) / 2);
		
		// SVG magasság frissítése a fa mérete alapján
		const treeDepth = getTreeDepth(root);
		svgHeight = Math.max(300, (treeDepth + 1) * LEVEL_HEIGHT + 80);
	}
	
	function getTreeDepth(node, depth = 0) {
		if (!node) return depth;
		if (node.isLeaf) return depth;
		
		let maxDepth = depth;
		for (let child of node.children) {
			const childDepth = getTreeDepth(child, depth + 1);
			maxDepth = Math.max(maxDepth, childDepth);
		}
		return maxDepth;
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
		return "url(#nodeGradient)";
	}
</script>

<div class="visualizer-container" bind:clientWidth={containerWidth}>
	<div class="control-buttons">
		<input class="custom-input" type="number" bind:value={elementValue} placeholder="Elem értéke" />
		<button on:click={insertElement} disabled={animationInProgress}>Elem beszúrás</button>
		<button on:click={searchElement} disabled={animationInProgress}>Elem keresés</button>
		<label>
			<input
				type="radio"
				name="degree"
				value="2"
				on:change={() => (maxDegree = 2)}
				checked={maxDegree === 2}
				disabled={animationInProgress}
			/>Fok: 2
		</label>
		<label>
			<input
				type="radio"
				name="degree"
				value="3"
				on:change={() => (maxDegree = 3)}
				checked={maxDegree === 3}
				disabled={animationInProgress}
			/>Fok: 3
		</label>
		<label>
			<input
				type="radio"
				name="degree"
				value="4"
				on:change={() => (maxDegree = 4)}
				checked={maxDegree === 4}
				disabled={animationInProgress}
			/>Fok: 4
		</label>
	</div>

	<div class="canvas-container">
		<div class="tag">B-fa vizualizáció</div>
		<svg class="svg" width={svgWidth} height={svgHeight}>
			<!-- Definiáljuk a gradienteket a csomópontokhoz -->
			<defs>
				<linearGradient id="nodeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stop-color="#4CAF50" />
					<stop offset="100%" stop-color="#2E7D32" />
				</linearGradient>
				<linearGradient id="highlightGradient" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" stop-color="#FFC107" />
					<stop offset="100%" stop-color="#FFA000" />
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
			</defs>
			
			{#if root}
				<!-- Élek rajzolása -->
				{#each svgNodes as { node }}
					{#if !node.isLeaf}
						{#each node.children as child}
							<line
								x1={node.prevX}
								y1={node.prevY + 25}
								x2={child.prevX}
								y2={child.prevY - 25}
								stroke="#aaa"
								stroke-width="2"
								opacity="0.5"
							/>
							<line
								x1={node.x}
								y1={node.y + 25}
								x2={child.x}
								y2={child.y - 25}
								stroke="#fff"
								stroke-width="2.5"
								stroke-opacity="0.8"
								transition:tweened={{
									duration: animationDuration,
									easing: cubicOut
								}}
							/>
						{/each}
					{/if}
				{/each}
				
				<!-- Csomópontok rajzolása -->
				{#each svgNodes as { node }}
					<g 
						transform="translate({node.prevX}, {node.prevY})"
						opacity="0.4"
					>
						<rect
							x={-(node.keys.length * 20 + 20) / 2}
							y="-25"
							width={node.keys.length * 20 + 20}
							height="50"
							rx="10"
							fill={getNodeColor(node)}
							filter="url(#dropShadow)"
						/>
					</g>
					
					<g 
						transform="translate({node.x}, {node.y})"
						transition:tweened={{
							duration: animationDuration,
							easing: cubicOut
						}}
					>
						<!-- Csomópont háttere -->
						<rect
							x={-(node.keys.length * 20 + 20) / 2}
							y="-25"
							width={node.keys.length * 20 + 20}
							height="50"
							rx="10"
							fill={getNodeGradient(node)}
							filter="url(#dropShadow)"
						/>
						
						<!-- Kulcsok -->
						{#each node.keys as key, i}
							<text
								x={(i - (node.keys.length - 1) / 2) * 20}
								y="6"
								text-anchor="middle"
								font-size="16"
								font-weight="bold"
								fill="white"
							>
								{key}
							</text>
						{/each}
					</g>
				{/each}
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
	
	.tag {
		display: inline-block;
		background-color: #484848;
		color: white;
		padding: 5px 10px;
		border-radius: 4px 4px 0 0;
		font-weight: bold;
		position: relative;
		top: 1px;
		z-index: 2;
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
	
	.control-buttons .custom-input {
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
		transition: background-color 0.3s;
	}

	.control-buttons button:hover:not(:disabled) {
		background-color: #45a049;
	}
	
	.control-buttons button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	
	.svg {
		margin: 0 auto;
		border: 1px solid #555;
		border-radius: 4px;
		display: block;
		background-color: #2f2f2f;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
	}
</style>