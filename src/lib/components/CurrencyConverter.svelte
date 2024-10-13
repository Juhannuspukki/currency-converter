<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchExchangeRates, updateAmounts } from '$lib/utils/currencyUtils';
	import type { ConversionResult } from '$lib/types/currency';
	import CurrencyInput from './CurrencyInput.svelte';

	export const TARGET_CURRENCY = 'EUR';
	export const BASE_CURRENCIES = ['SEK', 'THB', 'JPY', 'KRW', 'USD', 'SGD', 'IDR', 'MYR', 'PHP', 'LAK', 'KHR', 'VND', 'TWD'];

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

		if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
		if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
		if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
		return 'Just now';
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
	<div>
		<img src="logo.svg" alt="Mastercard Logo" width="100px" />
		<h1>Currency Converter</h1>

		{#if loading}
			<p>Loading currency data...</p>
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
			<p>
				Last updated: {lastUpdated !== 'Never'
					? formatTimeDifference(parseInt(lastUpdated))
					: 'Never'}
			</p>
		{/if}

		<button on:click={handleRefreshClick} disabled={loading}>
			{loading ? 'Refreshing...' : 'Refresh Rates'}
		</button>
	</div>
</main>

<style>
	h1 {
		font-size: 1.5rem;
	}
	main {
		width: 100vw;
		height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: 'Nunito', sans-serif;
	}
	.grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
	}
	.error {
		color: red;
	}
	button {
		padding: 10px 15px;
		background-color: #007cf0;
		color: white;
		border: none;
		cursor: pointer;
		border-radius: 0.5rem;
		&:hover {
			opacity: 0.8;
		}
	}
	button:disabled {
		background-color: #cccccc;
	}
</style>
