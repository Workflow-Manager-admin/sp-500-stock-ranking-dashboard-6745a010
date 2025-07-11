import React, { useState, useEffect } from "react";
import "./App.css";

/**
 * PUBLIC_INTERFACE
 * Main Dashboard App for S&P 500 stock ranking.
 * Fetches and displays real-time AAPL stock metrics from Finnhub.
 */
function App() {
  const [theme, setTheme] = useState("light");
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Finnhub connection status: 'connecting' | 'connected' | 'error'
  const [connectionStatus, setConnectionStatus] = useState("connecting");

  // Effect: apply theme to <html>
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  // Fetch Finnhub metrics for AAPL on mount (hardcoded URL and key, no process.env)
  useEffect(() => {
    /**
     * Fetch metrics for AAPL from Finnhub API.
     * Uses the specific provided API link and key as per requirements.
     * Removes all dynamic environment variable usage.
     */
    async function fetchAaplMetrics() {
      setLoading(true);
      setApiError(null);
      setConnectionStatus("connecting");
      const url =
        "https://finnhub.io/api/v1/stock/metric?symbol=AAPL&metric=all&token=d1omsf9r01quemda0sugd1omsf9r01quemda0sv0";
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`API responded ${res.status}`);
        const data = await res.json();
        setMetrics(data);
        setConnectionStatus("connected");
        // For debug confirmation
        // eslint-disable-next-line no-console
        console.log("AAPL Metrics fetched from Finnhub:", data);
      } catch (err) {
        setApiError(err.message);
        setMetrics(null);
        setConnectionStatus("error");
      } finally {
        setLoading(false);
      }
    }
    fetchAaplMetrics();
  }, []);

  // PUBLIC_INTERFACE
  // Toggle light/dark theme
  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

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
        <p>
          <strong>Demo: Real-time Finnhub API data for <code>AAPL</code></strong>
        </p>
        <section
          style={{
            background: "var(--bg-secondary)",
            padding: 20,
            borderRadius: 12,
            margin: "2rem auto",
            maxWidth: 480,
            boxShadow: "0 2px 8px rgba(25, 118, 210, 0.07)",
            minHeight: 180,
          }}
        >
          <h2 style={{margin: "0 0 0.75rem 0"}}>AAPL Stock Metrics</h2>
          {loading && <div>Loading metrics...</div>}
          {apiError && (
            <div style={{ color: "red", marginBottom: 16 }}>Error: {apiError}</div>
          )}
          {metrics && metrics.metric ? (
            <div style={{ textAlign: "left", fontSize: "1.08rem", width: "100%", overflowX: "auto" }}>
              <table
                style={{
                  minWidth: 820,
                  width: "100%",
                  borderCollapse: "collapse",
                  background: "var(--bg-primary)",
                  boxShadow: "0 2px 8px rgba(25, 118, 210, 0.06)",
                  borderRadius: 10,
                  margin: "0 auto"
                }}
                aria-label="AAPL Stock Metrics Table"
              >
                <thead>
                  <tr style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}>
                    <th style={{ padding: "10px 14px", borderBottom: "2px solid var(--border-color)" }}>Indicator</th>
                    <th style={{ padding: "10px 14px", borderBottom: "2px solid var(--border-color)" }}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Earnings Per Share (TTM)</td>
                    <td>{metrics.metric.epsTTM ?? "—"}</td>
                  </tr>
                  <tr>
                    <td>Price-to-Earnings Ratio (Normalized, Annual)</td>
                    <td>{metrics.metric.peNormalizedAnnual ?? "—"}</td>
                  </tr>
                  <tr>
                    <td>Revenue Growth YoY (TTM)</td>
                    <td>
                      {metrics.metric.revenueGrowthTTMYoy !== undefined && metrics.metric.revenueGrowthTTMYoy !== null
                        ? (metrics.metric.revenueGrowthTTMYoy * 100).toFixed(2) + "%"
                        : "—"}
                    </td>
                  </tr>
                  <tr>
                    <td>Return on Equity (ROE, TTM)</td>
                    <td>
                      {metrics.metric.roeTTM !== undefined && metrics.metric.roeTTM !== null
                        ? (metrics.metric.roeTTM * 100).toFixed(2) + "%"
                        : "—"}
                    </td>
                  </tr>
                  <tr>
                    <td>Free Cash Flow (TTM)</td>
                    <td>{metrics.metric.freeCashFlowTTM ?? "—"}</td>
                  </tr>
                  <tr>
                    <td>Debt-to-Equity Ratio</td>
                    <td>
                      {(metrics.metric.totalDebt != null &&
                        metrics.metric.totalEquity != null &&
                        Number(metrics.metric.totalEquity) !== 0)
                        ? (Number(metrics.metric.totalDebt) / Number(metrics.metric.totalEquity)).toFixed(3)
                        : "—"}
                    </td>
                  </tr>
                  <tr>
                    <td>Interest Coverage Ratio</td>
                    <td>{metrics.metric.interestCoverage ?? "—"}</td>
                  </tr>
                  <tr>
                    <td>Gross Profit Margin (TTM)</td>
                    <td>
                      {metrics.metric.grossMarginTTM !== undefined && metrics.metric.grossMarginTTM !== null
                        ? (metrics.metric.grossMarginTTM * 100).toFixed(2) + "%"
                        : "—"}
                    </td>
                  </tr>
                  <tr>
                    <td>Net Profit Margin (TTM)</td>
                    <td>
                      {metrics.metric.netProfitMarginTTM !== undefined && metrics.metric.netProfitMarginTTM !== null
                        ? (metrics.metric.netProfitMarginTTM * 100).toFixed(2) + "%"
                        : "—"}
                    </td>
                  </tr>
                  <tr>
                    <td>Price-to-Book Ratio (Annual)</td>
                    <td>{metrics.metric.pbAnnual ?? "—"}</td>
                  </tr>
                  <tr>
                    <td>Dividend Yield (Indicated Annual)</td>
                    <td>
                      {metrics.metric.dividendYieldIndicatedAnnual !== undefined && metrics.metric.dividendYieldIndicatedAnnual !== null
                        ? (metrics.metric.dividendYieldIndicatedAnnual * 100).toFixed(2) + "%"
                        : "—"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            !loading &&
            !apiError && <div>No metric data found.</div>
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
