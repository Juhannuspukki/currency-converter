import { saveExchangeRate, getExchangeRate } from '$lib/indexedDB';
import type { ConversionResult } from '../types/currency';

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export async function fetchExchangeRates(baseCurrencies: string[], targetCurrency: string, forceRefresh: boolean = false): Promise<ConversionResult[]> {
  if (forceRefresh) {
    return fetchAllRates(baseCurrencies, targetCurrency);
  }

  const cachedRates: (ConversionResult | null)[] = await Promise.all(
    baseCurrencies.map(async (currency) => {
      const cached = await getExchangeRate(currency, targetCurrency);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return { currency, rate: cached.rate, amount: cached.rate };
      }
      return null;
    })
  );

  const currenciesToFetch = baseCurrencies.filter((_, index) => !cachedRates[index]);

  if (currenciesToFetch.length > 0) {
    const newRates = await fetchAllRates(currenciesToFetch, targetCurrency);
    return cachedRates.map((rate, index) => rate || newRates[index]);
  }

  return cachedRates.filter((rate): rate is ConversionResult => rate !== null);
}

async function fetchAllRates(currencies: string[], targetCurrency: string): Promise<ConversionResult[]> {
  const response = await fetch(
    `/api/convert?from=${currencies.join(',')}&to=${targetCurrency}`
  );
  if (!response.ok) {
    throw new Error('API response was not ok');
  }
  const data = await response.json();

  // Ensure data is always an array
  const dataArray = Array.isArray(data) ? data : [data];

  const currentTimestamp = Date.now();
  localStorage.setItem("lastUpdated", currentTimestamp.toString());

  // Update IndexedDB and return results
  return Promise.all(
    dataArray.map(async (item: any) => {
      const rate = 1 / item.conversionRate; // Invert the rate
      await saveExchangeRate({
        baseCurrency: item.fromCurrency,
        targetCurrency: targetCurrency,
        rate: rate,
        timestamp: currentTimestamp
      });
      return { currency: item.fromCurrency, rate: rate, amount: rate };
    })
  );
}

export function updateAmounts(changedCurrency: string, changedAmount: number, conversions: ConversionResult[]): void {
    const changedConversion = conversions.find(conv => conv.currency === changedCurrency);
    if (changedConversion && changedConversion.rate !== null) {
      const eurAmount = changedCurrency === 'EUR' ? changedAmount : changedAmount / changedConversion.rate;
      conversions.forEach(conv => {
        if (conv.rate !== null) {
          conv.amount = eurAmount * conv.rate;
        }
      });
    }
  }