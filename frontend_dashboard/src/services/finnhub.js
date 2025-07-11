import axios from "axios";

/**
 * PUBLIC_INTERFACE
 * Fetches AAPL stock metrics from the Finnhub API using the API key provided in the environment.
 * The Finnhub API key must be set in the `.env` file as REACT_APP_FINNHUB_API_KEY.
 * Endpoint format: https://finnhub.io/api/v1/stock/metric?symbol=AAPL&metric=&token={API_KEY}
 *
 * @returns {Promise<{metric: object, chart: array, c?: number, d?: number, dp?: number, pc?: number}>}
 * @throws {Error} On fetch failure, gives actionable message with timestamp.
 */
export async function getStockData() {
  const apiKey = process.env.REACT_APP_FINNHUB_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Finnhub API key missing. Please create a .env file in your project root and set REACT_APP_FINNHUB_API_KEY=your_finnhub_api_key_here."
    );
  }

  const FINNHUB_ENDPOINT = `https://finnhub.io/api/v1/stock/metric?symbol=AAPL&metric=&token=${apiKey}`;

  // Logging for debugging: show endpoint (key redacted in logs)
  // eslint-disable-next-line
  console.log(`[Finnhub] Using endpoint: https://finnhub.io/api/v1/stock/metric?symbol=AAPL&metric=&token=***`);

  let metricRes;
  try {
    metricRes = await axios.get(FINNHUB_ENDPOINT);
    // eslint-disable-next-line
    console.log(`[Finnhub] Response status: ${metricRes.status}`, metricRes.data);
  } catch (err) {
    // Add detailed logging and build actionable error message
    const errTime = new Date().toISOString();
    let msg = `[Finnhub] API call error (${errTime}):`;
    let details = "";
    if (err.response) {
      msg += ` HTTP ${err.response.status}: ${JSON.stringify(err.response.data)}`;
      details += "Check if Finnhub API is available, your API key is valid, and rate-limits have not been exceeded.";
    } else if (err.request) {
      msg += " No response (network issue?)";
      details += "Verify your internet connection and ensure finnhub.io is reachable from your network.";
    } else {
      msg += ` ${err.message}`;
    }

    const actionHint =
      "See console for full stack trace. If persistent, check your network/firewall settings, API key, or https://finnhub.io/status.";

    // eslint-disable-next-line
    console.error(`[Finnhub ERROR @ ${errTime}]`, msg, "\\nDetails:", err, "\\nAction:", details);

    throw new Error(`${msg}${details ? " [" + details + "]" : ""} ${actionHint}`);
  }

  // Generate mock price chart for visual purposes as before
  let chart = [];
  let ce = Number(metricRes?.data?.metric?.["52WeekHigh"]) || 180;
  try {
    for (let i = 6; i >= 0; i--) {
      chart.unshift({
        label: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][6 - i],
        price: ce * (1 + 0.01 * (Math.random() - 0.5) * i),
      });
    }
  } catch (chartErr) {
    // eslint-disable-next-line
    console.error("[Finnhub] Chart generation failed:", chartErr);
  }

  const fallbackNum = (n) => (typeof n === "number" && !isNaN(n) ? n : undefined);
  return {
    metric: metricRes.data.metric,
    chart,
    c: fallbackNum(Number(metricRes.data.metric?.["close"] ?? metricRes.data.metric?.["52WeekHigh"])),
    d: fallbackNum(Number(metricRes.data.metric?.["change"])),
    dp: fallbackNum(Number(metricRes.data.metric?.["percentChange"])),
    pc: fallbackNum(Number(metricRes.data.metric?.["52WeekLow"])),
  };
}
