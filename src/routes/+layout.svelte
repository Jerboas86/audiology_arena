<script lang="ts">
	import { goto } from '$app/navigation';
	import * as m from '$lib/paraglide/messages';
	import { page } from '$app/state';
	import { getLocale, setLocale } from '$lib/paraglide/runtime';
	import {
		audioLanguageFlag,
		audioLanguageLabel,
		contentLocaleForAudioLanguage
	} from '$lib/language';

	let { data, children } = $props();

	const displayLocale = $derived(getLocale());

	function hrefFor(pathname: string, language = data.selectedLanguage) {
		const params = new URLSearchParams();
		if (language) params.set('language', language);
		const query = params.toString();

		return `${pathname}${query ? `?${query}` : ''}`;
	}

	function hrefForCurrentPage(language: string) {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('language', language);
		const query = params.toString();

		return `${page.url.pathname}${query ? `?${query}` : ''}`;
	}

	async function handleLanguageChange(event: Event) {
		const language = (event.currentTarget as HTMLSelectElement).value;
		if (!language) return;

		setLocale(contentLocaleForAudioLanguage(language), { reload: false });
		await goto(hrefForCurrentPage(language), { invalidateAll: true });
	}
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
			<a class:active={page.url.pathname === '/'} href={hrefFor('/')}>{m.nav_arena()}</a>
			<a class:active={page.url.pathname === '/scores'} href={hrefFor('/scores')}
				>{m.nav_scores()}</a
			>
			{#if data.availableLanguages.length > 0}
				<label class="language-control">
					<span class="sr-only">{m.nav_language_label()}</span>
					<select
						aria-label={m.nav_language_label()}
						value={data.selectedLanguage ?? ''}
						onchange={handleLanguageChange}
					>
						{#each data.availableLanguages as language}
							<option
								value={language}
								aria-label={audioLanguageLabel(language, displayLocale)}
								title={audioLanguageLabel(language, displayLocale)}
							>
								{audioLanguageFlag(language)}
							</option>
						{/each}
					</select>
				</label>
			{/if}
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
		align-items: center;
		gap: 10px;
	}

	.nav a,
	.language-control select {
		padding: 10px 16px;
		border-radius: 999px;
		border: 1px solid rgba(30, 27, 22, 0.12);
		background: rgba(255, 251, 245, 0.72);
		color: inherit;
		font-weight: 600;
	}

	.nav a {
		text-decoration: none;
	}

	.nav a.active {
		background: linear-gradient(180deg, rgba(193, 107, 39, 0.92), rgba(120, 66, 28, 0.96));
		border-color: rgba(120, 66, 28, 0.8);
		color: #fff9f2;
	}

	.language-control select {
		appearance: none;
		min-width: 4.5rem;
		padding-right: 34px;
		background:
			linear-gradient(45deg, transparent 50%, rgba(30, 27, 22, 0.72) 50%) right 18px top 50% / 6px
				6px no-repeat,
			linear-gradient(135deg, rgba(30, 27, 22, 0.72) 50%, transparent 50%) right 12px top 50% / 6px
				6px no-repeat,
			rgba(255, 251, 245, 0.72);
		cursor: pointer;
		font: inherit;
		text-align: center;
	}

	@supports (appearance: base-select) {
		.language-control select,
		.language-control select::picker(select) {
			appearance: base-select;
		}

		.language-control select {
			padding-right: 16px;
			background: rgba(255, 251, 245, 0.72);
		}

		.language-control select::picker(select) {
			margin-block-start: 2px;
			padding: 6px;
			border: 1px solid rgba(30, 27, 22, 0.12);
			border-radius: 14px;
			background: rgba(255, 251, 245, 0.96);
			box-shadow: 0 18px 44px rgba(84, 54, 19, 0.18);
		}

		.language-control select::picker-icon {
			display: none;
		}

		.language-control option {
			display: grid;
			min-width: 3.25rem;
			padding: 8px 12px;
			border-radius: 10px;
			text-align: center;
			cursor: pointer;
		}

		.language-control option:hover,
		.language-control option:focus {
			background: rgba(193, 107, 39, 0.12);
		}

		.language-control option:checked {
			background: linear-gradient(180deg, rgba(193, 107, 39, 0.92), rgba(120, 66, 28, 0.96));
			color: #fff9f2;
		}

		.language-control option::checkmark {
			display: none;
		}
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
