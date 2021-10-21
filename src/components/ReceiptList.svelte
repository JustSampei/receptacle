<script>
	import CardReceipt from "./CardReceipt.svelte";
	import Pagination from "./Pagination.svelte";
</script>

<div class="container block">
	<div class="column">
		<div class="columns is-centered is-fullwidth mb-6">
			<div class="column" />
			<div class="column is-10">
				<CardReceipt />
				<CardReceipt />
				<CardReceipt />
				<CardReceipt />
				<!-- Pagination -->
				<Pagination />
			</div>
			<div class="column" />
		</div>
	</div>
</div>
