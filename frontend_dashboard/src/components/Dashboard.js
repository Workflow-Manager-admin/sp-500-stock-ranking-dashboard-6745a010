import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { getStockData } from "../services/finnhub";
import { getCompanyByTicker } from "../data/companies";
import { getPerformanceMetrics, evaluateDisposition } from "../data/metrics";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

// PUBLIC_INTERFACE
function Dashboard({ ticker, setApiStatus, finnhubAvailable }) {
  const [loading, setLoading] = useState(true);
  const [stock, setStock] = useState(null);
  const [error, setError] = useState();

  useEffect(() => {
    if (!finnhubAvailable) {
      setLoading(false);
      setError("Missing Finnhub API key.");
      setApiStatus("error");
      setStock(null);
      // Debug log for development
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line
        console.warn("[Dashboard] Finnhub API key is missing.");
      }
      return;
    }
    setLoading(true);
    setError("");
    setApiStatus("loading");
    getStockData(ticker)
      .then((data) => {
        setStock(data);
        setLoading(false);
        setApiStatus("ok");
      })
      .catch((e) => {
        setError(
          <>
            Could not fetch data.<br />
            {process.env.NODE_ENV !== "production" && (
              <span style={{fontSize:"90%"}}>{typeof e === "object" && e?.message ? e.message : e+""}</span>
            )}
          </>
        );
        setApiStatus("error");
        setStock(null);
        setLoading(false);
        // Development debugging
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line
          console.error("[Dashboard] Error during Finnhub fetch:", e);
        }
      });
  }, [ticker, setApiStatus, finnhubAvailable]);

  const company = getCompanyByTicker(ticker);
  const metrics = getPerformanceMetrics(stock, ticker);
  const disposition = evaluateDisposition(metrics);

  return (
    <DashRoot>
      <DashLeft>
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
                <div className="val">{stock.c?.toLocaleString("en-US",{style:"currency",currency:"USD"})}</div>
              </SummaryField>
              <SummaryField>
                <div>Today's Change</div>
                <div className="val" style={{color:stock.d>=0?theme.accent:"#e53935"}}>
                  {stock.d>=0?"+":""}{stock.d} ({stock.dp>=0?"+":""}{stock.dp}%)
                </div>
              </SummaryField>
              <SummaryField>
                <div>Previous Close</div>
                <div className="val">{stock.pc?.toLocaleString("en-US",{style:"currency",currency:"USD"})}</div>
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
