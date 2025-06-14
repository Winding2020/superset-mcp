import axios, { AxiosInstance } from "axios";
import { 
  SupersetConfig, 
  Dataset, 
  DatasetMetric, 
  DatasetColumn, 
  DatasetListResponse, 
  CsrfTokenResponse,
  SqlExecuteRequest,
  SqlExecuteResponse
} from "../types/index.js";
import { getErrorMessage } from "../utils/error.js";

// Superset API客户端类
export class SupersetClient {
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
        provider: this.config.authProvider || 'db',
        refresh: true,
      });

      this.config.accessToken = response.data.access_token;
      this.isAuthenticated = true;
    } catch (error) {
      throw new Error(`认证失败: ${getErrorMessage(error)}`);
    }
  }

  // 获取CSRF令牌
  private async getCsrfToken(): Promise<CsrfTokenResponse> {
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
  private async ensureCsrfToken(): Promise<CsrfTokenResponse> {
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
  async getDatasets(page = 0, pageSize = 20): Promise<DatasetListResponse> {
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
      // 构建正确的请求数据格式，只包含API支持的字段
      const requestData: any = {
        table_name: dataset.table_name,
        database: dataset.database_id, // Superset API需要database字段而不是database_id
      };

      // 添加可选字段（只添加API支持的字段）
      if (dataset.schema) {
        requestData.schema = dataset.schema;
      }
      if (dataset.sql) {
        requestData.sql = dataset.sql;
      }
      // 注意：description字段在创建时不被支持，需要在创建后通过更新来设置

      console.error('创建dataset请求数据:', JSON.stringify(requestData, null, 2));

      const response = await this.makeProtectedRequest({
        method: 'POST',
        url: '/api/v1/dataset/',
        data: requestData
      });

      const createdDataset = response.data.result;

      // 如果有描述，创建后立即更新
      if (dataset.description && createdDataset.id) {
        try {
          await this.updateDataset(createdDataset.id, { description: dataset.description });
          createdDataset.description = dataset.description;
        } catch (updateError) {
          console.error('更新dataset描述失败:', updateError);
          // 不抛出错误，因为dataset已经创建成功
        }
      }

      return createdDataset;
    } catch (error) {
      console.error('创建dataset详细错误:', error);
      if (error instanceof Error && 'response' in error) {
        const axiosError = error as any;
        console.error('响应状态:', axiosError.response?.status);
        console.error('响应数据:', JSON.stringify(axiosError.response?.data, null, 2));
      }
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
      
      // 为新metric生成一个临时ID（负数，表示新创建）
      const newMetric = {
        metric_name: metric.metric_name,
        expression: metric.expression,
        metric_type: metric.metric_type,
        description: metric.description,
        verbose_name: metric.verbose_name,
        d3format: metric.d3format,
        warning_text: metric.warning_text,
        extra: metric.extra,
        is_restricted: metric.is_restricted,
      };
      
      // 清理现有metrics，移除API不接受的字段
      const cleanedCurrentMetrics = currentMetrics.map((m: any) => ({
        id: m.id,
        metric_name: m.metric_name,
        expression: m.expression,
        metric_type: m.metric_type,
        description: m.description,
        verbose_name: m.verbose_name,
        d3format: m.d3format,
        warning_text: m.warning_text,
        extra: m.extra,
        is_restricted: m.is_restricted,
      }));
      
      // 添加新metric到metrics数组
      const newMetrics = [...cleanedCurrentMetrics, newMetric];
      
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
      
      // 清理现有metrics，移除API不接受的字段
      const cleanedMetrics = currentMetrics.map((m: any, index: number) => {
        const cleanedMetric = {
          id: m.id,
          metric_name: m.metric_name,
          expression: m.expression,
          metric_type: m.metric_type,
          description: m.description,
          verbose_name: m.verbose_name,
          d3format: m.d3format,
          warning_text: m.warning_text,
          extra: m.extra,
          is_restricted: m.is_restricted,
        };
        
        // 如果是要更新的metric，应用更新
        if (index === metricIndex) {
          return {
            ...cleanedMetric,
            ...Object.fromEntries(
              Object.entries(metric).filter(([_, value]) => value !== undefined)
            )
          };
        }
        
        return cleanedMetric;
      });
      
      // 更新dataset
      const response = await this.makeProtectedRequest({
        method: 'PUT',
        url: `/api/v1/dataset/${datasetId}`,
        data: { metrics: cleanedMetrics }
      });
      
      // 返回更新后的metric
      const finalMetrics = response.data.result.metrics || [];
      return finalMetrics[metricIndex];
    } catch (error) {
      throw new Error(`更新dataset ${datasetId} metric ${metricId}失败: ${getErrorMessage(error)}`);
    }
  }

  // 删除dataset metric
  async deleteDatasetMetric(datasetId: number, metricId: number): Promise<void> {
    try {
      // 获取当前dataset
      const dataset = await this.getDataset(datasetId);
      const currentMetrics = dataset.metrics || [];
      
      // 找到要删除的metric
      const metricIndex = currentMetrics.findIndex((m: any) => m.id === metricId);
      if (metricIndex === -1) {
        throw new Error(`Metric ${metricId} 不存在`);
      }
      
      // 清理并过滤metrics
      const updatedMetrics = currentMetrics
        .filter((m: any) => m.id !== metricId)
        .map((m: any) => ({
          id: m.id,
          metric_name: m.metric_name,
          expression: m.expression,
          metric_type: m.metric_type,
          description: m.description,
          verbose_name: m.verbose_name,
          d3format: m.d3format,
          warning_text: m.warning_text,
          extra: m.extra,
          is_restricted: m.is_restricted,
        }));
      
      // 更新dataset
      await this.makeProtectedRequest({
        method: 'PUT',
        url: `/api/v1/dataset/${datasetId}`,
        data: { metrics: updatedMetrics }
      });
    } catch (error) {
      throw new Error(`删除dataset ${datasetId} metric ${metricId}失败: ${getErrorMessage(error)}`);
    }
  }

  // 获取dataset的字段信息（用于创建metrics时参考）
  async getDatasetColumns(datasetId: number): Promise<DatasetColumn[]> {
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

  // 执行SQL查询
  async executeSql(request: SqlExecuteRequest): Promise<SqlExecuteResponse> {
    try {
      // 构建请求数据，使用正确的API参数名
      const requestData = {
        database_id: request.database_id,
        sql: request.sql,
        schema: request.schema,
        queryLimit: request.limit || 1000, // 使用queryLimit而不是limit
        runAsync: false, // 使用runAsync而不是async，强制同步执行
        expand_data: request.expand_data !== false, // 默认为true
        select_as_cta: false, // 禁用CTA
        ctas_method: 'TABLE',
        json: true, // 添加json参数
      };

      console.log('执行SQL请求数据:', JSON.stringify(requestData, null, 2));

      const response = await this.makeProtectedRequest({
        method: 'POST',
        url: '/api/v1/sqllab/execute/',
        data: requestData
      });

      return response.data;
    } catch (error) {
      console.error('执行SQL详细错误:', error);
      if (error instanceof Error && 'response' in error) {
        const axiosError = error as any;
        console.error('响应状态:', axiosError.response?.status);
        console.error('响应数据:', JSON.stringify(axiosError.response?.data, null, 2));
      }
      throw new Error(`执行SQL失败: ${getErrorMessage(error)}`);
    }
  }
} 