// States and transitions from RFC 793
const states = {
  "outer-space": {
    label: "Internet",
    description: "Clients",
    styles: ["comp-outer"]
  },
  "web-worker": {
    label: "Web worker (uwsgi)",
    description: "web worker",
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
      description: "test desc"
    }
  },
  {
    from: "web-worker",
    to: "task-preprocess-event",
    options: {
      style: "fill: none; stroke-width: 3px"
    }
  },
  {
    from: "task-preprocess-event",
    to: "task-process-event",
    options: { styles: ["main-flow"] }
  },
  { from: "task-process-event", to: "task-save-event" },
  { from: "web-worker", to: "redis-buffers" },
  { from: "redis-buffers", to: "task-preprocess-event" },
  { from: "redis-buffers", to: "task-process-event" },
  { from: "redis-buffers", to: "task-save-event" },
  { from: "task-save-event", to: "database-postgres" },
  { from: "task-save-event", to: "kafka-eventstream" }
];

function setEdge(g, fromNode, toNode, options) {
  const defaultOptions = { curve: d3.curveBasis };
  const finalOptions = { ...defaultOptions, ...(options || {}) };
  g.setEdge(fromNode, toNode, finalOptions);
}

function prepareElements(g) {
  // Add states to the graph, set labels, and style
  Object.keys(states).forEach(function(state) {
    const value = states[state];
    // value.label = state;
    value.rx = value.ry = 5;
    if (value.styles && value.styles.length > 0) {
      value.class = value.styles.join(" ");
    }
    g.setNode(state, value);
  });

  edges.forEach(function(edgeParams) {
    const options = { ...edgeParams.options };
    if (options.styles && options.styles.length > 0) {
      options.class = options.styles.join(" ");
    }
    setEdge(g, edgeParams.from, edgeParams.to, options);
  });
}

function addTooltips(inner, g) {
  // Simple function to style the tooltip for the given node.
  const styleTooltip = function(name, description) {
    return (
      "<p class='name'>" +
      name +
      "</p><p class='description'>" +
      description +
      "</p>"
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
    .attr("title", function(v) {
      return styleTooltip(v, g.node(v).description);
    })
    .each(function(v) {
      $(this).tipsy(tooltipOptions);
    });

  // Add tooltips for edges
  inner
    .selectAll("g.edgeLabel")
    .attr("title", function(v) {
      return styleTooltip("edge-name", g.edge(v).description || "");
    })
    .each(function(v) {
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
  const zoom = d3.zoom().on("zoom", function() {
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
