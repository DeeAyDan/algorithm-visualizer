<script>
// @ts-nocheck

    import { algorithmComponents } from "../stores/algorithmComponents";
    import { selectedAlgorithmSourceCode, selectedAlgorithm } from "../stores/store.svelte.js";
</script>

<style>
    .canvas-container{
        height: 65vh;
        border-bottom: 3px solid #505050;
    }
</style>

<div class="canvas-container">
    
    <svelte:component this={algorithmComponents[$selectedAlgorithm]} />
</div>