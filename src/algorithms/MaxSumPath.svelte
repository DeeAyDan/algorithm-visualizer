<script lang="ts">
    import Canvas from '../routes/Canvas.svelte';
    import ConsoleLog from '../routes/ConsoleLog.svelte';
    import Controls from '../routes/Controls.svelte';
    import { selectedAlgorithmSourceCode } from '../stores/store.svelte';

    let placeholderText = {
      controls: "These are the controls for MaxSumPath",
      consoleLog: "Console log of MaxSumPath execution steps",
      canvas: "Visualizing MaxSumPath",
    };

    selectedAlgorithmSourceCode.set(`
    function maxSumPath(matrix) {
        let maxSum = 0;
        for (let row of matrix) {
            let rowSum = row.reduce((a, b) => a + b, 0);
            if (rowSum > maxSum) {
                maxSum = rowSum;
            }
        }
        return maxSum;
    }
    `);
  </script>
  
  <div class="algorithm-container">
    <Controls text={placeholderText.controls} />
    <Canvas text={placeholderText.canvas} />
    <ConsoleLog text={placeholderText.consoleLog} />
  </div>
  