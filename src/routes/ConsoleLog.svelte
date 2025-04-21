<script>
	import { consoleLog } from '../stores/store.svelte';
</script>

<div class="console-log-container">
	<div class="tag">Console Log</div>
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
		border-bottom: 3px solid #505050;
		flex: 1;
	}
	.tag {
		display: inline-block;
		top: 0;
		left: 0;
		background-color: #484848;
		color: white;
		padding: 3px;
	}
	.console {
		height: 90%;
		overflow: auto;
		position: relative;
	}
	.console-list {
		position: absolute;
		left: 20px;
	}
</style>
