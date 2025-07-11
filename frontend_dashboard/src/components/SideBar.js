import React from "react";
import styled from "styled-components";

// PUBLIC_INTERFACE
function SideBar({ companies, selected, onSelect }) {
  return (
    <Side>
      <Heading>Companies</Heading>
      <CompanyList>
        {companies.map((c) => (
          <CompanyRow
            key={c.ticker}
            className={selected === c.ticker ? "selected" : ""}
            onClick={() => onSelect(c.ticker)}
            aria-current={selected === c.ticker}
            tabIndex={0}
          >
            <span className="ticker">{c.ticker}</span>
            <span className="name">{c.name}</span>
          </CompanyRow>
        ))}
      </CompanyList>
    </Side>
  );
}

const Side = styled.aside`
  width: 260px;
  padding: 20px 8px 16px 12px;
  background: ${(p) => p.theme.colors.sideBg};
  color: ${(p) => p.theme.colors.secondary};
  height: 100vh;
  position: fixed;
  top: 64px;
  left: 0;
  overflow-y: auto;
  border-right: 1px solid #eaeaea;
  box-sizing: border-box;
  @media (max-width: 900px) {
    display: none;
  }
`;

const Heading = styled.div`
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 10px;
  color: ${(p) => p.theme.colors.primary};
`;

const CompanyList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const CompanyRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 8px 14px 8px 8px;
  border-radius: 6px;
  transition: background 0.18s, color 0.18s;
  user-select: none;
  font-size: 1rem;
  color: #27395b;
  &.selected, &:hover {
    background: #fff;
    color: ${(p) => p.theme.colors.primary};
    font-weight: 700;
  }
  .ticker {
    font-weight: 700;
    font-size: 1.06em;
    margin-right: 6px;
    width: 58px;
    color: ${(p) => p.theme.colors.primary};
  }
  .name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

export default SideBar;
