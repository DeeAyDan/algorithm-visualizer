<script lang="ts">
    import TreeNode from './TreeNode.svelte';

    export let value: number;
    export let height: number | null = null;
    export let left: any = null;
    export let right: any = null;
    export let color: 'red' | 'black' | null = null; // jövőbeni Red-Black Tree-hez
  
    let hasChildren = left || right;
  </script>
  
  <div class="tree-node" class:has-children={hasChildren}>
    <div class="node-content" style="border-color: {color || 'white'}">
      <span>{value}</span>
      {#if height !== null}
        <small>({height})</small>
      {/if}
    </div>
  
    {#if hasChildren}
      <div class="children">
        <div class="child">
          {#if left}
            <TreeNode {...left} />
          {/if}
        </div>
        <div class="child">
          {#if right}
            <TreeNode {...right} />
          {/if}
        </div>
      </div>
    {/if}
  </div>
  
  <style>
    .tree-node {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin: 1rem;
    }
  
    .node-content {
      background-color: #333;
      border: 2px solid white;
      border-radius: 50%;
      color: white;
      padding: 1rem;
      text-align: center;
      min-width: 40px;
      min-height: 40px;
    }
  
    .node-content small {
      display: block;
      font-size: 0.7em;
      color: #ccc;
    }
  
    .children {
      display: flex;
      justify-content: space-between;
      width: 100%;
      margin-top: 1rem;
    }
  
    .child {
      flex: 1;
      display: flex;
      justify-content: center;
    }
  </style>
  