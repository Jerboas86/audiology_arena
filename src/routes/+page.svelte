<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	let { data = { matchup: null, matchupError: false } } = $props();

	let voted = $state(false);
	let playedA = $state(false);
	let playedB = $state(false);

	function formatRoundTitle(token: string | null | undefined, fallback: string) {
		if (!token) return fallback;
		return token.charAt(0).toLocaleUpperCase() + token.slice(1);
	}

	function handleVote() {
		return async ({ result }: { result: { type: string } }) => {
			if (result.type === 'success') {
				voted = true;
			}
		};
	}

	async function nextRound() {
		voted = false;
		playedA = false;
		playedB = false;
		await invalidateAll();
	}

	const matchup = $derived(data.matchup ?? null);
	const sideA = $derived(matchup?.sideA ?? null);
	const sideB = $derived(matchup?.sideB ?? null);
	const audioUnavailable = $derived(!matchup || data.matchupError);
	const canVote = $derived(Boolean(matchup) && playedA && playedB);
	const roundTitle = $derived(formatRoundTitle(matchup?.token, m.home_round_title()));
</script>

<main class="arena">
	<section class="hero">
		<div class="hero-copy">
			<p class="eyebrow">{m.home_eyebrow()}</p>
			<h1>{m.home_heading()}</h1>
			<p class="intro">{m.home_intro()}</p>
		</div>

		<div class="round-card">
			<div class="round-label">{m.home_round_label()}</div>
			<div class="round-title">{roundTitle}</div>
			<div class="round-meta">
				<span>{m.home_round_meta_players()}</span>
				<span>{m.home_round_meta_winner()}</span>
				<span>{m.home_round_meta_rule()}</span>
			</div>
		</div>
	</section>

	{#if voted}
		<section class="result-card">
			<p class="result-label">{m.home_result_label()}</p>
			<h2>{m.home_result_heading()}</h2>
			<p>{m.home_result_body()}</p>
			<button class="next" onclick={nextRound}>{m.home_next_round()}</button>
		</section>
	{:else}
		{@const matchup = data.matchup}
		<section class="battlefield">
			<form method="POST" action="?/vote" use:enhance={handleVote}>
				<input type="hidden" name="token" value={matchup?.token ?? ''} />
				<input type="hidden" name="listId" value={matchup?.listId ?? ''} />
				<input type="hidden" name="language" value={matchup?.language ?? ''} />
				<input type="hidden" name="orgSlugA" value={sideA?.orgSlug ?? ''} />
				<input type="hidden" name="modelNameA" value={sideA?.modelName ?? ''} />
				<input type="hidden" name="voiceIdA" value={sideA?.voiceId ?? ''} />
				<input type="hidden" name="orgSlugB" value={sideB?.orgSlug ?? ''} />
				<input type="hidden" name="modelNameB" value={sideB?.modelName ?? ''} />
				<input type="hidden" name="voiceIdB" value={sideB?.voiceId ?? ''} />

				<div class="players">
					<div class="player">
						<div class="player-header">
							<p class="player-label">{m.home_player_a()}</p>
							<p
								class:ready={playedA && !audioUnavailable}
								class:unavailable={audioUnavailable}
								class="status"
							>
								{audioUnavailable
									? m.home_status_unavailable()
									: playedA
										? m.home_status_complete()
										: m.home_status_listen()}
							</p>
						</div>
						<audio
							controls
							src={sideA?.audioUrl}
							onended={() => {
								if (!audioUnavailable) playedA = true;
							}}
						></audio>
						<button class="vote" name="winner" value="a" disabled={!canVote}>
							{m.home_vote_a()}
						</button>
					</div>
					<div class="player accent">
						<div class="player-header">
							<p class="player-label">{m.home_player_b()}</p>
							<p
								class:ready={playedB && !audioUnavailable}
								class:unavailable={audioUnavailable}
								class="status"
							>
								{audioUnavailable
									? m.home_status_unavailable()
									: playedB
										? m.home_status_complete()
										: m.home_status_listen()}
							</p>
						</div>
						<audio
							controls
							src={sideB?.audioUrl}
							onended={() => {
								if (!audioUnavailable) playedB = true;
							}}
						></audio>
						<button class="vote" name="winner" value="b" disabled={!canVote}>
							{m.home_vote_b()}
						</button>
					</div>
				</div>
			</form>
		</section>

		<p class="footnote">
			{audioUnavailable ? m.home_footnote_unavailable() : m.home_footnote()}
		</p>
	{/if}
</main>

<style>
	.arena {
		display: flex;
		flex-direction: column;
		gap: 28px;
	}

	.hero {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 24px;
		align-items: stretch;
	}

	.hero-copy,
	.round-card,
	.player,
	.result-card {
		border: 1px solid rgba(30, 27, 22, 0.12);
		border-radius: 28px;
		background: rgba(255, 251, 245, 0.72);
		box-shadow: 0 24px 60px rgba(84, 54, 19, 0.12);
		backdrop-filter: blur(18px);
	}

	.hero-copy {
		padding: clamp(24px, 4vw, 42px);
	}

	.eyebrow,
	.round-label,
	.result-label,
	.player-label,
	.status,
	.footnote {
		margin: 0;
		text-transform: uppercase;
		letter-spacing: 0.14em;
		font-size: 0.8rem;
	}

	h1,
	h2 {
		margin: 0;
		letter-spacing: -0.04em;
	}

	h1 {
		font-size: clamp(2.4rem, 5vw, 4.8rem);
		line-height: 0.95;
		max-width: 12ch;
	}

	h2 {
		font-size: clamp(2rem, 4vw, 3rem);
	}

	.intro,
	.result-card p {
		font-size: 1.05rem;
		line-height: 1.6;
		max-width: 58ch;
		color: rgba(30, 27, 22, 0.82);
	}

	.round-card {
		width: min(100%, 52rem);
		margin: 0 auto;
		padding: 28px;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: 18px;
		background:
			linear-gradient(180deg, rgba(193, 107, 39, 0.9), rgba(120, 66, 28, 0.92)),
			radial-gradient(circle at top, rgba(255, 230, 193, 0.35), transparent 45%);
		color: #fff9f2;
	}

	.round-title {
		font-size: clamp(2.4rem, 4vw, 3.6rem);
		font-weight: 800;
		letter-spacing: -0.05em;
		overflow-wrap: anywhere;
		word-break: break-word;
	}

	.round-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}

	.round-meta span {
		padding: 10px 14px;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.16);
		font-size: 0.9rem;
	}

	.battlefield form {
		display: contents;
	}

	.players {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 20px;
	}

	.player {
		display: grid;
		padding: 24px;
		gap: 18px;
	}

	.accent {
		background:
			linear-gradient(180deg, rgba(255, 251, 245, 0.8), rgba(242, 231, 213, 0.96)),
			rgba(255, 251, 245, 0.72);
	}

	.player-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.player-label {
		font-size: 1.1rem;
		font-weight: 700;
		letter-spacing: 0.08em;
	}

	.status {
		color: rgba(30, 27, 22, 0.58);
	}

	.ready {
		color: #2c7a52;
	}

	.unavailable {
		color: #8f4b22;
	}

	audio {
		width: 100%;
		height: 48px;
	}

	.vote,
	.next {
		border: 0;
		border-radius: 16px;
		padding: 14px 18px;
		font-size: 1rem;
		font-weight: 700;
		color: #fff8ef;
		background: linear-gradient(135deg, #1f1a14, #5f3b1f);
		cursor: pointer;
		transition:
			transform 160ms ease,
			opacity 160ms ease,
			box-shadow 160ms ease;
		box-shadow: 0 16px 30px rgba(43, 27, 13, 0.2);
	}

	.vote:hover:not(:disabled),
	.next:hover {
		transform: translateY(-1px);
	}

	.vote:disabled {
		cursor: not-allowed;
		opacity: 0.45;
		box-shadow: none;
	}

	.result-card {
		padding: clamp(28px, 4vw, 40px);
		text-align: center;
		display: grid;
		justify-items: center;
		gap: 12px;
	}

	.footnote {
		color: rgba(30, 27, 22, 0.6);
		text-align: center;
	}

	@media (max-width: 860px) {
		.hero,
		.players {
			grid-template-columns: 1fr;
		}

		.player-header {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
