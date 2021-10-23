<script>
	import Ingredient from "./Ingredient.svelte";

	export let amounts = ["1", "2", "3","4","5"];
	export let ingredients = ["Ingrediente", "Ingrediente", "Ingrediente", "Ingrediente", "Ingrediente"];
</script>

<div class="container block has-text-centered">
	<p class="subtitle is-ubuntu has-text-weight-bold is-4">
		Recipe Ingridients
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

</style>