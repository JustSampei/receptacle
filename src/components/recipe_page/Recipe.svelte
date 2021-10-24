<script lang="ts">
	import IngridientList from "./IngredientList.svelte";
	import ButtonIcon from "../mini_components/ButtonIcon.svelte";
	import TimingAndServings from "./TimingAndServings.svelte";
	import TitleAndAddBookmark from "./TitleAndAddBookmark.svelte";
	import { createEventDispatcher } from "svelte";

	export let is_added_to_bookmarks;

	export let recipe;

	let servings = 4; //Non presente nelle API, default 4

	const handleServings = (event) => {
		servings += event.detail.variation;
		if (servings < 1) servings = 1;
	};

	const dispatcher = createEventDispatcher();

	const handleBookmarks = (event) => {
		let recipe_id = event.detail.id;
		if (event.detail.add_remove) {
			dispatcher("addBookmark", {
				id: recipe_id,
			});
		} else {
			dispatcher("removeBookmark", {
				id: recipe_id,
			});
		}
	};

	let gcd = (a, b) => {
		if (b < 0.0000001) return a;

		return gcd(b, Math.floor(a % b));
	};

	let getFraction = (fraction) => {
		let len = fraction.toString().length - 2;

		let denominator = Math.pow(10, len);
		let numerator = fraction * denominator;

		let divisor = gcd(numerator, denominator); // Should be 5

		numerator /= divisor; // Should be 687
		denominator /= divisor; // Should be 2000

		return Math.floor(numerator) + "/" + Math.floor(denominator);
	};

	let amounts = [],
		ingredients = (() => {
			let recipe_ingridients = recipe.ingredients, new_ingridients = [];
			console.log("before: ", recipe_ingridients)
			for (let ingredient of recipe_ingridients) {
				let ingridient_string: string = ingredient;
				let array = ingridient_string.substring(0, 5).match(/\d+/g);
				let a, b, c, d;
				if (array) {
					switch (array.length) {
						case 1:
							[a] = array;
							amounts.push(parseFloat(a));
							new_ingridients.push(ingridient_string.substring(1));
							break;
						case 2:
							[a, b] = array;
							a = parseFloat(a);
							b = parseFloat(b);
							d = a / b;
							amounts.push(d);
							new_ingridients.push(ingridient_string.substring(3));
							break;
						case 3:
							[a, b, c] = array;
							a = parseFloat(a);
							b = parseFloat(b);
							c = parseFloat(c);
							d = a + b / c;
							amounts.push(d);
							new_ingridients.push(ingridient_string.substring(5));
							break;
						default:
							amounts.push(0);
							break;
					}
				} else {
					amounts.push(0);
					new_ingridients.push(ingridient_string);
				}
			}
			console.log("after: ", new_ingridients);
			for (let amount of amounts) {
				if (amount == 0) return;
				amount = getFraction(amount);
			}
			return new_ingridients;
		})();

	let seed = 0;
	let modulus = 2 ** 32;
	let a = 1664525;
	let c = 1013904223;

	function getRandom(seed) {
		let returnVal = seed / modulus;
		seed = (a * seed + c) % modulus;
		return returnVal;
	}
</script>

<div class="container block">
	<div class="columns is-centered is-vcentered">
		<div class="column is-two-thirds-tablet">
			<div class="column is-centered is-vcentered box has-no-padding">
				<figure class="image is-3by2 block">
					<img
						alt="immagine ricetta"
						class="image-recipe"
						src={recipe.image_url}
					/>
				</figure>
				<TitleAndAddBookmark
					title={recipe.title}
					id={recipe.recipe_id}
					{is_added_to_bookmarks}
					on:addRemove={handleBookmarks}
				/>
				<!-- Tempo generato pseudorandom in base a id ricetta, non presente in API-->
				<TimingAndServings
					time={(() => {
						let time = Math.ceil(
							10 ** 7 * getRandom(recipe.recipe_id)
						);
						return time;
					})()}
					{servings}
					on:variation={handleServings}
				/>
				<nav class="level line" />
				<IngridientList ingredients={ingredients} {amounts} />
				<nav class="level line" />
				<div class="container has-text-centered pb-5">
					<ButtonIcon
						icon={"fa-hat-chef"}
						label={"How to cook"}
						icon_right={true}
						handleClick={() => {
							window.open(recipe.source_url, "_blank");
						}}
					/>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.image-recipe {
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
</style>
