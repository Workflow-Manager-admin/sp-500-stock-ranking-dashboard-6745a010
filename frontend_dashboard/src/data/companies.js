const COMPANIES = [
  {
    ticker: "AAPL",
    name: "Apple Inc.",
    sector: "Technology"
  },
  {
    ticker: "MSFT",
    name: "Microsoft Corporation",
    sector: "Technology"
  },
  {
    ticker: "GOOGL",
    name: "Alphabet Inc.",
    sector: "Communication Services"
  },
  {
    ticker: "AMZN",
    name: "Amazon.com, Inc.",
    sector: "Consumer Discretionary"
  },
  {
    ticker: "TSLA",
    name: "Tesla, Inc.",
    sector: "Consumer Discretionary"
  },
  {
    ticker: "META",
    name: "Meta Platforms, Inc.",
    sector: "Communication Services"
  }
  // ...extend with full S&P 500 as needed
];

// PUBLIC_INTERFACE
export function getCompanyList() {
  return COMPANIES;
}

// PUBLIC_INTERFACE
export function getCompanyByTicker(ticker) {
  return COMPANIES.find(c => c.ticker === ticker);
}
