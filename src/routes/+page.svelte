<script lang="ts">
	let voted = $state(false);
	let playedA = $state(false);
	let playedB = $state(false);

	type Player = 'A' | 'B';

	function voteFor(player: Player): () => void {
		return () => {
			voted = true;
			console.log(`The winner is ${player}`);
		};
	}

	function nextRound() {
		voted = false;
		playedA = false;
		playedB = false;
	}
</script>

<main>
	<div class="text-container">
		<div class="text">Le bouchon</div>
	</div>
	{#if voted}
		<button class="next" onclick={nextRound}>Next round</button>
	{:else}
		<div class="fight">
			<div class="player">
				<audio
					controls
					src=""
					onended={() => {
						playedA = true;
					}}
				></audio>
				<button disabled={!(playedA && playedB)} onclick={voteFor('A')}>Vote for A</button>
			</div>
			<div class="player">
				<audio
					controls
					src=""
					onended={() => {
						playedB = true;
					}}
				></audio>
				<button disabled={!(playedA && playedB)} onclick={voteFor('B')}>Vote for B</button>
			</div>
		</div>
	{/if}
</main>

<style>
	.text-container {
		margin: 16px;
		display: flex;
		gap: 8px;
		justify-content: center;
	}

	.text {
		border: 1px solid black;
		padding: 4px;
		border-radius: 4px;
	}

	.fight {
		display: grid;
		grid-template-columns: 1fr 1fr;
		justify-items: center;
	}

	.player {
		display: grid;
		gap: 8px;
	}

	audio {
		height: 40px;
	}

	.next {
		display: block;
		margin: auto;
	}
</style>
