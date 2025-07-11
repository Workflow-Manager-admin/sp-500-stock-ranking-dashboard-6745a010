import React, { useState, useEffect } from "react";
import "./App.css";

/**
 * PUBLIC_INTERFACE
 * Main Dashboard App for S&P 500 stock ranking, refactored for dynamic ticker search.
 * Lets users input a valid ticker symbol, fetches and displays Finnhub stock metrics as a table
 * with attribute names as columns and the corresponding values as a single row.
 *
 * Implements new weighted, normalized scoring and disposition per requirements.
 * Disposition is based on a sum of weighted normalized metrics:
 *   ROE 20%, Revenue Growth YoY 15%, EPS 15%, Net Profit Margin 12%,
 *   Gross Margin 10%, P/E Ratio 10%, Price-to-Book Ratio 10%.
 * Dividend Yield is no longer part of the score or displayed.
 */

function App() {
  const [theme, setTheme] = useState("light");
  const [ticker, setTicker] = useState("AAPL"); // default starting ticker
  const [inputTicker, setInputTicker] = useState("AAPL");
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Company info state
  const [companyName, setCompanyName] = useState("");
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companyError, setCompanyError] = useState(null);

  // Stock price state
  const [stockPrice, setStockPrice] = useState(null);
  const [priceError, setPriceError] = useState(null);
  const [priceLoading, setPriceLoading] = useState(false);

  // Finnhub connection status: 'connecting' | 'connected' | 'error'
  const [connectionStatus, setConnectionStatus] = useState("connecting");

  // Table attributes—Dividend Yield now shown, but NOT used in scoring or disposition
  const TABLE_ATTRIBUTES = [
    { label: "Disposition (Recommendation)", key: "disposition", isDisposition: true },
    { label: "Current Stock Price", key: "currentStockPrice", isPrice: true },
    { label: "EPS (TTM)", key: "epsTTM" },
    { label: "Dividend Yield (%)", key: "dividendYieldIndicatedAnnual" }, // ADDED
    { label: "P/E Ratio (Normalized Annual)", key: "peNormalizedAnnual" },
    { label: "Revenue Growth YoY (TTM)", key: "revenueGrowthTTMYoy" },
    { label: "ROE (TTM)", key: "roeTTM" },
    { label: "Free Cash Flow (TTM)", key: "freeCashFlowTTM" },
    { label: "Debt/Equity", key: "debtEquity" }, // calculated
    { label: "Interest Coverage", key: "interestCoverage" },
    { label: "Gross Margin (TTM)", key: "grossMarginTTM" },
    { label: "Net Profit Margin (TTM)", key: "netProfitMarginTTM" },
    { label: "P/B Ratio (Annual)", key: "pbAnnual" }
  ];

  // Effect: apply theme to <html>
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  // Fetch Finnhub metrics, company name, and price for current ticker (in parallel)
  useEffect(() => {
    async function fetchMetrics() {
      setLoading(true);
      setApiError(null);
      setConnectionStatus("connecting");
      const symbol = ticker.toUpperCase();
      const url = `https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=d1omsf9r01quemda0sugd1omsf9r01quemda0sv0`;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`API responded ${res.status}`);
        const data = await res.json();
        setMetrics(data);
        setConnectionStatus("connected");
      } catch (err) {
        setApiError(err.message);
        setMetrics(null);
        setConnectionStatus("error");
      } finally {
        setLoading(false);
      }
    }

    async function fetchCompanyName() {
      setCompanyLoading(true);
      setCompanyError(null);
      setCompanyName("");
      const symbol = ticker.toUpperCase();
      const url = `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=d1omsf9r01quemda0sugd1omsf9r01quemda0sv0`;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Company profile API responded ${res.status}`);
        const data = await res.json();
        if (data && data.name) {
          setCompanyName(data.name);
        } else {
          setCompanyName("");
        }
      } catch (err) {
        setCompanyError(err.message);
        setCompanyName("");
      } finally {
        setCompanyLoading(false);
      }
    }

    async function fetchStockPrice() {
      setPriceLoading(true);
      setPriceError(null);
      setStockPrice(null);
      const symbol = ticker.toUpperCase();
      const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=d1omsf9r01quemda0sugd1omsf9r01quemda0sv0`;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Price API responded ${res.status}`);
        const data = await res.json();
        if (typeof data.c === "number" && !isNaN(data.c)) {
          setStockPrice(data.c);
        } else {
          setStockPrice(null);
        }
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
      fetchCompanyName();
    }
  }, [ticker]);

  // PUBLIC_INTERFACE
  // Toggle light/dark theme
  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  // PUBLIC_INTERFACE
  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanTicker = inputTicker.trim().toUpperCase();
    if (cleanTicker.length > 0 && cleanTicker !== ticker) {
      setTicker(cleanTicker);
    }
  };

  // PUBLIC_INTERFACE
  /**
   * Weighted, normalized scoring/disposition: implement new formula per latest spec.
   * Disposition is now based on a sum of weighted (0–1 normalized) values:
   * - ROE (roeTTM): 20% (higher better; range: 0–0.35)
   * - Revenue Growth YoY: 15% (higher better; range: -0.1–0.25)
   * - EPS (TTM): 15% (higher better; range: 0–10)
   * - Net Profit Margin: 12% (higher better; 0–0.25)
   * - Gross Margin: 10% (higher better; 0.15–0.65)
   * - P/E Ratio: 10% (lower better; optimal zone: 8–18; 0–40 normalized, 1 in optimal zone)
   * - PB Ratio: 10% (lower better; optimal zone: 1–3.5; 0–8 normalized, 1 in optimal zone)
   * Returns: { totalScore (0–1), disposition, breakdown }
   */
  function evaluateStock(metric) {
    if (!metric) return { totalScore: 0, disposition: "N/A", breakdown: {} };

    // Normalization helper (clamp between 0-1)
    const norm = (value, min, max) => {
      if (value === undefined || value === null || isNaN(value)) return 0;
      if (max > min) {
        if (value <= min) return 0;
        if (value >= max) return 1;
        return (value - min) / (max - min);
      }
      return 0;
    };

    // Lower-is-better normalization for right-skewed ratios, but optimal "middle" for zone (P/E, PB)
    function peScore(pe) {
      if (pe === undefined || pe === null || isNaN(pe)) return 0;
      if (pe >= 8 && pe <= 18) return 1;
      if (pe < 8 && pe >= 0)     return (pe - 0) / (8 - 0) * 0.5 + 0.5;
      if (pe > 18 && pe <= 40)   return 1 - ((pe - 18) / (40 - 18)) * 1.0;
      return 0;
    }
    function pbScore(pb) {
      if (pb === undefined || pb === null || isNaN(pb)) return 0;
      if (pb >= 1 && pb <= 3.5) return 1;
      if (pb < 1 && pb >= 0)    return (pb - 0) / (1 - 0) * 0.6 + 0.4;
      if (pb > 3.5 && pb <= 8)  return 1 - ((pb - 3.5) / (8 - 3.5)) * 1.0;
      return 0;
    }

    // --- Scoring breakdown ---
    const breakdown = {};

    // Metric 1: ROE (TTM)
    const roe = metric.roeTTM;
    breakdown.roeTTM = norm(roe, 0, 0.35);

    // Metric 2: Revenue Growth YoY (TTM)
    const rev = metric.revenueGrowthTTMYoy;
    breakdown.revenueGrowthTTMYoy = norm(rev, -0.1, 0.25);

    // Metric 3: EPS (TTM)
    const eps = metric.epsTTM;
    breakdown.epsTTM = norm(eps, 0, 10);

    // Metric 4: Net Profit Margin (TTM)
    const net = metric.netProfitMarginTTM;
    breakdown.netProfitMarginTTM = norm(net, 0, 0.25);

    // Metric 5: Gross Margin (TTM)
    const gross = metric.grossMarginTTM;
    breakdown.grossMarginTTM = norm(gross, 0.15, 0.65);

    // Metric 6: P/E Ratio (Normalized Annual)
    const pe = metric.peNormalizedAnnual;
    breakdown.peNormalizedAnnual = peScore(pe);

    // Metric 7: P/B Ratio (Annual)
    const pb = metric.pbAnnual;
    breakdown.pbAnnual = pbScore(pb);

    // Weights
    const WEIGHTS = {
      roeTTM: 0.20,
      revenueGrowthTTMYoy: 0.15,
      epsTTM: 0.15,
      netProfitMarginTTM: 0.12,
      grossMarginTTM: 0.10,
      peNormalizedAnnual: 0.10,
      pbAnnual: 0.10,
    };

    // Compose weighted sum
    let totalScore = 0.0;
    totalScore += breakdown.roeTTM * WEIGHTS.roeTTM;
    totalScore += breakdown.revenueGrowthTTMYoy * WEIGHTS.revenueGrowthTTMYoy;
    totalScore += breakdown.epsTTM * WEIGHTS.epsTTM;
    totalScore += breakdown.netProfitMarginTTM * WEIGHTS.netProfitMarginTTM;
    totalScore += breakdown.grossMarginTTM * WEIGHTS.grossMarginTTM;
    totalScore += breakdown.peNormalizedAnnual * WEIGHTS.peNormalizedAnnual;
    totalScore += breakdown.pbAnnual * WEIGHTS.pbAnnual;

    // Clamp to [0,1]
    totalScore = Math.max(0, Math.min(1, totalScore));

    // Breakpoints (sample mapping; tuneable)
    // 0.80–1.00: Strong Buy, 0.65–0.80: Buy, 0.45–0.65: Hold, 0.30–0.45: Sell, <0.30: Strong Sell
    let disposition = "Hold";
    if (totalScore >= 0.80) disposition = "Strong Buy";
    else if (totalScore >= 0.65) disposition = "Buy";
    else if (totalScore >= 0.45) disposition = "Hold";
    else if (totalScore >= 0.30) disposition = "Sell";
    else disposition = "Strong Sell";

    return { totalScore, disposition, breakdown };
  }

  // Wrapper to comply with old call signature
  function getMetricScoreAndDisposition(metric, stockPriceValue) {
    const result = evaluateStock(metric);
    return {
      totalScore: result.totalScore,
      disposition: result.disposition,
      individualScores: result.breakdown
    };
  }

  // Format value for table cell (now handles disposition column)
  function getMetricValue(metric, key) {
    if (key === "disposition") {
      const { disposition, totalScore } = getMetricScoreAndDisposition(metric, stockPrice);
      if (!metric) return "N/A";
      let color, bg;
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
        default:
          color = "#888";
          bg = "#e0e0e0";
      }
      return (
        <span style={{
          display: "inline-flex",
          alignItems: "center",
          fontWeight: 700,
          fontSize: "0.98em",
          color,
          background: bg,
          borderRadius: 7,
          padding: "5px 16px",
          margin: "0 3px"
        }}>
          {disposition}
          <span
            style={{
              display: "inline-block",
              background: "#fff",
              color: bg,
              borderRadius: 5,
              fontWeight: 600,
              fontSize: "0.92em",
              marginLeft: 10,
              padding: "2px 9px",
              lineHeight: 1.1,
              border: `1.3px solid ${bg}`,
              boxShadow: "0 1px 2px rgba(20,20,30,0.07)",
              minWidth: 52,
              textAlign: "center",
            }}
            aria-label="Score"
            title={`Score: ${(totalScore*100).toFixed(1)} / 100`}
          >
            {(totalScore*100).toFixed(1)}
            <span style={{ fontWeight: 400, fontSize: "0.87em", color: "#555", marginLeft: 3 }}>/100</span>
          </span>
        </span>
      );
    }
    // Special case: render Current Stock Price column
    if (key === "currentStockPrice") {
      if (priceLoading) return "Loading...";
      if (priceError) return "N/A";
      if (stockPrice === null || stockPrice === undefined || isNaN(stockPrice))
        return "N/A";
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
    // Show as percent if the attribute is a margin or YoY
    if (
      key === "grossMarginTTM" ||
      key === "netProfitMarginTTM" ||
      key === "revenueGrowthTTMYoy"
    ) {
      return typeof v === "number" ? (v * 100).toFixed(2) + "%" : v + "%";
    }
    // Show Dividend Yield as percent (if present)
    if (key === "dividendYieldIndicatedAnnual") {
      return typeof v === "number" ? (v * 100).toFixed(2) + "%" : (v ? v + "%" : "N/A");
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
              padding: "7px 19px",
              borderRadius: 8,
              border: "2px solid #1976d2",
              fontFamily: "monospace",
              width: 190,
              minWidth: 100,
              background: "#eef4fb",
              outline: "none",
              fontWeight: 700,
              color: "#1565c0",
              letterSpacing: "0.15em",
              boxShadow: "0 1px 3px rgba(20,40,110,0.09)",
              transition: "border 0.15s, box-shadow 0.15s",
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
          {/* Display company name above the metrics table */}
          <div style={{ marginBottom: "0.4rem", minHeight: 32, textAlign: "center" }}>
            {companyLoading ? (
              <span style={{ fontWeight: 500, fontSize: "1.08em", color: "#1976d2" }}>
                Fetching company info...
              </span>
            ) : companyError ? (
              <span style={{ color: "#d32f2f", fontSize: "0.98em", fontWeight: 500 }}>
                [Failed to fetch company name]
              </span>
            ) : companyName ? (
              <span style={{ fontSize: "1.35em", fontWeight: 700, color: "#1976d2", letterSpacing: 0.2 }}>
                {companyName}
              </span>
            ) : (
              <span></span>
            )}
          </div>
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
                    {TABLE_ATTRIBUTES.map((attr) => (
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
                    {TABLE_ATTRIBUTES.map((attr) => (
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
