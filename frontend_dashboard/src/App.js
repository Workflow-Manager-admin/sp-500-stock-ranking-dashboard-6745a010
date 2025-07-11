import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';

// PUBLIC_INTERFACE
function App() {
  const [theme, setTheme] = useState('light');
  const [aaplMetrics, setAaplMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Effect to apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Effect to fetch Finnhub AAPL metrics on mount
  useEffect(() => {
    // PUBLIC_INTERFACE
    /**
     * Fetches metric data for AAPL from Finnhub
     * API key is read from REACT_APP_FINNHUB_API_KEY, fallback to sample
     */
    const fetchAaplMetrics = async () => {
      setLoading(true);
      setApiError(null);
      const defaultApiKey = 'd1omsf9r01quemda0sugd1omsf9r01quemda0sv0';
      const key = process.env.REACT_APP_FINNHUB_API_KEY || defaultApiKey;
      const url = `https://finnhub.io/api/v1/stock/metric?symbol=AAPL&metric=all&token=${key}`;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`API responded ${res.status}`);
        const data = await res.json();
        setAaplMetrics(data);
        // For demo: also output to console
        // eslint-disable-next-line no-console
        console.log('AAPL metrics:', data);
      } catch (err) {
        setApiError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAaplMetrics();
  }, []);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="App">
      <header className="App-header">
        <button 
          className="theme-toggle" 
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <p>
          Current theme: <strong>{theme}</strong>
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <div style={{marginTop: '2rem', width: '100%', maxWidth: 600}}>
          <h2>Finnhub AAPL Stock Metrics</h2>
          {loading && <div>Loading AAPL data...</div>}
          {apiError && <div style={{color: 'red'}}>Error: {apiError}</div>}
          {aaplMetrics && aaplMetrics.metric ?
            <div>
              <div style={{textAlign: "left", fontSize: "1rem"}}>
                <strong>52 Week High:</strong> {aaplMetrics.metric['52WeekHigh']}<br />
                <strong>52 Week Low:</strong> {aaplMetrics.metric['52WeekLow']}<br />
                <strong>Market Cap (USD):</strong> {aaplMetrics.metric.marketCapitalization}<br />
                <strong>PE Ratio (TTM):</strong> {aaplMetrics.metric.peTTM}<br />
                {/* Add more AAPL metrics as needed */}
              </div>
            </div>
            : !loading && !apiError && <div>No metric data found.</div>
          }
        </div>
      </header>
    </div>
  );
}

export default App;
