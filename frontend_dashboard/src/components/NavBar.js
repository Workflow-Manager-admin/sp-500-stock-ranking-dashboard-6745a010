import React from "react";
import styled from "styled-components";

// PUBLIC_INTERFACE
function NavBar({ apiStatus, search, setSearch, finnhubAvailable }) {
  return (
    <Bar>
      <Title>
        S&amp;P 500 Stock Dashboard
      </Title>
      <SearchBox>
        <input
          placeholder="Search company or ticker…"
          value={search}
          onChange={(evt) => setSearch(evt.target.value)}
          aria-label="Search company or ticker"
        />
      </SearchBox>
      <ApiStatus status={apiStatus} available={finnhubAvailable}>
        {finnhubAvailable
          ? apiStatus === "error"
            ? "API Unreachable"
            : "API OK"
          : "API Key Missing"}
      </ApiStatus>
    </Bar>
  );
}

const Bar = styled.header`
  display: flex;
  align-items: center;
  height: 64px;
  padding: 0 36px;
  background: ${(p) => p.theme.colors.primary};
  color: #fff;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(32,28,78,0.06);
  position: sticky; top: 0;
`;

const Title = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: 0.02em;
`;

const SearchBox = styled.div`
  margin-left: 60px;
  flex: 1 1 0;
  display: flex;
  align-items: center;
  input {
    width: 280px;
    padding: 8px 14px;
    border-radius: 6px;
    border: none;
    font-size: 1.05rem;
    outline: none;
    background: #f2f6fb;
    color: #222;
    @media (max-width: 600px) {
      width: 120px;
    }
  }
`;

const ApiStatus = styled.span`
  margin-left: 44px;
  font-size: 1rem;
  font-weight: 600;
  ${(p) =>
    !p.available
      ? `color: #ff4242;`
      : p.status === "error"
      ? `color: #ffda61;`
      : `color: #43a047;`}
`;

export default NavBar;
