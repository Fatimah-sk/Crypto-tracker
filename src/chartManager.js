
import Chart from "chart.js/auto";
import { format } from "date-fns";
import { state } from "./state.js";

let chartInstance = null;

/* ================== Render Chart ================== */
export function renderChart(prices, { label, up }) {
  const chartCanvas = document.querySelector("#priceChart");

  // Check that the chart canvas exists
  if (!chartCanvas) {
    return false;
  }

  // Validate chart data
  if (!Array.isArray(prices) || prices.length === 0) {
    destroyChart();
    return false;
  }

  const validPrices = prices.filter(
    (item) =>
      Array.isArray(item) &&
      Number.isFinite(item[0]) &&
      Number.isFinite(item[1])
  );

  if (validPrices.length === 0) {
    destroyChart();
    return false;
  }

  const labels = validPrices.map(([ts]) =>
    format(new Date(ts), "dd/MM")
  );

  const values = validPrices.map(([, price]) => price);

  // Remove previous chart before creating a new one
  destroyChart();

  const line = up ? "#33d17a" : "#ff6b6b";
  const fill = up
    ? "rgba(51,209,122,0.18)"
    : "rgba(255,107,107,0.18)";

  chartInstance = new Chart(chartCanvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label,
          data: values,
          borderColor: line,
          backgroundColor: fill,
          fill: true,
          tension: 0.35,
          pointRadius: 0,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: "#0b1220",
          borderColor: line,
          borderWidth: 1,
          titleColor: "#fff",
          bodyColor: "#fff",
          callbacks: {
            label: (ctx) =>
              `${state.currency.toUpperCase()} ${Number(
                ctx.raw
              ).toLocaleString()}`,
          },
        },
      },
      scales: {
        x: {
          ticks: {
            maxTicksLimit: 6,
            color: "rgba(255,255,255,.6)",
          },
          grid: {
            color: "rgba(255,255,255,.05)",
          },
        },
        y: {
          ticks: {
            color: "rgba(255,255,255,.6)",
            callback: (v) => Number(v).toLocaleString(),
          },
          grid: {
            color: "rgba(255,255,255,.05)",
          },
        },
      },
    },
  });

  return true;
}

/* ================== Destroy Chart ================== */
export function destroyChart() {
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
}
