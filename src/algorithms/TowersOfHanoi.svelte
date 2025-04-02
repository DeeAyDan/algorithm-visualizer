<script lang="ts">
  import Canvas from "../routes/Canvas.svelte";
  import ConsoleLog from "../routes/ConsoleLog.svelte";
  import Controls from "../routes/Controls.svelte";
  import { selectedAlgorithmSourceCode } from "../stores/store.svelte.js";

  let placeholderText = {
    controls: "These are the controls for Towers of Hanoi",
    consoleLog: "Console log of Towers of Hanoi execution steps",
    canvas: "Visualizing Towers of Hanoi",
  };

  const sourceCode = `
    function towersOfHanoi(n, from, to, aux) {
      if (n === 1) {
        console.log('Move disk 1 from ' + from + ' to ' + to);
        return;
      }
      towersOfHanoi(n - 1, from, aux, to);
      console.log('Move disk ' + n + ' from ' + from + ' to ' + to);
      towersOfHanoi(n - 1, aux, to, from);
    }
  `;

  selectedAlgorithmSourceCode.set(sourceCode);
</script>

<div class="algorithm-container">
  <Controls text={placeholderText.controls} />
  <Canvas text={placeholderText.canvas} />
  <ConsoleLog text={placeholderText.consoleLog} />
</div>
