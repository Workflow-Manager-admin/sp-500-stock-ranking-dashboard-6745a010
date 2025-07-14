import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';

// PUBLIC_INTERFACE
function App() {
  const [theme, setTheme] = useState("light");
  const [ticker, setTicker] = useState("AAPL"); // default starting ticker
  const [inputTicker, setInputTicker] = useState("AAPL");
  /**
   * setMetrics: Updates the metrics state variable with the latest stock metric data
   * as returned from the Finnhub API for the selected ticker.
   * - metrics: Contains key financial ratios and statistics (e.g., PE Ratio, ROE, profit margins, etc.)
   *            used for scoring and displaying in the dashboard.
   * - Expects the raw JSON data structure from Finnhub's `/stock/metric` endpoint,
   *   or null if data fetch fails.
   * - Used throughout the dashboard to drive the performance table and disposition logic.
   */
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Effect to apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

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
      </header>
    </div>
  );
}

export default App;
