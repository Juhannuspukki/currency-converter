// src/lib/indexedDB.ts

const DB_NAME = 'CurrencyConverterDB';
const STORE_NAME = 'exchangeRates';
const DB_VERSION = 1;

export interface ExchangeRate {
  baseCurrency: string;
  targetCurrency: string;
  rate: number;
  lastUpdated: string;
}

export async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      db.createObjectStore(STORE_NAME, { keyPath: ['baseCurrency', 'targetCurrency'] });
    };
  });
}

export async function saveExchangeRate(rate: ExchangeRate): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(rate);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function getExchangeRate(baseCurrency: string, targetCurrency: string): Promise<ExchangeRate | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get([baseCurrency, targetCurrency]);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
}