import React, { useState, useEffect } from "react";
import styled, { ThemeProvider, createGlobalStyle } from "styled-components";
import NavBar from "./components/NavBar";
import SideBar from "./components/SideBar";
import Dashboard from "./components/Dashboard";
import { getCompanyList } from "./data/companies";

// Define dashboard theme based on requirements
const theme = {
  colors: {
    primary: "#1976d2",
    secondary: "#1565c0",
    accent: "#43a047",
    bg: "#fff",
    text: "#212121",
    badgeBuy: "#43a047",
    badgeHold: "#fbc02d",
    badgeSell: "#e53935",
    sideBg: "#f4f7fc"
  }
};
const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
    background: ${(p) => p.theme.colors.bg};
    color: ${(p) => p.theme.colors.text};
    min-height: 100vh;
    transition: background .3s;
  }
`;

// PUBLIC_INTERFACE
function App() {
  const [selectedTicker, setSelectedTicker] = useState("AAPL");
  const [search, setSearch] = useState("");
  const [companyList, setCompanyList] = useState(getCompanyList());
  const [apiStatus, setApiStatus] = useState("idle");

  // Filter function for search
  const handleSearch = (value) => {
    setSearch(value);
    setCompanyList(
      getCompanyList().filter(
        (c) =>
          c.ticker.toLowerCase().includes(value.toLowerCase()) ||
          c.name.toLowerCase().includes(value.toLowerCase())
      )
    );
  };

  // PUBLIC_INTERFACE
  const handleSelectTicker = (ticker) => {
    setSelectedTicker(ticker);
  };

  // Remove API key warnings: not needed, API/token now hardcoded in finnhub.js

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <NavBar
        apiStatus={apiStatus}
        search={search}
        setSearch={handleSearch}
        finnhubAvailable={true} // Always available in demo
      />
      <Container>
        <SideBar
          companies={companyList}
          selected={selectedTicker}
          onSelect={handleSelectTicker}
        />
        <Main>
          <Dashboard
            ticker={selectedTicker}
            setApiStatus={setApiStatus}
          />
        </Main>
      </Container>
    </ThemeProvider>
  );
}

const Container = styled.div`
  display: flex;
  min-height: 100vh;
`;

const Main = styled.main`
  flex: 1 1 0;
  padding: 32px 32px 32px 290px;
  min-width: 0;
  background: #fff;
  @media (max-width: 900px) {
    padding: 16px;
  }
`;

export default App;
