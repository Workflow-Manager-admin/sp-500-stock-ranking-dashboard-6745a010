# S&P 500 Stock Ranking Dashboard (frontend_dashboard)

**Finnhub API Key Setup:**  
To enable live data, create a `.env` file in your project root and add:  
```
REACT_APP_FINNHUB_API_KEY=your_finnhub_api_key_here
```
Obtain your key from [Finnhub.io](https://finnhub.io/) (free sign-up available).

This React application is a real-time dashboard for ranking S&P 500 companies and providing Buy/Sell/Hold dispositions based on 10 performance parameters using Finnhub API data.

## Features

- Real-time fetch of AAPL stock data from Finnhub (ready for full S&P 500 scale-up)
- Company ranking based on multiple performance metrics
- Buy/Sell/Hold disposition badge, color-coded for clarity
- Rich dashboard: charts, tables, summary panels
- Responsive modern minimal UI (light theme, blue/green primary/secondary/accent)
- Side navigation with company search and filtering

## Layout

- **Top Nav Bar:** App title, API status, search bar
- **Side Navigation:** List of companies for selection
- **Main Content:** Stock details, metric charts, disposition, performance table
- **Summary/Disposition Panel:** Overview of Buy/Hold/Sell distribution

## Environment Configuration

Create a `.env` file in the project root with:
```
REACT_APP_FINNHUB_API_KEY=your_finnhub_api_key_here
```
Finnhub API key is required for real-time stock data.

## Development

Install dependencies and run:

```sh
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## Structure Overview

- `src/components/`: UI components (NavBar, SideBar, Dashboard, etc.)
- `src/services/`: Finnhub API integration, data utilities
- `src/App.js`: Main layout & state management
- `src/assets/`: Reusable assets & styling

## Customization

Modify company list and metrics easily in `src/data/companies.js` and `src/data/metrics.js`.

## Extending to all S&P 500

Update company list and ensure rate limits are observed on bulk Finnhub requests.

---
Built with React, styled-components, recharts for data visualization.
