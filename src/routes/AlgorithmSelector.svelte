<script lang="ts">
    // @ts-nocheck
    
    import { isOpen, selectedAlgorithm, selectedAlgorithmSourceCode } from "../stores/store.svelte.js";
    import { algorithmComponents } from "../stores/algorithmComponents";


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

    function selectAlgorithm(algorithm: string){
        selectedAlgorithm.set(algorithm);
        selectedAlgorithmSourceCode.set(algorithmComponents[algorithm].sourceCodeText);
        isOpen.set(false);
    }

    function toggleGroup(group: keyof typeof algorithmGroups) {
        algorithmGroups[group] = !algorithmGroups[group];
    }
</script>

<style>
    .input-container {
        display: inline-block;
        background-color: #484848;
        width: 100%;
        display: block;
        overflow: auto;
    }

    .algorithm-group-button{
        background-color: #404040;
        color: white;
        border: none;
        cursor: pointer;
        padding: 10px;
        width: 100%;
        text-align: left;
    }

    .algorithm-button{
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

    .todo{
        color:red;
    }

</style>

<div class="input-container">
    <div class="algorithm-group">
        <button class="algorithm-group-button" on:click={() => toggleGroup('divideAndConquer')}>
            Oszd meg és uralkodj
        </button>
        <div class="algorithm-list {algorithmGroups.divideAndConquer ? 'visible' : ''}">
            <button class="algorithm-button todo">Faktoriális számítás</button>
            <button class="algorithm-button" on:click={() => selectAlgorithm("towersOfHanoi")}>Hanoi tornyai</button>
            <button class="algorithm-button todo">Hilbert-görbék</button>
        </div>
    </div>
    
    <div class="algorithm-group">
        <button class="algorithm-group-button" on:click={() => toggleGroup('dynamicProgramming')}>
            Dinamikus programozás
        </button>
        <div class="algorithm-list {algorithmGroups.dynamicProgramming ? 'visible' : ''}">
            <button class="algorithm-button" on:click={() => selectAlgorithm("maxSumPath")}>Legnagyobb összegű út</button>
            <button class="algorithm-button todo">Pénzváltó algoritmus</button>
            <button class="algorithm-button todo">Knuth-Morris-Pratt algoritmus</button>
        </div>
    </div>
    <div class="algorithm-group">
        <button class="algorithm-group-button" on:click={() => toggleGroup('greedyAlgorithms')}>
            Mohó algoritmusok
        </button>
        <div class="algorithm-list {algorithmGroups.greedyAlgorithms ? 'visible' : ''}">
            <button class="algorithm-button todo">Tört hátizsák probléma</button>
            <button class="algorithm-button todo">Tört hátizsák probléma (ismétléssel)</button>
            <button class="algorithm-button todo">Utazási probléma</button>
        </div>
    </div>
    <div class="algorithm-group">
        <button class="algorithm-group-button" on:click={() => toggleGroup('sortingAlgorithms')}>
            Rendezési algoritmusok
        </button>
        <div class="algorithm-list {algorithmGroups.sortingAlgorithms ? 'visible' : ''}">
            <button class="algorithm-button todo">Összefésüléses rendezés</button>
            <button class="algorithm-button todo">Beszúrásos rendezés</button>
            <button class="algorithm-button todo">Kupacrendezés</button>
            <button class="algorithm-button todo">Gyorsrendezés</button>
        </div>
    </div>
    <div class="algorithm-group">
        <button class="algorithm-group-button" on:click={() => toggleGroup('searchTrees')}>
            Keresőfák
        </button>
        <div class="algorithm-list {algorithmGroups.searchTrees ? 'visible' : ''}">
            <button class="algorithm-button todo">Bináris fa</button>
            <button class="algorithm-button todo">AVL-fa</button>
            <button class="algorithm-button todo">B-fa</button>
            <button class="algorithm-button todo">Piros-fekete fa</button>
            <button class="algorithm-button todo">2-3 fa</button>
            <button class="algorithm-button todo">2-3-4 fa</button>
            <button class="algorithm-button todo">Bináris kupac</button>
        </div>
    </div>
    <div class="algorithm-group">
        <button class="algorithm-group-button" on:click={() => toggleGroup('stringAlgorithms')}>
            Sztring algoritmusok
        </button>
        <div class="algorithm-list {algorithmGroups.stringAlgorithms ? 'visible' : ''}">
            <button class="algorithm-button todo">Rabin-Karp algoritmus</button>
        </div>
    </div>
    <div class="algorithm-group">
        <button class="algorithm-group-button" on:click={() => toggleGroup('shortestPath')}>
            Legrövidebb út keresése
        </button>
        <div class="algorithm-list {algorithmGroups.shortestPath ? 'visible' : ''}">
            <button class="algorithm-button todo">Dijkstra algoritmus</button>
            <button class="algorithm-button todo">Bellman-Ford algoritmus</button>
        </div>
    </div>
    <div class="algorithm-group">
        <button class="algorithm-group-button" on:click={() => toggleGroup('minimumSpanningTree')}>
            Minimális feszítőfák
        </button>
        <div class="algorithm-list {algorithmGroups.minimumSpanningTree ? 'visible' : ''}">
            <button class="algorithm-button todo">Prim algoritmus</button>
            <button class="algorithm-button todo">Kruskal algoritmus</button>
        </div>
    </div>
    <div class="algorithm-group">
        <button class="algorithm-group-button" on:click={() => toggleGroup('geometryAlgorithms')}>
            Geometriai algoritmusok
        </button>
        <div class="algorithm-list {algorithmGroups.geometryAlgorithms ? 'visible' : ''}">
            <button class="algorithm-button todo">Konvex burok</button>
            <button class="algorithm-button todo">Chan algoritmusa</button>
            <button class="algorithm-button todo">Graham szkennelése</button>
        </div>
    </div>
</div>
