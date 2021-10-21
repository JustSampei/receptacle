<script>
	import Ingridient from "./Ingridient.svelte";
</script>

<div class="container block">
	<div class="columns is-mobile">
		<div class="column" />
		<div class="column is-10">
			<div class="column is-centered is-vcentered box has-no-padding">
				<figure class="image is-3by2 block">
					<img
						alt="immagine ricetta"
						class="image-receipt"
						src="https://bulma.io/images/placeholders/128x128.png"
					/>
				</figure>
				<div class="container block">
					<div class="columns is-multiline is-vcentered is-centered">
						<div class="column is-half has-text-centered">
							<p class="title is-ubuntu">Pizza</p>
						</div>
						<div class="column is-half has-text-centered">
							<button class="button is-rounded">
								<span class="icon is-medium has-text-centered">
									<i class="far fa-bookmark" />
								</span>
								<span class="is-ubuntu">Add to bookmarks</span>
							</button>
						</div>
					</div>
				</div>
				<div class="container block">
					<div class="columns is-multiline is-vcentered is-centered has-no-margin">
						<div class="column is-half has-text-centered">
							<span class="icon-text">
								<span class="icon">
									<i class="fas fa-clock" />
								</span>
								<span class="is-ubuntu">60 Min</span>
							</span>
						</div>
						<div class="column is-half has-text-centered">
							<div
								class="columns is-mobile is-vcentered is-centered has-no-margin"
							>
								<div class="column has-text-centered">
									<button class="button is-rounded">
										<span class="icon is-medium">
											<i class="fas fa-minus" />
										</span>
									</button>
								</div>
								<div class="column is-half has-text-centered">
									<span class="icon-text">
										<span class="icon">
											<i class="fas fa-user-friends" />
										</span>
										<span class="is-ubuntu">
											3 &nbsp;
										</span>
										<span class="is-ubuntu">
											Servings
										</span>
									</span>
								</div>
								<div class="column has-text-centered">
									<button class="button is-rounded">
										<span class="icon is-medium">
											<i class="fas fa-plus" />
										</span>
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
				<nav class="level line" />
				<div class="container block has-text-centered">
					<p class="subtitle is-ubuntu has-text-weight-bold is-4">
						Recipe Ingridients
					</p>
				</div>
				<div class="container block">
					<div
						class="columns is-multiline is-vcentered is-centered has-no-margin"
					>
						<Ingridient />
						<Ingridient />
						<Ingridient />
						<Ingridient />
					</div>
				</div>
				<nav class="level line" />
				<div class="container has-text-centered pb-5">
					<button class="button is-rounded">
						<span class="icon is-medium has-text-centered">
							<i class="fas fa-arrow-right"></i>
						</span>
						<span class="is-ubuntu">How to cook</span>
					</button>
				</div>
			</div>
		</div>
		<div class="column" />
	</div>
</div>

<style>
	.is-ubuntu {
		font-family: is-ubuntu;
	}

	.image-receipt {
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

	.has-no-margin {
		margin: 0;
	}
</style>
