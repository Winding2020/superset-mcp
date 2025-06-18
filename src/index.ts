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
import { getErrorMessage } from "./utils/error.js";

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
    const result = await handleToolCall(request);
    
    // Always return the result as MCP success, even if it contains an error
    // This allows users to see the actual error details in the MCP client
    if (result.isError) {
      console.error(`Tool execution failed for ${request.params.name}:`, result.content?.[0]?.text || 'Unknown error occurred');
    }
    
    return result;
  } catch (error) {
    // Convert any uncaught errors to error result format
    const errorMessage = getErrorMessage(error);
    console.error(`Tool execution failed for ${request.params.name}:`, errorMessage);
    
    return {
      content: [
        {
          type: "text",
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
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
    const errorMessage = getErrorMessage(error);
    console.error(`Resource read failed for ${request.params.uri}:`, errorMessage);
    
    // Return error as successful response content
    return {
      contents: [
        {
          uri: request.params.uri,
          mimeType: "text/plain",
          text: `Error reading resource: ${errorMessage}`,
        },
      ],
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server startup failed:", getErrorMessage(error));
  process.exit(1);
}); 