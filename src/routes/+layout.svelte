<script lang="ts">
	let { children } = $props();
</script>

<nav>Audiology Arena</nav>
{@render children()}

<style>
	* {
		font-family: sans-serif;
	}

	nav {
		text-align: center;
		font-size: 32px;
		font-weight: 700;
	}
</style>
