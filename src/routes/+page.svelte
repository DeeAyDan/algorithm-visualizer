<script>
    import Header from "./Header.svelte";
    import SourceCode from "./SourceCode.svelte";
    import AlgorithmSelector from "./AlgorithmSelector.svelte";
    import Controls from "./Controls.svelte";
    import Canvas from "./Canvas.svelte";
    import ConsoleLog from "./ConsoleLog.svelte";
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
</style>

<main>
    <Header></Header>
    <div class="page-body-container">
        <AlgorithmSelector></AlgorithmSelector>
        <div class="display-container">
            <Controls></Controls>
            <Canvas></Canvas>
            <ConsoleLog></ConsoleLog>
        </div>
        <SourceCode></SourceCode>
    </div>
</main>