<script lang="ts">
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
            <div class="algorithm-button todo">Faktoriális számítás</div>
            <div class="algorithm-button todo">Hanoi tornyai</div>
            <div class="algorithm-button todo">Hilbert-görbék</div>
        </div>
    </div>
    
    <div class="algorithm-group">
        <button class="algorithm-group-button" on:click={() => toggleGroup('dynamicProgramming')}>
            Dinamikus programozás
        </button>
        <div class="algorithm-list {algorithmGroups.dynamicProgramming ? 'visible' : ''}">
            <div class="algorithm-button todo">Legnagyobb összegű út</div>
            <div class="algorithm-button todo">Pénzváltó algoritmus</div>
            <div class="algorithm-button todo">Knuth-Morris-Pratt algoritmus</div>
        </div>
    </div>
    <div class="algorithm-group">
        <button class="algorithm-group-button" on:click={() => toggleGroup('greedyAlgorithms')}>
            Mohó algoritmusok
        </button>
        <div class="algorithm-list {algorithmGroups.greedyAlgorithms ? 'visible' : ''}">
            <div class="algorithm-button todo">Tört hátizsák probléma</div>
            <div class="algorithm-button todo">Tört hátizsák probléma (ismétléssel)</div>
            <div class="algorithm-button todo">Utazási probléma</div>
        </div>
    </div>
    <div class="algorithm-group">
        <button class="algorithm-group-button" on:click={() => toggleGroup('sortingAlgorithms')}>
            Rendezési algoritmusok
        </button>
        <div class="algorithm-list {algorithmGroups.sortingAlgorithms ? 'visible' : ''}">
            <div class="algorithm-button todo">Összefésüléses rendezés</div>
            <div class="algorithm-button todo">Beszúrásos rendezés</div>
            <div class="algorithm-button todo">Kupacrendezés</div>
            <div class="algorithm-button todo">Gyorsrendezés</div>
        </div>
    </div>
    <div class="algorithm-group">
        <button class="algorithm-group-button" on:click={() => toggleGroup('searchTrees')}>
            Keresőfák
        </button>
        <div class="algorithm-list {algorithmGroups.searchTrees ? 'visible' : ''}">
            <div class="algorithm-button todo">Bináris fa</div>
            <div class="algorithm-button todo">AVL-fa</div>
            <div class="algorithm-button todo">B-fa</div>
            <div class="algorithm-button todo">Piros-fekete fa</div>
            <div class="algorithm-button todo">2-3 fa</div>
            <div class="algorithm-button todo">2-3-4 fa</div>
            <div class="algorithm-button todo">Bináris kupac</div>
        </div>
    </div>
    <div class="algorithm-group">
        <button class="algorithm-group-button" on:click={() => toggleGroup('stringAlgorithms')}>
            Sztring algoritmusok
        </button>
        <div class="algorithm-list {algorithmGroups.stringAlgorithms ? 'visible' : ''}">
            <div class="algorithm-button todo">Rabin-Karp algoritmus</div>
        </div>
    </div>
    <div class="algorithm-group">
        <button class="algorithm-group-button" on:click={() => toggleGroup('shortestPath')}>
            Legrövidebb út keresése
        </button>
        <div class="algorithm-list {algorithmGroups.shortestPath ? 'visible' : ''}">
            <div class="algorithm-button todo">Dijkstra algoritmus</div>
            <div class="algorithm-button todo">Bellman-Ford algoritmus</div>
        </div>
    </div>
    <div class="algorithm-group">
        <button class="algorithm-group-button" on:click={() => toggleGroup('minimumSpanningTree')}>
            Minimális feszítőfák
        </button>
        <div class="algorithm-list {algorithmGroups.minimumSpanningTree ? 'visible' : ''}">
            <div class="algorithm-button todo">Prim algoritmus</div>
            <div class="algorithm-button todo">Kruskal algoritmus</div>
        </div>
    </div>
    <div class="algorithm-group">
        <button class="algorithm-group-button" on:click={() => toggleGroup('geometryAlgorithms')}>
            Geometriai algoritmusok
        </button>
        <div class="algorithm-list {algorithmGroups.geometryAlgorithms ? 'visible' : ''}">
            <div class="algorithm-button todo">Konvex burok</div>
            <div class="algorithm-button todo">Chan algoritmusa</div>
            <div class="algorithm-button todo">Graham szkennelése</div>
        </div>
    </div>
</div>
