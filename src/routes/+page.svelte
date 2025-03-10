<script>
    import Header from "./Header.svelte";
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
    }
</style>

<main>
    <Header></Header>
    <div style="color:black">Dropdown</div>
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