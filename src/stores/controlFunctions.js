// @ts-nocheck
// algorithmUtils.js
import { get } from 'svelte/store';
import { 
  algorithmStatus, 
  resumeSignal, 
  consoleLog, 
  currentStep,
  speed } from './store.svelte.js';

/**
 * Adds a log message to the console log store
 * @param {string} message - The message to log
 */
export function log(message) {
  consoleLog.update((logs) => [...logs, message]);
  currentStep.update((n) => n + 1);
}

/**
 * Creates a delay based on the current speed setting
 * @param {number} ms - Base milliseconds to delay
 * @returns {Promise} - Promise that resolves after the delay
 */
export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Waits until the algorithm is resumed
 * @returns {Promise} - Promise that resolves when algorithm status changes to running
 */
export function waitUntilResume() {
  return new Promise((resolve) => {
    const unsub = resumeSignal.subscribe(() => {
      if (get(algorithmStatus) === 'running') {
        unsub();
        resolve();
      }
    });
  });
}

/**
 * Checks if the algorithm needs to pause and waits if necessary
 * @returns {Promise} - Promise that resolves when ready to continue
 */
export async function pauseIfNeeded() {
  if (get(algorithmStatus) === 'paused') {
    await waitUntilResume();
  }
}

/**
 * Base algorithm controller class
 */
export class AlgorithmController {
  /**
   * @param {Object} config - Algorithm configuration
   * @param {string} config.displayName - Display name of the algorithm
   * @param {Function} config.resetFunction - Function to reset algorithm-specific state
   * @param {Function} config.runFunction - Main algorithm execution function
   * @param {Object} config.context - Canvas context and other required state
   */
  constructor({ displayName, resetFunction, runFunction, context }) {
    this.displayName = displayName;
    this.resetFunction = resetFunction;
    this.runFunction = runFunction;
    this.context = context;
  }

  /**
   * Waits until the algorithm is restarted
   * @returns {Promise} - Promise that resolves when algorithm status changes to idle
   */
  waitUntilRestart() {
    return new Promise((resolve) => {
      const unsub = resumeSignal.subscribe(() => {
        if (get(algorithmStatus) === 'idle') {
          // Reset common state
          consoleLog.set([]);
          currentStep.set(0);
          
          // Call algorithm-specific reset function
          this.resetFunction(this.context);
          
          unsub();
          resolve();
        }
      });
    });
  }

  /**
   * Handles restarting the algorithm if it's finished
   * @returns {Promise} - Promise that resolves when ready to restart
   */
  async restartAlgorithm() {
    if (get(algorithmStatus) === 'finished') {
      await this.waitUntilRestart();
    }
  }

  /**
   * Starts the algorithm execution
   */
  async startAlgorithm() {
    consoleLog.update((logs) => [...logs, `${this.displayName} indítása...`]);
    
    try {
      await this.runFunction(this);
    } catch (error) {
      console.error('Algorithm error:', error);
      consoleLog.update((logs) => [...logs, `Hiba történt: ${error.message}`]);
    }
    
    consoleLog.update((logs) => [...logs, 'A futás befejeződött!']);
    algorithmStatus.set('finished');
    await this.restartAlgorithm();
  }
}