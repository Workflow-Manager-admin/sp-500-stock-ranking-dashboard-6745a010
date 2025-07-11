import React, { useEffect, useState, useMemo } from "react";
import "./App.css";

// PUBLIC_INTERFACE
// Disposition badge color utility
function getDispositionColor(disposition) {
  if (disposition === "Buy") return "#43a047";
  if (disposition === "Hold") return "#ffa726";
  if (disposition === "Sell") return "#ef5350";
  return "#bdbdbd";
}

// PUBLIC_INTERFACE
// Score calculation (simplified, real logic would consider metrics weights)
function calcDisposition(metrics) {
  // weights and thresholds could be tuned/refined
  if (!metrics) return "Hold";
  let score = 0;
  if (metrics.peRatio !== undefined && metrics.peRatio < 30) score += 1;
  if (metrics.marketCap !== undefined && metrics.marketCap > 100e9) score += 1;
  if (metrics.epsGrowth !== undefined && metrics.epsGrowth > 0.10) score += 1;
  if (metrics.profitMargin !== undefined && metrics.profitMargin > 0.2) score += 1;
  if (metrics.divYield !== undefined && metrics.divYield > 0.01) score += 1;
  if (metrics.roe !== undefined && metrics.roe > 0.15) score += 1;
  if (metrics.revenueGrowth !== undefined && metrics.revenueGrowth > 0.07) score += 1;
  if (metrics.currentRatio !== undefined && metrics.currentRatio > 1.5) score += 1;
  if (metrics.beta !== undefined && metrics.beta < 1.2) score += 1;
  if (metrics.debtToEquity !== undefined && metrics.debtToEquity < 1) score += 1;
  if (score >= 8) return "Buy";
  if (score >= 5) return "Hold";
  return "Sell";
}

// Demo S&P 500 tickers (in a real app fetch entire list; Finnhub demo API key is very limited)
const DEFAULT_TICKERS = [
  "AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA", "TSLA", "BRK.B", "JPM", "V",
];

// Map for demo display, in a real app, fetch company names dynamically
const TICKER_NAMES = {
  "AAPL": "Apple Inc.",
  "MSFT": "Microsoft Corp.",
  "GOOGL": "Alphabet Inc.",
  "AMZN": "Amazon.com Inc.",
  "META": "Meta Platforms Inc.",
  "NVDA": "NVIDIA Corp.",
  "TSLA": "Tesla Inc.",
  "BRK.B": "Berkshire Hathaway Inc. (B)",
  "JPM": "JPMorgan Chase & Co.",
  "V": "Visa Inc.",
};

// Finnhub API Key: In real-world use, secure via backend; demo key is public, rate-limited.
const FINNHUB_API_KEY = "c0v1i2aad3ibbnlc1hgg"; // DEMO key
const FINNHUB_BASE = "https://finnhub.io/api/v1";

// Helper to fetch profile, quote, and metrics for a given ticker (parallel fetch)
async function fetchCompanyData(ticker) {
  try {
    const [profileRes, quoteRes, metricsRes] = await Promise.all([
      fetch(`${FINNHUB_BASE}/stock/profile2?symbol=${ticker}&token=${FINNHUB_API_KEY}`),
      fetch(`${FINNHUB_BASE}/quote?symbol=${ticker}&token=${FINNHUB_API_KEY}`),
      fetch(`${FINNHUB_BASE}/stock/metric?symbol=${ticker}&metric=all&token=${FINNHUB_API_KEY}`)
    ]);
    const profile = await profileRes.json();
    const quote = await quoteRes.json();
    const metricsRaw = await metricsRes.json();

    // Extract metrics needed for the 10 parameters
    const m = metricsRaw && metricsRaw.metric ? metricsRaw.metric : {};
    const metrics = {
      peRatio: m.peNormalizedAnnual,
      marketCap: m.marketCapitalization,
      epsGrowth: m.epsGrowth3Y,
      profitMargin: m.netProfitMarginAnnual,
      divYield: m.dividendYieldIndicatedAnnual,
      roe: m.roeAnnual,
      revenueGrowth: m.revenueGrowth3Y,
      currentRatio: m.currentRatioAnnual,
      beta: m.beta,
      debtToEquity: m.totalDebt/((m.marketCapitalization || 1)), // fallback if missing
    };

    return {
      ticker,
      name: profile.name || TICKER_NAMES[ticker] || ticker,
      logo: profile.logo || undefined,
      quote,
      metrics,
      disposition: calcDisposition(metrics),
      updated: new Date(),
    };
  } catch (e) {
    return { ticker, name: TICKER_NAMES[ticker] || ticker, error: true };
  }
}

