<!-- Dropdown.svelte -->
<script>
    import { isOpen } from "../stores/store.svelte.js";

    function toggleDropdown() {
        isOpen.update(value => !value);
    }

    let inputVisible = false;

    $: $isOpen, inputVisible = $isOpen;
</script>

<style>
    .dropdown {
        position:relative;
        height: 100%;
    }

    .dropdown-button {
        background: none;
        border: none;
        cursor: pointer;
        height: 100%;
        margin-right: 15px;
    }
    .arrow{
        display: inline;
    }
    .arrow.visible{
        display: none;
    }
</style>

<div class="dropdown">
    <button class="dropdown-button" on:click={toggleDropdown}>
         <span class="arrow {inputVisible ? 'visible' : ''}">Algoritmus választó ▼</span>
         <span class="arrow {!inputVisible ? 'visible' : ''}">Menü bezárása</span>

    </button>
</div>
