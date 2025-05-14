<script lang="ts">
    // @ts-nocheck
    import {
        selectedAlgorithmSourceCode,
        selectedAlgorithm,
        activeLine
    } from '../stores/store.svelte';
    import { algorithmDisplayNames } from '../stores/algorithmMap';
    $: formattedAlgorithmName = algorithmDisplayNames[$selectedAlgorithm];
    $: codeLines = $selectedAlgorithmSourceCode.split('\n');
    $: ({ start, end } = $activeLine);
</script>
<div class="source-container">
    <div class="tag">{formattedAlgorithmName}</div>
    <div class="source-code">
        <code>
            {#each codeLines as line, i}
                <div class="code-line">
                    <div class="line-number">{i + 1}</div>
                    <pre class="code-text {i + 1 >= start && i + 1 <= end ? 'active-line' : ''}">{line}</pre>
                </div>
            {/each}
        </code>
    </div>
   
</div>
<style>
    .source-container {
        width: 100%;
        background-color: #484848;
    }
    .tag {
        display: inline-block;
        top: 0;
        left: 0;
        background-color: #484848;
        padding: 3px;
        font-size: px;
    }
    .source-code {
        padding: 10px;
    }
    .code-line {
        display: flex;
        padding: 0;
        margin: 0;
    }
    .code-text {
        white-space: pre-wrap;
        font-size: 70%;
        margin: 0;
        flex: 1;
    }
    .active-line {
        background-color: #45a049;
        color: #2f2f2f;
    }
    .line-number {
        font-size: 60%;
        text-align: right;
        color: #888;
        margin: 0 10px 0 0;
        min-width: 2em;
        user-select: none;
    }
</style>