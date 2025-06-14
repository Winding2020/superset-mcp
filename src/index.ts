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

// 创建MCP服务器
const server = new Server({
  name: "superset-dataset-mcp",
  version: "1.0.0",
}, {
  capabilities: {
    tools: {},
    resources: {},
  },
});

// 工具列表
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: toolDefinitions,
  };
});

// 工具执行处理器
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    return await handleToolCall(request);
  } catch (error) {
    throw new McpError(ErrorCode.InternalError, `工具执行失败: ${error}`);
  }
});

// 资源列表
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: resourceDefinitions,
  };
});

// 资源读取处理器
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  try {
    return await handleResourceRead(request);
  } catch (error) {
    throw new McpError(ErrorCode.InternalError, `资源读取失败: ${error}`);
  }
});

// 启动服务器
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("服务器启动失败:", error);
  process.exit(1);
}); 