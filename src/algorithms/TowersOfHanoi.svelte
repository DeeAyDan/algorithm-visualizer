<script lang="ts">
  // @ts-nocheck

  import { selectedAlgorithmSourceCode } from "../stores/store.svelte.js";
  import Controls from "../routes/Controls.svelte";

  let currentStep = 0;
  let totalSteps = 10; // Example: Towers of Hanoi with 10 steps
  let speed = 50; // Default execution speed

   // Play button logic
   function handlePlay() {
    console.log("Playing Towers of Hanoi algorithm...");
    // Logic for running the algorithm goes here
  }

  // Logic for updating speed
  function handleSpeedChange(newSpeed: number) {
    speed = newSpeed;
    console.log(`Speed set to: ${speed}`);
  }

  // Visualizing step-by-step execution
  function updateStep(step: number) {
    currentStep = step;
    console.log(`Current Step: ${currentStep}`);
  }

  // Define source code for Towers of Hanoi
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

<style>
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

<div class="algorithm-container">
  <Controls
    currentStep={currentStep}
    totalSteps={totalSteps}
    speed={speed}
    onPlay={handlePlay}
    onSpeedChange={handleSpeedChange}
/>

  <div class="tag">Canvas</div>
</div>
