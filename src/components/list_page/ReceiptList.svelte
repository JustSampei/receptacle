<script>
	import { createEventDispatcher } from "svelte";

	import ListedReceipt from "./ListedReceipt.svelte";
	import Pagination from "./Pagination.svelte";

	export let recipes = [
		{
			id: 1,
			title: "Pizza",
			ingredients: [
				"1 Cup Ingrediente",
				"2 Cups Ingrediente",
				"3 Cups Ingrediente",
				"4 Cups Ingrediente",
				"5 Cups Ingrediente",
			],
			image_receipt: "https://bulma.io/images/placeholders/256x256.png",
		},
		{
			id: 2,
			title: "Pizza",
			ingredients: [
				"1 Cup Ingrediente",
				"2 Cups Ingrediente",
				"3 Cups Ingrediente",
				"4 Cups Ingrediente",
				"5 Cups Ingrediente",
			],
			image_receipt: "https://bulma.io/images/placeholders/256x256.png",
		},
	];

	export let bookmarks;

	let page = 0,
		out_of = Math.ceil(recipes.length / 5);
	let recipes_showed = recipes.slice(page * 5, (page + 1) * 5);

	const handleVariation = (event) => {
		page += event.detail.variation;
		if (page < 0) page = 0;
		if (page >= out_of - 1) page = out_of - 1;
		recipes_showed = recipes.slice(page * 5, (page + 1) * 5);
	};

	const dispatcher = createEventDispatcher();

	const handleBookmarks = (event) => {
		let receipt_id = event.id;
		if (event.detail.add_remove) {
			console.log("adding bookmark");
			dispatcher("addBookmark", {
				id: receipt_id,
				is_added_to_bookmarks: event.detail.add_remove,
			});
		} else {
			console.log("removing bookmark");
			dispatcher("removeBookmark", {
				id: receipt_id,
				is_added_to_bookmarks: event.detail.add_remove,
			});
		}
	};
</script>

<div class="container block">
	<div class="columns is-centered is-fullwidth">
		<div class="column is-two-thirds-tablet">
			{#each recipes_showed as receipt}
				<ListedReceipt
					id={receipt.id}
					title={receipt.title}
					subtitle={"second"}
					image_src={"https://bulma.io/images/placeholders/256x256.png"}
					bookmarks={bookmarks}
					on:addRemove={handleBookmarks}
				/>
			{/each}
			<!-- Pagination -->
			<Pagination {page} {out_of} on:variation={handleVariation} />
		</div>
	</div>
</div>
