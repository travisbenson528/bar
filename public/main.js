import { SigmaBridge } from "./sigma-bridge.js";
import { tableToSeries } from "./table-utils.js";
import { BarChart } from "./viz-bar-chart.js";

const app = document.querySelector("#app");
const { card, chartContainer, legendElement, metaElement } = createLayout();
app.innerHTML = "";
app.appendChild(card);

const chart = new BarChart(chartContainer);
chart.showMessage("Listening for Sigma data…");
const bridge = new SigmaBridge();

bridge.onStatus((message) => {
  metaElement.textContent = message;
});

bridge.onError((error) => {
  metaElement.textContent = error.message || "Unknown Sigma error";
});

bridge.onData((table) => {
  const { series, dimensionName, measureName, rowCount } = tableToSeries(table);
  legendElement.innerHTML = `
    <span><i style="background:#6366f1"></i>${escapeHtml(dimensionName)}</span>
    <span><i style="background:#8b5cf6"></i>${escapeHtml(measureName)}</span>
    <span><i style="background:#e4e7ec"></i>${rowCount} rows</span>
  `;

  chart.setData(series);
});

bridge.bootstrap();

function createLayout() {
  const card = document.createElement("div");
  card.className = "card";

  const header = document.createElement("div");
  header.className = "card-header";

  const title = document.createElement("h1");
  title.textContent = "Bar Chart";
  header.appendChild(title);

  const meta = document.createElement("p");
  meta.textContent = "Waiting for Sigma data…";
  header.appendChild(meta);

  const legend = document.createElement("div");
  legend.className = "legend";
  legend.innerHTML =
    '<span><i style="background:#6366f1"></i>Dimension</span><span><i style="background:#8b5cf6"></i>Measure</span>';

  const chartContainer = document.createElement("div");
  chartContainer.className = "chart-container";

  card.appendChild(header);
  card.appendChild(legend);
  card.appendChild(chartContainer);

  return {
    card,
    chartContainer,
    legendElement: legend,
    metaElement: meta
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
