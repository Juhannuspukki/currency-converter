export interface ConversionResult {
	currency: string;
	rate: number | null;
	amount: number | null;
	lastUpdated: string | null;
}