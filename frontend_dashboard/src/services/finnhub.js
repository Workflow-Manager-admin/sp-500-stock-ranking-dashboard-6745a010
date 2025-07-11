import axios from "axios";

// PUBLIC_INTERFACE
/**
 * Fetches comprehensive stock metrics from a hardcoded Finnhub endpoint for AAPL,
 * disregarding all inputs, and returns the metrics (plus a mock chart for price visualization).
 * No API key nor ticker symbol is accepted or checked; everything is hardcoded for AAPL.
 *
 * @returns {Promise<{metric: object, chart: array, c?: number, d?: number, dp?: number, pc?: number}>}
 */
export async function getStockData() {
  // Hardcoded endpoint and token per updated requirements (ticker ignored, always fetches AAPL)
  const FINNHUB_ENDPOINT =
    "https://finnhub.io/api/v1/stock/metric?symbol=AAPL&metric=all&token=d1on19hr01quemda1r1gd1on19hr01quemda1r20";

  // Logging for debugging
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    // eslint-disable-next-line
    console.log(`[Finnhub] Using hardcoded endpoint: ${FINNHUB_ENDPOINT.replace(/token=([^&]+)/, "token=[REDACTED]")}`);
  }

  let metricRes;
  try {
    metricRes = await axios.get(FINNHUB_ENDPOINT);
    if (!isProd) {
      // eslint-disable-next-line
      console.log(`[Finnhub] Response status: ${metricRes.status}`, metricRes.data);
    }
  } catch (err) {
    let msg = "[Finnhub] API call error:";
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
    throw new Error(msg);
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
    if (!isProd) {
      // eslint-disable-next-line
      console.error("[Finnhub] Chart generation failed:", chartErr);
    }
  }

  // For compatibility, also return a handful of "quote"-like attributes if available
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
