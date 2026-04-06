FROM node:18-slim
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# MCP stdio servers usually run via command line, but on Cloud Run we need an HTTP bridge 
# unless we use the newer MCP over HTTP.
# Actually, Google's MCP Data Toolbox usually provides an HTTP interface.
# I'll adapt my server to support HTTP (SSE) or use a simpler approach.
# For Cloud Run, HTTP is required.

EXPOSE 8080
CMD [ "node", "index.js" ]
