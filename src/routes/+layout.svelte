<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { page } from '$app/state';

	let { children } = $props();
</script>

<svelte:head>
	<title>Audiology Arena</title>
	<meta name="description" content={m.home_meta_description()} />
</svelte:head>

<div class="shell">
	<header class="topbar">
		<div>
			<div class="brand">Audiology Arena</div>
			<div class="tagline">{m.home_tagline()}</div>
		</div>
		<nav class="nav" aria-label={m.nav_label()}>
			<a class:active={page.url.pathname === '/'} href="/">{m.nav_arena()}</a>
			<a class:active={page.url.pathname === '/scores'} href="/scores">{m.nav_scores()}</a>
		</nav>
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
		align-items: center;
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

	.nav {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}

	.nav a {
		padding: 10px 16px;
		border-radius: 999px;
		border: 1px solid rgba(30, 27, 22, 0.12);
		background: rgba(255, 251, 245, 0.72);
		color: inherit;
		text-decoration: none;
		font-weight: 600;
	}

	.nav a.active {
		background: linear-gradient(180deg, rgba(193, 107, 39, 0.92), rgba(120, 66, 28, 0.96));
		border-color: rgba(120, 66, 28, 0.8);
		color: #fff9f2;
	}
</style>
