<script lang="ts">
    // @ts-nocheck
    import { createEventDispatcher } from 'svelte';
    import {
        algorithmStatus,
        resumeSignal,
        currentStep,
        totalSteps,
        speed
    } from '../stores/store.svelte.js';
    import { get } from 'svelte/store';
    import { tweened } from 'svelte/motion';
    import { cubicOut } from 'svelte/easing';
    
    const dispatch = createEventDispatcher();
    const progress = tweened(0, {
        duration: 400,
        easing: cubicOut
    });

    // Add a cooldown state variable
    let resumeButtonCooldown = false;
    
    // Update tween when currentStep changes
    $: progress.set($currentStep);
    // Calculate percentage from tweened value
    $: progressPercentage = ($progress / $totalSteps) * 100 + '%';
    
    function handleStart() {
        algorithmStatus.set('running');
        dispatch('start', { speed });
    }
    
    function handlePause() {
        algorithmStatus.set('paused');
        
        // Enable cooldown period for resume button
        resumeButtonCooldown = true;
        setTimeout(() => {
            resumeButtonCooldown = false;
        }, 1000); // 1 second cooldown
    }
    
    function handleResume() {
        if (!resumeButtonCooldown) {
            algorithmStatus.set('running');
            resumeSignal.update((n) => n + 1);
        }
    }
    
    function handleReset() {
        algorithmStatus.set('idle');
        resumeSignal.update((n) => n + 1);
    }
    
    function handleSpeedChange(newSpeed: number) {
        speed.set(Number(newSpeed));
    }
</script>

<div class="controls-bar">
    <!-- Állapotfüggő gombok -->
    {#if $algorithmStatus === 'idle'}
        <button class="play-button" on:click={handleStart}>Start</button>
    {:else if $algorithmStatus === 'running'}
        <button class="play-button" on:click={handlePause}>Szünet</button>
    {:else if $algorithmStatus === 'paused'}
        <button class="play-button" class:disabled={resumeButtonCooldown} on:click={handleResume}>
            Folytatás
        </button>
    {:else if $algorithmStatus === 'finished'}
        <button class="play-button" on:click={handleReset}>Visszaállítás</button>
    {/if}
    
    <!-- Léptetési információ -->
    <div class="step-counter">
        <div class="progress" data-label="{$currentStep}/{$totalSteps}">
            <span class="value" style="--progress-percentage: {progressPercentage}"></span>
        </div>
    </div>
    
    <!-- Sebességcsúszka -->
    <div class="speed-slider">
        <label for="speed-range">Sebesség</label>
        <input
            type="range"
            class="slider"
            id="speed-range"
            min="1"
            max="100"
            bind:value={$speed}
            on:input={(e) => handleSpeedChange(e.target.value)}
        />
    </div>
</div>

<style>
    .controls-bar {
        height: 48px;
        border-bottom: 3px solid #505050;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 20px;
    }
    
    .play-button {
        background-color: #484848;
        border: none;
        cursor: pointer;
        padding: 10px;
        display: flex;
        height: 2em;
        align-items: center;
    }
    
    .play-button.disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .step-counter {
        border-radius: 25%;
    }
    
    .progress {
        height: 1.5em;
        width: 200px;
        background-color: #484848;
        position: relative;
        font-weight: bold;
    }
    
    .progress:before {
        content: attr(data-label);
        font-size: 0.8em;
        position: absolute;
        text-align: center;
        top: 5px;
        left: 0;
        right: 0;
    }
    
    .progress .value {
        background-color: #45a049;
        width: var(--progress-percentage);
        display: inline-block;
        height: 100%;
    }
    
    .speed-slider {
        display: flex;
        align-items: center;
    }
    
    .slider {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: 1.5rem;
        background: #484848;
        outline: none;
        margin-left: 5px;
    }
    
    .slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 10px;
        height: 25px;
        background: #45a049;
        cursor: pointer;
    }
    
    .slider::-moz-range-thumb {
        -webkit-appearance: none;
        appearance: none;
        border-radius: 0;
        border: none;
        background: #45a049;
        width: 10px;
        height: 25px;
        cursor: pointer;
    }
    
    #speed-range {
        width: 100px;
        height: 1.5em;
        cursor: pointer;
    }
</style>