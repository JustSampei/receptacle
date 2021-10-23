<script>
import { createEventDispatcher } from "svelte";

	import ButtonIcon from "../mini_components/ButtonIcon.svelte";

	export let title, is_added_to_bookmarks;

	const dispatcher = createEventDispatcher();

	const handleAddRemove = () => {
		is_added_to_bookmarks = !is_added_to_bookmarks;
		dispatcher("addRemove", {
			add_remove: is_added_to_bookmarks,
		});
	}
	
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
				label={"Add to Bookmarks"}
				handleClick={() => handleAddRemove()}
			/>
		</div>
	</div>
</div>

<style>
</style>
