<script>
    import DropdownButton from "./DropdownButton.svelte";
    import { isOpen, selectedAlgorithm } from "../stores/store.svelte.js";
</script>

<style>
    .header{
        width: 100%;
        height: 32px;
        background-color: #595959;
        border-bottom: 3px solid #505050;
        display: flex;
        justify-content: space-between;
    }

    .title{
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        padding: 5px 10px 5px 10px;
        font-family: 'Courier New', Courier, monospace;
        cursor: pointer;
    }
</style>

<div class="header">
    <button class="title" on:click={() => selectedAlgorithm.selectedAlgorithm = ""}>Algoritmus Vizualizáló.</button>
    <DropdownButton></DropdownButton>
</div>