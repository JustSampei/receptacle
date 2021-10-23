<script>
	export let icon, is_icon_full = true, label = "", icon_right = false;

	export let handleClick = null;
</script>

<button class="button is-rounded is-vcentered is-centered" on:click={handleClick}>
	{#if (icon_right && label != "")}
		<span class="is-ubuntu">{label}</span>
	{/if}
	<span class="icon is-medium has-text-centered">
		<i class="{is_icon_full ? 'fas' : 'far'} {icon}" />
	</span>
	{#if (!icon_right && label != "")}
		<span class="is-ubuntu">{label}</span>
	{/if}
</button>
