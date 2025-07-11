import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { getStockData } from "../services/finnhub";
import { getCompanyByTicker } from "../data/companies";
import { getPerformanceMetrics, evaluateDisposition } from "../data/metrics";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

/**
 * PUBLIC_INTERFACE
 * Dashboard displays stock details, metrics, and summary.
 * Now displays real-time API connection status visibly on the dashboard.
 *
 * @param {object} props
 * @param {string} props.ticker - Stock ticker symbol.
 * @param {function} props.setApiStatus - Callback to update API status in parent.
 * @param {string} [props.apiStatus] - API fetch status ("loading", "ok", "error", "idle").
 * @param {string} [props.apiError] - Optional error message from last API call (if any).
 */
function Dashboard({ ticker, setApiStatus, apiStatus, apiError }) {
  const [loading, setLoading] = useState(true);
  const [stock, setStock] = useState(null);
  const [error, setError] = useState();

  useEffect(() => {
    // Ignore API key/env checks, always fetch AAPL
    setLoading(true);
    setError("");
    setApiStatus("loading");
    getStockData()
      .then((data) => {
        setStock(data);
        setLoading(false);
        setApiStatus("ok");
      })
      .catch((e) => {
        // Always log detail with timestamp if not production
        const errorDetail =
          e && e.message
            ? e.message
            : typeof e === "object"
            ? JSON.stringify(e)
            : String(e);
        const time = new Date().toLocaleString();
        // Log for diagnosis (even if in production, log error with UTC time for diagnosis)
        // eslint-disable-next-line
        console.error(`[Dashboard Finnhub Error at ${time}]`, errorDetail);

        // Prepare actionable error message for user diagnosis
        setError(
          <>
            <span>
              Could not fetch data from Finnhub.<br />
              <span style={{ fontSize: "92%" }}>
                {errorDetail}
              </span>
            </span>
          </>
        );
        setApiStatus("error");
        setStock(null);
        setLoading(false);
      });
  }, [ticker, setApiStatus]);

  const company = getCompanyByTicker(ticker);
  const metrics = getPerformanceMetrics(stock, ticker);
  const disposition = evaluateDisposition(metrics);

  // Helper: Map apiStatus to color/message
  const getApiStatusUI = () => {
    if (!apiStatus || apiStatus === "idle") {
      // Initial load/idle = treat as loading
      return (
        <ApiStatusBox $color="#ffda61">
          <b>API Status:</b> Connecting...
        </ApiStatusBox>
      );
    }
    if (apiStatus === "loading") {
      return (
        <ApiStatusBox $color="#ffda61">
          <b>API Status:</b> Connecting...
        </ApiStatusBox>
      );
    }
    if (apiStatus === "ok") {
      return (
        <ApiStatusBox $color="#43a047">
          <b>API Status:</b> Connected
        </ApiStatusBox>
      );
    }
    if (apiStatus === "error") {
      // Prefer dashboard-caught error, fallback to apiError
      let msg = "";
      if (error) { // handled as React node
        msg = typeof error === "string"
          ? error
          : (error?.props?.children ?? "Unknown error");
      } else if (apiError) {
        msg = String(apiError);
      } else {
        msg = "Unknown error";
      }
      return (
        <ApiStatusBox $color="#e53935">
          <b>API Status:</b> Error: <span style={{fontWeight:400}}>{msg}</span>
        </ApiStatusBox>
      );
    }
    return null;
  };

  return (
    <DashRoot>
      <DashLeft>
        {getApiStatusUI()}
        <ApiKeyBox>
          <ApiKeyLabel>Active Finnhub API Key:</ApiKeyLabel>
          <ApiKeyValue>d1omsf9r01quemda0sugd1omsf9r01quemda0sv0</ApiKeyValue>
        </ApiKeyBox>
        <h1>
          {company?.name || ticker}
          <Badge $type={disposition}>{disposition}</Badge>
        </h1>
        <Ticker>{ticker}</Ticker>
        {loading ? (
          <Loading>Loading data…</Loading>
        ) : error ? (
          <ErrorMsg>{error}</ErrorMsg>
        ) : stock ? (
          <>
            <SummarySection>
              <SummaryField>
                <div>Current</div>
                <div className="val">
                  {(stock.metric?.close ?? stock.c)?.toLocaleString("en-US", { style: "currency", currency: "USD" }) || "—"}
                </div>
              </SummaryField>
              <SummaryField>
                <div>Today's Change</div>
                <div className="val" style={{ color: (stock.d ?? 0) >= 0 ? theme.accent : "#e53935" }}>
                  {(stock.d ?? 0) >= 0 ? "+" : ""}
                  {stock.d ?? "—"}
                  {" ("}
                  {(stock.dp ?? 0) >= 0 ? "+" : ""}
                  {stock.dp ?? "—"}%
                  {")"}
                </div>
              </SummaryField>
              <SummaryField>
                <div>Previous Close</div>
                <div className="val">
                  {(stock.metric?.["52WeekLow"] ?? stock.pc)?.toLocaleString("en-US", { style: "currency", currency: "USD" }) || "—"}
                </div>
              </SummaryField>
            </SummarySection>
            <h3>Metrics</h3>
            <MetricsTable>
              <thead>
                <tr>
                  {metrics.map(m => <th key={m.key}>{m.label}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {metrics.map(m => (
                    <td key={m.key} style={{color:(m.valueColor)||"#095"}}>{m.displayValue}</td>
                  ))}
                </tr>
              </tbody>
            </MetricsTable>
            <h3 style={{marginTop:"2em"}}>Recent Price Trend</h3>
            <ChartBox>
              {stock.chart && (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={stock.chart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" minTickGap={18} />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="price" stroke={theme.primary} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartBox>
          </>
        ) : null}
      </DashLeft>
      <DashRight>
        <h2>Disposition Summary</h2>
        <SummaryPanel>
          <PanelBadge $type="Buy">Buy</PanelBadge>
          <PanelBadge $type="Hold">Hold</PanelBadge>
          <PanelBadge $type="Sell">Sell</PanelBadge>
        </SummaryPanel>
        <p>
          <b>Note:</b> This demo uses real-time data for AAPL. The dashboard is prepared for scaling to all S&P 500 tickers.
        </p>
        <Disclaimer>
          Data from Finnhub. Not investment advice.
        </Disclaimer>
      </DashRight>
    </DashRoot>
  );
}

// Theme colors for chart
const theme = {
  primary: "#1976d2",
  accent: "#43a047"
};

const DashRoot = styled.div`
  display: flex;
  gap: 64px;
  flex-wrap: wrap;
  @media (max-width: 1100px) {
    flex-direction: column;
    gap: 32px;
  }
`;

// API Key info section: lightweight and out of main content path
const ApiKeyBox = styled.div`
  background: #f2f7fb;
  color: #144482;
  border-radius: 8px;
  font-size: 0.99em;
  margin-bottom: 14px;
  padding: 7px 18px 7px 16px;
  box-shadow: 0 1px 2px rgba(30,40,70,.04);
  display: flex;
  align-items: baseline;
  gap: 7px;
`;

const ApiKeyLabel = styled.span`
  font-weight: 500;
  margin-right: 4px;
  color: #1976d2;
`;

const ApiKeyValue = styled.span`
  font-family: "Menlo", "Consolas", "monospace";
  font-weight: 600;
  color: #1976d2;
  background: #eaf1fa;
  padding: 1px 10px 2px 9px;
  border-radius: 4px;
  font-size: 1em;
  user-select: all;
`;

const DashLeft = styled.div`
  flex: 2 1 480px;
  min-width: 260px;
  max-width: 850px;
`;

const DashRight = styled.div`
  flex: 0 1 320px;
  min-width: 250px;
  background: #f3f7fa;
  border-radius: 14px;
  padding: 28px 28px 18px 28px;
  box-shadow: 0 2px 8px rgba(32,28,78,0.06);
  @media (max-width: 1100px) {
    width: 100%;
    margin: 0 auto;
  }
`;

const Loading = styled.div`
  color: #aaa;
  margin-top: 32px;
`;

const ErrorMsg = styled.div`
  color: #e53935;
  margin-top: 28px;
  font-weight: bold;
`;

// API status indicator styling
const ApiStatusBox = styled.div`
  background: ${({ $color }) => $color || "#eee"};
  color: ${({ $color }) =>
    $color === "#43a047"
      ? "#fff"
      : $color === "#e53935"
      ? "#fff"
      : "#975f06"};
  padding: 8px 22px;
  border-radius: 8px;
  font-size: 1.04em;
  font-weight: 600;
  margin: 0 0 20px 0;
  display: inline-block;
  box-shadow: 0 1px 3px rgba(20,100,50,0.04);
  letter-spacing: 0.01em;
`;

const Badge = styled.span`
  display: inline-block;
  margin-left: 18px;
  font-weight: bold;
  font-size: 1.1em;
  color: #fff;
  background: ${({ $type, theme }) =>
    $type === "Buy"
      ? theme.colors.badgeBuy
      : $type === "Hold"
      ? theme.colors.badgeHold
      : theme.colors.badgeSell};
  border-radius: 18px;
  padding: 5px 20px;
`;

const Ticker = styled.div`
  font-size: 1.3em;
  font-weight: bold;
  color: #1976d2;
  margin-bottom: 8px;
  letter-spacing: 0.02em;
`;

const SummarySection = styled.div`
  display: flex;
  gap: 42px;
  margin: 22px 0 30px 0;
  div.val {
    font-size: 1.16em;
    font-weight: 600;
  }
  @media (max-width: 400px) {
    gap: 8px;
    flex-direction: column;
  }
`;

const SummaryField = styled.div`
  min-width: 120px;
  color: #444;
`;

const MetricsTable = styled.table`
  width: 100%;
  margin-top: 16px;
  border-radius: 6px;
  border: 1px solid #e3eff9;
  th, td {
    padding: 8px 4px;
    text-align: center;
  }
  th {
    background: #f2f6fb;
    font-weight: 700;
    color: #1565c0;
    font-size: 1.08em;
  }
  td {
    font-size: 1.04em;
    font-weight: 600;
    background: #fff;
  }
`;

const ChartBox = styled.div`
  width: 100%;
  height: 210px;
  background: #fafcff;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(24,28,78,0.09);
  margin-bottom: 20px;
  padding: 10px;
`;

const SummaryPanel = styled.div`
  display: flex;
  gap: 16px;
  margin: 18px 0 14px 0;
`;

const PanelBadge = styled.span`
  background: ${({ $type, theme }) =>
    $type === "Buy"
      ? theme.colors.badgeBuy
      : $type === "Hold"
      ? theme.colors.badgeHold
      : theme.colors.badgeSell};
  color: #fff;
  border-radius: 1em;
  padding: 8px 22px;
  font-weight: 700;
  font-size: 1.08em;
  letter-spacing: 0.01em;
`;

const Disclaimer = styled.div`
  font-size: 0.97em;
  color: #777;
  margin-top: 22px;
`;

export default Dashboard;
