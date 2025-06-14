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
import axios, { AxiosInstance, AxiosError } from "axios";
import { z } from "zod";

// 错误处理帮助函数
function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    return error.response?.data?.message || error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

// Superset客户端配置接口
interface SupersetConfig {
  baseUrl: string;
  username?: string;
  password?: string;
  accessToken?: string;
}

// Dataset数据结构
interface Dataset {
  id: number;
  database_id: number;
  table_name: string;
  schema?: string;
  description?: string;
  sql?: string;
  params?: string;
  cache_timeout?: number;
  is_sqllab_view?: boolean;
  template_params?: string;
  owners?: Array<{ id: number; username: string }>;
  metrics?: Array<any>;
  columns?: Array<any>;
}

// Dataset Metric数据结构
interface DatasetMetric {
  id?: number;
  metric_name: string;
  metric_type?: string;
  expression: string;
  description?: string;
  verbose_name?: string;
  warning_text?: string;
  d3format?: string;
  extra?: string;
  is_restricted?: boolean;
}

// Superset API客户端类
class SupersetClient {
  private api: AxiosInstance;
  private config: SupersetConfig;
  private isAuthenticated = false;
  private csrfToken?: string;

  constructor(config: SupersetConfig) {
    this.config = config;
    this.api = axios.create({
      baseURL: config.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // 启用cookie支持以维持session
    });

    // 请求拦截器：添加认证token
    this.api.interceptors.request.use((config) => {
      if (this.config.accessToken) {
        config.headers.Authorization = `Bearer ${this.config.accessToken}`;
      }
      return config;
    });
  }

  // 认证登录
  async authenticate(): Promise<void> {
    if (this.config.accessToken) {
      this.isAuthenticated = true;
      return;
    }

    if (!this.config.username || !this.config.password) {
      throw new Error("需要提供用户名和密码或访问令牌");
    }

    try {
      const response = await this.api.post('/api/v1/security/login', {
        username: this.config.username,
        password: this.config.password,
        provider: 'db',
        refresh: true,
      });

      this.config.accessToken = response.data.access_token;
      this.isAuthenticated = true;
    } catch (error) {
      throw new Error(`认证失败: ${getErrorMessage(error)}`);
    }
  }

