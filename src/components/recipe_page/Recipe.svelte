<script lang="ts">
	import IngredientList from "./IngredientList.svelte";
	import ButtonIcon from "../mini_components/ButtonIcon.svelte";
	import TimingAndServings from "./TimingAndServings.svelte";
	import TitleAndAddBookmark from "./TitleAndAddBookmark.svelte";
	import { createEventDispatcher } from "svelte";
import { loop_guard } from "svelte/internal";

	export let is_added_to_bookmarks: boolean;

	export let recipe;

	const getingredients = (list_ingredients) => {
		let recipe_ingredients = list_ingredients,
			new_ingredients = [];
		for (let ingredient of recipe_ingredients) {
			let ingredient_string: string = ingredient;
			let array = ingredient_string.substring(0, 5).match(/\d+/g);
			if (array) {
				let ounces = ingredient_string.match(/\((\d+)?(.+)?(\d+)\s+\w+\)/g);
				if (ounces) ingredient_string = ingredient_string.replace(ounces.toString(), "");
				switch (array.length) {
					case 1:
						new_ingredients.push(ingredient_string.substring(array.length));
						break;
					case 2:
						new_ingredients.push(ingredient_string.substring(array.length + 1));
						break;
					case 3:
						new_ingredients.push(ingredient_string.substring(array.length + 2));
						break;
					default:
						new_ingredients.push(ingredient_string);
						break;
				}
			} else new_ingredients.push(ingredient_string);
		}
		return new_ingredients;
	};

	let servings = 4; //Non presente nelle API, default 4

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

	const getAmounts = (list_ingredients) => {
		let recipe_ingredients = list_ingredients,
			new_amounts = [];
		for (let ingredient of recipe_ingredients) {
			let ingredient_string: string = ingredient;
			let array = ingredient_string.substring(0, 5).match(/\d+/g);
			let a, b, c, d;
			if (array) {
				switch (array.length) {
					case 1:
						[a] = array;
						new_amounts.push(parseFloat(a));
						break;
					case 2:
						[a, b] = array;
						a = parseFloat(a);
						b = parseFloat(b);
						d = a / b;
						new_amounts.push(d);
						break;
					case 3:
						[a, b, c] = array;
						a = parseFloat(a);
						b = parseFloat(b);
						c = parseFloat(c);
						d = a + (b / c);
						new_amounts.push(d);
						break;
					default:
						new_amounts.push(0);
						break;
				}
			} else {
				new_amounts.push(0);
			}
		}
		return new_amounts;
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

	const getAmountsFracted = (amounts) => {
		let fraction_amounts = [];
		for (let amount of amounts) {
			amount = (amount * servings) / 4;
			if (amount != 0 && amount % 1 != 0.0) {
				if (Math.floor(amount) == 0) {
					fraction_amounts.push(getFraction(amount % 1));
				}
				else fraction_amounts.push(Math.floor(amount) + " " + getFraction(amount % 1));
			} else if (amount != 0) {
				fraction_amounts.push(amount);
			} else fraction_amounts.push("");
		}
		return fraction_amounts;
	}

	let amounts = getAmounts(recipe.ingredients),
		amounts_fracted = getAmountsFracted(amounts),
		ingredients = getingredients(recipe.ingredients);

	const handleServings = (event) => {
		servings = servings + event.detail.variation;
		if (servings < 1) servings = 1;
		amounts = getAmounts(recipe.ingredients);
		amounts_fracted = getAmountsFracted(amounts);
	};

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
				<IngredientList ingredients={ingredients} amounts={amounts_fracted} />
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
