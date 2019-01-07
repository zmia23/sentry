// States and transitions from RFC 793
const states = {
  "outer-space": {
    label: "Internet",
    description: "Clients that use Sentry SDKs",
    styles: ["comp-outer"]
  },
  "web-worker": {
    label: "Web worker (uwsgi)",
    description: `
    Processes requests <i>synchronously</i>.
    Does some basic event checks and discards garbage.
    Returns the event ID.<br><br>
      Sources:
      <ul>
      <li><a href="https://github.com/getsentry/sentry/blob/37eb11f6b050fd019375002aed4cf1d8dff2b117/src/sentry/web/api.py#L465">StoreView class</a></li>
      <li><a href="https://github.com/getsentry/sentry/blob/37eb11f6b050fd019375002aed4cf1d8dff2b117/src/sentry/web/api.py#L532">Main processing function</a></li>
      </ul>`,
    styles: ["comp-uwsgi", "comp-sync"]
  },
  "task-preprocess-event": {
    label: "Task: preprocess event",
    styles: ["comp-celery-task"]
  },
  "task-process-event": {
    label: "Task: process event",
    styles: ["comp-celery-task"]
  },
  "task-save-event": {
    label: "Task: save event",
    styles: ["comp-celery-task"]
  },
  "redis-buffers": {
    label: "Redis (buffers)",
    styles: ["comp-redis"]
  },
  "database-postgres": {
    label: "Database (PostgreSQL)",
    styles: ["comp-database"]
  },
  "kafka-eventstream": {
    label: "Kafka Event Stream",
    styles: ["comp-kafka"]
  }
};

const edges = [
  {
    from: "outer-space",
    to: "web-worker",
    options: {
      label: "Raw event data",
      description: `
        Example: <br>
        <pre>{bla}</pre>
      `,
      styles: ["main-flow"]
    }
  },
  {
    from: "web-worker",
    to: "task-preprocess-event",
    options: {
      label: "Start task",
      description: `
        Source:
        <a href="https://github.com/getsentry/sentry/blob/824c03089907ad22a9282303a5eaca33989ce481/src/sentry/coreapi.py#L182">Scheduling "preprocess_event"</a>
      `,
      styles: ["main-flow"]
    }
  },
  {
    from: "task-preprocess-event",
    to: "task-process-event",
    options: {
      label: "    Start task",
      description: `
        Source:
        <a href="https://github.com/getsentry/sentry/blob/37eb11f6b050fd019375002aed4cf1d8dff2b117/src/sentry/tasks/store.py#L78">Scheduling "process_event"</a>
      `,
      styles: ["main-flow"]
    }
  },
  {
    from: "task-process-event",
    to: "task-save-event",
    options: {
      label: "   Start task",
      description: `
        Source:
        <a href="https://github.com/getsentry/sentry/blob/37eb11f6b050fd019375002aed4cf1d8dff2b117/src/sentry/tasks/store.py#L193">Scheduling "save_event"</a>
      `,
      styles: ["main-flow"]
    }
  },
  { from: "web-worker", to: "redis-buffers" },
  { from: "redis-buffers", to: "task-preprocess-event" },
  { from: "redis-buffers", to: "task-process-event" },
  { from: "redis-buffers", to: "task-save-event" },
  {
    from: "task-save-event",
    to: "database-postgres",
    options: {
      label: "    Save to DB",
      description: `Source: <a href="https://github.com/getsentry/sentry/blob/37eb11f6b050fd019375002aed4cf1d8dff2b117/src/sentry/event_manager.py#L1112">Saving to database</a>`
    }
  },
  { from: "task-save-event", to: "kafka-eventstream" }
];

function setEdge(g, fromNode, toNode, options) {
  const defaultOptions = { curve: d3.curveBasis };
  const finalOptions = { ...defaultOptions, ...(options || {}) };
  g.setEdge(fromNode, toNode, finalOptions);
}

function prepareElements(g) {
  // Add states to the graph, set labels, and style
  Object.keys(states).forEach(function (state) {
    const value = states[state];
    // value.label = state;
    value.rx = value.ry = 5;
    if (value.styles && value.styles.length > 0) {
      value.class = value.styles.join(" ");
    }
    g.setNode(state, value);
  });

  edges.forEach(function (edgeParams) {
    const options = { ...edgeParams.options };
    if (options.styles && options.styles.length > 0) {
      options.class = options.styles.join(" ");
    }
    setEdge(g, edgeParams.from, edgeParams.to, options);
  });
}

function addTooltips(inner, g) {
  // Simple function to style the tooltip for the given node.
  const styleTooltip = (name, description) => {
    console.log(description);
    return (
      `
      <div class="name">${name}</div>
      <div class="description">${description}</div>
      `
    );
  };

  const tooltipOptions = {
    gravity: "w",
    opacity: 1,
    html: true,
    hoverable: true
  };

  // Add tooltips for nodes
  inner
    .selectAll("g.node")
    .attr("title", (v) => {
      const node = g.node(v);
      return styleTooltip(node.label.trim(), node.description);
    })
    .each(function (v) {
      $(this).tipsy(tooltipOptions);
    });

  // Add tooltips for edges
  inner
    .selectAll("g.edgeLabel")
    .attr("title", (v) => {
      const edge = g.edge(v);
      return styleTooltip(edge.label.trim(), edge.description || "");
    })
    .each((v) => {
      $(this).tipsy(tooltipOptions);
    });
}

function initGraph() {
  // Create a new directed graph
  const g = new dagreD3.graphlib.Graph().setGraph({});

  prepareElements(g);

  // Create the renderer
  const render = new dagreD3.render();

  // Set up an SVG group so that we can translate the final graph.
  const svg = d3.select("svg");
  const inner = svg.append("g");

  // Set up zoom support
  const zoom = d3.zoom().on("zoom", () => {
    inner.attr("transform", d3.event.transform);
  });
  svg.call(zoom);

  // Run the renderer. This is what draws the final graph.
  render(inner, g);

  addTooltips(inner, g);

  // Center the graph
  const initialScale = 0.75;
  svg.call(
    zoom.transform,
    d3.zoomIdentity
      .translate((svg.attr("width") - g.graph().width * initialScale) / 2, 20)
      .scale(initialScale)
  );

  svg.attr("height", g.graph().height * initialScale + 40);
}

$(document).ready(initGraph);