// Chart.js basic line chart import
function LineChart({ data, label, color }) {
  // Only use native SVG for no dep, for a real project use chart.js or recharts
  if (!data || data.length < 2) return <svg width="100%" height="60"><text x="10" y="35" fill="#aaa">No data</text></svg>;

  // Compute scales
  const w = 200, h = 60, pad = 18;
  const minV = Math.min(...data), maxV = Math.max(...data);
  const norm = v => h - pad - ((v - minV) / (maxV-minV||1)) * (h - 2*pad);

  let path = "";
  data.forEach((d, i) => {
    path += (i === 0 ? "M" : "L") + (pad + (i * (w - 2*pad)) / (data.length - 1)) + "," + norm(d) + " ";
  });

  return (
    <svg width={w} height={h}>
      <polyline fill="none" stroke={color || "#1976d2"} strokeWidth="2" points={data.map(
        (d,i) => `${pad + (i*(w-2*pad))/(data.length-1)},${norm(d)}`
      ).join(" ")} />
      <text x={pad} y={10} fontSize="11" fill="#888">{label}</text>
      <circle r="3" fill="#1976d2" cx={pad} cy={norm(data[0])}/>
      <circle r="3" fill="#1976d2" cx={w-pad} cy={norm(data[data.length-1])}/>
    </svg>
  );
}

// PUBLIC_INTERFACE
function Navbar({ onSearch, searchValue }) {
  return (
    <nav style={{
      background: "var(--bg-secondary)",
      borderBottom: "1px solid var(--border-color)",
      padding: "16px",
      display: "flex", justifyContent: "space-between", alignItems: "center",
      position: "sticky", top: 0, zIndex: 110,
    }}>
      <span style={{ fontWeight: 700, fontSize: 22, color: "#1976d2" }}>S&amp;P 500 Dashboard</span>
      <input
        type="text"
        className="sp500-search"
        placeholder="Search company or ticker..."
        value={searchValue}
        onChange={e => onSearch(e.target.value)}
        style={{
          background: "var(--bg-primary)",
          color: "var(--text-primary)",
          border: "1px solid var(--border-color)",
          borderRadius: 8,
          padding: "6px 14px",
          fontSize: 16,
          marginLeft: 'auto',
          minWidth: 200,
          transition: "all .25s"
        }}
      />
    </nav>
  );
}

// PUBLIC_INTERFACE
function Sidebar({ tickers, selected, onSelect, search }) {
  return (
    <aside className="sp500-sidebar" style={{
      width: 180,
      background: "var(--bg-secondary)",
      borderRight: "1px solid var(--border-color)",
      height: "calc(100vh - 56px)",
      overflowY: "auto",
      position: "sticky",
      top: 56,
      zIndex: 100,
    }}>
      <ul style={{ listStyle: "none", margin: 0, padding: 8 }}>
        {tickers.filter(t =>
          TICKER_NAMES[t].toLowerCase().includes(search.toLowerCase()) || t.toLowerCase().includes(search.toLowerCase())
        ).map(ticker =>
          <li key={ticker}>
            <button
              className={`sidebar-ticker ${selected === ticker ? "selected" : ""}`}
              style={{
                width: "100%",
                background: selected === ticker ? "#e3f2fd" : "transparent",
                border: "none",
                padding: "10px 8px",
                marginBottom: 2,
                display: "flex",
                alignItems: "center",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: 500,
                color: "var(--text-primary)",
                fontSize: 15,
                transition: "all .18s"
              }}
              onClick={() => onSelect(ticker)}
            >
              <span style={{ marginRight: 8 }}>{ticker}</span>
              <span style={{ fontSize: 13, opacity: .7 }}>{TICKER_NAMES[ticker]}</span>
            </button>
          </li>
        )}
      </ul>
    </aside>
  );
}

// PUBLIC_INTERFACE
function DispositionBadge({ disposition }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 12px",
      borderRadius: "1em",
      fontWeight: "600",
      background: getDispositionColor(disposition),
      color: "#fff",
      fontSize: 15,
      letterSpacing: ".02em"
    }}>{disposition}</span>
  );
}

