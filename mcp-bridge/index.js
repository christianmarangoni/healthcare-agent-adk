const express = require("express");
const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { SSEServerTransport } = require("@modelcontextprotocol/sdk/server/sse.js");
const { CallToolRequestSchema, ListToolsRequestSchema } = require("@modelcontextprotocol/sdk/types.js");
const { Client } = require("pg");

const app = express();

const dbConfig = {
  host: process.env.DB_HOST || `/cloudsql/rootprj-377111:europe-west1:healthcare-db-instance`,
  user: process.env.DB_USER || "mcp_user",
  password: process.env.DB_PASSWORD || "mcp_password_2026",
  database: process.env.DB_NAME || "healthcare",
};

// Map to store active transports by session or just handle per request if stateless
let activeTransports = new Map();

const server = new Server(
  { name: "healthcare-mcp-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

const pgClient = new Client(dbConfig);
pgClient.connect().catch(err => console.error("Database connection error:", err));

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "query_doctors",
      description: "Esegue una query SQL sul database dei medici specialisti di Milano.",
      inputSchema: {
        type: "object",
        properties: {
          sql: { type: "string", description: "La query SQL da eseguire (es. SELECT * FROM doctors WHERE specialization = 'CARDIOLOGIA' AND city = 'MILANO')." },
        },
        required: ["sql"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "query_doctors") {
    const sql = request.params.arguments.sql;
    console.log("Executing SQL:", sql);
    if (!sql.toLowerCase().trim().startsWith("select")) {
      return { content: [{ type: "text", text: "Errore: Solo query SELECT ammesse." }], isError: true };
    }
    try {
      const res = await pgClient.query(sql);
      return { content: [{ type: "text", text: JSON.stringify(res.rows, null, 2) }] };
    } catch (err) {
      console.error("SQL Error:", err.message);
      return { content: [{ type: "text", text: `Errore SQL: ${err.message}` }], isError: true };
    }
  }
  throw new Error("Tool not found");
});

app.get("/sse", async (req, res) => {
  console.log("New SSE request received");
  const transport = new SSEServerTransport("/message", res);
  
  // To avoid 'Already connected' error, we should create a NEW server instance per connection 
  // or manage transports correctly. ADK/Gemini often creates fresh connections.
  const sessionServer = new Server(
    { name: "healthcare-mcp-server", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );
  
  // Reuse handlers
  sessionServer.setRequestHandler(ListToolsRequestSchema, server.getRequestHandler(ListToolsRequestSchema));
  sessionServer.setRequestHandler(CallToolRequestSchema, server.getRequestHandler(CallToolRequestSchema));

  await sessionServer.connect(transport);
  
  // Store transport by a unique ID or use the one from the SDK
  const sessionId = transport.sessionId;
  activeTransports.set(sessionId, transport);
  
  req.on("close", () => {
    console.log(`SSE connection closed for session ${sessionId}`);
    activeTransports.delete(sessionId);
  });
});

app.post("/message", async (req, res) => {
  // The SDK uses a query param 'sessionId' to route POST messages back to the SSE stream
  const sessionId = req.query.sessionId;
  const transport = activeTransports.get(sessionId);
  
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    console.warn(`No active transport found for sessionId: ${sessionId}`);
    res.status(400).send("No active transport");
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Healthcare MCP SSE Server (Session-Aware) listening on port ${PORT}`);
});
