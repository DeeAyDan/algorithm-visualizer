<script>
// @ts-nocheck

	import { consoleLog } from '../stores/store.svelte';

</script>

<div class="console-log-container">
	<div class="tag">Lépések</div>
	<div class="console">
		<ol class="console-list">
			{#each $consoleLog as line}
				<li>{line}</li>
			{/each}
		</ol>
	</div>
</div>

<style>
	.console-log-container {
		flex: 1;
		border-bottom: 3px solid #505050;
		border-left: 3px solid #505050;
		border-top: 3px solid #505050;

	}
	.tag {
		display: inline-block;
		top: 0;
		left: 0;
		background-color: #484848;
		color: aliceblue;
		padding: 3px;
	}
	.console {
		height: calc(100% - 1.5rem);
		min-height: 400px;
		position: relative;
		overflow: auto;
	}
	.console-list {
		position: absolute;
		top: 0;
		margin: 1rem;
		color: aliceblue;
	}
</style>
