<script>
	import IngridientList from "./IngredientList.svelte";
	import ButtonIcon from "../mini_components/ButtonIcon.svelte";
	import TimingAndServings from "./TimingAndServings.svelte";
	import TitleAndAddBookmark from "./TitleAndAddBookmark.svelte";
	import { createEventDispatcher } from "svelte";

	export let is_added_to_bookmarks;

	export let receipt;

	let amounts, ingredients;

	let servings = 4; //Non presente nelle API, default 4

	const handleServings = (event) => {
		servings += event.detail.variation;
		if (servings < 1) servings = 1;
	};

	const dispatcher = createEventDispatcher();

	const handleBookmarks = (event) => {
		if (event.detail.add_remove) {
			console.log("adding bookmark");
			dispatcher("addBookmark", {
				id: receipt.id,
				is_added_to_bookmarks: event.detail.add_remove
			});
		} else {
			console.log("removing bookmark");
			dispatcher("removeBookmark", {
				id: receipt.id,
				is_added_to_bookmarks: event.detail.add_remove
			});
		}
	};
</script>

<div class="container block">
	<div class="columns is-centered is-vcentered">
		<div class="column is-two-thirds-tablet">
			<div class="column is-centered is-vcentered box has-no-padding">
				<figure class="image is-3by2 block">
					<img
						alt="immagine ricetta"
						class="image-receipt"
						src={receipt.image_receipt}
					/>
				</figure>
				<TitleAndAddBookmark
					title={receipt.title}
					is_added_to_bookmarks={is_added_to_bookmarks}
					on:addRemove={handleBookmarks}
				/>
				<TimingAndServings
					time={60}
					servings={servings}
					on:variation={handleServings}
				/>
				<nav class="level line" />
				<IngridientList {ingredients} {amounts} />
				<nav class="level line" />
				<div class="container has-text-centered pb-5">
					<ButtonIcon
						icon={"fa-hat-chef"}
						label={"How to cook"}
						icon_right={true}
					/>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.image-receipt {
		border-top-left-radius: 6px;
		border-top-right-radius: 6px;
	}

	.has-no-padding {
		padding: 0;
	}

	.line {
		border: 1px solid #363636;
		margin-right: 3rem;
		margin-left: 3rem;
	}

	.has-no-margin {
		margin: 0;
	}
</style>
