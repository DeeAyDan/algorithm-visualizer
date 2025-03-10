<!-- Dropdown.svelte -->
<script>
    import { isOpen } from "../stores/store";

    function toggleDropdown() {
        isOpen.update(value => !value);
    }

    let inputVisible = false;

    $: $isOpen, inputVisible = $isOpen;
</script>

<style>
    .dropdown {
        position:relative;
        margin: auto;
        height: 100%;
    }

    .dropdown-button {
        background: none;
        border: none;
        cursor: pointer;
        height: 100%;
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
         <span class="arrow {inputVisible ? 'visible' : ''}">Select an algorithm ▼</span>
         <span class="arrow {!inputVisible ? 'visible' : ''}">Close the menu ▼</span>

    </button>
</div>
