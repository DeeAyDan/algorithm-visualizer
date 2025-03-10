<script>
    import { isOpen } from "../stores/store";
    let algorithmMenuVisible = true;
    let divideAndConquerVisible = false;

    $: $isOpen, algorithmMenuVisible = $isOpen;

    function showDivideAndConquer(){
        divideAndConquerVisible = !divideAndConquerVisible;
    }
</script>

<style>
    .input-container {
        display: inline-block;
        background-color: #484848;
        width: 35%;
        display: none;
    }

    .input-container.visible {
        display: block;
    }

    .divide-and-conquer-button{
        background: none;
        border: none;
        cursor: pointer;
        width: 100%;
    }

    .divide-and-conquer-button.visible{
        background-color: #404040;
    }

    .divide-and-conquer-button:hover{
        background-color: #404040;
    }

    .divide-and-conquer{
        display: none;
    }

    .divide-and-conquer.visible{
        display: block;
    }
</style>

<div class="input-container {algorithmMenuVisible ? 'visible' : ''}">
    <button class="divide-and-conquer-button {divideAndConquerVisible ? 'visible' : ''}" on:click={showDivideAndConquer}>Oszd meg és uralkodj</button>
    <div  class="divide-and-conquer {divideAndConquerVisible ? 'visible' : ''}" >option 2</div>
    <div  class="divide-and-conquer {divideAndConquerVisible ? 'visible' : ''}" >option 3</div>
</div>
