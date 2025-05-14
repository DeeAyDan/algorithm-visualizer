<script lang="ts">
	// @ts-nocheck
	import { onMount } from 'svelte';
	import {
		selectedAlgorithmSourceCode,
		selectedAlgorithm,
		currentStep,
		totalSteps,
		consoleLog,
		speed,
		algorithmStatus,
		resumeSignal,
		activeLine
	} from '../stores/store.svelte.js';
	import Controls from '../routes/Controls.svelte';
	import { get } from 'svelte/store';
	import { algorithmDisplayNames } from '../stores/algorithmMap.js';
	import { waitUntilResume, delay, pauseIfNeeded, log } from '../stores/utils.js';

	const displayName = algorithmDisplayNames[get(selectedAlgorithm)];

	let inputNumber = 5;
	let callStack = [];
	let currentResult = null;
	let recursionTree = [];

	$: {
		if (inputNumber !== undefined) {
			totalSteps.set(calculateTotalSteps(inputNumber));
		}
	}

	onMount(() => {
		resetParameters();
	});

	function resetParameters() {
		currentStep.set(0);
		consoleLog.set([]);

		inputNumber = 5;
		callStack = [];
		currentResult = null;
		recursionTree = [];
		activeLine.set({ start: -1, end: -1 });
	}

	function calculateTotalSteps(n: number): number {
		return n <= 1 ? 2 : 3 * n - 1;
	}

	async function restartAlgorithm() {
		if (get(algorithmStatus) === 'finished') {
			return new Promise((resolve) => {
				const unsub = resumeSignal.subscribe(() => {
					if (get(algorithmStatus) === 'idle') {
						resetParameters();
						unsub();
						resolve();
					}
				});
			});
		}
	}

	async function startAlgorithm(event) {
		consoleLog.set([]);
		currentStep.set(0);
		callStack = [];
		currentResult = null;
		recursionTree = [];

		consoleLog.update((logs) => [...logs, `${displayName} indítása...`]);

		totalSteps.set(calculateTotalSteps(inputNumber));
		let result = await recursiveFactorial(inputNumber);
		consoleLog.update((logs) => [...logs, `Végeredmény: ${inputNumber}! = ${result}`]);

		activeLine.set({ start: -1, end: -1 });
		algorithmStatus.set('finished');
		await restartAlgorithm();
	}

	async function recursiveFactorial(n: number, depth = 0): Promise<number> {
		const callId = `factorial(${n})`;
		callStack = [...callStack, { id: callId, n, depth }];

		const treeNode = { id: callId, n, children: [], result: null, state: 'active' };
		recursionTree = [...recursionTree, treeNode];

		activeLine.set({ start: 1, end: 1 });
		await log(`Belépés: factorial(${n})`);
		await delay(900 - get(speed) * 8);
		await pauseIfNeeded();

		if (n === 0 || n === 1) {
			activeLine.set({ start: 2, end: 4 });
			await log(`Alapeset: ${n}! = 1`);

			treeNode.result = 1;
			treeNode.state = 'completed';
			recursionTree = [...recursionTree];

			currentResult = 1;

			await delay(300);
			callStack = callStack.slice(0, -1);

			return 1;
		}

		activeLine.set({ start: 5, end: 5 });
		await log(`Rekurzív hívás: factorial(${n - 1})`);
		await delay(900 - get(speed) * 8);
		await pauseIfNeeded();

		const partial = await recursiveFactorial(n - 1, depth + 1);

		const result = n * partial;
		currentResult = result;

		treeNode.result = result;
		treeNode.state = 'completed';

		const childId = `factorial(${n - 1})`;
		const childNode = recursionTree.find((node) => node.id === childId);
		if (childNode) {
			treeNode.children = [childNode];
		}

		recursionTree = [...recursionTree];

		activeLine.set({ start: 5, end: 5 });
		await log(`Visszatérés: ${n}! = ${n} * ${partial} = ${result}`);
		await delay(900 - get(speed) * 8);
		await pauseIfNeeded();
		callStack = callStack.slice(0, -1);

		return result;
	}

	selectedAlgorithmSourceCode.set(
		`function recursiveFactorial(n) {
  if (n === 0 || n === 1) {
    return 1;
  }
  return n * recursiveFactorial(n - 1);
}`
	);
