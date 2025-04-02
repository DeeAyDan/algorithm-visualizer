<script>
    export let text = "";
</script>

<style>
    .console-log-container {
        height: 65vh;
        border-bottom: 3px solid #505050;
    }
    .tag {
        display: inline-block;
        top: 0;
        left: 0;
        background-color: #484848;
        color: white;
        padding: 3px;
        font-size: px;
    }
</style>
<div class="console-log-container">
    <div class="tag">Console Log</div>
    {text}
</div>