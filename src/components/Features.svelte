<script>
	import { createEventDispatcher } from "svelte";
	import ButtonIcon from "./mini_components/ButtonIcon.svelte";

	export let open_bookmarks, is_back_hidden = true, is_bookmarks_hidden = false;

	const dispatcher = createEventDispatcher();

	const handleOpenBookmarks = () => {
		open_bookmarks = !open_bookmarks;
		dispatcher('openCloseBookmarks', {
			open_close: open_bookmarks
		})
	}

	const handleOpenRecipe = () => {
		dispatcher('closeRecipe');
	}

</script>

<div class="container block">
	<div class="columns is-mobile is-centered is-vcentered">
		<!--<div class="column is-5 has-text-centered">
			<ButtonIcon icon={"fas fa-recipe"} label={"Add recipe"} icon_right={true}></ButtonIcon>
		</div>-->
		<div class="column has-text-centered {is_back_hidden ? "is-hidden" : ""}">
			<ButtonIcon icon={"fa-arrow-left"} label={"Go Back"} handleClick={handleOpenRecipe} />
		</div>
		<div class="column has-text-centered {is_bookmarks_hidden ? "is-hidden" : ""}">
			<ButtonIcon icon={"fa-bookmark"} is_icon_full={open_bookmarks} label={"Bookmarks"} icon_right={true} handleClick={handleOpenBookmarks} />
		</div>
	</div>
</div>

<style>
</style>
