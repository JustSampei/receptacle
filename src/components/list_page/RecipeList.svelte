<script>
	import { createEventDispatcher } from "svelte";
	import TextIcon from "../mini_components/TextIcon.svelte";

	import ListedRecipe from "./ListedRecipe.svelte";
	import Pagination from "./Pagination.svelte";

	export let recipes = [];

	export let bookmarks;

	let page = 0,
		out_of = Math.ceil(recipes.length / 5);
	$: recipes_showed = recipes.slice(page * 5, (page + 1) * 5);

	const handleVariation = (event) => {
		page += event.detail.variation;
		if (page < 0) page = 0;
		if (page >= out_of - 1) page = out_of - 1;
		recipes_showed = recipes.slice(page * 5, (page + 1) * 5);
	};

	const dispatcher = createEventDispatcher();

	const handleBookmarks = (event) => {
		let recipe_id = event.detail.id;
		if (event.detail.add_remove) {
			dispatcher("addBookmark", {
				id: recipe_id
			});
		} else {
			dispatcher("removeBookmark", {
				id: recipe_id
			});
		}
	};

	const handleOpen = (event) => {
		let recipe_to_open = event.detail.recipe_id;
		dispatcher('openRecipe', {
			recipe: recipe_to_open
		})
	}
</script>

<div class="container block">
	<div class="columns is-centered is-fullwidth">
		<div class="column is-two-thirds-tablet">
			{#each recipes_showed as recipe}		
				<ListedRecipe
					id={recipe.recipe_id}
					title={recipe.title}
					subtitle={recipe.publisher}
					is_added_to_bookmarks={ bookmarks.includes(recipe.recipe_id)}
					image_src={recipe.image_url}
					on:addRemove={handleBookmarks}
					on:open={handleOpen}
				/>
			{/each}
			<!-- Pagination -->
			{#if recipes.length != 0}
				<Pagination page={page} out_of={out_of} on:variation={handleVariation} />
			{:else}
				<div class="box has-text-centered">
					<TextIcon label={"There are no recipes here"} icon={"fa-empty-set"} />
				</div>
			{/if}
		</div>
	</div>
</div>
