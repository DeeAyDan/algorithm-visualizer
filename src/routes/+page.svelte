<script>
// @ts-nocheck


    import Header from "./Header.svelte";
    import SourceCode from "./SourceCode.svelte";
    import AlgorithmSelector from "./AlgorithmSelector.svelte";
    import Controls from "./Controls.svelte";
    import Canvas from "./Canvas.svelte";
    import ConsoleLog from "./ConsoleLog.svelte";
    import { isOpen, selectedAlgorithm } from "../stores/store.svelte.js";

    import MaxSumPath from "../algorithms/MaxSumPath.svelte";


    const algorithmComponents = {
    maxSumPath: MaxSumPath,
  };

    let algorithmMenuVisible = false;
    $: $isOpen, algorithmMenuVisible = $isOpen;
</script>

<style>
    main{
        height: 100vh;
        display: flex;
        flex-direction: column;
    }
    .page-body-container{
        display: flex;
        background-color: #2f2f2f;
        flex: 1;
        justify-content: space-between;
    }
    .display-container{
        display: flex;
        flex-direction: column;
        width: 100%;
    }
    .left-panel{
        padding: 0px;
        display: flex;
        flex-direction: column;
        background-color: #2f2f2f;
        max-height: calc(100vh - 35px);
        overflow: auto;
        box-sizing: border-box; 
        background-color: #484848;
        width: 550px;

    }
    .algorithm-selector{
        display: none;
        padding: 0px;
        margin: 0px;
    }
    .algorithm-selector.visible{
        display: block;
    }
    .select-title{
        text-align: center;
    }
</style>

<main>
    <Header />
    <div class="page-body-container">
        <div class="display-container">
            {#if selectedAlgorithm.selectedAlgorithm}
            <svelte:component this={algorithmComponents[selectedAlgorithm.selectedAlgorithm]} />
            {/if}
        </div>
        <div class="left-panel">
            <div class="algorithm-selector {algorithmMenuVisible ? 'visible' : ''}">
                <AlgorithmSelector />
            </div>
            <div class="algorithm-selector {algorithmMenuVisible ? '' : 'visible'}">
                {#if selectedAlgorithm.selectedAlgorithm}
                <SourceCode code={selectedAlgorithm.sourceCode} />
                {:else}
                <div>
                    <h1 class="select-title">Válassz egy algoritmust!</h1>
                </div>
                {/if}
            </div>
        </div>
        
    </div>
</main>