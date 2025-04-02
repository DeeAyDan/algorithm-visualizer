<script>
    import DropdownButton from "./DropdownButton.svelte";
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
        color: white;
        font-size: 20px;
        padding: 5px 10px 5px 10px;
        font-family: 'Courier New', Courier, monospace;
    }
</style>

<div class="header">
    <span class="title">Algoritmus Vizualizáló.</span>
    <DropdownButton></DropdownButton>
</div>