<script>
    export let text = "";
</script>

<style>
    .controls-bar{
        height: 48px;
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

<div class="controls-bar">
    <div class="tag">Controls</div>
    {text}
</div>