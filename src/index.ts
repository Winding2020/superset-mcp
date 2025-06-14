#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  McpError,
  ErrorCode,
} from "@modelcontextprotocol/sdk/types.js";

import { toolDefinitions } from "./server/tools.js";
import { resourceDefinitions } from "./server/resources.js";
import { handleToolCall } from "./handlers/tool-handlers.js";
import { handleResourceRead } from "./handlers/resource-handlers.js";

// Create MCP server
const server = new Server({
  name: "superset-dataset-mcp",
  version: "1.0.0",
}, {
  capabilities: {
    tools: {},
    resources: {},
  },
});

// Tool list handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: toolDefinitions,
  };
});

// Tool execution handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    return await handleToolCall(request);
  } catch (error) {
    throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error}`);
  }
});

// Resource list handler
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: resourceDefinitions,
  };
});

// Resource read handler
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  try {
    return await handleResourceRead(request);
  } catch (error) {
    throw new McpError(ErrorCode.InternalError, `Resource read failed: ${error}`);
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server startup failed:", error);
  process.exit(1);
}); 