const express = require("express");
const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { SSEServerTransport } = require("@modelcontextprotocol/sdk/server/sse.js");
const { CallToolRequestSchema, ListToolsRequestSchema } = require("@modelcontextprotocol/sdk/types.js");
const { Client } = require("pg");

const app = express();

const dbConfig = {
  // On Cloud Run with Cloud SQL instance connection, host is /cloudsql/INSTANCE_CONNECTION_NAME
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "mcp_user",
  password: process.env.DB_PASSWORD || "mcp_password_2026",
  database: process.env.DB_NAME || "healthcare",
};

const server = new Server(
  { name: "healthcare-mcp-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

const pgClient = new Client(dbConfig);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "query_doctors",
      description: "Esegue una query SQL sul database dei medici specialisti di Milano.",
      inputSchema: {
        type: "object",
        properties: {
          sql: { type: "string", description: "La query SQL da eseguire (sola lettura)." },
        },
        required: ["sql"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "query_doctors") {
    const sql = request.params.arguments.sql;
    if (!sql.toLowerCase().trim().startsWith("select")) {
      return { content: [{ type: "text", text: "Errore: Solo query SELECT ammesse." }], isError: true };
    }
    try {
      if (!pgClient._connected) await pgClient.connect();
      const res = await pgClient.query(sql);
      return { content: [{ type: "text", text: JSON.stringify(res.rows, null, 2) }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Errore SQL: ${err.message}` }], isError: true };
    }
  }
  throw new Error("Tool not found");
});

let transport;

app.get("/sse", async (req, res) => {
  transport = new SSEServerTransport("/message", res);
  await server.connect(transport);
});

app.post("/message", async (req, res) => {
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(400).send("No active transport");
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Healthcare MCP SSE Server listening on port ${PORT}`);
});
