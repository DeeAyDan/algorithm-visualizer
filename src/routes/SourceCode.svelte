<script lang="ts">
	import { selectedAlgorithmSourceCode, selectedAlgorithm } from '../stores/store.svelte';

	export const formattedNamesMap: Record<string, string> = {
		avlTree: 'AVL-fa',
		bTree: 'B-fa',
		bellmanFordShortestPath: 'Bellman-Ford legrövidebb út',
		binaryHeap: 'Bináris kupac',
		binaryTree: 'Bináris keresőfa',
		chansAlgorithm: 'Chan algoritmus',
		coinChange: 'Pénzváltás algoritmus',
		convexHull: 'Konvex burok',
		dijkstraShortestPath: 'Dijkstra legrövidebb út',
		factorialCalculator: 'Faktoriális kalkulátor',
		fractionalKnapsack: 'Töredekes hátizsák',
		fractionalKnapsackRep: 'Töredekes hátizsák (ismétléses)',
		grahamScan: 'Graham szkennelés',
		heapSort: 'Kupacrendezés',
		hilbertCurves: 'Hilbert görbe',
		insertionSort: 'Beszúró rendezés',
		knuthMorrisPratt: 'Knuth-Morris-Pratt algoritmus',
		kruskalMinimumSpanningTree: 'Kruskal minimális feszítőfa',
		maxSumPath: 'Maximális összegű út',
		mergeSort: 'Összefésülő rendezés',
		primMinimumSpanningTree: 'Prim minimális feszítőfa',
		quickSort: 'Gyorsrendezés',
		rabinKarp: 'Rabin-Karp algoritmus',
		redBlackTree: 'Piros-fekete fa',
		towersOfHanoi: 'Hanoi tornyai',
		travelingProblem: 'Utazó ügynök probléma',
		twoThreeFourTree: '2-3-4 fa',
		twoThreeTree: '2-3 fa'
	};

	function formatAlgorithmName(key: string): string {
		return (
			formattedNamesMap[key] ??
			key
				.replace(/([A-Z])/g, ' $1') // camelCase -> szóköz a nagybetűk előtt
				.replace(/_/g, ' ') // snake_case -> szóköz
				.replace(/^./, (str) => str.toUpperCase()) // első betű nagybetűs
		);
	}

	$: formattedAlgorithmName = formatAlgorithmName($selectedAlgorithm);
</script>

<div class="source-container">
	<div class="tag">{formattedAlgorithmName}</div>
	<div>
		{$selectedAlgorithmSourceCode}
	</div>
</div>

<style>
	.source-container {
		width: 70%;
		background-color: #484848;
	}
	.tag {
		display: inline-block;
		top: 0;
		left: 0;
		background-color: #484848;
		color: white;
		padding: 3px;
		font-size: px;
	}
</style>
