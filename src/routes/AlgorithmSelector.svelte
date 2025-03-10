<script>
    import { isOpen } from "../stores/store";
    let inputVisible = false;

    $: $isOpen, inputVisible = $isOpen;
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
</style>

<div class="input-container {inputVisible ? 'visible' : ''}">

</div>
