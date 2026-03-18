<script lang="ts">
	import * as m from '$lib/paraglide/messages';

	let { data } = $props();

	type GroupKey = 'org' | 'model' | 'voice';

	const groups: { key: GroupKey; label: string }[] = [
		{ key: 'org', label: m.scores_group_org() },
		{ key: 'model', label: m.scores_group_model() },
		{ key: 'voice', label: m.scores_group_voice() }
	];

	function hrefFor(group: GroupKey, language: string | null) {
		const params = new URLSearchParams();
		params.set('group', group);
		if (language) params.set('language', language);
		return `/scores?${params.toString()}`;
	}

	function formatRatio(wins: number, comparisons: number) {
		if (comparisons === 0) return '0%';
		return `${Math.round((wins / comparisons) * 100)}%`;
	}

	const selectedRows = $derived(
		data.group === 'org'
			? data.leaderboards.orgs
			: data.group === 'model'
				? data.leaderboards.models
				: data.leaderboards.voices
	);
</script>

<svelte:head>
	<title>{m.scores_meta_title()}</title>
</svelte:head>

<main class="scores-page">
	<section class="controls">
		<div class="pill-row" aria-label={m.scores_group_label()}>
			{#each groups as group}
				<a
					class:active={group.key === data.group}
					class="pill"
					href={hrefFor(group.key, data.language)}
				>
					{group.label}
				</a>
			{/each}
		</div>

		<div class="pill-row" aria-label={m.scores_language_label()}>
			<a class:active={!data.language} class="pill" href={hrefFor(data.group, null)}>
				{m.scores_language_all()}
			</a>
			{#each data.languages as language}
				<a
					class:active={language === data.language}
					class="pill"
					href={hrefFor(data.group, language)}
				>
					{language}
				</a>
			{/each}
		</div>
	</section>

	<section class="table-card">
		{#if selectedRows.length === 0}
			<div class="empty-state">
				<p class="card-label">{m.scores_empty_label()}</p>
				<h2>{m.scores_empty_heading()}</h2>
				<p>{m.scores_empty_body()}</p>
			</div>
		{:else if data.group === 'org'}
			<table>
				<thead>
					<tr>
						<th>{m.scores_col_rank()}</th>
						<th>{m.scores_col_org()}</th>
						<th>{m.scores_col_language()}</th>
						<th>{m.scores_col_rating()}</th>
						<th>{m.scores_col_record()}</th>
						<th>{m.scores_col_win_rate()}</th>
					</tr>
				</thead>
				<tbody>
					{#each data.leaderboards.orgs as row, index}
						<tr>
							<td>{index + 1}</td>
							<td>{row.orgName}</td>
							<td>{row.language}</td>
							<td>{row.rating}</td>
							<td>{row.numWins}-{row.numLosses}</td>
							<td>{formatRatio(row.numWins, row.numComparisons)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{:else if data.group === 'model'}
			<table>
				<thead>
					<tr>
						<th>{m.scores_col_rank()}</th>
						<th>{m.scores_col_org()}</th>
						<th>{m.scores_col_model()}</th>
						<th>{m.scores_col_language()}</th>
						<th>{m.scores_col_rating()}</th>
						<th>{m.scores_col_record()}</th>
						<th>{m.scores_col_win_rate()}</th>
					</tr>
				</thead>
				<tbody>
					{#each data.leaderboards.models as row, index}
						<tr>
							<td>{index + 1}</td>
							<td>{row.orgName}</td>
							<td>{row.modelName}</td>
							<td>{row.language}</td>
							<td>{row.rating}</td>
							<td>{row.numWins}-{row.numLosses}</td>
							<td>{formatRatio(row.numWins, row.numComparisons)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{:else}
			<table>
				<thead>
					<tr>
						<th>{m.scores_col_rank()}</th>
						<th>{m.scores_col_org()}</th>
						<th>{m.scores_col_model()}</th>
						<th>{m.scores_col_voice()}</th>
						<th>{m.scores_col_language()}</th>
						<th>{m.scores_col_rating()}</th>
						<th>{m.scores_col_record()}</th>
						<th>{m.scores_col_win_rate()}</th>
					</tr>
				</thead>
				<tbody>
					{#each data.leaderboards.voices as row, index}
						<tr>
							<td>{index + 1}</td>
							<td>{row.orgName}</td>
							<td>{row.modelName}</td>
							<td>{row.voiceName}</td>
							<td>{row.language}</td>
							<td>{row.rating}</td>
							<td>{row.numWins}-{row.numLosses}</td>
							<td>{formatRatio(row.numWins, row.numComparisons)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</section>
</main>

<style>
	.scores-page {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.table-card {
		border: 1px solid rgba(30, 27, 22, 0.12);
		border-radius: 28px;
		background: rgba(255, 251, 245, 0.76);
		box-shadow: 0 24px 60px rgba(84, 54, 19, 0.12);
		backdrop-filter: blur(18px);
	}

	.table-card,
	.empty-state {
		padding: clamp(22px, 3vw, 32px);
	}

	.card-label {
		margin: 0 0 12px;
		text-transform: uppercase;
		letter-spacing: 0.14em;
		font-size: 0.8rem;
	}

	h2 {
		margin: 0;
		letter-spacing: -0.04em;
	}

	h2 {
		font-size: clamp(1.8rem, 4vw, 2.6rem);
	}

	.empty-state p {
		font-size: 1rem;
		line-height: 1.6;
		color: rgba(30, 27, 22, 0.82);
	}

	.controls {
		display: grid;
		gap: 14px;
	}

	.pill-row {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}

	.pill {
		padding: 10px 16px;
		border-radius: 999px;
		border: 1px solid rgba(30, 27, 22, 0.12);
		background: rgba(255, 251, 245, 0.76);
		color: inherit;
		text-decoration: none;
		font-weight: 600;
	}

	.pill.active {
		background: linear-gradient(180deg, rgba(193, 107, 39, 0.92), rgba(120, 66, 28, 0.96));
		border-color: rgba(120, 66, 28, 0.8);
		color: #fff9f2;
	}

	.table-card {
		overflow: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		min-width: 720px;
	}

	th,
	td {
		padding: 14px 12px;
		text-align: left;
		border-bottom: 1px solid rgba(30, 27, 22, 0.08);
	}

	th {
		font-size: 0.82rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: rgba(30, 27, 22, 0.62);
	}

	tbody tr:hover {
		background: rgba(250, 238, 217, 0.5);
	}
</style>
