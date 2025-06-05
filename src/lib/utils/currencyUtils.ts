import { saveExchangeRate, getExchangeRate } from '$lib/indexedDB';
import type { ConversionResult } from '../types/currency';

const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

export async function fetchExchangeRates(baseCurrencies: string[], forceRefresh: boolean = false): Promise<ConversionResult[]> {
  if (forceRefresh) {
    return fetchAllRates(baseCurrencies);
  }

  const cachedRates: (ConversionResult | null)[] = await Promise.all(
    baseCurrencies.map(async (currency) => {
      const cached = await getExchangeRate(currency, "EUR");
      if (cached && cached.lastUpdated && (Date.now() - new Date(cached.lastUpdated).getTime() < CACHE_DURATION)) {
        return { currency, rate: cached.rate, amount: cached.rate, lastUpdated: cached.lastUpdated };
      }
      return null;
    })
  );

  const currenciesToFetch = baseCurrencies.filter((_, index) => !cachedRates[index]);

  if (currenciesToFetch.length > 0) {
    const newRates = await fetchAllRates(currenciesToFetch);
    return cachedRates.map((rate, index) => rate || newRates[index]);
  }

  return cachedRates.filter((rate): rate is ConversionResult => rate !== null);
}

async function fetchAllRates(currencies: string[]): Promise<ConversionResult[]> {
  const response = await fetch('https://pub-0cc45d2cd60c448c9104b64da83bdf7b.r2.dev/rates.json');
  if (!response.ok) {
    throw new Error('Failed to fetch exchange rates');
  }
  const ratesData = await response.json();

  const currentTimestamp = Date.now();
  localStorage.setItem("lastUpdated", currentTimestamp.toString());

  // Process all requested currencies, including those not found in the rates
  const results: ConversionResult[] = [];
  
  for (const currency of currencies) {

    const rateObj = ratesData.find((item: any) => item.id === currency);
    if (!rateObj) {
      // If currency not found in rates, add it with null values
      results.push({
        currency,
        rate: null,
        amount: null,
        lastUpdated: null
      });
      continue;
    }

    // Calculate the rate from EUR to the source currency
    const rate = 1 / rateObj.exchangeRate;
    
    await saveExchangeRate({
      baseCurrency: currency,
      targetCurrency: 'EUR',
      rate: rate,
      lastUpdated: rateObj.lastUpdated
    });

    results.push({
      currency,
      rate,
      amount: rate,
      lastUpdated: rateObj.lastUpdated
    });
  }

  return results;
}

export function updateAmounts(changedCurrency: string, changedAmount: number | null, conversions: ConversionResult[]): void {
    if (changedAmount === null) return;
    
    const changedConversion = conversions.find(conv => conv?.currency === changedCurrency);
    if (!changedConversion || changedConversion.rate === null || changedConversion.rate === undefined) {
      console.warn(`Cannot update amounts: invalid conversion data for ${changedCurrency}`);
      return;
    }

    try {
      const eurAmount = changedCurrency === 'EUR' ? changedAmount : changedAmount / changedConversion.rate;
      
      conversions.forEach(conv => {
        if (conv && conv.rate !== null && conv.rate !== undefined) {
          conv.amount = eurAmount * conv.rate;
        }
      });
    } catch (error) {
      console.error('Error updating amounts:', error);
    }
  }

export function formatDate(isoString: string | null): string {
  if (!isoString) return '';
  
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
  } catch (e) {
    console.error('Error formatting date:', e);
    return '';
  }
}