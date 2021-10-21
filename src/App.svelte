<script lang="ts">
	import SearchBar from "./components/SearchBar.svelte";
	import ReceiptList from "./components/ReceiptList.svelte";
	import Features from "./components/Features.svelte";
import Receipt from "./components/Receipt.svelte";

	export let name: string;
</script>

<main>
	<section class="hero is-fullheight">
		<div class="hero-body">
			<div class="container">
				<section class="container has-text-centered is-vcentered block">
					<p
						class="title is-ubuntu has-text-black-ter is-2 has-font-weigth-bold has-letters-spaced"
					>
						Receptacle.
					</p>
				</section>
				<SearchBar />
				<Features />
				<ReceiptList />
				<Receipt></Receipt>
			</div>
		</div>
	</section>
</main>

<style>
	.is-ubuntu {
		font-family: is-ubuntu;
	}

	.has-letters-spaced {
		letter-spacing: 0.3rem;
	}
</style>
