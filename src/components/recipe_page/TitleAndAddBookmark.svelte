<script>
import { createEventDispatcher } from "svelte";

	import ButtonIcon from "../mini_components/ButtonIcon.svelte";

	export let title, id;

	export let is_added_to_bookmarks = false;

	const dispatcher = createEventDispatcher();

	const handleAddRemove = () => {
		is_added_to_bookmarks = !is_added_to_bookmarks;
		dispatcher("addRemove", {
			id: id,
			add_remove: is_added_to_bookmarks
		});
	};
	
</script>

<div class="container block">
	<div class="columns is-multiline is-vcentered is-centered">
		<div class="column is-half has-text-centered">
			<p class="title is-ubuntu">{title}</p>
		</div>
		<div class="column is-half has-text-centered">
			<ButtonIcon
				icon={"fa-bookmark"}
				is_icon_full={is_added_to_bookmarks}
				label={is_added_to_bookmarks ? "Added to Bookmarks" : "Add to Bookmarks"}
				handleClick={() => handleAddRemove()}
			/>
		</div>
	</div>
</div>

<style>
</style>
