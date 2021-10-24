<script>
	import Ingredient from "./Ingredient.svelte";

	export let amounts, ingredients;

</script>

<div class="container block has-text-centered">
	<p class="subtitle is-ubuntu has-text-weight-bold is-4">
		Recipe ingredients
	</p>
</div>
<div class="container block">
	<div class="columns is-multiline is-vcentered has-no-margin">
		{#each ingredients as ingredient, i}
			<Ingredient ingredient={ingredient} amount={amounts[i]} />
		{/each}
	</div>
</div>


<style>
	.has-no-margin {
		margin: 0;
	}
</style>