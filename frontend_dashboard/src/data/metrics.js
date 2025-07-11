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
 * Shows only real API data. If data is missing, displays "N/A"/blank—never uses mock/sample data.
 */
export function getPerformanceMetrics(stock, ticker) {
  // stock is expected to be Finnhub /stock/metric API payload (with .metric object)
  const m = stock && stock.metric ? stock.metric : {};
  return METRIC_DEFS.map(def => {
    let value = null, displayValue = "N/A", valueColor = undefined;
    let apiVal = def.finnhubKey ? m[def.finnhubKey] : undefined;

    switch (def.key) {
      case "pe":
        if (typeof apiVal === "number") {
          value = apiVal;
          displayValue = value.toFixed(2);
          valueColor = "#1565c0";
        }
        break;
      case "eps":
        if (typeof apiVal === "number") {
          value = apiVal;
          displayValue = value.toFixed(2);
        }
        break;
      case "roe":
        if (typeof apiVal === "number") {
          value = apiVal;
          displayValue = value.toFixed(2);
        }
        break;
      case "profitM":
        if (typeof apiVal === "number") {
          value = apiVal;
          displayValue = value.toFixed(2) + "%";
        }
        break;
      case "revG":
        if (typeof apiVal === "number") {
          value = apiVal;
          displayValue = value.toFixed(2) + "%";
        }
        break;
      case "vol":
        if (typeof apiVal === "number") {
          value = apiVal;
          displayValue = value.toLocaleString();
        }
        break;
      case "yield":
        if (typeof apiVal === "number") {
          value = apiVal;
          displayValue = value.toFixed(2) + "%";
          valueColor = "#1976d2";
        }
        break;
      case "beta":
        if (typeof apiVal === "number") {
          value = apiVal;
          displayValue = value.toFixed(2);
        }
        break;
      case "price":
        if (typeof m["close"] === "number") {
          value = m["close"];
          displayValue = `$${Number(value).toFixed(2)}`;
        } else if (typeof stock?.c === "number") {
          value = stock.c;
          displayValue = `$${Number(value).toFixed(2)}`;
        }
        break;
      case "trend":
        // use only real values, "N/A" if not present
        if (typeof m["1WeekPriceReturnDaily"] === "number") {
          value = m["1WeekPriceReturnDaily"];
          displayValue = value.toFixed(2) + "%";
          valueColor = value > 0 ? "#43a047" : "#e53935";
        } else if (typeof stock?.dp === "number") {
          value = stock.dp;
          displayValue = value.toFixed(2) + "%";
          valueColor = value > 0 ? "#43a047" : "#e53935";
        }
        break;
      default:
        // No mock/fallback. Only real data.
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
    if (typeof m.value === "number")
      score += Math.max((m.value/(m.key==="pe"?40:10))*m.weight, 0);
  });
  if (score > 7) return "Buy";
  if (score > 5) return "Hold";
  return "Sell";
}