  // 获取CSRF令牌
  private async getCsrfToken(): Promise<{ token: string; sessionCookie: string }> {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.api.get('/api/v1/security/csrf_token/');
      const token = response.data.result;
      const sessionCookie = response.headers['set-cookie']?.find((cookie: string) => 
        cookie.startsWith('session=')
      )?.split(';')[0]?.split('=')[1] || '';
      
      this.csrfToken = token;
      return { token, sessionCookie };
    } catch (error) {
      throw new Error(`获取CSRF令牌失败: ${getErrorMessage(error)}`);
    }
  }

  // 确保已认证
  private async ensureAuthenticated(): Promise<void> {
    if (!this.isAuthenticated) {
      await this.authenticate();
    }
  }

  // 确保有CSRF令牌
  private async ensureCsrfToken(): Promise<{ token: string; sessionCookie: string }> {
    if (!this.csrfToken) {
      return await this.getCsrfToken();
    }
    // 如果已有token，重新获取以确保session cookie是最新的
    return await this.getCsrfToken();
  }

  // 执行需要CSRF保护的请求
  private async makeProtectedRequest(config: any): Promise<any> {
    await this.ensureAuthenticated();
    const { token, sessionCookie } = await this.ensureCsrfToken();
    
    // 创建一个新的axios实例来处理这个特定请求
    const protectedApi = axios.create({
      baseURL: this.config.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.accessToken}`,
        'X-CSRFToken': token,
        ...config.headers,
      },
      withCredentials: true,
    });

    // 如果有session cookie，添加到请求中
    if (sessionCookie) {
      protectedApi.defaults.headers.common['Cookie'] = `session=${sessionCookie}`;
    }

    return protectedApi.request(config);
  }

  // 获取所有datasets
  async getDatasets(page = 0, pageSize = 20): Promise<{ result: Dataset[]; count: number }> {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.api.get('/api/v1/dataset/', {
        params: {
          q: JSON.stringify({
            page,
            page_size: pageSize,
            order_column: 'changed_on_delta_humanized',
            order_direction: 'desc',
          }),
        },
      });
      
      return {
        result: response.data.result,
        count: response.data.count,
      };
    } catch (error) {
      throw new Error(`获取datasets失败: ${getErrorMessage(error)}`);
    }
  }

  // 根据ID获取单个dataset
  async getDataset(id: number): Promise<Dataset> {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.api.get(`/api/v1/dataset/${id}`);
      return response.data.result;
    } catch (error) {
      throw new Error(`获取dataset ${id}失败: ${getErrorMessage(error)}`);
    }
  }

  // 创建新dataset
  async createDataset(dataset: Partial<Dataset>): Promise<Dataset> {
    try {
      // 转换参数格式：database_id -> database
      const requestData = {
        ...dataset,
        database: dataset.database_id,
      };
      delete requestData.database_id;

      const response = await this.makeProtectedRequest({
        method: 'POST',
        url: '/api/v1/dataset/',
        data: requestData
      });
      return response.data.result;
    } catch (error) {
      throw new Error(`创建dataset失败: ${getErrorMessage(error)}`);
    }
  }

  // 更新dataset
  async updateDataset(id: number, dataset: Partial<Dataset>): Promise<Dataset> {
    try {
      const response = await this.makeProtectedRequest({
        method: 'PUT',
        url: `/api/v1/dataset/${id}`,
        data: dataset
      });
      return response.data.result;
    } catch (error) {
      throw new Error(`更新dataset ${id}失败: ${getErrorMessage(error)}`);
    }
  }

  // 删除dataset
  async deleteDataset(id: number): Promise<void> {
    try {
      await this.makeProtectedRequest({
        method: 'DELETE',
        url: `/api/v1/dataset/${id}`
      });
    } catch (error) {
      throw new Error(`删除dataset ${id}失败: ${getErrorMessage(error)}`);
    }
  }

  // 刷新dataset schema
  async refreshDatasetSchema(id: number): Promise<any> {
    try {
      const response = await this.makeProtectedRequest({
        method: 'PUT',
        url: `/api/v1/dataset/${id}/refresh`
      });
      return response.data.result;
    } catch (error) {
      throw new Error(`刷新dataset ${id} schema失败: ${getErrorMessage(error)}`);
    }
  }

  // 获取数据库列表
  async getDatabases(): Promise<any[]> {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.api.get('/api/v1/database/');
      return response.data.result;
    } catch (error) {
      throw new Error(`获取数据库列表失败: ${getErrorMessage(error)}`);
    }
  }

  // 获取dataset的metrics列表
  async getDatasetMetrics(datasetId: number): Promise<DatasetMetric[]> {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.api.get(`/api/v1/dataset/${datasetId}`);
      return response.data.result.metrics || [];
    } catch (error) {
      throw new Error(`获取dataset ${datasetId} metrics失败: ${getErrorMessage(error)}`);
    }
  }

  // 创建dataset metric
  async createDatasetMetric(datasetId: number, metric: Partial<DatasetMetric>): Promise<DatasetMetric> {
    try {
      // 首先获取当前dataset
      const dataset = await this.getDataset(datasetId);
      const currentMetrics = dataset.metrics || [];
      
      // 添加新metric到metrics数组
      const newMetrics = [...currentMetrics, metric];
      
      // 更新dataset
      const response = await this.makeProtectedRequest({
        method: 'PUT',
        url: `/api/v1/dataset/${datasetId}`,
        data: { metrics: newMetrics }
      });
      
      // 返回新创建的metric（通常是数组中的最后一个）
      const updatedMetrics = response.data.result.metrics || [];
      return updatedMetrics[updatedMetrics.length - 1];
    } catch (error) {
      throw new Error(`创建dataset ${datasetId} metric失败: ${getErrorMessage(error)}`);
    }
  }

  // 更新dataset metric
  async updateDatasetMetric(datasetId: number, metricId: number, metric: Partial<DatasetMetric>): Promise<DatasetMetric> {
    try {
      // 获取当前dataset
      const dataset = await this.getDataset(datasetId);
      const currentMetrics = dataset.metrics || [];
      
      // 找到并更新指定的metric
      const metricIndex = currentMetrics.findIndex((m: any) => m.id === metricId);
      if (metricIndex === -1) {
        throw new Error(`Metric ${metricId} 不存在`);
      }
      
      const updatedMetrics = [...currentMetrics];
      updatedMetrics[metricIndex] = { ...updatedMetrics[metricIndex], ...metric };
      
      // 更新dataset
      const response = await this.makeProtectedRequest({
        method: 'PUT',
        url: `/api/v1/dataset/${datasetId}`,
        data: { metrics: updatedMetrics }
      });
      
      return updatedMetrics[metricIndex];
    } catch (error) {
      throw new Error(`更新dataset ${datasetId} metric ${metricId}失败: ${getErrorMessage(error)}`);
    }
  }

  // 删除dataset metric
  async deleteDatasetMetric(datasetId: number, metricId: number): Promise<void> {
    try {
      await this.makeProtectedRequest({
        method: 'DELETE',
        url: `/api/v1/dataset/${datasetId}/metric/${metricId}`
      });
    } catch (error) {
      throw new Error(`删除dataset ${datasetId} metric ${metricId}失败: ${getErrorMessage(error)}`);
    }
  }

  // 获取dataset的字段信息（用于创建metrics时参考）
  async getDatasetColumns(datasetId: number): Promise<Array<{
    column_name: string;
    type: string;
    description?: string;
    is_dttm?: boolean;
    expression?: string;
    verbose_name?: string;
  }>> {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.api.get(`/api/v1/dataset/${datasetId}`);
      const dataset = response.data.result;
      
      // 返回字段信息，包括物理字段和计算字段
      const columns = dataset.columns || [];
      return columns.map((col: any) => ({
        column_name: col.column_name,
        type: col.type,
        description: col.description,
        is_dttm: col.is_dttm,
        expression: col.expression,
        verbose_name: col.verbose_name,
      }));
    } catch (error) {
      throw new Error(`获取dataset ${datasetId} 字段信息失败: ${getErrorMessage(error)}`);
    }
  }
}

// 全局Superset客户端实例
let supersetClient: SupersetClient | null = null;

// 初始化Superset客户端
function initializeSupersetClient(): SupersetClient {
  if (!supersetClient) {
    const config: SupersetConfig = {
      baseUrl: process.env.SUPERSET_BASE_URL || 'http://localhost:8088',
      username: process.env.SUPERSET_USERNAME,
      password: process.env.SUPERSET_PASSWORD,
      accessToken: process.env.SUPERSET_ACCESS_TOKEN,
    };
    
    supersetClient = new SupersetClient(config);
  }
  
  return supersetClient;
}

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
    tools: [
      {
        name: "list_datasets",
        description: "获取Superset中的所有datasets列表",
        inputSchema: {
          type: "object",
          properties: {
            page: {
              type: "number",
              description: "页码（从0开始）",
              default: 0,
            },
            pageSize: {
              type: "number", 
              description: "每页数量",
              default: 20,
            },
          },
        },
      },
      {
        name: "get_dataset",
        description: "根据ID获取特定的dataset详细信息",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "number",
              description: "Dataset的ID",
            },
          },
          required: ["id"],
        },
      },
      {
        name: "create_dataset",
        description: "创建新的dataset",
        inputSchema: {
          type: "object",
          properties: {
            database_id: {
              type: "number",
              description: "数据库ID",
            },
            table_name: {
              type: "string",
              description: "表名",
            },
            schema: {
              type: "string",
              description: "数据库schema（可选）",
            },
            description: {
              type: "string",
              description: "Dataset描述（可选）",
            },
            sql: {
              type: "string", 
              description: "自定义SQL查询（可选）",
            },
          },
          required: ["database_id", "table_name"],
        },
      },
      {
        name: "update_dataset",
        description: "更新已存在的dataset",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "number",
              description: "Dataset的ID",
            },
            table_name: {
              type: "string",
              description: "表名（可选）",
            },
            description: {
              type: "string",
              description: "Dataset描述（可选）",
            },
            sql: {
              type: "string",
              description: "自定义SQL查询（可选）",
            },
            cache_timeout: {
              type: "number",
              description: "缓存超时时间（秒）（可选）",
            },
          },
          required: ["id"],
        },
      },
      {
        name: "delete_dataset",
        description: "删除dataset",
        inputSchema: {
          type: "object", 
          properties: {
            id: {
              type: "number",
              description: "要删除的Dataset的ID",
            },
          },
          required: ["id"],
        },
      },
      {
        name: "refresh_dataset_schema",
        description: "刷新dataset的schema信息",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "number",
              description: "Dataset的ID",
            },
          },
          required: ["id"],
        },
      },
      {
        name: "list_databases",
        description: "获取Superset中配置的所有数据库",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_dataset_metrics",
        description: "获取指定dataset的所有metrics",
        inputSchema: {
          type: "object",
          properties: {
            dataset_id: {
              type: "number",
              description: "Dataset的ID",
            },
          },
          required: ["dataset_id"],
        },
      },
      {
        name: "create_dataset_metric",
        description: "为dataset创建新的metric",
        inputSchema: {
          type: "object",
          properties: {
            dataset_id: {
              type: "number",
              description: "Dataset的ID",
            },
            metric_name: {
              type: "string",
              description: "Metric名称",
            },
            expression: {
              type: "string",
              description: "Metric表达式（SQL表达式）",
            },
            metric_type: {
              type: "string",
              description: "Metric类型（可选）",
            },
            description: {
              type: "string",
              description: "Metric描述（可选）",
            },
            verbose_name: {
              type: "string",
              description: "Metric显示名称（可选）",
            },
            d3format: {
              type: "string",
              description: "D3格式化字符串（可选）",
            },
          },
          required: ["dataset_id", "metric_name", "expression"],
        },
      },
      {
        name: "update_dataset_metric",
        description: "更新dataset中的metric",
        inputSchema: {
          type: "object",
          properties: {
            dataset_id: {
              type: "number",
              description: "Dataset的ID",
            },
            metric_id: {
              type: "number",
              description: "Metric的ID",
            },
            metric_name: {
              type: "string",
              description: "Metric名称（可选）",
            },
            expression: {
              type: "string",
              description: "Metric表达式（可选）",
            },
            description: {
              type: "string",
              description: "Metric描述（可选）",
            },
            verbose_name: {
              type: "string",
              description: "Metric显示名称（可选）",
            },
            d3format: {
              type: "string",
              description: "D3格式化字符串（可选）",
            },
          },
          required: ["dataset_id", "metric_id"],
        },
      },
      {
        name: "delete_dataset_metric",
        description: "删除dataset中的metric",
        inputSchema: {
          type: "object",
          properties: {
            dataset_id: {
              type: "number",
              description: "Dataset的ID",
            },
            metric_id: {
              type: "number",
              description: "要删除的Metric的ID",
            },
          },
          required: ["dataset_id", "metric_id"],
        },
      },
      {
        name: "get_dataset_columns",
        description: "获取dataset的字段信息，用于创建metrics时参考可用字段",
        inputSchema: {
          type: "object",
          properties: {
            dataset_id: {
              type: "number",
              description: "Dataset的ID",
            },
          },
          required: ["dataset_id"],
        },
      },
    ],
  };
});

// 工具执行处理器
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const client = initializeSupersetClient();
  
  try {
    switch (request.params.name) {
      case "list_datasets": {
        const { page = 0, pageSize = 20 } = request.params.arguments as any;
        const result = await client.getDatasets(page, pageSize);
        
        return {
          content: [
            {
              type: "text",
              text: `找到 ${result.count} 个datasets（显示第 ${page + 1} 页）:\n\n` +
                result.result.map(dataset => 
                  `ID: ${dataset.id}\n` +
                  `名称: ${dataset.table_name}\n` +
                  `数据库ID: ${dataset.database_id}\n` +
                  `Schema: ${dataset.schema || 'N/A'}\n` +
                  `描述: ${dataset.description || 'N/A'}\n` +
                  `---`
                ).join('\n')
            },
          ],
        };
      }
      
      case "get_dataset": {
        const { id } = request.params.arguments as any;
        const dataset = await client.getDataset(id);
        
        return {
          content: [
            {
              type: "text",
              text: `Dataset详细信息:\n\n` +
                `ID: ${dataset.id}\n` +
                `表名: ${dataset.table_name}\n` +
                `数据库ID: ${dataset.database_id}\n` +
                `Schema: ${dataset.schema || 'N/A'}\n` +
                `描述: ${dataset.description || 'N/A'}\n` +
                `SQL: ${dataset.sql || 'N/A'}\n` +
                `缓存超时: ${dataset.cache_timeout || 'N/A'}\n` +
                `列数量: ${dataset.columns?.length || 0}\n` +
                `指标数量: ${dataset.metrics?.length || 0}`
            },
          ],
        };
      }
      
      case "create_dataset": {
        const datasetData = request.params.arguments as any;
        const newDataset = await client.createDataset(datasetData);
        
        return {
          content: [
            {
              type: "text",
              text: `Dataset创建成功！\n\n` +
                `ID: ${newDataset.id}\n` +
                `表名: ${newDataset.table_name}\n` +
                `数据库ID: ${newDataset.database_id}\n` +
                `Schema: ${newDataset.schema || 'N/A'}`
            },
          ],
        };
      }
      
      case "update_dataset": {
        const { id, ...updateData } = request.params.arguments as any;
        const updatedDataset = await client.updateDataset(id, updateData);
        
        return {
          content: [
            {
              type: "text",
              text: `Dataset ${id} 更新成功！\n\n` +
                `表名: ${updatedDataset.table_name}\n` +
                `描述: ${updatedDataset.description || 'N/A'}\n` +
                `缓存超时: ${updatedDataset.cache_timeout || 'N/A'}`
            },
          ],
        };
      }
      
      case "delete_dataset": {
        const { id } = request.params.arguments as any;
        await client.deleteDataset(id);
        
        return {
          content: [
            {
              type: "text",
              text: `Dataset ${id} 删除成功！`
            },
          ],
        };
      }
      
      case "refresh_dataset_schema": {
        const { id } = request.params.arguments as any;
        const result = await client.refreshDatasetSchema(id);
        
        return {
          content: [
            {
              type: "text",
              text: `Dataset ${id} schema刷新成功！\n\n刷新结果: ${JSON.stringify(result, null, 2)}`
            },
          ],
        };
      }
      
      case "list_databases": {
        const databases = await client.getDatabases();
        
        return {
          content: [
            {
              type: "text",
              text: `找到 ${databases.length} 个数据库:\n\n` +
                databases.map(db => 
                  `ID: ${db.id}\n` +
                  `名称: ${db.database_name}\n` +
                  `驱动: ${db.sqlalchemy_uri?.split('://')[0] || 'N/A'}\n` +
                  `---`
                ).join('\n')
            },
          ],
        };
      }
      
      case "get_dataset_metrics": {
        const { dataset_id } = request.params.arguments as any;
        const metrics = await client.getDatasetMetrics(dataset_id);
        
        return {
          content: [
            {
              type: "text",
              text: `Dataset ${dataset_id} metrics:\n\n` +
                metrics.map(metric => 
                  `ID: ${metric.id}\n` +
                  `名称: ${metric.metric_name}\n` +
                  `类型: ${metric.metric_type || 'N/A'}\n` +
                  `表达式: ${metric.expression}\n` +
                  `描述: ${metric.description || 'N/A'}\n` +
                  `---`
                ).join('\n')
            },
          ],
        };
      }
      
      case "create_dataset_metric": {
        const { dataset_id, metric_name, expression, metric_type, description, verbose_name, d3format } = request.params.arguments as any;
        const metric = { metric_name, expression, metric_type, description, verbose_name, d3format };
        const newMetric = await client.createDatasetMetric(dataset_id, metric);
        
        return {
          content: [
            {
              type: "text",
              text: `Dataset ${dataset_id} metric创建成功！\n\n` +
                `ID: ${newMetric.id}\n` +
                `名称: ${newMetric.metric_name}\n` +
                `类型: ${newMetric.metric_type || 'N/A'}\n` +
                `表达式: ${newMetric.expression}\n` +
                `描述: ${newMetric.description || 'N/A'}\n` +
                `显示名称: ${newMetric.verbose_name || 'N/A'}\n` +
                `D3格式化字符串: ${newMetric.d3format || 'N/A'}`
            },
          ],
        };
      }
      
      case "update_dataset_metric": {
        const { dataset_id, metric_id, metric_name, expression, description, verbose_name, d3format } = request.params.arguments as any;
        const metric = { metric_name, expression, description, verbose_name, d3format };
        const updatedMetric = await client.updateDatasetMetric(dataset_id, metric_id, metric);
        
        return {
          content: [
            {
              type: "text",
              text: `Dataset ${dataset_id} metric ${metric_id} 更新成功！\n\n` +
                `名称: ${updatedMetric.metric_name}\n` +
                `类型: ${updatedMetric.metric_type || 'N/A'}\n` +
                `表达式: ${updatedMetric.expression}\n` +
                `描述: ${updatedMetric.description || 'N/A'}\n` +
                `显示名称: ${updatedMetric.verbose_name || 'N/A'}\n` +
                `D3格式化字符串: ${updatedMetric.d3format || 'N/A'}`
            },
          ],
        };
      }
      
      case "delete_dataset_metric": {
        const { dataset_id, metric_id } = request.params.arguments as any;
        await client.deleteDatasetMetric(dataset_id, metric_id);
        
        return {
          content: [
            {
              type: "text",
              text: `Dataset ${dataset_id} metric ${metric_id} 删除成功！`
            },
          ],
        };
      }
      
      case "get_dataset_columns": {
        const { dataset_id } = request.params.arguments as any;
        const columns = await client.getDatasetColumns(dataset_id);
        
        return {
          content: [
            {
              type: "text",
              text: `Dataset ${dataset_id} 字段信息:\n\n` +
                columns.map(col => 
                  `• ${col.column_name} (类型: ${col.type})\n` +
                  `  描述: ${col.description || 'N/A'}\n` +
                  `  is_dttm: ${col.is_dttm ? '是' : '否'}\n` +
                  `  表达式: ${col.expression || 'N/A'}\n` +
                  `  显示名称: ${col.verbose_name || 'N/A'}\n`
                ).join('\n')
            },
          ],
        };
      }
      
      default:
        throw new McpError(ErrorCode.MethodNotFound, `未知工具: ${request.params.name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `错误: ${getErrorMessage(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// 资源列表
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "superset://datasets",
        name: "Superset Datasets概览",
        description: "Superset中所有datasets的概览信息",
        mimeType: "text/plain",
      },
      {
        uri: "superset://databases", 
        name: "Superset数据库列表",
        description: "Superset中配置的所有数据库连接",
        mimeType: "text/plain",
      },
      {
        uri: "superset://dataset-metrics",
        name: "Dataset Metrics概览",
        description: "所有datasets中定义的metrics概览",
        mimeType: "text/plain",
      },
    ],
  };
});

// 资源读取处理器
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const client = initializeSupersetClient();
  
  try {
    switch (request.params.uri) {
      case "superset://datasets": {
        const result = await client.getDatasets(0, 50);
        const content = `Superset Datasets概览\n` +
          `========================\n\n` +
          `总数: ${result.count}\n\n` +
          result.result.map(dataset => 
            `• ${dataset.table_name} (ID: ${dataset.id})\n` +
            `  数据库ID: ${dataset.database_id}\n` +
            `  Schema: ${dataset.schema || 'N/A'}\n` +
            `  描述: ${dataset.description || 'N/A'}\n`
          ).join('\n');
        
        return {
          contents: [
            {
              uri: request.params.uri,
              mimeType: "text/plain",
              text: content,
            },
          ],
        };
      }
      
      case "superset://databases": {
        const databases = await client.getDatabases();
        const content = `Superset数据库连接\n` +
          `===================\n\n` +
          `总数: ${databases.length}\n\n` +
          databases.map(db => 
            `• ${db.database_name} (ID: ${db.id})\n` +
            `  驱动: ${db.sqlalchemy_uri?.split('://')[0] || 'N/A'}\n` +
            `  是否可连接: ${db.allow_run_async ? '是' : '否'}\n`
          ).join('\n');
        
        return {
          contents: [
            {
              uri: request.params.uri,
              mimeType: "text/plain", 
              text: content,
            },
          ],
        };
      }
      
      case "superset://dataset-metrics": {
        const datasetsResult = await client.getDatasets(0, 100);
        let allMetrics: Array<{datasetId: number, datasetName: string, metrics: DatasetMetric[]}> = [];
        
        // 获取所有datasets的metrics
        for (const dataset of datasetsResult.result) {
          try {
            const metrics = await client.getDatasetMetrics(dataset.id);
            if (metrics.length > 0) {
              allMetrics.push({
                datasetId: dataset.id,
                datasetName: dataset.table_name,
                metrics: metrics
              });
            }
          } catch (error) {
            // 忽略单个dataset的错误，继续处理其他datasets
            console.error(`获取dataset ${dataset.id} metrics失败:`, error);
          }
        }
        
        const totalMetrics = allMetrics.reduce((sum, item) => sum + item.metrics.length, 0);
        
        const content = `Dataset Metrics概览\n` +
          `====================\n\n` +
          `总metrics数: ${totalMetrics}\n` +
          `包含metrics的datasets数: ${allMetrics.length}\n\n` +
          allMetrics.map(item => 
            `Dataset: ${item.datasetName} (ID: ${item.datasetId})\n` +
            `Metrics数量: ${item.metrics.length}\n` +
            item.metrics.map(metric => 
              `  • ${metric.metric_name} (ID: ${metric.id})\n` +
              `    表达式: ${metric.expression}\n` +
              `    类型: ${metric.metric_type || 'N/A'}\n` +
              `    描述: ${metric.description || 'N/A'}\n`
            ).join('') +
            `\n`
          ).join('');
        
        return {
          contents: [
            {
              uri: request.params.uri,
              mimeType: "text/plain",
              text: content,
            },
          ],
        };
      }
      
      default:
        throw new McpError(ErrorCode.InvalidRequest, `未知资源: ${request.params.uri}`);
    }
  } catch (error) {
    throw new McpError(ErrorCode.InternalError, `读取资源失败: ${getErrorMessage(error)}`);
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