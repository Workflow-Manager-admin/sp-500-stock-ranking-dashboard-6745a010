/**
 * Performance metric definitions and extraction logic adapted for Finnhub's stock/metric API endpoint.
 */
const METRIC_DEFS = [
  { key: "pe",    label: "P/E Ratio",      weight: 0.15, finnhubKey: "peInclExtraTTM" },
  { key: "eps",   label: "EPS",            weight: 0.11, finnhubKey: "epsInclExtraItemsTTM" },
  { key: "roe",   label: "ROE (%)",        weight: 0.11, finnhubKey: "roeTTM" },
  { key: "profitM",label: "Profit Margin", weight: 0.10, finnhubKey: "netProfitMarginTTM" },
  { key: "revG",  label: "Revenue Growth", weight: 0.10, finnhubKey: "revenueGrowthTTM" },
  { key: "vol",   label: "Volume",         weight: 0.11, finnhubKey: "10DayAverageTradingVolume" },
  { key: "yield", label: "Dividend Yield", weight: 0.10, finnhubKey: "dividendYieldIndicatedAnnual" },
  { key: "beta",  label: "Beta",           weight: 0.07, finnhubKey: "beta" },
  { key: "price", label: "Price",          weight: 0.08, finnhubKey: "close" },
  { key: "trend", label: "Trend (7D)",     weight: 0.07, finnhubKey: null }
];

// PUBLIC_INTERFACE
/**
 * Extract metrics using Finnhub /stock/metric API payload (stock.metric).
 * Falls back to demo values if data is missing; otherwise shows real values.
 */
export function getPerformanceMetrics(stock, ticker) {
  // stock is expected to be Finnhub /stock/metric API payload (with .metric object)
  // For demo/mock, fetch sample or live values for all but price
  const m = stock && stock.metric ? stock.metric : {};
  return METRIC_DEFS.map(def => {
    let value = null, displayValue = "—", valueColor;
    let apiVal = def.finnhubKey ? m[def.finnhubKey] : undefined;

    switch (def.key) {
      case "pe":
        value = typeof apiVal === "number" ? apiVal : 28.2;
        displayValue = value !== undefined && value !== null ? value.toFixed(2) : "—";
        valueColor = "#1565c0";
        break;
      case "eps":
        value = typeof apiVal === "number" ? apiVal : 6.12;
        displayValue = value !== undefined && value !== null ? value.toFixed(2) : "—";
        break;
      case "roe":
        value = typeof apiVal === "number" ? apiVal : 131;
        displayValue = value !== undefined && value !== null ? value.toFixed(2) : "—";
        break;
      case "profitM":
        value = typeof apiVal === "number" ? apiVal : 22.9;
        displayValue = value !== undefined && value !== null ? value.toFixed(2) + "%" : "—";
        break;
      case "revG":
        value = typeof apiVal === "number" ? apiVal : 7.8;
        displayValue = value !== undefined && value !== null ? value.toFixed(2) + "%" : "—";
        break;
      case "vol":
        value = typeof apiVal === "number" ? apiVal : (stock?.v || 74123421);
        displayValue = value !== undefined && value !== null ? value.toLocaleString() : "—";
        break;
      case "yield":
        value = typeof apiVal === "number" ? apiVal : 0.5;
        displayValue = value !== undefined && value !== null ? value.toFixed(2) + "%" : "—";
        valueColor = "#1976d2";
        break;
      case "beta":
        value = typeof apiVal === "number" ? apiVal : 1.2;
        displayValue = value !== undefined && value !== null ? value.toFixed(2) : "—";
        break;
      case "price":
        value = typeof m["close"] === "number" ? m["close"] : (stock?.c ?? null);
        displayValue = value !== undefined && value !== null ? (`$${Number(value)?.toFixed(2)}`) : "—";
        break;
      case "trend":
        // for simplicity: use 1-week percent change, fallback to dp/delta percent, fallback to 2.1
        value = (typeof m["1WeekPriceReturnDaily"] === "number")
          ? m["1WeekPriceReturnDaily"]
          : (typeof stock?.dp === "number" ? stock.dp : 2.1);
        displayValue = value !== undefined && value !== null ? value.toFixed(2) + "%" : "—";
        valueColor = value > 0 ? "#43a047" : "#e53935";
        break;
      default:
        break;
    }
    return {
      ...def,
      value,
      displayValue,
      valueColor
    };
  });
}


// PUBLIC_INTERFACE
export function evaluateDisposition(metrics) {
  // Scoring: Buy if >7, Hold 5-7, Sell <5 (arbitrary demo logic)
  let score = 0;
  metrics.forEach(m => {
    if (m.value && typeof m.value === "number")
      score += Math.max((m.value/(m.key==="pe"?40:10))*m.weight, 0);
  });
  if (score > 7) return "Buy";
  if (score > 5) return "Hold";
  return "Sell";
}
