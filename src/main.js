
import "./style.css";

import { fetchCoins, fetchCoinChart } from "./api.js";
import { state, modalState, CUR_KEY } from "./state.js";
import { toggleFav } from "./favorites.js";
import {
  createUI,
  setUpdatedNow,
  renderSkeleton,
  renderRows,
} from "./ui.js";
import { renderChart, destroyChart } from "./chartManager.js";

createUI();

/* ================== DOM ================== */
const rowsEl = document.querySelector("#rows");
const statusEl = document.querySelector("#status");
const searchEl = document.querySelector("#search");
const sortEl = document.querySelector("#sort");
const currencyEl = document.querySelector("#currency");
const toggleFavsBtn = document.querySelector("#toggleFavs");
const yearEl = document.querySelector("#year");

const modalEl = document.querySelector("#modal");
const closeModalBtn = document.querySelector("#closeModal");
const rangeEl = document.querySelector("#range");
const mLogoEl = document.querySelector("#mLogo");
const mNameEl = document.querySelector("#mName");
const mSubEl = document.querySelector("#mSub");
const mStatusEl = document.querySelector("#mStatus");

yearEl.textContent = new Date().getFullYear();

/* ================== State ================== */
currencyEl.value = state.currency;
let chartRequestId = 0;

// Prevent overlapping API requests
let isLoading = false;

// Track the latest requested currency
let requestedCurrency = state.currency;

/* ================== Modal ================== */
function openModal() {
  modalEl.classList.remove("hidden");
}

function closeModal() {
  chartRequestId++;
  modalState.coin = null;

  modalEl.classList.add("hidden");
  mStatusEl.textContent = "";
  destroyChart();
}

async function loadModalChart() {
  const coin = modalState.coin;
  if (!coin) return;

  const requestId = ++chartRequestId;
  const days = modalState.days;
  const currency = state.currency;

  mSubEl.textContent =
    `Last ${days} days • ${currency.toUpperCase()}`;

  mStatusEl.textContent = "Loading chart...";

  try {
    const prices = await fetchCoinChart(
      coin.id,
      days,
      currency
    );

    // Ignore outdated requests or closed modal
    if (
      requestId !== chartRequestId ||
      modalEl.classList.contains("hidden")
    ) {
      return;
    }

    const first = prices[0]?.[1] ?? 0;
    const last = prices.at(-1)?.[1] ?? 0;
    const up = last >= first;

    const success = renderChart(prices, {
      label: coin.name,
      up,
    });

    mStatusEl.textContent = success
      ? ""
      : "No chart data available.";

  } catch (err) {
    // Ignore errors from outdated requests
    if (
      requestId !== chartRequestId ||
      modalEl.classList.contains("hidden")
    ) {
      return;
    }

    console.error(err);
    mStatusEl.textContent = "Could not load chart 😢";
  }
}

async function showCoinModal(coin) {
  modalState.coin = coin;

  mLogoEl.src = coin.image;
  mLogoEl.alt = coin.name;
  mNameEl.textContent =
    `${coin.name} (${coin.symbol.toUpperCase()})`;

  openModal();
  await loadModalChart();
}

/* ================== API Error Handling ================== */
function getErrorMessage(error) {
  const status = error.response?.status;

  if (status === 429) {
    return "Too many requests. Please wait a moment and try again.";
  }

  if (status >= 500) {
    return "The server is temporarily unavailable. Please try again later.";
  }

  if (!error.response) {
     return "Unable to connect to CoinGecko. Please try again later.";

  }

  return "Could not load data. Please try again.";
}

function showLoadError(error) {
  const errorMessage = getErrorMessage(error);

  statusEl.innerHTML = `
    <div class="errorbox">
      <strong>${errorMessage}</strong>
      <button id="retry" class="btn">Retry</button>
    </div>
  `;

  if (!state.coins.length) {
    rowsEl.innerHTML = "";
  }

  document
    .querySelector("#retry")
    ?.addEventListener("click", () => {
      loadAndRender({ showSkeleton: false });
    });
}

/* ================== Load + Render ================== */
async function loadAndRender({ showSkeleton = false } = {}) {
  // Avoid overlapping requests
  if (isLoading) return;

  isLoading = true;

  const currencyAtStart = state.currency;

  if (showSkeleton) {
    statusEl.textContent = "";
    renderSkeleton(10);
  }

  try {
    const coins = await fetchCoins(currencyAtStart);

    // Ignore results if the currency changed
    if (currencyAtStart !== state.currency) {
      return;
    }

    state.coins = coins;
    renderRows(state.coins);
    setUpdatedNow();

  } catch (error) {
    console.error(error);

    if (currencyAtStart === state.currency) {
      showLoadError(error);
    }

  } finally {
    isLoading = false;

    // Load the latest currency if it changed
    // while another request was running
    if (requestedCurrency !== currencyAtStart) {
      requestedCurrency = state.currency;
      loadAndRender({ showSkeleton: true });
    }
  }
}

/* ================== Init ================== */
function init() {
  // Initial load
  loadAndRender({ showSkeleton: true });

  // Search
  searchEl.addEventListener("input", () => {
    state.query = searchEl.value;
    renderRows(state.coins);
  });

  // Sort
  sortEl.addEventListener("change", () => {
    state.sort = sortEl.value;
    renderRows(state.coins);
  });

  // Currency
  currencyEl.addEventListener("change", () => {
    state.currency = currencyEl.value;
    requestedCurrency = state.currency;

    localStorage.setItem(CUR_KEY, state.currency);

    // Clear old currency data
    state.coins = [];

    if (!isLoading) {
      loadAndRender({ showSkeleton: true });
    } else {
      renderSkeleton(10);
    }
  });

  // Favorites toggle
  toggleFavsBtn.addEventListener("click", () => {
    state.showFavsOnly = !state.showFavsOnly;

    toggleFavsBtn.textContent = state.showFavsOnly
      ? "⭐ Favorites: ON"
      : "⭐ Favorites: OFF";

    renderRows(state.coins);
  });

  // Table clicks
  rowsEl.addEventListener("click", (e) => {
    const tr = e.target.closest("tr");
    if (!tr) return;

    const id = tr.dataset.id;

    if (e.target.closest(".star")) {
      toggleFav(id);
      renderRows(state.coins);
      return;
    }

    const coin = state.coins.find((c) => c.id === id);

    if (coin) {
      showCoinModal(coin);
    }
  });

  // Close modal
  closeModalBtn.addEventListener("click", closeModal);

  modalEl.addEventListener("click", (e) => {
    if (e.target === modalEl) {
      closeModal();
    }
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
    }
  });

  // Chart range
  rangeEl.addEventListener("change", async () => {
    modalState.days = Number(rangeEl.value);
    await loadModalChart();
  });
}

init();

/* ================== Auto Refresh ================== */
setInterval(() => {
  // Skip refresh when the tab is in the background
  if (document.hidden) return;

  // Skip refresh while another request is running
  if (isLoading) return;

  loadAndRender();

}, 60000);
