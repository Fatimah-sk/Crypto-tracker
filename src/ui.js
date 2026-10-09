import { format } from "date-fns";
import { state } from "./state.js";
import { getFavs } from "./favorites.js";

export function createUI() {
  const app = document.querySelector("#app");

  app.innerHTML = `
<div class="container">
  <header class="topbar">
    <div class="brand">
      <h1>Crypto Tracker</h1>
      <p class="subtitle">
        Top coins • CoinGecko API • <span id="updated">—</span>
      </p>
    </div>

    <div class="controls">
      <select id="currency" class="select">
        <option value="usd">USD</option>
        <option value="nok">NOK</option>
      </select>

      <select id="sort" class="select">
        <option value="market_cap_desc">Market cap (high → low)</option>
        <option value="market_cap_asc">Market cap (low → high)</option>
        <option value="price_desc">Price (high → low)</option>
        <option value="price_asc">Price (low → high)</option>
        <option value="change_desc">24h % (high → low)</option>
        <option value="change_asc">24h % (low → high)</option>
      </select>

      <button id="toggleFavs" class="btn">⭐ Favorites: OFF</button>
      <input id="search" type="search" placeholder="Search (BTC, ETH, Bitcoin)..." />
    </div>
  </header>

  <div id="status" class="status"></div>

  <div class="table-wrap">
    <table class="table">
      <thead>
        <tr>
          <th></th>
          <th>#</th>
          <th>Coin</th>
          <th>Price</th>
          <th>24h %</th>
          <th>Market Cap</th>
          <th>Volume</th>
        </tr>
      </thead>
      <tbody id="rows"></tbody>
    </table>
  </div>

  <!-- Chart Modal -->
  <div id="modal" class="modal hidden">
    <div class="modal-card">
      <div class="modal-header">
        <div class="modal-title">
          <img id="mLogo" class="mLogo" alt="" />
          <div>
            <div id="mName" class="mName">Coin</div>
            <div id="mSub" class="mSub">—</div>
          </div>
        </div>

        <div class="modal-actions">
          <select id="range" class="select">
            <option value="1">1D</option>
            <option value="7" selected>7D</option>
            <option value="30">30D</option>
            <option value="365">1Y</option>
          </select>
          <button id="closeModal" class="btn">Close</button>
        </div>
      </div>

      <p id="mStatus" class="status">Loading chart...</p>
      <div class="chart-wrap">
        <canvas id="priceChart"></canvas>
      </div>
    </div>
  </div>

  <footer class="footer">
    <p>Built by <strong>Fatimah Sakhnine</strong> • Powered by CoinGecko API</p>
    <p class="small">© <span id="year"></span> Crypto Tracker</p>
  </footer>
</div> `;
}

/* ================== Helpers ================== */
export function formatNumber(n) {
  if (n === null || n === undefined) return "—";
  return Number(n).toLocaleString();
}


export function setUpdatedNow() {
  const updatedEl = document.querySelector("#updated");
  updatedEl.textContent = `Last updated: ${format(new Date(), "HH:mm:ss")}`;
}

export function renderSkeleton(rows = 10) {
    const rowsEl = document.querySelector("#rows");
  rowsEl.innerHTML = Array.from({ length: rows })
    .map(
      () => `
      <tr>
        <td><div class="sk sk-btn"></div></td>
        <td><div class="sk sk-num"></div></td>
        <td><div class="sk sk-text"></div></td>
        <td><div class="sk sk-num"></div></td>
        <td><div class="sk sk-num"></div></td>
        <td><div class="sk sk-num"></div></td>
        <td><div class="sk sk-num"></div></td>
      </tr>
    `
    )
    .join("");
}

/* ================== Render Table ================== */
export function renderRows(coins) {
  const rowsEl = document.querySelector("#rows");
  const statusEl = document.querySelector("#status");

  const favs = getFavs();
  const q = state.query.trim().toLowerCase();

  let filtered = coins;

  // Search
  if (q) {
    filtered = filtered.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        String(c.symbol).toLowerCase().includes(q)
    );
  }
  // Favorites only
  if (state.showFavsOnly) {
    filtered = filtered.filter((c) => favs.includes(c.id));
  }

  // Sort (clone first)
  filtered = [...filtered];
  const byNum = (a, b, key) => (a[key] ?? 0) - (b[key] ?? 0);

  if (state.sort === "market_cap_desc") filtered.sort((a, b) => byNum(b, a, "market_cap"));
  if (state.sort === "market_cap_asc") filtered.sort((a, b) => byNum(a, b, "market_cap"));

  if (state.sort === "price_desc") filtered.sort((a, b) => byNum(b, a, "current_price"));
  if (state.sort === "price_asc") filtered.sort((a, b) => byNum(a, b, "current_price"));

  if (state.sort === "change_desc") filtered.sort((a, b) => byNum(b, a, "price_change_percentage_24h"));
  if (state.sort === "change_asc") filtered.sort((a, b) => byNum(a, b, "price_change_percentage_24h"));

  rowsEl.innerHTML = filtered
    .map((c, i) => {
      const change = c.price_change_percentage_24h ?? 0;
      const cls = change >= 0 ? "pos" : "neg";
      const star = favs.includes(c.id) ? "★" : "☆";

      return `
      <tr data-id="${c.id}">
        <td><button class="star" aria-label="favorite">${star}</button></td>
        <td>${i + 1}</td>
        <td class="coin">
          <img class="logo" src="${c.image}" alt="${c.name}" />
          <div>
            <div class="name">${c.name}</div>
            <div class="sym">${String(c.symbol).toUpperCase()}</div>
          </div>
        </td>
        <td>${state.currency.toUpperCase()} ${formatNumber(c.current_price)}</td>
        <td class="${cls}">${change.toFixed(2)}%</td>
        <td>${state.currency.toUpperCase()} ${formatNumber(c.market_cap)}</td>
        <td>${state.currency.toUpperCase()} ${formatNumber(c.total_volume)}</td>
      </tr>
      `;
    })
    .join("");

  statusEl.textContent = filtered.length ? "" : "No results.";
}
