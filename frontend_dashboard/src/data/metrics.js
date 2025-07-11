// Define 10 performance parameters
const METRIC_DEFS = [
  { key: "pe", label: "P/E Ratio", weight: 0.15 },
  { key: "eps", label: "EPS", weight: 0.11 },
  { key: "roe", label: "ROE (%)", weight: 0.11 },
  { key: "profitM", label: "Profit Margin", weight: 0.10 },
  { key: "revG", label: "Revenue Growth", weight: 0.10 },
  { key: "vol", label: "Volume", weight: 0.11 },
  { key: "yield", label: "Dividend Yield", weight: 0.10 },
  { key: "beta", label: "Beta", weight: 0.07 },
  { key: "price", label: "Price", weight: 0.08 },
  { key: "trend", label: "Trend (7D)", weight: 0.07 }
];

// PUBLIC_INTERFACE
export function getPerformanceMetrics(stock, ticker) {
  // stock = Finnhub payload for quote
  // For demo/mock, fetch sample or live values for all but price
  return METRIC_DEFS.map(def => {
    let value = null, displayValue = "—", valueColor;
    switch (def.key) {
      case "pe":
        value = 28.2; displayValue = "28.2"; valueColor = "#1565c0"; break;
      case "eps":
        value = 6.12; displayValue = "6.12"; break;
      case "roe":
        value = 131; displayValue = "131"; break;
      case "profitM":
        value = 22.9; displayValue = "22.9%"; break;
      case "revG":
        value = 7.8; displayValue = "7.8%"; break;
      case "vol":
        value = stock ? stock.v : 74123421; displayValue = value?.toLocaleString(); break;
      case "yield":
        value = 0.5; displayValue = "0.5%"; valueColor = "#1976d2"; break;
      case "beta":
        value = 1.2; displayValue = "1.2"; break;
      case "price":
        value = stock?.c; displayValue = value ? (`$${Number(value)?.toFixed(2)}`) : "—"; break;
      case "trend":
        value = (stock?.dp ?? 2.1); displayValue = value + "%"; valueColor = value > 0 ? "#43a047" : "#e53935"; break;
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
