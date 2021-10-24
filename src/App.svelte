<script lang="ts">
	import SearchBar from "./components/SearchBar.svelte";
	import RecipeList from "./components/list_page/RecipeList.svelte";
	import Features from "./components/Features.svelte";
	import Recipe from "./components/recipe_page/Recipe.svelte";

	import { bookmarks_store } from "./stores/Bookmarks";
	import { recipes_store } from "./stores/Recipes";

	let bookmarks,
		bookmarks_recipes = [],
		recipes = [],
		recipe_to_open;

	let open_bookmarks = false,
		searching = false,
		open_recipe = false,
		is_back_hidden = true,
		is_bookmarks_hidden = false,
		notification = false;

	bookmarks_store.subscribe(async (value) => {
		bookmarks = value;
		bookmarks_recipes = await getBookmarksRecipes(bookmarks);
	});

	recipes_store.subscribe((value) => {
		recipes = value;
	});

	const addRecipeToBookmarks = (event) => {
		let recipe_id = event.detail.id;
		if (bookmarks.includes(recipe_id)) return;
		bookmarks.push(recipe_id);
		bookmarks_store.set(bookmarks);
	};

	const removeFromBookmarks = (event) => {
		let recipe_id = event.detail.id;
		let index_bookmark = bookmarks.indexOf(recipe_id);
		bookmarks.splice(index_bookmark, 1);
		bookmarks_store.set(bookmarks);
	};

	const openRecipe = async (event) => {
		let recipe_id = event.detail.recipe;
		recipe_to_open = await getRecipe(recipe_id);
		open_recipe = true;
		is_back_hidden = false;
		is_bookmarks_hidden = true;
	};

	const closeRecipe = () => {
		recipe_to_open = null;
		open_recipe = false;
		is_back_hidden = true;
		is_bookmarks_hidden = false;
	};

	const handleOpenCloseBookmarks = (event) => {
		if (open_recipe && !open_bookmarks) closeRecipe();
		open_bookmarks = event.detail.open_close;
	};

	const queryNotPossible = () => {
		notification = true;
		setTimeout(closeNotification, 2000);
	};

	const closeNotification = () => {
		notification = false;
	};

	async function getRecipes(query) {
		try {
			let recipes_response = await fetch(
				`https://forkify-api.herokuapp.com/api/search?q=${query}`
			);
			if (recipes_response.status == 400) {
				queryNotPossible();
				return;
			}
			let recipes_data = await recipes_response.json();
			recipes_store.set(recipes_data.recipes);
		} catch (e) {
			queryNotPossible();
		}
	}

	const handleSearching = async (event) => {
		await getRecipes(event.detail.searched.toLowerCase());
		searching = event.detail.search;
		open_bookmarks = false;
	};

	async function getRecipe(recipe) {
		let recipe_data;
		try {
			let recipe_response = await fetch(
				`https://forkify-api.herokuapp.com/api/get?rId=${recipe}`
			);
			recipe_data = await recipe_response.json();
		} catch (e) {
			console.error(e);
		}
		return recipe_data.recipe;
	}

	async function getBookmarksRecipes(bookmarks) {
		let bookmarks_datas = [];
		for (const recipe of bookmarks) {
			let bookmark_recipe = await getRecipe(recipe);
			bookmarks_datas.push(bookmark_recipe);
		}
		return bookmarks_datas;
	}
</script>

<main>
	<section class="hero is-fullheight">
		<div class="hero-body">
			<div class="container">
				<section class="container has-text-centered is-vcentered block">
					<p
						class="title is-ubuntu has-text-black is-2 has-font-weigth-bold has-letters-spaced"
					>
						Receptacle.
					</p>
				</section>
				<SearchBar on:search={handleSearching} />
				<Features
					{open_bookmarks}
					{is_back_hidden}
					{is_bookmarks_hidden}
					on:closeRecipe={closeRecipe}
					on:openCloseBookmarks={handleOpenCloseBookmarks}
				/>
				{#if open_bookmarks && !open_recipe && bookmarks_recipes}
					<RecipeList
						{bookmarks}
						recipes={bookmarks_recipes}
						on:addBookmark={addRecipeToBookmarks}
						on:removeBookmark={removeFromBookmarks}
						on:openRecipe={openRecipe}
					/>
				{:else if searching && !open_recipe && recipes}
					<RecipeList
						{bookmarks}
						{recipes}
						on:addBookmark={addRecipeToBookmarks}
						on:removeBookmark={removeFromBookmarks}
						on:openRecipe={openRecipe}
					/>
				{:else if open_recipe && recipe_to_open}
					<Recipe
						recipe={recipe_to_open}
						is_added_to_bookmarks={bookmarks.includes(
							recipe_to_open.recipe_id
						)}
						on:addBookmark={addRecipeToBookmarks}
						on:removeBookmark={removeFromBookmarks}
					/>
				{/if}
			</div>
		</div>
	</section>
</main>

{#if notification}
	<div class="notification is-danger">
		<button class="delete" on:click={closeNotification} />
		Query not possible.
	</div>
{/if}

<style>
	.has-letters-spaced {
		letter-spacing: 0.3rem;
	}

	.notification {
		z-index: 1000;
		position: fixed;
		right: 15px;
		top: 15px;
	}
</style>
