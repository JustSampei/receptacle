<script>
import { createEventDispatcher } from "svelte";

	import ButtonIcon from "../mini_components/ButtonIcon.svelte";

	export let page, out_of;

	const dispatcher = createEventDispatcher();

	const handleVariation = (x) => {
		dispatcher("variation", {
			variation: x
		});
	};
</script>

<div class="container">
	<div class="columns is-vcentered is-mobile">
		<div class="column has-text-left">
			<ButtonIcon
				icon={"fa-chevron-left"}
				label={"Previous"}
				handleClick={() => handleVariation(-1)}
			/>
		</div>
		<div class="column has-text-centered">
			<p class="subtitle is-ubuntu">{page + 1} / {out_of}</p>
		</div>
		<div class="column has-text-right">
			<ButtonIcon
				icon={"fa-chevron-right"}
				label={"Next"}
				icon_right={true}
				handleClick={() => handleVariation(1)}
			/>
		</div>
	</div>
</div>
