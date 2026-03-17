<script lang="ts">
	import * as m from '$lib/paraglide/messages';

	let { children } = $props();
</script>

<svelte:head>
	<title>Audiology Arena</title>
	<meta name="description" content={m.home_meta_description()} />
</svelte:head>

<div class="shell">
	<header class="topbar">
		<div class="brand">Audiology Arena</div>
		<div class="tagline">{m.home_tagline()}</div>
	</header>

	{@render children()}
</div>

<style>
	:global(body) {
		margin: 0;
		min-height: 100vh;
		background:
			radial-gradient(circle at top, rgba(227, 167, 87, 0.28), transparent 30%),
			linear-gradient(180deg, #f7f2e8 0%, #efe4d0 42%, #e7d6bc 100%);
		color: #1e1b16;
		font-family: 'Avenir Next', 'Segoe UI', sans-serif;
	}

	:global(*) {
		box-sizing: border-box;
	}

	.shell {
		width: min(1120px, calc(100% - 32px));
		margin: 0 auto;
		padding: 24px 0 48px;
	}

	.topbar {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 12px;
		padding: 0 4px 24px;
	}

	.brand {
		font-size: clamp(2rem, 4vw, 3.5rem);
		font-weight: 800;
		letter-spacing: -0.04em;
	}

	.tagline {
		font-size: 0.95rem;
		text-transform: uppercase;
		letter-spacing: 0.18em;
		color: rgba(30, 27, 22, 0.72);
	}
</style>
