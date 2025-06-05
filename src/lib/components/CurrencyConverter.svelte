<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchExchangeRates, updateAmounts } from '$lib/utils/currencyUtils';
	import type { ConversionResult } from '$lib/types/currency';
	import CurrencyInput from './CurrencyInput.svelte';
	import LoadingOverlay from './LoadingOverlay.svelte';

	export const TARGET_CURRENCY = 'EUR';
	export const BASE_CURRENCIES = [
		'SEK',
		'THB',
		'JPY',
		'PLN',
		'KRW',
		'USD',
		'SGD',
		'IDR',
		'MYR',
		'PHP',
		'LAK',
		'KHR',
		'VND',
		'TWD',
		'MMK'
	];

	const currencyFlags: Record<string, string> = {
		EUR: '🇪🇺',
		SEK: '🇸🇪',
		THB: '🇹🇭',
		JPY: '🇯🇵',
		PLN: '🇵🇱',
		USD: '🇺🇸',
		KRW: '🇰🇷',
		SGD: '🇸🇬',
		MYR: '🇲🇾',
		PHP: '🇵🇭',
		IDR: '🇮🇩',
		LAK: '🇱🇦',
		KHR: '🇰🇭',
		VND: '🇻🇳',
		TWD: '🇹🇼',
		MMK: '🇲🇲'
	};

	let conversions: ConversionResult[] = [
		{ currency: TARGET_CURRENCY, rate: 1, amount: 1, lastUpdated: null },
		...BASE_CURRENCIES.map((currency) => ({ currency, rate: null, amount: null, lastUpdated: null }))
	];
	let loading: boolean = true;
	let error: string | null = null;
	let lastChanged: string = TARGET_CURRENCY;
	let showLastUpdated: boolean = false;

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

	let formattedLastUpdated: string = 'Never';

	function updateFormattedLastUpdated() {
		if (typeof window !== 'undefined' && window.localStorage) {
			const storedLastUpdated = localStorage.getItem('lastUpdated');
			if (storedLastUpdated) {
				formattedLastUpdated = formatTimeDifference(parseInt(storedLastUpdated));
			} else {
				formattedLastUpdated = 'Never';
			}
		}
	}

	let updateInterval: number;

	onMount(() => {
		// Start the update interval
		updateInterval = setInterval(updateFormattedLastUpdated, 1000);

		// Initial update of conversion rates
		updateConversionRates();

		// Clean up the interval when the component is destroyed
		return () => {
			clearInterval(updateInterval);
		};
	});

	async function updateConversionRates(forceRefresh: boolean = false) {
		loading = true;
		error = null;

		try {
			const rates = await fetchExchangeRates(BASE_CURRENCIES, forceRefresh);
			// Ensure we have valid rates before updating
			if (Array.isArray(rates)) {
				conversions = [
					{ currency: TARGET_CURRENCY, rate: 1, amount: 1, lastUpdated: null },
					...rates.filter(rate => rate?.currency)
				];
				updateFormattedLastUpdated();
				updateAmounts(TARGET_CURRENCY, 1, conversions);
			} else {
				throw new Error('Invalid rates data received');
			}
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
</script>

<LoadingOverlay loading={loading} />

<main>
	<div class="logo-container">
		<img src="mastercard.svg" alt="Mastercard Logo" />
	</div>
	<div class="outer-container">
		<div class="inner-container">
			<h1>Currency Converter</h1>
			{#if error}
				<p class="error">{error}</p>
			{:else}
				<div class="{showLastUpdated ? 'grid compact' : 'grid'}">
					{#each conversions.filter(c => c?.currency) as conversion (conversion.currency)}
						<CurrencyInput
							currency={conversion.currency}
							amount={conversion.amount}
							rate={conversion.rate}
							lastUpdated={conversion.lastUpdated}
							showLastUpdated={showLastUpdated}
							flag={currencyFlags[conversion.currency] || '💱'}
							on:input={handleInputChange}
						/>
					{/each}
				</div>
				<p class="disclaimer">
					<i>
						This website uses official Mastercard currency rates, but is not affiliated with
						Mastercard in any way. Last update received from the server: {formattedLastUpdated}
					</i>
					<button on:click={handleRefreshClick} disabled={loading}>
						<i>Click here to refresh rates.</i>
					</button>
					<button on:click={() => showLastUpdated = !showLastUpdated}>
						<i>Click here to {showLastUpdated ? 'hide' : 'show'} debug information.</i>
					</button>
				</p>
			{/if}
		</div>
	</div>
	<div class="spacer"></div>
</main>

<style>
	h1 {
		text-align: center;
		font-size: 2rem;
		margin: 0 0 2rem 0;
		color: #ffffff;
	}
	p {
		color: #ffffff;
	}
	main {
		height: 100%;
		display: grid;
		grid-template-rows: minmax(0, 1fr) min-content minmax(0, 1fr);
		font-family: 'Nunito', sans-serif;
	}
	.outer-container {
		padding: 0 1.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.inner-container {
		max-width: 400px;
	}
	.logo-container {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 3rem;
	}
	img {
		height: 50%;
		max-height: 10rem;
	}
	.grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		row-gap: 2rem;
		column-gap: 2rem;
		margin-bottom: 2rem;
	}
	@media screen and (orientation: landscape) and (max-height: 728px) {
		.logo-container {
			min-height: 0;
		}
		img{
			display: none;
		}

		.inner-container {
			max-width: 100%;
		}
		.grid {
			grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
			row-gap: 1.5rem;
		}
		.disclaimer {
			margin: 0;
		}
	}
	.compact {
		row-gap: 1rem;
	}
	.disclaimer {
		font-size: 0.85rem;
		color: #777777;
	}
	.error {
		color: red;
	}
	button {
		display: inline;
		padding: 0;
		background-color: transparent;
		color: #777777;
		border: none;
		cursor: pointer;
		border-radius: 0.5rem;
		font-size: 0.85rem;
		text-decoration: underline;
		text-align: left;
		&:hover {
			opacity: 0.8;
		}
	}
	button:disabled {
		background-color: #cccccc;
	}
</style>
