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
  
  console.error("Superset Dataset MCP服务器已启动并通过stdio监听");
  console.error("支持的功能:");
  console.error("- Dataset管理: 列表、查看、创建、更新、删除、刷新schema");
  console.error("- Dataset Metrics管理: 查看、创建、更新、删除metrics");
  console.error("- Dataset字段查询: 获取字段信息以辅助创建metrics");
  console.error("- 数据库连接管理");
  console.error("");
  console.error("支持的环境变量:");
  console.error("- SUPERSET_BASE_URL: Superset服务器地址（默认: http://localhost:8088）");
  console.error("- SUPERSET_USERNAME: 用户名");
  console.error("- SUPERSET_PASSWORD: 密码");
  console.error("- SUPERSET_ACCESS_TOKEN: 访问令牌（可选，如果提供则无需用户名密码）");
}

main().catch((error) => {
  console.error("服务器启动失败:", error);
  process.exit(1);
}); 