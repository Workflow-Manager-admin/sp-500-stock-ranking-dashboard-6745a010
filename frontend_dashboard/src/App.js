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

  // Effect: apply theme to <html>
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  // Fetch Finnhub metrics for AAPL on mount
  useEffect(() => {
    /**
     * Fetch metrics for AAPL from Finnhub API.
     * Uses REACT_APP_FINNHUB_API_KEY (if set), otherwise falls back to default demo key.
     */
    async function fetchAaplMetrics() {
      setLoading(true);
      setApiError(null);
      const fallbackKey = "d1omsf9r01quemda0sugd1omsf9r01quemda0sv0";
      const key =
        (typeof process !== "undefined" &&
          process.env &&
          process.env.REACT_APP_FINNHUB_API_KEY) ||
        fallbackKey;
      const url = `https://finnhub.io/api/v1/stock/metric?symbol=AAPL&metric=all&token=${key}`;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`API responded ${res.status}`);
        const data = await res.json();
        setMetrics(data);
        // For debug confirmation
        // eslint-disable-next-line no-console
        console.log("AAPL Metrics fetched from Finnhub:", data);
      } catch (err) {
        setApiError(err.message);
        setMetrics(null);
      } finally {
        setLoading(false);
      }
    }
    fetchAaplMetrics();
  }, []);

  // PUBLIC_INTERFACE
  // Toggle light/dark theme
  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

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
            <div style={{ textAlign: "left", fontSize: "1.08rem" }}>
              <div>
                <strong>52 Week High:</strong> {metrics.metric["52WeekHigh"]}
              </div>
              <div>
                <strong>52 Week Low:</strong> {metrics.metric["52WeekLow"]}
              </div>
              <div>
                <strong>Market Cap (USD):</strong>{" "}
                {metrics.metric.marketCapitalization}
              </div>
              <div>
                <strong>P/E Ratio (TTM):</strong> {metrics.metric.peTTM}
              </div>
              <div>
                <strong>Dividend Yield (%):</strong>{" "}
                {
                  metrics.metric.dividendYieldIndicatedAnnual
                }
              </div>
              {/* Add more metrics as required for confirmation */}
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
