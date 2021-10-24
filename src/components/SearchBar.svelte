<script lang="ts">
import { createEventDispatcher } from "svelte";

	import App from "../App.svelte";


	const dispatcher = createEventDispatcher();

	let searched: string = "";

	const handleSearch = () => {
		if (!searched) return
		dispatcher('search', {
			search: true,
			searched: searched
		})
	}
</script>

<div class="container block">
	<div class="columns">
		<div class="column is-3" />
		<div class="column">
			<div class="control has-icons-right">
				<input
					bind:value={searched}
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
</style>
