import axios from "axios";

/**
 * PUBLIC_INTERFACE
 * Fetches comprehensive stock metrics from the ONLY allowed Finnhub endpoint for AAPL.
 * No alternate endpoint, key, environment variable, or dynamic configuration is permitted.
 * All requests use:
 *   https://finnhub.io/api/v1/stock/metric?symbol=AAPL&metric=all&token=d1omsf9r01quemda0sugd1omsf9r01quemda0sv0
 * 
 * @returns {Promise<{metric: object, chart: array, c?: number, d?: number, dp?: number, pc?: number}>}
 * @throws {Error} When fetch fails, includes descriptive, actionable info and iso timestamp.
 */
export async function getStockData() {
  const FINNHUB_ENDPOINT =
    "https://finnhub.io/api/v1/stock/metric?symbol=AAPL&metric=all&token=d1omsf9r01quemda0sugd1omsf9r01quemda0sv0";

  // Logging for debugging - always log endpoint as redacted, no env logic
  // eslint-disable-next-line
  console.log(`[Finnhub] Using ONLY endpoint: ${FINNHUB_ENDPOINT.replace(/token=([^&]+)/, "token=[REDACTED]")}`);

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
      details += "Check if Finnhub API token is valid and not exceeded rate limits.";
    } else if (err.request) {
      msg += " No response (network issue?)";
      details += "Verify your internet connection and ensure finnhub.io is reachable from your network.";
    } else {
      msg += ` ${err.message}`;
    }

    const actionHint =
      "See console for full stack trace. If persistent, check network/firewall settings and API key status at finnhub.io (free keys may be rate limited).";

    // eslint-disable-next-line
    console.error(`[Finnhub ERROR @ ${errTime}]`, msg, "\nDetails:", err, "\nAction:", details);

    // Error message shown in UI should be concise but actionable.
    throw new Error(`${msg}${details ? " [" + details + "]" : ""} ${actionHint}`);
  }

  // Generate mock price chart for visual purposes, as before
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
