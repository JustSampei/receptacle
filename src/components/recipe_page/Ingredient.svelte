<script>
	import TextIcon from "../mini_components/TextIcon.svelte";

	export let ingredient, amount;
</script>

<div class="column is-half has-text-centered">
	{#if ingredient != ""}
		<TextIcon icon={"fa-check"} label={amount + "  " + ingredient}></TextIcon>
	{/if}
</div>

<style>
</style>