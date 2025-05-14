<script>
    import DropdownButton from "./DropdownButton.svelte";
    import { isOpen, selectedAlgorithm, selectedAlgorithmSourceCode } from "../stores/store.svelte.js";

    function closeMenu() {
        isOpen.set(false);
        selectedAlgorithm.set("");
        selectedAlgorithmSourceCode.set("");
    }
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
    <button class="title" on:click={() => closeMenu()}>Algoritmus Vizualizátor.</button>
    <DropdownButton></DropdownButton>
</div>