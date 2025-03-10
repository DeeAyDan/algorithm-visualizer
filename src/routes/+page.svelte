<script>
    import Header from "./Header.svelte";
</script>

<style>
    .page-body-container{
        display: flex;
        background-color: #2f2f2f;
    }
    .display-container{
        display: flex;
        flex-direction: column;
    }
</style>

<main>
    <Header></Header>
    <div>Dropdown</div>
    <div class="page-body-container">
        <div>Source</div>
        <div class="display-container">
            <div>Controls</div>
            <div>Canvas</div>
            <div>ConsoleLog</div>
        </div>
        <div>Input Field</div>
    </div>
</main>