// PUBLIC_INTERFACE
export function getFinnhubKey() {
  return process.env.REACT_APP_FINNHUB_API_KEY || "";
}
