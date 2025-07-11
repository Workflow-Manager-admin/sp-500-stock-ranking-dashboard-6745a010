import axios from "axios";

/**
 * PUBLIC_INTERFACE
 * Fetches AAPL stock metrics from the required Finnhub endpoint ONLY:
 * https://finnhub.io/api/v1/stock/metric?symbol=AAPL&metric=
 * - No key or metric param modification is allowed.
 * - This is used for all real-time AAPL metric data in the dashboard.
 *
 * @returns {Promise<{metric: object, chart: array, c?: number, d?: number, dp?: number, pc?: number}>}
 * @throws {Error} On fetch failure, gives actionable message with timestamp.
 */
export async function getStockData() {
  const FINNHUB_ENDPOINT =
    "https://finnhub.io/api/v1/stock/metric?symbol=AAPL&metric=";

  // Logging for debugging: log the required endpoint, no token present
  // eslint-disable-next-line
  console.log(`[Finnhub] Using required endpoint: ${FINNHUB_ENDPOINT}`);

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
      details += "Check if Finnhub API is available and rate-limits have not been exceeded.";
    } else if (err.request) {
      msg += " No response (network issue?)";
      details += "Verify your internet connection and ensure finnhub.io is reachable from your network.";
    } else {
      msg += ` ${err.message}`;
    }

    const actionHint =
      "See console for full stack trace. If persistent, check your network/firewall settings or https://finnhub.io/status.";

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