// PUBLIC_INTERFACE
function MetricBar({ label, value, good, bad, unit }) {
  let percent;
  if (good !== undefined && bad !== undefined && !isNaN(value)) {
    // for simplicity linear, in real app use dynamic scale and invert as needed for negative metrics
    percent = (value - bad) / (good - bad);
    percent = Math.max(0, Math.min(1, percent));
  }
  return (
    <div style={{ marginBottom: 10 }}>
      <span style={{ display: "inline-block", width: 110, color: "#555" }}>{label}</span>
      <div style={{ display: "inline-block", width: 100, verticalAlign: "middle" }}>
        <div style={{
          width: "100%", height: 7, background: "#eee", borderRadius: 6, overflow: "hidden"
        }}>
          <div style={{
            width: `${percent * 100 || 0}%`, height: 7, borderRadius: 6,
            background: percent > 0.7 ? "#43a047" : percent > 0.4 ? "#ffa726" : "#ef5350",
            transition: "width .32s"
          }} />
        </div>
      </div>
      <span style={{ marginLeft: 8, fontWeight: "600", color: "#222" }}>{value !== undefined && value !== null ? value + (unit || "") : "–"}</span>
    </div>
  );
}

// PUBLIC_INTERFACE
function CompanyCard({ company, loading, error }) {
  if (loading) return <div style={{ padding: 19, textAlign: "center", color: "#888" }}>Loading...</div>;
  if (error || !company)
    return <div style={{ padding: 19, textAlign: "center", color: "#f44336" }}>Error fetching data.</div>;

  let { ticker, name, logo, quote, metrics, disposition } = company;
  return (
    <div style={{
      background: "var(--bg-primary)",
      borderRadius: 14,
      boxShadow: "0 2px 8px rgba(25,118,210,0.09)",
      maxWidth: 370,
      margin: "0 auto",
      marginTop: 30,
      padding: 22,
      position: "relative"
    }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        {logo && <img src={logo} alt={ticker} style={{ width: 44, height: 44, borderRadius: 8, marginRight: 13, background: "#fff", border: "1.5px solid #ececec" }} />}
        <div>
          <div style={{ fontSize: 21, fontWeight: 700, color: "var(--text-primary)" }}>{name}</div>
          <div style={{ fontSize: 16, color: "#888", fontWeight: 500 }}>{ticker}</div>
        </div>
        <div style={{ marginLeft: "auto" }}><DispositionBadge disposition={disposition} /></div>
      </div>
      <div style={{ marginTop: 18, marginBottom: 4 }}>
        <span style={{ fontSize: 15, color: "#597594" }}>Current price&nbsp;</span>
        <span style={{ fontWeight: 700, fontSize: 23, color: "#1565c0" }}>{quote && quote.c ? `$${quote.c}` : "—"}</span>
        <span style={{
          marginLeft: 17,
          color: quote && quote.dp > 0 ? "#43a047"
            : quote && quote.dp < 0 ? "#ef5350" : "#888",
          fontWeight: 700
        }}>
          {quote && quote.dp >= 0 ? "+" : ""}{quote && quote.dp ? quote.dp.toFixed(2) + "%" : ""}
        </span>
      </div>
      <hr style={{ border: "none", borderTop: "1px solid #f1f4f8", margin: "15px 0 12px 0" }} />
      <div>
        <MetricBar label="P/E Ratio" value={metrics.peRatio && metrics.peRatio.toFixed(2)} good={15} bad={35} />
        <MetricBar label="EPS Growth" value={metrics.epsGrowth && (metrics.epsGrowth*100).toFixed(1)} good={15} bad={0} unit="%" />
        <MetricBar label="Profit Margin" value={metrics.profitMargin && (metrics.profitMargin*100).toFixed(1)} good={25} bad={-10} unit="%" />
        <MetricBar label="Dividend Yield" value={metrics.divYield && (metrics.divYield*100).toFixed(2)} good={3} bad={0.1} unit="%" />
        <MetricBar label="ROE" value={metrics.roe && (metrics.roe*100).toFixed(1)} good={25} bad={5} unit="%" />
        <MetricBar label="Revenue Growth" value={metrics.revenueGrowth && (metrics.revenueGrowth*100).toFixed(1)} good={17} bad={-5} unit="%" />
        <MetricBar label="Current Ratio" value={metrics.currentRatio && metrics.currentRatio.toFixed(2)} good={2.5} bad={1} />
        <MetricBar label="Beta" value={metrics.beta && metrics.beta.toFixed(2)} good={0.9} bad={1.8} />
        <MetricBar label="Debt/Equity" value={metrics.debtToEquity && metrics.debtToEquity.toFixed(2)} good={0.2} bad={2} />
        <MetricBar label="Market Cap" value={metrics.marketCap ? (metrics.marketCap/1e9).toFixed(0) : undefined} good={200} bad={10} unit="B" />
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
// Dashboard/company ranking table with disposition badge and ability to filter & sort
function CompaniesTable({ data, selected, onSelect }) {
  if (!data || !data.length) return <div style={{ color: "#888", padding: 15 }}>No companies found.</div>;
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 13 }}>
      <thead>
        <tr style={{ fontWeight: 700, fontSize: 14 }}>
          <td style={{ padding: "7px 5px"}}>#</td>
          <td style={{ padding: "7px 5px"}}>Name</td>
          <td style={{ padding: "7px 5px"}}>Ticker</td>
          <td style={{ padding: "7px 5px"}}>Price</td>
          <td style={{ padding: "7px 5px"}}>Disposition</td>
        </tr>
      </thead>
      <tbody>
        {data.map((comp, idx) => 
          <tr key={comp.ticker}
            onClick={() => onSelect(comp.ticker)}
            style={{
              background: comp.ticker === selected ? "#e3f2fd" : undefined,
              cursor: "pointer",
              fontWeight: comp.ticker === selected ? 600 : 500,
              fontSize: 15
            }}>
            <td style={{ padding: "7px 5px" }}>{idx+1}</td>
            <td style={{ padding: "7px 5px" }}>{comp.name}</td>
            <td style={{ padding: "7px 5px" }}>{comp.ticker}</td>
            <td style={{ padding: "7px 5px" }}>{comp.quote && comp.quote.c ? `$${comp.quote.c}` : "—"}</td>
            <td style={{ padding: "7px 5px" }}>
              <DispositionBadge disposition={comp.disposition} />
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

/**
 * PUBLIC_INTERFACE
 * Minimal S&P 500 Dashboard entry point.
 * 
 * Renders only a modern, responsive search bar styled for the dashboard theme and
 * hides all rankings, company data, and metrics until search is performed.
 * 
 * This is the only element shown on first load.
 */
function App() {
  const [theme, setTheme] = useState("light");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [metricsData, setMetricsData] = useState(null);
  const [error, setError] = useState(null);

  // Apply theme to document root for CSS variable switching
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Finnhub Token from environment variable
  const FINNHUB_API_TOKEN = process.env.REACT_APP_FINNHUB_TOKEN;

  // When the user presses Enter or search input changes, fetch company metrics
  useEffect(() => {
    // Only search for an uppercase ticker with basic length (2+ chars), and not empty.
    const symbol = search.trim().toUpperCase();
    if (!symbol || symbol.length < 1) {
      setMetricsData(null);
      setError(null);
      setLoading(false);
      return;
    }

    // Debounce API call: Only fetch after user stops typing for 700ms
    const debounce = setTimeout(() => {
      setLoading(true);
      setError(null);
      setMetricsData(null);

      // PUBLIC_INTERFACE
      // Fetches metrics from Finnhub
      async function fetchMetrics() {
        try {
          // Check for missing token
          if (!FINNHUB_API_TOKEN) {
            throw new Error("API Token is missing. Please set REACT_APP_FINNHUB_TOKEN in your environment.");
          }
          const url = `https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${FINNHUB_API_TOKEN}`;
          const resp = await fetch(url);
          if (!resp.ok) throw new Error("No data found for this symbol or API request failed.");
          const json = await resp.json();

          // If Finnhub returns no metrics, simulate "no results"
          if (!json || Object.keys(json).length === 0 || !json.metric) {
            throw new Error("No metrics found for this symbol.");
          }
          setMetricsData({
            symbol,
            metrics: json.metric
          });
        } catch (err) {
          setError(err.message || "Error fetching data.");
        } finally {
          setLoading(false);
        }
      }

      fetchMetrics();
    }, 700);

    // Cleanup if user is typing fast
    return () => clearTimeout(debounce);
    // eslint-disable-next-line
  }, [search, FINNHUB_API_TOKEN]);

  // Render metrics data block
  function renderMetricsTable(metricsObj) {
    if (!metricsObj) return null;
    // Make a short list of interesting metrics (demo), sorted by relevance for user
    const METRIC_LABELS = [
      ["peNormalizedAnnual", "P/E Ratio"],
      ["revenueGrowth3Y", "Revenue Growth (3Y)"],
      ["roeAnnual", "ROE"],
      ["epsGrowth3Y", "EPS Growth (3Y)"],
      ["netProfitMarginAnnual", "Profit Margin"],
      ["marketCapitalization", "Market Cap"],
      ["dividendYieldIndicatedAnnual", "Dividend Yield"],
      ["currentRatioAnnual", "Current Ratio"],
      ["beta", "Beta"],
      ["totalDebt", "Total Debt"],
      ["debtToEquity", "Debt/Equity"],
      ["evToEbitda", "EV/EBITDA"],
    ];

    return (
      <div
        style={{
          marginTop: 26,
          marginBottom: 17,
          borderRadius: 12,
          background: "var(--bg-secondary)",
          boxShadow: "0 2px 12px rgba(25,118,210,0.09)",
          padding: 22,
          maxWidth: 390,
          width: "100%",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        <h2 style={{
          color: "#1976d2",
          fontWeight: 700,
          fontSize: 23,
          margin: "0 0 11px",
          textAlign: "center",
        }}>
          {metricsData.symbol}
        </h2>
        <table style={{ width: "100%", fontSize: 16, marginTop: 6, marginBottom: 0 }}>
          <tbody>
            {METRIC_LABELS.map(([key, label]) => (
              <tr key={key}>
                <td
                  style={{
                    color: "#434b57",
                    padding: "4px 9px 4px 0",
                    fontWeight: 500,
                    textAlign: "left",
                  }}
                >
                  {label}
                </td>
                <td
                  style={{
                    color: "#1565c0",
                    fontFamily: "Menlo, monospace",
                    padding: "4px 0",
                    textAlign: "right",
                  }}
                >
                  {metricsObj[key] !== undefined && metricsObj[key] !== null
                    ? typeof metricsObj[key] === "number"
                      ? Number(metricsObj[key]).toLocaleString(undefined, {
                          maximumFractionDigits: 3,
                          minimumFractionDigits: 0,
                        })
                      : metricsObj[key]
                    : <span style={{ color: "#aaa" }}>–</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="App" style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg-primary)"
    }}>
      <button
        className="theme-toggle"
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        onClick={() => setTheme(t => t === "light" ? "dark" : "light")}
        style={{ position: "absolute", top: 32, right: 32 }}
      >
        {theme === "light" ? "🌙 Dark" : "☀️ Light"}
      </button>
      <div style={{
        maxWidth: 440,
        width: "100%",
        padding: "44px 28px 36px 28px",
        borderRadius: "14px",
        background: "var(--bg-secondary)",
        boxShadow: "0 2px 22px rgba(25,118,210,0.055)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}>
        <span style={{
          fontWeight: 700,
          fontSize: 28,
          letterSpacing: ".01em",
          color: "#1976d2",
          marginBottom: 12
        }}>S&amp;P 500 Stock Search</span>
        <input
          type="text"
          className="sp500-search"
          placeholder="Search company or ticker…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            background: "var(--bg-primary)",
            color: "var(--text-primary)",
            border: "1.5px solid var(--border-color)",
            borderRadius: 10,
            padding: "14px 18px",
            fontSize: 20,
            lineHeight: 1.2,
            boxSizing: "border-box",
            outline: "none",
            width: "100%",
            maxWidth: 364,
            boxShadow: "0 1px 6px rgba(25,118,210,0.03)",
            marginTop: 8,
            marginBottom: 6,
            transition: "border 0.25s"
          }}
          autoFocus
        />
        {loading && (
          <span style={{
            color: "#888",
            marginTop: 15,
            fontWeight: 500
          }}>
            Loading company metrics...
          </span>
        )}
        {error && (
          <span style={{
            color: "#f44336",
            marginTop: 15,
            fontWeight: 500,
            whiteSpace: "pre-line",
            textAlign: "center"
          }}>
            {error}
          </span>
        )}
        {metricsData && !loading && !error && renderMetricsTable(metricsData.metrics)}
        {!search && (
          <span style={{
            color: "var(--text-secondary)",
            fontWeight: 400,
            fontSize: 15,
            marginTop: 10,
            textAlign: "center",
            maxWidth: 350,
            display: "block"
          }}>
            Begin your search to view S&amp;P 500 companies. Stock ranking and data appear after a search.
          </span>
        )}
      </div>
      <footer style={{
        marginTop: 60,
        padding: "14px 0 20px 0",
        background: "transparent",
        borderTop: "none",
        fontSize: 15,
        color: "#555",
        textAlign: "center",
        width: "100%"
      }}>
        &copy; {new Date().getFullYear()} S&amp;P 500 Stock Ranking Dashboard
      </footer>
    </div>
  );
}

export default App;
