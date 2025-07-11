import axios from "axios";

const BASE = "https://finnhub.io/api/v1";

// PUBLIC_INTERFACE
export async function getStockData(ticker) {
  // Hardcoded API key as instructed
  const API_KEY = 'd1okfe1r01quemd9ir20d1okfe1r01quemd9ir2g';
  // No longer need to throw if missing
  // Get price quote
  const quoteRes = await axios.get(`${BASE}/quote`, {
    params: { symbol: ticker, token: API_KEY }
  });
  // Get fake chart for now
  let chart = [];
  try {
    const ce = quoteRes.data.c || 180;
    for (let i = 6; i >= 0; i--) {
      chart.unshift({
        label: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][6-i],
        price: ce * (1 + 0.01 * (Math.random() - 0.5) * i)
      });
    }
  } catch { }
  return { ...quoteRes.data, chart };
}
