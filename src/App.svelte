<script lang="ts">
	import SearchBar from "./components/SearchBar.svelte";
	import ReceiptList from "./components/list_page/ReceiptList.svelte";
	import Features from "./components/Features.svelte";
	import Receipt from "./components/receipt_page/Receipt.svelte";

	export let name: string;

	let receipt = {
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
	};

	import {bookmarks_store} from "./stores/Bookmarks";

	let bookmarks;

	bookmarks_store.subscribe(value => {
		bookmarks = value;
	})

	let is_added_to_bookmarks = bookmarks.includes(receipt.id);

	const addReceiptToBookmarks = (event) => {
		let receipt_id = event.detail.id;
		
		bookmarks_store.update(bookmarks = bookmarks.push(receipt_id));
	};

	const removeFromBookmarks = (event) => {
		let receipt_id = event.detail.id;
		let index_bookmark = bookmarks.indexOf(receipt_id);
		bookmarks.splice(index_bookmark, 1);
		is_added_to_bookmarks = event.detail.is_added_to_bookmarks;
	};
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
				<SearchBar />
				<Features />
				<ReceiptList bookmarks={bookmarks} />
				<Receipt
					receipt={receipt}
					is_added_to_bookmarks={is_added_to_bookmarks}
					on:addBookmark={addReceiptToBookmarks}
					on:removeBookmark={removeFromBookmarks}
				/>
			</div>
		</div>
	</section>
</main>

<style>
	.has-letters-spaced {
		letter-spacing: 0.3rem;
	}
</style>
