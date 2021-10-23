<script>
	import TextIcon from "../mini_components/TextIcon.svelte";

	export let ingredient, amount, servings = 4;

	if (amount != 4 && amount >= 0) amount = (amount * servings) / 4;
</script>

<div class="column is-half has-text-centered">
	<TextIcon icon={"fa-check"} label={amount + ingredient}></TextIcon>
</div>

<style>
</style>