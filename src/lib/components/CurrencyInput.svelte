<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';

	export let currency: string;
	export let flag: string;
	export let amount: number | null;
	export let rate: number | null = null;

	const dispatch = createEventDispatcher<{
		input: { currency: string; value: number | null };
	}>();

	let inputValue = '';
	let isEditing = false;

	$: {
		if (!isEditing && amount !== null) {
			inputValue = amount.toFixed(2);
		}
	}

	onMount(() => {
		if (amount !== null) {
			inputValue = amount.toFixed(2);
		}
	});

	function handleInput(event: Event) {
		isEditing = true;
		inputValue = (event.target as HTMLInputElement).value;
		const value = parseFloat(inputValue);
		if (!isNaN(value)) {
			dispatch('input', { currency, value });
		}
	}

	function handleBlur() {
		isEditing = false;
		const value = parseFloat(inputValue);
		if (!isNaN(value)) {
			inputValue = value.toFixed(2);
			dispatch('input', { currency, value });
		} else {
			inputValue = amount !== null ? amount.toFixed(2) : '';
			dispatch('input', { currency, value: amount });
		}
	}
</script>

<div>
	<label>
		<span>
			{flag}
			{currency}
		</span>
		{#if rate !== null || currency === 'EUR'}
			<input type="text" bind:value={inputValue} on:input={handleInput} on:blur={handleBlur} />
		{:else}
			No data available
		{/if}
	</label>
</div>

<style>
	label {
		display: grid;
		grid-template-columns: 3.75rem 1fr;
	}
	span {
		padding: 0.2rem 0;
    font-size: 0.85rem;
		display: inline-block;
	}
	input {
		width: 100%;
    padding: 0;
    font-size: 1rem;
    text-align: center;
		color: #333333;
		border: none;
    border-bottom: 1px solid #333333;
		font-family: 'Nunito', 'sans-serif';
	}
</style>