</script>

<div class="custom-input">
	<label for="inputNumber">Szám (n):</label>
	<input
		id="inputNumber"
		type="number"
		bind:value={inputNumber}
		min="0"
		max="12"
		placeholder="Adj meg egy számot"
		disabled={$algorithmStatus !== 'idle'}
	/>
</div>

<div class="algorithm-container">
	<Controls {currentStep} {totalSteps} on:start={startAlgorithm} />

	<div class="visualization-container">
		<div class="visualization-section">
			<h3>Hívási verem</h3>
			<div class="call-stack scrollable">
				{#each callStack as call}
					<div class="call-item">
						<div class="call-name">{call.id}</div>
					</div>
				{/each}
				{#if callStack.length === 0}
					<div class="empty-stack">A verem üres</div>
				{/if}
			</div>
		</div>

		<div class="visualization-section" style="height: 110px;">
			<h3>Jelenlegi eredmény</h3>
			{#if currentResult !== null}
				<div class="current-result">{currentResult}</div>
			{:else}
				<div class="empty-result">Nincs eredmény</div>
			{/if}
		</div>

		<div class="visualization-section">
			<h3>Rekurziós fa</h3>
			<div class="recursion-tree scrollable">
				{#each recursionTree.filter((node) => node.state === 'completed') as node}
					<div class="tree-node {node.state}">
						<div class="node-content">
							<div class="node-name">{node.id}</div>
							<div class="node-result">{node.result !== null ? `= ${node.result}` : ''}</div>
						</div>
						{#if node.children.length > 0}
							<div class="node-formula">
								{node.n} × {node.children[0].result} = {node.result}
							</div>
						{/if}
					</div>
				{/each}
				{#if recursionTree.filter((node) => node.state === 'completed').length === 0}
					<div class="empty-tree">A fa üres</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.custom-input {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 10px;
		padding: 0.5rem;
		border-bottom: 3px solid #505050;
	}
	.custom-input input {
		width: 55px;
		padding: 0.5rem;
		margin-right: 10px;
		border-radius: 5px;
		background-color: #2f2f2f;
		border: 3px solid #505050;
	}

	.custom-input input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		border-color: #3a3a3a;
	}

	.visualization-container {
		display: flex;
		flex-direction: row;
		gap: 20px;
		padding: 20px;
		background-color: #2f2f2f;
	}

	.visualization-section {
		background-color: #3a3a3a;
		border-radius: 8px;
		padding: 15px;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
		height: 250px;
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.visualization-section h3 {
		margin-top: 0;
		color: #e0e0e0;
		border-bottom: 2px solid #505050;
		padding-bottom: 8px;
		margin-bottom: 12px;
	}

	.scrollable {
		overflow-y: auto;
		max-height: 250px;
		flex: 1;
	}

	.call-stack {
		display: flex;
		flex-direction: column-reverse;
		gap: 4px;
	}

	.call-item {
		background-color: #505050;
		padding: 8px 12px;
		border-radius: 4px;
		color: #fff;
		font-family: monospace;
		display: flex;
		justify-content: space-between;
		border-left: 4px solid #45a049;
	}

	.empty-stack,
	.empty-result,
	.empty-tree {
		text-align: center;
		color: #888;
		padding: 20px;
		font-style: italic;
	}

	.current-result {
		font-size: 24px;
		font-weight: bold;
		text-align: center;
		background-color: #45a049;
		color: white;
		padding: 10px;
		border-radius: 4px;
	}

	.recursion-tree {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.tree-node {
		background-color: #505050;
		padding: 12px;
		border-radius: 4px;
		color: #fff;
		margin-bottom: 8px;
		border-left: 4px solid #45a049;
	}

	.tree-node.completed {
		border-left-color: #45a049;
	}

	.tree-node.active {
		border-left-color: #f1c40f;
	}

	.node-content {
		display: flex;
		justify-content: space-between;
		font-family: monospace;
		margin-bottom: 8px;
	}

	.node-name {
		font-weight: bold;
	}

	.node-result {
		color: #45a049;
		font-weight: bold;
	}

	.node-formula {
		background-color: #444;
		padding: 6px 10px;
		border-radius: 4px;
		font-family: monospace;
		text-align: center;
	}
</style>
