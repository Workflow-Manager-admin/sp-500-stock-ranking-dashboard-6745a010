import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders S&P 500 Stock Dashboard and AAPL company", () => {
  render(<App />);
  expect(screen.getByText(/S&P 500 Stock Dashboard/i)).toBeInTheDocument();
  expect(screen.getByText(/Apple Inc\./i)).toBeInTheDocument();
});
