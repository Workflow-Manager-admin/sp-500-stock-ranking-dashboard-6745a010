import axios from "axios";

const BASE = "https://finnhub.io/api/v1";

// Utility to redact sensitive values from logs
function redactApiKey(url) {
  // Remove token param value for log safety
  return url.replace(/token=([^&]+)/, "token=[REDACTED]");
}

// PUBLIC_INTERFACE
/**
 * Fetches comprehensive stock metrics for the specified ticker from Finnhub's `stock/metric` endpoint,
 * and returns the metrics (and mock chart for price visualization).
 * Maintains API key presence/error/console log pattern as before.
 *
 * @param {string} ticker - Stock ticker symbol (e.g., "AAPL")
 * @returns {Promise<{metric: object, chart: array, c?: number, d?: number, dp?: number, pc?: number}>}
 */
export async function getStockData(ticker) {
  // Hardcoded API key as instructed (could be replaced later by env)
  const API_KEY = 'd1okfe1r01quemd9ir20d1okfe1r01quemd9ir2g';

  // Logging for debugging – NEVER log the key, only presence!
  const isProd = process.env.NODE_ENV === "production";
  const keyPresent = !!API_KEY && typeof API_KEY === "string";
  if (!isProd) {
    // eslint-disable-next-line
    console.log(`[Finnhub] API key present: ${keyPresent}`);
  }

  if (!keyPresent) {
    if (!isProd) {
      // eslint-disable-next-line
      console.warn(`[Finnhub] API key is missing – API call will fail!`);
    }
    throw new Error("Missing Finnhub API key.");
  }

  const url = `${BASE}/stock/metric`;
  const params = { symbol: ticker, metric: "all", token: API_KEY };

  if (!isProd) {
    // eslint-disable-next-line
    const urlForLog = `${url}?symbol=${ticker}&metric=all&token=[REDACTED]`;
    console.log(`[Finnhub] API request: ${urlForLog}`, { params: { ...params, token: "[REDACTED]" } });
  }

  // Prepare response for logging status
  let metricRes;
  try {
    metricRes = await axios.get(url, { params });
    if (!isProd) {
      // eslint-disable-next-line
      console.log(`[Finnhub] Response status: ${metricRes.status}`, metricRes.data);
    }
  } catch (err) {
    let msg = "[Finnhub] API call error:";
    // Axios style errors
    if (err.response) {
      msg += ` HTTP ${err.response.status}: ${JSON.stringify(err.response.data)}`;
    } else if (err.request) {
      msg += " No response (network issue?)";
    } else {
      msg += ` ${err.message}`;
    }
    if (!isProd) {
      // eslint-disable-next-line
      console.error(msg, err);
    }
    // Propagate error for UI
    throw new Error(msg);
  }

  // Compose the price chart for the demo (simulate a week)
  let chart = [];
  // Try to extract the close price for trend - fallback to a static number
  let ce = Number(metricRes?.data?.metric?.["52WeekHigh"]) || 180;
  try {
    for (let i = 6; i >= 0; i--) {
      chart.unshift({
        label: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][6-i],
        price: ce * (1 + 0.01 * (Math.random() - 0.5) * i)
      });
    }
  } catch (chartErr) {
    if (!isProd) {
      // eslint-disable-next-line
      console.error("[Finnhub] Chart generation failed:", chartErr);
    }
    // Not fatal, returns empty chart
  }
  // For compatibility, also return a handful of "quote"-like attributes if available
  // (A few dashboard metrics expect c, d, dp, pc)
  const fallbackNum = n => (typeof n === "number" && !isNaN(n) ? n : undefined);
  return {
    metric: metricRes.data.metric,
    chart,
    c: fallbackNum(Number(metricRes.data.metric?.['close'] ?? metricRes.data.metric?.['52WeekHigh'])),
    d: fallbackNum(Number(metricRes.data.metric?.['change'])),
    dp: fallbackNum(Number(metricRes.data.metric?.['percentChange'])),
    pc: fallbackNum(Number(metricRes.data.metric?.['52WeekLow'])), // Example/fallback, not literal prev close
  };
}
