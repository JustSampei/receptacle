<script>
	import App from "../App.svelte";

	function handleSearch() {}
</script>

<div class="container block">
	<div class="columns">
		<div class="column is-3" />
		<div class="column">
			<div class="control has-icons-right">
				<input
					class="input is-rounded is-ubuntu"
					type="text"
					placeholder="Search for recipes..."
				/>
				<span class="icon is-right" on:click={handleSearch}>
					<i class="fas fa-search has-text-black-ter" />
				</span>
			</div>
		</div>
		<div class="column is-3" />
	</div>
</div>

<style>
	input:focus {
		outline: none;
	}

	i {
		pointer-events: initial;
	}

	.is-ubuntu {
		font-family: is-ubuntu;
	}
</style>
