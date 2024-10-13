<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchExchangeRates, updateAmounts } from '$lib/utils/currencyUtils';
	import type { ConversionResult } from '$lib/types/currency';
	import CurrencyInput from './CurrencyInput.svelte';

	export const TARGET_CURRENCY = 'EUR';
	export const BASE_CURRENCIES = [
		'SEK',
		'THB',
		'JPY',
		'KRW',
		'USD',
		'SGD',
		'IDR',
		'MYR',
		'PHP',
		'LAK',
		'KHR',
		'VND',
		'TWD'
	];

	const currencyFlags: Record<string, string> = {
		EUR: '🇪🇺',
		SEK: '🇸🇪',
		THB: '🇹🇭',
		JPY: '🇯🇵',
		KRW: '🇰🇷',
		USD: '🇺🇸',
		SGD: '🇸🇬',
		IDR: '🇮🇩',
		MYR: '🇲🇾',
		PHP: '🇵🇭',
		LAK: '🇱🇦',
		KHR: '🇰🇭',
		VND: '🇻🇳',
		TWD: '🇹🇼'
	};

	let conversions: ConversionResult[] = [
		{ currency: TARGET_CURRENCY, rate: 1, amount: 1 },
		...BASE_CURRENCIES.map((currency) => ({ currency, rate: null, amount: null }))
	];
	let loading: boolean = true;
	let error: string | null = null;
	let lastUpdated: string = 'Never';
	let lastChanged: string = TARGET_CURRENCY;

	function formatTimeDifference(timestamp: number): string {
		const now = Date.now();
		const diff = now - timestamp;
		const seconds = Math.floor(diff / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);

		if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago.`;
		if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago.`;
		if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago.`;
		return 'Just now.';
	}

	async function updateConversionRates(forceRefresh: boolean = false) {
		loading = true;
		error = null;

		try {
			const rates = await fetchExchangeRates(BASE_CURRENCIES, TARGET_CURRENCY, forceRefresh);
			conversions = [{ currency: TARGET_CURRENCY, rate: 1, amount: 1 }, ...rates];
			lastUpdated = localStorage.getItem('lastUpdated') ?? 'Never';
			updateAmounts(TARGET_CURRENCY, 1, conversions);
		} catch (err) {
			console.error('Error fetching conversion rates:', err);
			error = 'Failed to fetch conversion rates. Please try again.';
		} finally {
			loading = false;
		}
	}

	function handleInputChange(event: CustomEvent<{ currency: string; value: number | null }>) {
		const { currency, value } = event.detail;
		lastChanged = currency;
		const conversionIndex = conversions.findIndex((conv) => conv.currency === currency);
		if (conversionIndex !== -1) {
			conversions[conversionIndex].amount = value;
			if (value !== null) {
				updateAmounts(currency, value, conversions);
			}
			conversions = [...conversions]; // Trigger reactivity
		}
	}

	function handleRefreshClick() {
		updateConversionRates(true);
	}

	onMount(async () => {
		await updateConversionRates();
	});
</script>

<main>
	<div class="container">
		<img src="mastercard.svg" alt="Mastercard Logo" width="100px" />
		<h1>Currency Converter</h1>

		{#if loading}
			<p class="loading">Loading currency data...</p>
		{:else if error}
			<p class="error">{error}</p>
		{:else}
			<div class="grid">
				{#each conversions as conversion}
					<CurrencyInput
						currency={conversion.currency}
						amount={conversion.amount}
						rate={conversion.rate}
						flag={currencyFlags[conversion.currency]}
						on:input={handleInputChange}
					/>
				{/each}
			</div>
			<p class="disclaimer">
				<i
					>This website uses official Mastercard currency rates, but is not affiliated with
					Mastercard in any way. Last updated: {lastUpdated !== 'Never'
						? formatTimeDifference(parseInt(lastUpdated))
						: 'Never'}</i
				>
				<button on:click={handleRefreshClick} disabled={loading}>
					<i>Click here to refresh rates.</i>
				</button>
			</p>
		{/if}
	</div>
</main>

<style>
	h1 {
		text-align: center;
		font-size: 2rem;
		margin-bottom: 2rem;
	}
	main {
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: 'Nunito', sans-serif;
	}
	.container {
		padding: 0 1rem;
		max-width: 500px;
	}
	img {
		position: fixed;
		z-index: -1;
		top: 1rem;
		left: 50%;
		transform: translate(-50%, 0);
		opacity: 1;
	}
	.grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
		margin-bottom: 2rem;
	}
	.loading {
		text-align: center;
	}
	.disclaimer {
		font-size: 0.85rem;
		color: #767676;
	}
	.error {
		color: red;
	}
	button {
		display: inline;
		padding: 0;
		background-color: transparent;
		color: #767676;
		border: none;
		cursor: pointer;
		border-radius: 0.5rem;
		font-size: 0.85rem;
		text-decoration: underline;
		&:hover {
			opacity: 0.8;
		}
	}
	button:disabled {
		background-color: #cccccc;
	}
</style>
