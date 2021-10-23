<script>
	export let icon, is_icon_full = true, label = "", icon_right = false;
</script>

<span class="icon-text" >
	{#if label != "" && icon_right}
		<span class="is-ubuntu"> {label} </span>
	{/if}
	
	<span class="icon">
		<i class="{is_icon_full ? 'fas' : 'far'} {icon}" />
	</span>

	{#if label != "" && !icon_right}
		<span class="is-ubuntu"> {label} </span>
	{/if}
</span>
