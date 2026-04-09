<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import flagIcon from '$lib/assets/flag.svg';

	let { data = { matchup: null, matchupError: false } } = $props();

	const MAX_AUDIO_RETRIES = 3;
	const AUDIO_RETRY_DELAY_MS = 1000;

	let voted = $state(false);
	let playedA = $state(false);
	let playedB = $state(false);
	let retriesA = $state(0);
	let retriesB = $state(0);
	let flagSide: 'a' | 'b' | null = $state(null);
	let flagDialogEl: HTMLDialogElement | undefined = $state();

	function retryAudioLoad(
		audio: HTMLAudioElement,
		retries: number,
		setRetries: (n: number) => void
	) {
		if (retries >= MAX_AUDIO_RETRIES) return;
		const next = retries + 1;
		setRetries(next);
		setTimeout(() => {
			audio.load();
		}, AUDIO_RETRY_DELAY_MS * next);
	}

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

	function openFlagDialog(side: 'a' | 'b') {
		flagSide = side;
		flagDialogEl?.showModal();
	}

	function closeFlagDialog() {
		flagDialogEl?.close();
		flagSide = null;
	}

	function handleReportDefect() {
		return async ({ result }: { result: { type: string } }) => {
			if (result.type === 'success') {
				closeFlagDialog();
			}
		};
	}

	async function nextRound() {
		voted = false;
		playedA = false;
		playedB = false;
		retriesA = 0;
		retriesB = 0;
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
			<div class="hero-left">
				<p class="eyebrow">{m.home_eyebrow()}</p>
				<h1>{m.home_heading()}</h1>
			</div>
			<div class="hero-right">
				<p class="intro">{m.home_goal_1()} {m.home_goal_2()}</p>
				<p class="intro">{m.home_intro()}</p>
			</div>
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
							<button
								class="flag-btn"
								type="button"
								title={m.home_flag_label()}
								aria-label={m.home_flag_label()}
								onclick={() => openFlagDialog('a')}
							>
								<img src={flagIcon} alt="" width="18" height="18" />
							</button>
						</div>
						<audio
							controls
							src={sideA?.audioUrl}
							onended={() => {
								if (!audioUnavailable) playedA = true;
							}}
							onerror={(e) => {
								retryAudioLoad(
									e.currentTarget as HTMLAudioElement,
									retriesA,
									(n) => (retriesA = n)
								);
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
							<button
								class="flag-btn"
								type="button"
								title={m.home_flag_label()}
								aria-label={m.home_flag_label()}
								onclick={() => openFlagDialog('b')}
							>
								<img src={flagIcon} alt="" width="18" height="18" />
							</button>
						</div>
						<audio
							controls
							src={sideB?.audioUrl}
							onended={() => {
								if (!audioUnavailable) playedB = true;
							}}
							onerror={(e) => {
								retryAudioLoad(
									e.currentTarget as HTMLAudioElement,
									retriesB,
									(n) => (retriesB = n)
								);
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

		<dialog bind:this={flagDialogEl} class="flag-dialog">
			<h3>{m.home_flag_dialog_title()}</h3>
			<p>{m.home_flag_dialog_body()}</p>
			<div class="flag-dialog-actions">
				<button type="button" class="flag-dialog-cancel" onclick={closeFlagDialog}>
					{m.home_flag_dialog_cancel()}
				</button>
				{#if flagSide}
					{@const side = flagSide === 'a' ? sideA : sideB}
					<form method="POST" action="?/reportDefect" use:enhance={handleReportDefect}>
						<input type="hidden" name="token" value={matchup?.token ?? ''} />
						<input type="hidden" name="listId" value={matchup?.listId ?? ''} />
						<input type="hidden" name="language" value={matchup?.language ?? ''} />
						<input type="hidden" name="orgSlug" value={side?.orgSlug ?? ''} />
						<input type="hidden" name="modelName" value={side?.modelName ?? ''} />
						<input type="hidden" name="voiceId" value={side?.voiceId ?? ''} />
						<button type="submit" class="flag-dialog-confirm">
							{m.home_flag_dialog_confirm()}
						</button>
					</form>
				{/if}
			</div>
		</dialog>
	{/if}

	<section class="support-card">
		<div class="support-glow" aria-hidden="true"></div>
		<div class="support-copy">
			<p class="support-eyebrow">{m.home_support_eyebrow()}</p>
			<h2>{m.home_support_heading()}</h2>
			<p>{m.home_support_body()}</p>
		</div>
		<a class="support-link" href="https://fr.tipeee.com/audarena/">
			{m.home_support_cta()}
		</a>
	</section>
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
	.result-card,
	.support-card {
		border: 1px solid rgba(30, 27, 22, 0.12);
		border-radius: 28px;
		background: rgba(255, 251, 245, 0.72);
		box-shadow: 0 24px 60px rgba(84, 54, 19, 0.12);
		backdrop-filter: blur(18px);
	}

	.hero-copy {
		padding: clamp(24px, 4vw, 42px);
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 32px;
		align-items: start;
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

	.flag-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 6px;
		border: 1px solid rgba(30, 27, 22, 0.12);
		border-radius: 8px;
		background: transparent;
		cursor: pointer;
		opacity: 0.5;
		transition:
			opacity 160ms ease,
			background 160ms ease;
	}

	.flag-btn:hover {
		opacity: 1;
		background: rgba(30, 27, 22, 0.06);
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

	.support-card {
		position: relative;
		overflow: hidden;
		padding: clamp(24px, 4vw, 36px);
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 24px;
		background:
			radial-gradient(circle at top right, rgba(124, 241, 220, 0.28), transparent 32%),
			linear-gradient(135deg, rgba(12, 63, 67, 0.98), rgba(24, 109, 107, 0.94));
		border-color: rgba(183, 255, 242, 0.24);
		box-shadow:
			0 26px 70px rgba(9, 51, 56, 0.26),
			inset 0 1px 0 rgba(227, 255, 250, 0.16);
		color: #eefcf9;
	}

	.support-glow {
		position: absolute;
		inset: auto -6rem -8rem auto;
		width: 16rem;
		height: 16rem;
		border-radius: 999px;
		background: radial-gradient(circle, rgba(185, 255, 239, 0.3), transparent 68%);
		pointer-events: none;
	}

	.support-copy {
		position: relative;
		z-index: 1;
		display: grid;
		gap: 12px;
	}

	.support-eyebrow {
		margin: 0;
		text-transform: uppercase;
		letter-spacing: 0.14em;
		font-size: 0.8rem;
		color: rgba(212, 255, 246, 0.74);
	}

	.support-copy h2 {
		max-width: 14ch;
		line-height: 0.95;
	}

	.support-copy p:last-child {
		margin: 0;
		font-size: 1rem;
		line-height: 1.6;
		color: rgba(234, 255, 250, 0.86);
		max-width: 52ch;
	}

	.support-link {
		position: relative;
		z-index: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 16px 22px;
		border-radius: 999px;
		border: 1px solid rgba(220, 255, 248, 0.36);
		background: linear-gradient(135deg, #ecfffb, #9de9d8);
		color: #0f4747;
		font-weight: 700;
		text-decoration: none;
		white-space: nowrap;
		box-shadow: 0 18px 34px rgba(5, 39, 41, 0.28);
		transition:
			transform 160ms ease,
			box-shadow 160ms ease,
			background 160ms ease;
	}

	.support-link:hover {
		transform: translateY(-2px);
		background: linear-gradient(135deg, #f6fffd, #b5f2e4);
		box-shadow: 0 22px 40px rgba(5, 39, 41, 0.32);
	}

	.flag-dialog {
		border: 1px solid rgba(30, 27, 22, 0.12);
		border-radius: 20px;
		padding: clamp(24px, 3vw, 32px);
		max-width: 420px;
		width: 90vw;
		background: #fffbf5;
		box-shadow: 0 24px 60px rgba(84, 54, 19, 0.18);
	}

	.flag-dialog::backdrop {
		background: rgba(30, 27, 22, 0.4);
		backdrop-filter: blur(4px);
	}

	.flag-dialog h3 {
		margin: 0 0 8px;
		font-size: 1.25rem;
		letter-spacing: -0.02em;
	}

	.flag-dialog p {
		margin: 0 0 20px;
		font-size: 0.95rem;
		line-height: 1.5;
		color: rgba(30, 27, 22, 0.72);
	}

	.flag-dialog-actions {
		display: flex;
		justify-content: flex-end;
		gap: 10px;
	}

	.flag-dialog-actions form {
		display: contents;
	}

	.flag-dialog-cancel,
	.flag-dialog-confirm {
		border: 0;
		border-radius: 12px;
		padding: 10px 18px;
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		transition:
			transform 160ms ease,
			opacity 160ms ease;
	}

	.flag-dialog-cancel {
		background: rgba(30, 27, 22, 0.08);
		color: rgba(30, 27, 22, 0.72);
	}

	.flag-dialog-cancel:hover {
		background: rgba(30, 27, 22, 0.14);
	}

	.flag-dialog-confirm {
		background: linear-gradient(135deg, #8f4b22, #c16b27);
		color: #fff8ef;
		box-shadow: 0 8px 20px rgba(143, 75, 34, 0.2);
	}

	.flag-dialog-confirm:hover {
		transform: translateY(-1px);
	}

	.footnote {
		color: rgba(30, 27, 22, 0.6);
		text-align: center;
	}

	@media (max-width: 860px) {
		.hero,
		.players,
		.hero-copy {
			grid-template-columns: 1fr;
		}

		.support-card {
			flex-direction: column;
			align-items: flex-start;
		}

		.support-copy h2 {
			max-width: none;
		}

		.player-header {
			flex-direction: column;
			align-items: flex-start;
		}

	}
</style>
