const SVG_NS = "http://www.w3.org/2000/svg";

export class BarChart {
  constructor(container) {
    this.container = container;
    this.series = [];
    this.svg = document.createElementNS(SVG_NS, "svg");
    this.tooltip = document.createElement("div");
    this.tooltip.className = "tooltip";
    this.message = document.createElement("div");
    this.message.className = "chart-message";
    this.message.textContent = "Listening for Sigma data…";
    this.container.appendChild(this.svg);
    this.container.appendChild(this.tooltip);
    this.container.appendChild(this.message);
    if ("ResizeObserver" in window) {
      this.resizeObserver = new ResizeObserver(() => this.render());
      this.resizeObserver.observe(this.container);
    } else {
      window.addEventListener("resize", () => this.render());
    }
  }

  setData(series) {
    this.series = Array.isArray(series) ? series : [];
    if (!this.series.length) {
      this.showMessage("Add a numeric measure to your Sigma dataset to render bars.");
      this.svg.innerHTML = "";
      return;
    }

    this.hideMessage();
    this.render();
  }

  render() {
    const width = this.container.clientWidth || 300;
    const height = this.container.clientHeight || 240;
    this.svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    this.svg.innerHTML = "";

    const padding = { top: 12, right: 24, bottom: 42, left: 64 };
    const chartWidth = Math.max(width - padding.left - padding.right, 10);
    const chartHeight = Math.max(height - padding.top - padding.bottom, 10);
    const maxValue = Math.max(...this.series.map((d) => d.value), 0);
    const ticks = buildTicks(maxValue, 4);

    const scaleX = (index) => {
      const step = chartWidth / this.series.length;
      return padding.left + step * index + step / 2;
    };

    const scaleY = (value) => {
      if (maxValue === 0) {
        return padding.top + chartHeight;
      }
      return padding.top + chartHeight - (value / maxValue) * chartHeight;
    };

    const axisGroup = document.createElementNS(SVG_NS, "g");
    axisGroup.setAttribute("stroke", "#d0d5dd");
    axisGroup.setAttribute("stroke-width", "1");
    axisGroup.setAttribute("fill", "none");

    ticks.forEach((tickValue) => {
      const y = scaleY(tickValue);
      const line = document.createElementNS(SVG_NS, "line");
      line.setAttribute("x1", padding.left);
      line.setAttribute("x2", padding.left + chartWidth);
      line.setAttribute("y1", y);
      line.setAttribute("y2", y);
      line.setAttribute("stroke", "#e4e7ec");
      axisGroup.appendChild(line);

      const label = document.createElementNS(SVG_NS, "text");
      label.textContent = formatNumber(tickValue);
      label.setAttribute("x", padding.left - 12);
      label.setAttribute("y", y + 4);
      label.setAttribute("text-anchor", "end");
      label.setAttribute("fill", "#475467");
      label.setAttribute("font-size", "12");
      axisGroup.appendChild(label);
    });

    this.svg.appendChild(axisGroup);

    const barGroup = document.createElementNS(SVG_NS, "g");
    const barWidth = Math.min(60, (chartWidth / this.series.length) * 0.8);

    this.series.forEach((point, index) => {
      const barHeight = chartHeight - (scaleY(point.value) - padding.top);
      const x = scaleX(index) - barWidth / 2;
      const y = scaleY(point.value);

      const rect = document.createElementNS(SVG_NS, "rect");
      rect.setAttribute("x", x);
      rect.setAttribute("y", y);
      rect.setAttribute("width", barWidth);
      rect.setAttribute("height", Math.max(barHeight, 0));
      rect.setAttribute("rx", "6");
      rect.setAttribute("fill", "url(#barGradient)");
      rect.setAttribute("data-category", point.category);
      rect.setAttribute("data-value", point.value);
      rect.addEventListener("mouseenter", (event) =>
        this.showTooltip(event, point)
      );
      rect.addEventListener("mouseleave", () => this.hideTooltip());
      rect.addEventListener("mousemove", (event) =>
        this.updateTooltipPosition(event)
      );
      barGroup.appendChild(rect);

      const label = document.createElementNS(SVG_NS, "text");
      label.textContent = point.category;
      label.setAttribute("x", scaleX(index));
      label.setAttribute("y", height - 12);
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("fill", "#475467");
      label.setAttribute("font-size", "12");
      if (this.series.length > 6) {
        label.setAttribute("transform", `rotate(-35 ${scaleX(index)} ${height - 12})`);
      }
      barGroup.appendChild(label);
    });

    this.svg.appendChild(createGradient());
    this.svg.appendChild(barGroup);
  }

  showTooltip(event, point) {
    this.tooltip.innerHTML = `<strong>${point.category}</strong><br>${formatNumber(
      point.value
    )}`;
    this.tooltip.classList.add("visible");
    this.updateTooltipPosition(event);
  }

  updateTooltipPosition(event) {
    const bounds = this.container.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    this.tooltip.style.left = `${x}px`;
    this.tooltip.style.top = `${y}px`;
  }

  hideTooltip() {
    this.tooltip.classList.remove("visible");
  }

  showMessage(text) {
    this.message.textContent = text;
    this.message.classList.add("visible");
  }

  hideMessage() {
    this.message.classList.remove("visible");
  }
}

function createGradient() {
  const defs = document.createElementNS(SVG_NS, "defs");
  const gradient = document.createElementNS(SVG_NS, "linearGradient");
  gradient.setAttribute("id", "barGradient");
  gradient.setAttribute("x1", "0%");
  gradient.setAttribute("x2", "0%");
  gradient.setAttribute("y1", "0%");
  gradient.setAttribute("y2", "100%");

  const stopTop = document.createElementNS(SVG_NS, "stop");
  stopTop.setAttribute("offset", "0%");
  stopTop.setAttribute("stop-color", "#6366f1");
  stopTop.setAttribute("stop-opacity", "0.95");

  const stopBottom = document.createElementNS(SVG_NS, "stop");
  stopBottom.setAttribute("offset", "100%");
  stopBottom.setAttribute("stop-color", "#4f46e5");
  stopBottom.setAttribute("stop-opacity", "0.8");

  gradient.appendChild(stopTop);
  gradient.appendChild(stopBottom);
  defs.appendChild(gradient);
  return defs;
}

function buildTicks(max, count) {
  if (max === 0) {
    return [0];
  }
  const ticks = [];
  const step = max / count;
  for (let i = 0; i <= count; i += 1) {
    ticks.push(Math.round(step * i));
  }
  return ticks;
}

function formatNumber(value) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 1
  }).format(value);
}
