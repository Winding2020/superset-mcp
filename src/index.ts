#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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

import { toolDefinitions, handleToolCall } from "./handlers/tool-handlers.js";
import { resourceDefinitions, handleResourceRead } from "./handlers/resource-handlers.js";
import { getErrorMessage } from "./utils/error.js";

const currentDir = dirname(fileURLToPath(import.meta.url));
const packageJsonPath = resolve(currentDir, "../package.json");
const packageInfo = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

if (process.argv.includes("--version") || process.argv.includes("-v")) {
  console.log(`${packageInfo.name} ${packageInfo.version}`);
  process.exit(0);
}

// Create MCP server
const server = new Server({
  name: "superset-dataset-mcp",
  version: packageInfo.version,
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