
export const FAV_KEY = "crypto_favorites";
export const CUR_KEY = "crypto_currency";

export const state = {
  coins: [],
  query: "",
  showFavsOnly: false,
  sort: "market_cap_desc",
  currency: localStorage.getItem(CUR_KEY) || "usd",
};

export const modalState = {
  coin: null,
  days: 7,
};
