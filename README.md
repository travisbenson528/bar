# Sigma Bar Chart Plugin

This repository contains a lightweight, dependency-free Sigma Computing plugin that renders an interactive SVG bar chart. It ships with a small data bridge so you can run it locally without Sigma and seamlessly switch to the hosted runtime once it is uploaded to Sigma.

![Bar chart preview](https://uploads.sigmacomputing.com/plugins/bar-chart.png)

## Features

- Listens for Sigma plugin `postMessage` payloads (and falls back to local sample data while developing).
- Automatically aggregates duplicate categories and keeps the configuration minimal: first column is treated as the dimension, the second column as the measure.
- Responsive SVG rendering with gradients, tooltips, axis guides, and rotated labels for dense data.
- Zero npm dependencies. Development relies on the browser module graph, and the build step simply copies the `public/` directory so you can zip and upload it to Sigma.

## Project structure

```
public/
  index.html         # Plugin entry file referenced by sigma-manifest.json
  main.js            # Sets up the UI shell and wires the data bridge to the chart
  sigma-bridge.js    # Normalizes Sigma payloads and replays sample data locally
  table-utils.js     # Converts Sigma tables to the shape expected by the chart
  viz-bar-chart.js   # SVG renderer + tooltip logic
  styles.css         # Card layout and visualization styling
scripts/build.js     # Copies public/ and the manifest into dist/
sigma-manifest.json  # Plugin metadata consumed by Sigma
```

## Getting started

1. **Install requirements** – Only Node.js (for the copy script) and Python (for the dev server) are required. No npm packages are installed.
2. **Start a local preview server**

   ```bash
   npm run dev
   ```

   This serves the `public/` directory on `http://localhost:4173` using Python's built-in HTTP server. Because the plugin is not iframe-embedded in Sigma when you run it locally, the `SigmaBridge` automatically injects a small sample dataset so you can iterate on the visualization.

3. **Build distributable assets**

   ```bash
   npm run build
   ```

   The script wipes `dist/`, copies `public/` and `sigma-manifest.json` into the folder, and prints the output directory. Zip the contents of `dist/` and upload them as a Sigma plugin.

## Hooking into Sigma

Sigma loads plugins inside an iframe and communicates via `postMessage`. The `SigmaBridge` class inside `public/sigma-bridge.js` handles common message formats:

- `sigma.data`, `sigma.payload`, `sigma:payload`, `sigma.viz.payload`, and `sigma-plugin-data` payloads that include `{ columns, rows }` or nested `table`, `data`, or `dataset` objects.
- Columnar payloads (`{ columns, values }`) and record-based payloads (`{ columns, records: [...] }`).

If your Sigma workbook produces a different shape, update `normalizeTablePayload` to handle it. The bridge falls back to a sample dataset when the plugin isn't embedded so you can iterate without a live workbook.

Once a normalized table arrives, `tableToSeries` converts it into an array of `{ category, value }` objects and feeds the `BarChart` renderer.

## Deploying to Sigma

1. Run `npm run build`.
2. Zip the **contents** of the `dist/` directory (do not zip the folder itself).
3. Upload the zip file in Sigma under *Administration → Plugin Gallery*.
4. Assign the plugin to a workbook and map the first field to your desired dimension and the second to the numeric measure.

## Customizing

- Update the gradient colors and typography in `public/styles.css` to align with your brand.
- Extend `table-utils.js` if you need to handle multiple measures or expose plugin configuration knobs via the manifest.
- For more complex build steps, swap out the copy script for a bundler such as Vite or esbuild and adjust `sigma-manifest.json` to reference the bundled entry point.
