
import axios from "axios";

const BASE_URL = "https://api.coingecko.com/api/v3";

// Fetch top cryptocurrencies
export async function fetchCoins(currency) {
  const { data } = await axios.get(`${BASE_URL}/coins/markets`, {
    params: {
      vs_currency: currency,
      order: "market_cap_desc",
      per_page: 30,
      page: 1,
      sparkline: false,
    },
  });

  return data;
}

// Fetch historical prices for chart
export async function fetchCoinChart(id, days, currency) {
  const { data } = await axios.get(
    `${BASE_URL}/coins/${id}/market_chart`,
    {
      params: {
        vs_currency: currency,
        days,
      },
    }
  );

  return data.prices;
}
