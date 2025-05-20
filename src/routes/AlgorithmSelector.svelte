<script lang="ts">
	// @ts-nocheck

	import { isOpen, selectedAlgorithm } from '../stores/store.svelte.js';
	import { algorithmComponents } from '../stores/algorithmComponents';

	let algorithmGroups = {
		divideAndConquer: false,
		dynamicProgramming: false,
		greedyAlgorithms: false,
		sortingAlgorithms: false,
		searchTrees: false,
		stringAlgorithms: false,
		shortestPath: false,
		minimumSpanningTree: false,
		geometryAlgorithms: false
	};

	function selectAlgorithm(algorithm: string) {
		if (algorithmComponents[algorithm]) {
			selectedAlgorithm.set(algorithm);
		} else {
			console.error(`Algorithm '${algorithm}' not found.`);
		}
		isOpen.set(false);
	}

	function toggleGroup(group: keyof typeof algorithmGroups) {
		algorithmGroups[group] = !algorithmGroups[group];
	}
</script>

<div class="input-container">
	<div class="algorithm-group">
		<button class="algorithm-group-button" on:click={() => toggleGroup('divideAndConquer')}>
			Oszd meg és uralkodj
		</button>
		<div class="algorithm-list {algorithmGroups.divideAndConquer ? 'visible' : ''}">
			<button class="algorithm-button" on:click={() => selectAlgorithm('factorialCalculator')}>Faktoriális számítás</button>
			<button class="algorithm-button" on:click={() => selectAlgorithm('towersOfHanoi')}>Hanoi tornyai</button>
			<button class="algorithm-button" on:click={() => selectAlgorithm('hilbertCurves')}>Hilbert-görbék</button>
		</div>
	</div>

	<div class="algorithm-group">
		<button class="algorithm-group-button" on:click={() => toggleGroup('dynamicProgramming')}>
			Dinamikus programozás
		</button>
		<div class="algorithm-list {algorithmGroups.dynamicProgramming ? 'visible' : ''}">
			<button class="algorithm-button" on:click={() => selectAlgorithm('maxSumPath')}>Legnagyobb összegű út</button>
			<button class="algorithm-button" on:click={() => selectAlgorithm('coinChange')}>Pénzváltó algoritmus</button>
		</div>
	</div>
	<div class="algorithm-group">
		<button class="algorithm-group-button" on:click={() => toggleGroup('greedyAlgorithms')}>
			Mohó algoritmusok
		</button>
		<div class="algorithm-list {algorithmGroups.greedyAlgorithms ? 'visible' : ''}">
			<button class="algorithm-button" on:click={() => selectAlgorithm('fractionalKnapsack')}>Tört hátizsák probléma</button>
			<button class="algorithm-button" on:click={() => selectAlgorithm('fractionalKnapsackRep')}>Tört hátizsák probléma (ismétléssel)</button>
			<button class="algorithm-button" on:click={() => selectAlgorithm('travelingProblem')}>Utazási probléma</button>
		</div>
	</div>
	<div class="algorithm-group">
		<button class="algorithm-group-button" on:click={() => toggleGroup('sortingAlgorithms')}>
			Rendezési algoritmusok
		</button>
		<div class="algorithm-list {algorithmGroups.sortingAlgorithms ? 'visible' : ''}">
			<button class="algorithm-button" on:click={() => selectAlgorithm('mergeSort')}>Összefésüléses rendezés</button>
			<button class="algorithm-button" on:click={() => selectAlgorithm('insertionSort')}>Beszúrásos rendezés</button>
			<button class="algorithm-button" on:click={() => selectAlgorithm('heapSort')}>Kupacrendezés</button>
			<button class="algorithm-button" on:click={() => selectAlgorithm('quickSort')}>Gyorsrendezés</button>
		</div>
	</div>
	<div class="algorithm-group">
		<button class="algorithm-group-button" on:click={() => toggleGroup('searchTrees')}>
			Keresőfák
		</button>
		<div class="algorithm-list {algorithmGroups.searchTrees ? 'visible' : ''}">
			<button class="algorithm-button" on:click={() => selectAlgorithm('binaryTree')}>Bináris fa</button>
			<button class="algorithm-button todo" on:click={() => selectAlgorithm('avlTree')}>AVL-fa</button>
			<button class="algorithm-button todo" on:click={() => selectAlgorithm('bTree')}>B-fa</button>
			<button class="algorithm-button todo" on:click={() => selectAlgorithm('redBlackTree')}>Piros-fekete fa</button>
			<button class="algorithm-button todo" on:click={() => selectAlgorithm('twoThreeTree')}>2-3 fa</button>
			<button class="algorithm-button todo" on:click={() => selectAlgorithm('binaryHeap')}>Bináris kupac</button>
		</div>
	</div>
	<div class="algorithm-group">
		<button class="algorithm-group-button" on:click={() => toggleGroup('stringAlgorithms')}>
			Sztring algoritmusok
		</button>
		<div class="algorithm-list {algorithmGroups.stringAlgorithms ? 'visible' : ''}">
			<button class="algorithm-button todo" on:click={() => selectAlgorithm('rabinKarp')}>Rabin-Karp algoritmus</button>
			<button class="algorithm-button todo" on:click={() => selectAlgorithm('knuthMorrisPratt')}>Knuth-Morris-Pratt algoritmus</button>
		</div>
	</div>
	<div class="algorithm-group">
		<button class="algorithm-group-button" on:click={() => toggleGroup('shortestPath')}>
			Legrövidebb út keresése
		</button>
		<div class="algorithm-list {algorithmGroups.shortestPath ? 'visible' : ''}">
			<button class="algorithm-button" on:click={() => selectAlgorithm('dijkstraShortestPath')}>Dijkstra algoritmus</button>
			<button class="algorithm-button" on:click={() => selectAlgorithm('bellmanFordShortestPath')}>Bellman-Ford algoritmus</button>
		</div>
	</div>
	<div class="algorithm-group">
		<button class="algorithm-group-button" on:click={() => toggleGroup('minimumSpanningTree')}>
			Minimális feszítőfák
		</button>
		<div class="algorithm-list {algorithmGroups.minimumSpanningTree ? 'visible' : ''}">
			<button class="algorithm-button" on:click={() => selectAlgorithm('primMinimumSpanningTree')}>Prim algoritmus</button>
			<button class="algorithm-button" on:click={() => selectAlgorithm('kruskalMinimumSpanningTree')}>Kruskal algoritmus</button>
		</div>
	</div>
	<div class="algorithm-group">
		<button class="algorithm-group-button" on:click={() => toggleGroup('geometryAlgorithms')}>
			Geometriai algoritmusok
		</button>
		<div class="algorithm-list {algorithmGroups.geometryAlgorithms ? 'visible' : ''}">
			<button class="algorithm-button" on:click={() => selectAlgorithm('convexHull')}>Konvex burok (Brute Force)</button>
			<button class="algorithm-button" on:click={() => selectAlgorithm('jarvisMarch')}>Jarvis menetelés</button>
			<button class="algorithm-button" on:click={() => selectAlgorithm('grahamScan')}>Graham pásztázás</button>
		</div>
	</div>
</div>

<style>
	.input-container {
		display: inline-block;
		background-color: #484848;
		width: 100%;
		display: block;
		overflow: auto;
	}

	.algorithm-group-button {
		background-color: #404040;
		color: white;
		border: none;
		cursor: pointer;
		padding: 10px;
		width: 100%;
		text-align: left;
	}

	.algorithm-button {
		border: none;
		cursor: pointer;
		text-align: right;
		padding-right: 10px;
		padding: 5px 10px 5px 0px;
		background: none;
		width: 100%;
	}

	.algorithm-button:hover {
		background-color: #555555;
	}

	.algorithm-group-button:hover {
		background-color: #505050;
	}

	.algorithm-list {
		display: none;
	}

	.algorithm-list.visible {
		display: block;
	}

	.todo {
		color: red;
	}
</style>
