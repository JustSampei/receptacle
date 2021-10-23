<script>
import { createEventDispatcher } from "svelte";

	import ButtonIcon from "../mini_components/ButtonIcon.svelte";
	import TextIcon from "../mini_components/TextIcon.svelte";

	export let time = 60, servings = 4;

	const dispatcher = createEventDispatcher();

	const handleServings = (x) => {
		dispatcher('variation', {
			variation: x
		});
	}
</script>

<div class="container block">
	<div class="columns is-multiline is-vcentered is-centered has-no-margin">
		<div class="column has-text-centered">
			<TextIcon icon={"fa-clock"} label={time + (time === 1 ? ' Minute' : ' Minutes')} />
		</div>
		<div class="column is-two-thirds-tablet has-text-centered">
			<div
				class="columns is-mobile is-vcentered is-centered has-no-margin"
			>
				<div class="column has-text-centered">
					<ButtonIcon icon={"fa-minus"} handleClick={() => handleServings(-1)} />
				</div>

				<div class="column is-half has-text-centered">
					<TextIcon icon={"fa-user-friends"} label={servings + (servings === 1 ? ' Serving' : ' Servings')} />
				</div>

				<div class="column has-text-centered">
					<ButtonIcon icon={"fa-plus"} handleClick={() => handleServings(+1)} />
				</div>
			</div>
		</div>
	</div>
</div>

<style>
</style>
