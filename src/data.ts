/** A tiny in-memory universe of stocks to screen. */
export interface Stock {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  marketCapB: number; // market cap in billions USD
}

/**
 * A structured screen. This is exactly the kind of payload that doesn't belong
 * in a URL query string — nested, open-ended, and potentially large — which is
 * why the HTTP QUERY method exists.
 */
export interface StockFilter {
  sector?: string;
  maxPrice?: number;
  minMarketCapB?: number;
  sort?: "price" | "marketCapB";
}

export const STOCKS: Stock[] = [
  {
    symbol: "AAPL",
    name: "Apple",
    sector: "Technology",
    price: 214,
    marketCapB: 3300,
  },
  {
    symbol: "MSFT",
    name: "Microsoft",
    sector: "Technology",
    price: 462,
    marketCapB: 3400,
  },
  {
    symbol: "NVDA",
    name: "NVIDIA",
    sector: "Technology",
    price: 128,
    marketCapB: 3100,
  },
  {
    symbol: "AMD",
    name: "Advanced Micro Devices",
    sector: "Technology",
    price: 168,
    marketCapB: 270,
  },
  {
    symbol: "JPM",
    name: "JPMorgan Chase",
    sector: "Financials",
    price: 205,
    marketCapB: 590,
  },
  {
    symbol: "V",
    name: "Visa",
    sector: "Financials",
    price: 275,
    marketCapB: 550,
  },
  {
    symbol: "XOM",
    name: "Exxon Mobil",
    sector: "Energy",
    price: 114,
    marketCapB: 500,
  },
  {
    symbol: "JNJ",
    name: "Johnson & Johnson",
    sector: "Healthcare",
    price: 155,
    marketCapB: 375,
  },
  {
    symbol: "PFE",
    name: "Pfizer",
    sector: "Healthcare",
    price: 28,
    marketCapB: 160,
  },
];

/** Apply a {@link StockFilter} to the universe. */
export function searchStocks(filter: StockFilter): Stock[] {
  let results = STOCKS.filter((stock) => {
    if (filter.sector && stock.sector !== filter.sector) return false;
    if (filter.maxPrice !== undefined && stock.price > filter.maxPrice)
      return false;
    if (
      filter.minMarketCapB !== undefined &&
      stock.marketCapB < filter.minMarketCapB
    ) {
      return false;
    }
    return true;
  });

  if (filter.sort) {
    const key = filter.sort;
    results = [...results].sort((a, b) => b[key] - a[key]);
  }

  return results;
}
