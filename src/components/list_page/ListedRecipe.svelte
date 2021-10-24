<script>
	import ButtonIcon from "../mini_components/ButtonIcon.svelte";
	import { fade } from "svelte/transition";
	import { createEventDispatcher } from "svelte";
import Recipe from "../recipe_page/Recipe.svelte";

	export let id,
		title,
		subtitle,
		image_src;
	
	export let is_added_to_bookmarks = false;

	const dispatcher = createEventDispatcher();

	const handleAddRemove = () => {
		is_added_to_bookmarks = !is_added_to_bookmarks;
		dispatcher("addRemove", {
			id: id,
			add_remove: is_added_to_bookmarks
		});
	};

	const handleClick = () => {
		dispatcher('open', {
			recipe_id: id
		})
	}
</script>

<div class="box container has-no-padding block" transition:fade>
	<div
		class="columns is-mobile is-vcentered has-box-sizing-for-image has-no-margin"
	>
		<div class="column is-5 has-no-padding" on:click={handleClick}>
			<figure class="image has-fit-cover">
				<img
					alt={title}
					class="has-border-left-radius-special has-max-height-card-image"
					src={image_src}
				/>
			</figure>
		</div>
		<div class="column is-5 has-no-padding has-text-centered" on:click={handleClick}>
			<p class="subtitle has-text-weight-bold">{title}</p>
			<p class="subtitle is-ubuntu">{subtitle}</p>
		</div>
		<div class="column is-2 has-no-padding has-text-centered">
			<ButtonIcon
				icon={"fa-bookmark"}
				is_icon_full={is_added_to_bookmarks}
				handleClick={() => handleAddRemove()}
			/>
		</div>
	</div>
</div>

<style>
	.has-no-margin {
		margin: 0;
	}

	.has-no-padding {
		padding: 0;
	}

	.has-border-left-radius-special {
		border-top-left-radius: 6px;
		border-bottom-left-radius: 6px;
	}

	.has-box-sizing-for-image {
		box-sizing: content-box !important;
	}

	.has-fit-cover {
		object-fit: cover;
	}

	.has-max-height-card-image {
		max-height: 20vh;
	}
</style>
