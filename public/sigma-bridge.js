const SAMPLE_TABLE = {
  columns: [
    { name: "Category", type: "string" },
    { name: "Total", type: "number" }
  ],
  rows: [
    ["North", 120],
    ["South", 90],
    ["East", 150],
    ["West", 60]
  ]
};

const EVENT_TYPES = [
  "sigma.data",
  "sigma:payload",
  "sigma.payload",
  "sigma.viz.payload",
  "sigma-plugin-data"
];

export class SigmaBridge {
  constructor(targetWindow = window) {
    this.win = targetWindow;
    this.listeners = {
      data: new Set(),
      error: new Set(),
      status: new Set()
    };
    this.lastTable = null;
    this.handleMessage = this.handleMessage.bind(this);
  }

  onData(callback) {
    this.listeners.data.add(callback);
    if (this.lastTable) {
      callback(this.lastTable);
    }
    return () => this.listeners.data.delete(callback);
  }

  onError(callback) {
    this.listeners.error.add(callback);
    return () => this.listeners.error.delete(callback);
  }

  onStatus(callback) {
    this.listeners.status.add(callback);
    return () => this.listeners.status.delete(callback);
  }

  emitData(table) {
    this.lastTable = table;
    for (const cb of this.listeners.data) {
      cb(clone(table));
    }
  }

  emitError(error) {
    const normalized = typeof error === "string" ? { message: error } : error;
    for (const cb of this.listeners.error) {
      cb(normalized);
    }
  }

  emitStatus(message) {
    for (const cb of this.listeners.status) {
      cb(message);
    }
  }

  bootstrap() {
    this.win.addEventListener("message", this.handleMessage);
    if (this.win.parent === this.win) {
      this.emitStatus("Standalone preview mode");
      // Delay to let the UI mount before drawing.
      setTimeout(() => this.emitData(SAMPLE_TABLE), 150);
    } else {
      this.emitStatus("Waiting for Sigma host…");
      this.requestData();
    }
  }

  requestData() {
    if (this.win.parent === this.win) {
      return;
    }
    this.postToParent({ type: "sigma.requestData" });
  }

  postToParent(message) {
    try {
      this.win.parent.postMessage(message, "*");
    } catch (error) {
      this.emitError(error);
    }
  }

  handleMessage(event) {
    const { data } = event;
    if (!data || typeof data !== "object") {
      return;
    }

    const { type, payload } = data;
    if (!type) {
      return;
    }

    if (EVENT_TYPES.includes(type)) {
      const table = normalizeTablePayload(payload);
      if (table) {
        this.emitStatus("Rendering Sigma data");
        this.emitData(table);
      } else {
        this.emitError({
          message: "Received data from Sigma but it could not be parsed.",
          payload
        });
      }
      return;
    }

    if (type === "sigma.error") {
      this.emitError(payload || { message: "Unknown host error" });
      return;
    }

    if (type === "sigma.requestDataAck") {
      this.emitStatus("Data request acknowledged");
    }
  }
}

function normalizeTablePayload(payload) {
  if (!payload) {
    return null;
  }

  if (Array.isArray(payload.rows) && Array.isArray(payload.columns)) {
    return {
      columns: payload.columns,
      rows: payload.rows
    };
  }

  if (payload.table) {
    return normalizeTablePayload(payload.table);
  }

  if (payload.data) {
    return normalizeTablePayload(payload.data);
  }

  if (payload.dataset) {
    return normalizeTablePayload(payload.dataset);
  }

  if (Array.isArray(payload.columns) && Array.isArray(payload.records)) {
    const rows = payload.records.map((record) =>
      payload.columns.map((column) => record[column.name] ?? record[column.field])
    );
    return {
      columns: payload.columns,
      rows
    };
  }

  if (
    Array.isArray(payload.columns) &&
    payload.values &&
    typeof payload.values === "object"
  ) {
    const columns = payload.columns;
    const rows = [];
    const valueArrays = columns.map((column) => payload.values[column.name]);
    const lengths = valueArrays.map((arr) => (Array.isArray(arr) ? arr.length : 0));
    const rowCount = lengths.length ? Math.max(...lengths) : 0;
    for (let i = 0; i < rowCount; i += 1) {
      rows.push(valueArrays.map((arr) => (arr ? arr[i] : null)));
    }
    return { columns, rows };
  }

  return null;
}

function clone(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  if (value === undefined) {
    return value;
  }
  return JSON.parse(JSON.stringify(value));
}
