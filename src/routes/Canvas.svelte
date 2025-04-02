<script>
    export let text = ""
</script>

<style>
    .canvas-container{
        height: 65vh;
        border-bottom: 3px solid #505050;
    }
    .tag{
        display: inline-block;
        top: 0;
        left: 0;
        background-color: #484848;
        color: white;
        padding: 3px;
        font-size: px;
    }
</style>

<div class="canvas-container">
    <div class="tag">Canvas</div>
    {text}
</div>