import React, { useState, useEffect } from "react";
import "./App.css";

/**
 * PUBLIC_INTERFACE
 * Main Dashboard App for S&P 500 stock ranking, refactored for dynamic ticker search.
 * Lets users input a valid ticker symbol, fetches and displays Finnhub stock metrics as a table
 * with attribute names as columns and the corresponding values as a single row.
 *
 * Now implements scoring and disposition logic:
 * - Computes total score by summing metric scores according to thresholds.
 * - Adds 'Disposition' as first table column ("Buy", "Hold", or "Sell").
 */

function App() {
  const [theme, setTheme] = useState("light");
  const [ticker, setTicker] = useState("AAPL"); // default starting ticker
  const [inputTicker, setInputTicker] = useState("AAPL");
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Stock price state
  const [stockPrice, setStockPrice] = useState(null);
  const [priceError, setPriceError] = useState(null);
  const [priceLoading, setPriceLoading] = useState(false);

  // Finnhub connection status: 'connecting' | 'connected' | 'error'
  const [connectionStatus, setConnectionStatus] = useState("connecting");

  // Table attributes—update disposition label to clarify new rating range
  const TABLE_ATTRIBUTES = [
    { label: "Disposition (Recommendation)", key: "disposition", isDisposition: true },
    { label: "Current Stock Price", key: "currentStockPrice", isPrice: true },
    { label: "EPS (TTM)", key: "epsTTM" },
    { label: "P/E Ratio (Normalized Annual)", key: "peNormalizedAnnual" },
    { label: "Revenue Growth YoY (TTM)", key: "revenueGrowthTTMYoy" },
    { label: "ROE (TTM)", key: "roeTTM" },
    { label: "Free Cash Flow (TTM)", key: "freeCashFlowTTM" },
    { label: "Debt/Equity", key: "debtEquity" }, // calculated
    { label: "Interest Coverage", key: "interestCoverage" },
    { label: "Gross Margin (TTM)", key: "grossMarginTTM" },
    { label: "Net Profit Margin (TTM)", key: "netProfitMarginTTM" },
    { label: "P/B Ratio (Annual)", key: "pbAnnual" },
    { label: "Dividend Yield (Indicated Annual)", key: "dividendYieldIndicatedAnnual" }
  ];

  // Effect: apply theme to <html>
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  // Fetch Finnhub metrics and price for current ticker (In parallel)
  useEffect(() => {
    /**
     * Fetch metrics for a given ticker from Finnhub API.
     * Uses the specific provided API link and key as per requirements.
     * No dynamic environment variables used.
     */
    async function fetchMetrics() {
      setLoading(true);
      setApiError(null);
      setConnectionStatus("connecting");
      // Always uppercase, Finnhub requires
      const symbol = ticker.toUpperCase();
      const url = `https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=d1omsf9r01quemda0sugd1omsf9r01quemda0sv0`;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`API responded ${res.status}`);
        const data = await res.json();
        setMetrics(data);
        setConnectionStatus("connected");
        // For debug confirmation
        // eslint-disable-next-line no-console
        console.log(`${symbol} Metrics fetched from Finnhub:`, data);
      } catch (err) {
        setApiError(err.message);
        setMetrics(null);
        setConnectionStatus("error");
      } finally {
        setLoading(false);
      }
    }

    async function fetchStockPrice() {
      setPriceLoading(true);
      setPriceError(null);
      setStockPrice(null);
      // Only fetch if the ticker is present
      const symbol = ticker.toUpperCase();
      // Use your Finnhub API key here for /quote as well
      const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=d1omsf9r01quemda0sugd1omsf9r01quemda0sv0`;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Price API responded ${res.status}`);
        const data = await res.json();
        // Finnhub /quote returns { c: current price, ... }
        if (typeof data.c === "number" && !isNaN(data.c)) {
          setStockPrice(data.c);
        } else {
          setStockPrice(null);
        }
        // Debug
        // eslint-disable-next-line no-console
        console.log(`${symbol} Stock price from Finnhub:`, data);
      } catch (err) {
        setPriceError(err.message);
        setStockPrice(null);
      } finally {
        setPriceLoading(false);
      }
    }

    if (ticker && ticker.length > 0) {
      fetchMetrics();
      fetchStockPrice();
    }
  }, [ticker]);

  // PUBLIC_INTERFACE
  // Toggle light/dark theme
  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  // PUBLIC_INTERFACE
  // Handle form submit for ticker search
  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanTicker = inputTicker.trim().toUpperCase();
    if (cleanTicker.length > 0 && cleanTicker !== ticker) {
      setTicker(cleanTicker);
    }
  };

  // PUBLIC_INTERFACE
  /**
   * Scoring/disposition: evaluateStock per provided pseudocode.
   * This produces "Strong Buy", "Buy", "Hold", "Sell", "Strong Sell".
   * Field mappings (Finnhub API):
   * - EPS (TTM): metric.epsTTM
   * - P/E Ratio (Normalized Annual): metric.peNormalizedAnnual
   * - Revenue Growth YoY (TTM): metric.revenueGrowthTTMYoy
   * - ROE (TTM): metric.roeTTM
   * - Free Cash Flow (TTM): metric.freeCashFlowTTM
   * - Debt/Equity: calc from metric.totalDebt/metric.totalEquity
   * - Interest Coverage: metric.interestCoverage
   * - Gross Margin (TTM): metric.grossMarginTTM
   * - Net Profit Margin (TTM): metric.netProfitMarginTTM
   * - P/B Ratio (Annual): metric.pbAnnual
   * - Dividend Yield (Indicated Annual): metric.dividendYieldIndicatedAnnual
   * Returns: { totalScore, disposition, breakdown }
   */
  function evaluateStock(metric) {
    if (!metric) return { totalScore: 0, disposition: "N/A", breakdown: {} };

    const breakdown = {};

    // 1. EPS (TTM): >8 = +2, 4-8 = +1, 1-4 = 0, <1 = -1
    const eps = metric.epsTTM;
    breakdown.epsTTM = eps === undefined || eps === null
      ? 0
      : eps > 8 ? 2 : eps > 4 ? 1 : eps >= 1 ? 0 : -1;

    // 2. P/E Ratio (Normalized Annual): <12 = +2, 12-18 = +1, 18-30 = 0, >30 = -1
    const pe = metric.peNormalizedAnnual;
    breakdown.peNormalizedAnnual = pe === undefined || pe === null
      ? 0
      : pe < 12 ? 2 : pe < 18 ? 1 : pe <= 30 ? 0 : -1;

    // 3. Revenue Growth YoY (TTM): >0.14 = +2, 0.05-0.14 = +1, 0-0.05 = 0, <0 = -1
    const rev = metric.revenueGrowthTTMYoy;
    breakdown.revenueGrowthTTMYoy = rev === undefined || rev === null
      ? 0
      : rev > 0.14 ? 2 : rev > 0.05 ? 1 : rev >= 0 ? 0 : -1;

    // 4. ROE (TTM): >0.2 = +2, 0.12–0.2 = +1, 0.05-0.12 = 0, <0.05 = -1
    const roe = metric.roeTTM;
    breakdown.roeTTM = roe === undefined || roe === null
      ? 0
      : roe > 0.2 ? 2 : roe > 0.12 ? 1 : roe >= 0.05 ? 0 : -1;

    // 5. Free Cash Flow (TTM): >0 = +1, <=0 = -1
    const fcf = metric.freeCashFlowTTM;
    breakdown.freeCashFlowTTM = fcf === undefined || fcf === null
      ? 0
      : fcf > 0 ? 1 : -1;

    // 6. Debt/Equity: <0.8 = +2, 0.8–1.4 = +1, 1.4–2.5 = 0, >2.5 = -1
    let de = null;
    if (
      metric.totalDebt !== undefined &&
      metric.totalDebt !== null &&
      metric.totalEquity !== undefined &&
      metric.totalEquity !== null &&
      Number(metric.totalEquity) !== 0
    ) {
      de = Number(metric.totalDebt) / Number(metric.totalEquity);
    }
    breakdown.debtEquity = de === null
      ? 0
      : de < 0.8 ? 2 : de < 1.4 ? 1 : de <= 2.5 ? 0 : -1;

    // 7. Interest Coverage: >8 = +2, 3–8 = +1, 1–3 = 0, <1 = -1
    const ic = metric.interestCoverage;
    breakdown.interestCoverage = ic === undefined || ic === null
      ? 0
      : ic > 8 ? 2 : ic > 3 ? 1 : ic >= 1 ? 0 : -1;

    // 8. Gross Margin (TTM): >0.55 = +2, 0.38–0.55 = +1, 0.25–0.38 = 0, <0.25 = -1
    const gross = metric.grossMarginTTM;
    breakdown.grossMarginTTM = gross === undefined || gross === null
      ? 0
      : gross > 0.55 ? 2 : gross > 0.38 ? 1 : gross >= 0.25 ? 0 : -1;

    // 9. Net Profit Margin (TTM): >0.18 = +2, 0.09–0.18 = +1, 0–0.09 = 0, <0 = -1
    const net = metric.netProfitMarginTTM;
    breakdown.netProfitMarginTTM = net === undefined || net === null
      ? 0
      : net > 0.18 ? 2 : net > 0.09 ? 1 : net >= 0 ? 0 : -1;

    // 10. P/B Ratio (Annual): <2 = +2, 2–3.7 = +1, 3.7–8 = 0, >8 = -1
    const pb = metric.pbAnnual;
    breakdown.pbAnnual = pb === undefined || pb === null
      ? 0
      : pb < 2 ? 2 : pb < 3.7 ? 1 : pb <= 8 ? 0 : -1;

    // 11. Dividend Yield (Indicated Annual): >0.035 = +2, 0.015-0.035 = +1, 0–0.015 = 0, <0 = -1
    const dy = metric.dividendYieldIndicatedAnnual;
    breakdown.dividendYieldIndicatedAnnual = dy === undefined || dy === null
      ? 0
      : dy > 0.035 ? 2 : dy > 0.015 ? 1 : dy >= 0 ? 0 : -1;

    // Total score: sum
    const scoreList = Object.values(breakdown);
    const totalScore = scoreList.reduce((a, b) => a + b, 0);

    // Disposition mapping
    let disposition = "Hold";
    if (totalScore >= 13) disposition = "Strong Buy";
    else if (totalScore >= 8) disposition = "Buy";
    else if (totalScore >= 3) disposition = "Hold";
    else if (totalScore >= -2) disposition = "Sell";
    else disposition = "Strong Sell";

    return { totalScore, disposition, breakdown };
  }

  // Wrapper to comply with old call signature
  function getMetricScoreAndDisposition(metric, stockPriceValue) {
    // Just use the evaluateStock function and relabel as existing contract
    const result = evaluateStock(metric);
    // Map differences in param naming for consumers:
    // - individualScores (old) = breakdown (new)
    return {
      totalScore: result.totalScore,
      disposition: result.disposition,
      individualScores: result.breakdown
    };
  }

  // Helper: Format value for table cell (now handles disposition column)
  function getMetricValue(metric, key) {
    if (key === "disposition") {
      // Calculate the disposition only if metric is present
      const { disposition } = getMetricScoreAndDisposition(metric, stockPrice);
      // Display as a badge
      if (!metric) return "N/A";
      let color, bg;
      // New: Five buckets colorization
      switch (disposition) {
        case "Strong Buy":
          color = "#fff";
          bg = "#1976d2"; // blue accent for strong buy
          break;
        case "Buy":
          color = "#fff";
          bg = "#43a047"; // green
          break;
        case "Hold":
          color = "#fff";
          bg = "#f9a825"; // amber yellow
          break;
        case "Sell":
          color = "#fff";
          bg = "#d32f2f"; // red
          break;
        case "Strong Sell":
          color = "#fff";
          bg = "#7b1fa2"; // deep purple for strong sell
          break;
        default: // N/A or unknown
          color = "#888";
          bg = "#e0e0e0";
      }
      return (
        <span style={{
          display: "inline-block",
          fontWeight: 700,
          fontSize: "0.98em",
          color,
          background: bg,
          borderRadius: 7,
          padding: "5px 16px",
          margin: "0 3px"
        }}>{disposition}</span>
      );
    }
    // Special case: render Current Stock Price column
    if (key === "currentStockPrice") {
      if (priceLoading) return "Loading...";
      if (priceError) return "N/A";
      if (stockPrice === null || stockPrice === undefined || isNaN(stockPrice))
        return "N/A";
      // Show with $ and 2 decimals
      return "$" + Number(stockPrice).toFixed(2);
    }
    if (!metric) return "N/A";
    // Special case for 'debtEquity'
    if (key === "debtEquity") {
      if (
        metric.totalDebt !== undefined &&
        metric.totalDebt !== null &&
        metric.totalEquity !== undefined &&
        metric.totalEquity !== null &&
        Number(metric.totalEquity) !== 0
      ) {
        return (Number(metric.totalDebt) / Number(metric.totalEquity)).toFixed(4);
      }
      return "N/A";
    }
    const v = metric[key];
    if (v === undefined || v === null || v === "") return "N/A";
    // Show as percent if the attribute is a margin or yield
    if (
      key === "grossMarginTTM" ||
      key === "netProfitMarginTTM" ||
      key === "dividendYieldIndicatedAnnual" ||
      key === "revenueGrowthTTMYoy"
    ) {
      return typeof v === "number" ? (v * 100).toFixed(2) + "%" : v + "%";
    }
    // Format ratio to 2 decimals
    if (
      key === "peNormalizedAnnual" ||
      key === "pbAnnual" ||
      key === "roeTTM" ||
      key === "interestCoverage"
    ) {
      return Number(v).toFixed(2);
    }
    // Everything else: keep as is (to 2 decimals if number)
    return typeof v === "number" ? v.toFixed(2) : v;
  }

  // Helper to render Finnhub status badge
  function renderStatusBadge(status) {
    let label, color, bg, icon;

    switch (status) {
      case "connecting":
        label = "Connecting to Finnhub…";
        color = "#856404";
        bg = "#fff3cd";
        icon = "⏳";
        break;
      case "connected":
        label = "Connected to Finnhub API";
        color = "#155724";
        bg = "#d4edda";
        icon = "✅";
        break;
      case "error":
        label = "Error Connecting to Finnhub";
        color = "#721c24";
        bg = "#f8d7da";
        icon = "❌";
        break;
      default:
        label = "Unknown";
        color = "#6c757d";
        bg = "#e2e3e5";
        icon = "❓";
    }

    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 600,
          fontSize: "1rem",
          background: bg,
          color,
          border: `1px solid ${color}`,
          borderRadius: 8,
          padding: "6px 18px",
          margin: "12px auto 18px",
          maxWidth: 340,
          transition: "background 0.3s,color 0.3s",
        }}
        aria-live="polite"
        data-testid="finnhub-status"
      >
        <span style={{ fontSize: "1.25em", marginRight: 8 }}>{icon}</span>
        {label}
      </div>
    );
  }

  // Render main content
  return (
    <div className="App">
      <header className="App-header">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>

        {/* Finnhub API Connection Status (top area) */}
        {renderStatusBadge(connectionStatus)}

        <h1>S&amp;P 500 Stock Dashboard</h1>
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
            justifyContent: "center",
            margin: "18px 0 8px 0",
            fontSize: "1rem",
          }}
          autoComplete="off"
        >
          <label htmlFor="ticker-input" style={{ fontWeight: 600 }}>
            Ticker:
          </label>
          <input
            style={{
              fontSize: "1rem",
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid #ddd",
              fontFamily: "monospace",
              width: 102,
              minWidth: 60,
              outline: "none",
            }}
            id="ticker-input"
            name="ticker"
            value={inputTicker}
            onChange={(e) => setInputTicker(e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase())}
            maxLength={8}
            placeholder="AAPL"
            autoFocus
            required
            aria-label="Ticker symbol"
            data-testid="ticker-input"
          />
          <button
            type="submit"
            style={{
              background: "var(--button-bg)",
              color: "var(--button-text)",
              padding: "7px 22px",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: "1rem",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            Search
          </button>
        </form>

        <section
          style={{
            background: "var(--bg-secondary)",
            padding: 20,
            borderRadius: 12,
            margin: "2rem auto",
            maxWidth: 890,
            boxShadow: "0 2px 8px rgba(25, 118, 210, 0.07)",
            minHeight: 180,
            width: "100%",
          }}
        >
          <h2 style={{ margin: "0 0 0.75rem 0" }}>
            {ticker ? <span>{ticker} Stock Metrics</span> : "Stock Metrics"}
          </h2>
          {loading && <div>Loading metrics...</div>}
          {apiError && (
            <div style={{ color: "red", marginBottom: 16 }}>Error: {apiError}</div>
          )}
          {metrics && metrics.metric ? (
            <div
              style={{
                textAlign: "center",
                fontSize: "1.13rem",
                width: "100%",
                overflowX: "auto",
                marginTop: 12,
              }}
            >
              {/* New table: attr names are columns, values for current ticker in one row */}
              <table
                style={{
                  width: "100%",
                  background: "var(--bg-primary)",
                  borderCollapse: "collapse",
                  borderRadius: 10,
                  boxShadow: "0 2px 6px rgba(50,50,50,0.045)",
                  margin: "0 auto",
                  minWidth: 740,
                  maxWidth: 1280,
                }}
                data-testid="metrics-table"
              >
                <thead>
                  <tr>
                    {TABLE_ATTRIBUTES.map((attr, ix) => (
                      <th
                        key={attr.key}
                        style={{
                          padding: "12px 12px",
                          fontWeight: 700,
                          borderBottom: "2px solid var(--border-color)",
                          background: "var(--bg-secondary)",
                          color: "var(--text-secondary)",
                          minWidth: 80,
                          fontSize: "1.08em",
                        }}
                      >
                        {attr.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {TABLE_ATTRIBUTES.map((attr, ix) => (
                      <td
                        key={attr.key}
                        style={{
                          padding: "10px 4px",
                          fontFamily: attr.key === "disposition" ? "inherit" : "monospace",
                          fontWeight: attr.key === "disposition" ? 700 : 600,
                          color: attr.key === "disposition" ? "inherit" : "var(--text-primary)",
                          background: "var(--bg-primary)",
                          borderBottom: "1px solid var(--border-color)",
                          fontSize: "1.09em",
                        }}
                        data-testid={`metriccell-${attr.key}`}
                      >
                        {getMetricValue(metrics.metric, attr.key)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            !loading && !apiError && <div>No metric data found.</div>
          )}
        </section>
        <footer style={{ marginTop: 24, color: "var(--text-secondary)" }}>
          <a
            className="App-link"
            href="https://finnhub.io/docs/api#stock-metrics"
            target="_blank"
            rel="noopener noreferrer"
          >
            Finnhub API Docs
          </a>
        </footer>
      </header>
    </div>
  );
}

export default App;
