<script lang="ts">
	import type { Picture } from '@sveltejs/enhanced-img';

	export type Sponsor = {
		name: string;
		logo: Picture;
	};

	let {
		sponsors,
		eyebrow,
		heading,
		body
	}: { sponsors: Sponsor[]; eyebrow: string; heading: string; body: string } = $props();
</script>

<section class="sponsors" aria-labelledby="sponsors-heading">
	<div class="sponsors-intro">
		<p class="sponsors-eyebrow">{eyebrow}</p>
		<h2 id="sponsors-heading">{heading}</h2>
		<p>{body}</p>
	</div>

	<div class="sponsor-grid">
		{#each sponsors as sponsor (sponsor.name)}
			<article class="sponsor-card">
				<enhanced:img
					src={sponsor.logo}
					alt={sponsor.name}
					sizes="(max-width: 760px) calc(100vw - 112px), 380px"
				/>
			</article>
		{/each}
	</div>
</section>

<style>
	.sponsors {
		display: grid;
		grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
		gap: clamp(28px, 5vw, 64px);
		align-items: center;
		padding: clamp(28px, 5vw, 52px);
		border: 1px solid rgba(30, 27, 22, 0.12);
		border-radius: 28px;
		background:
			radial-gradient(circle at 88% 18%, rgba(14, 78, 116, 0.12), transparent 28%),
			linear-gradient(145deg, rgba(255, 251, 245, 0.86), rgba(238, 226, 207, 0.92));
		box-shadow: 0 24px 60px rgba(84, 54, 19, 0.12);
		backdrop-filter: blur(18px);
	}

	.sponsors-intro {
		display: grid;
		gap: 12px;
	}

	.sponsors-eyebrow {
		margin: 0;
		text-transform: uppercase;
		letter-spacing: 0.14em;
		font-size: 0.8rem;
		color: #0e4e74;
	}

	h2 {
		margin: 0;
		font-size: clamp(2rem, 4vw, 3rem);
		line-height: 0.98;
		letter-spacing: -0.04em;
	}

	.sponsors-intro p:last-child {
		margin: 0;
		max-width: 44ch;
		font-size: 1rem;
		line-height: 1.6;
		color: rgba(30, 27, 22, 0.72);
	}

	.sponsor-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
		gap: 16px;
	}

	.sponsor-card {
		min-height: 180px;
		display: grid;
		place-items: center;
		padding: clamp(24px, 4vw, 38px);
		border: 1px solid rgba(14, 78, 116, 0.14);
		border-radius: 22px;
		background: rgba(255, 255, 255, 0.72);
		box-shadow:
			0 18px 40px rgba(14, 78, 116, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.9);
	}

	.sponsor-card :global(img) {
		display: block;
		width: min(100%, 380px);
		height: auto;
	}

	@media (max-width: 760px) {
		.sponsors {
			grid-template-columns: 1fr;
		}

		.sponsor-card {
			min-height: 150px;
		}
	}
</style>
