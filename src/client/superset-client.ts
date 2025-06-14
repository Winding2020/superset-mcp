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

// Superset API client class
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
      withCredentials: true, // Enable cookie support to maintain session
    });

    // Request interceptor: add authentication token
    this.api.interceptors.request.use((config) => {
      if (this.config.accessToken) {
        config.headers.Authorization = `Bearer ${this.config.accessToken}`;
      }
      return config;
    });
  }

  // Authentication login
  async authenticate(): Promise<void> {
    if (this.config.accessToken) {
      this.isAuthenticated = true;
      return;
    }

    if (!this.config.username || !this.config.password) {
      throw new Error("Username and password or access token required");
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
      throw new Error(`Authentication failed: ${getErrorMessage(error)}`);
    }
  }

  // Get CSRF token
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
      throw new Error(`Failed to get CSRF token: ${getErrorMessage(error)}`);
    }
  }

  // Ensure authenticated
  private async ensureAuthenticated(): Promise<void> {
    if (!this.isAuthenticated) {
      await this.authenticate();
    }
  }

  // Ensure CSRF token exists
  private async ensureCsrfToken(): Promise<CsrfTokenResponse> {
    if (!this.csrfToken) {
      return await this.getCsrfToken();
    }
    // If token exists, re-fetch to ensure session cookie is up to date
    return await this.getCsrfToken();
  }

  // Execute CSRF-protected request
  private async makeProtectedRequest(config: any): Promise<any> {
    await this.ensureAuthenticated();
    const { token, sessionCookie } = await this.ensureCsrfToken();
    
    // Create a new axios instance to handle this specific request
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

    // If session cookie exists, add it to the request
    if (sessionCookie) {
      protectedApi.defaults.headers.common['Cookie'] = `session=${sessionCookie}`;
    }

    return protectedApi.request(config);
  }

  // Get all datasets
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
      throw new Error(`Failed to get datasets: ${getErrorMessage(error)}`);
    }
  }

  // Get single dataset by ID
  async getDataset(id: number): Promise<Dataset> {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.api.get(`/api/v1/dataset/${id}`);
      return response.data.result;
    } catch (error) {
      throw new Error(`Failed to get dataset ${id}: ${getErrorMessage(error)}`);
    }
  }

  // Create new dataset
  async createDataset(dataset: Partial<Dataset>): Promise<Dataset> {
    try {
      // Build correct request data format, only include API-supported fields
      const requestData: any = {
        table_name: dataset.table_name,
        database: dataset.database_id, // Superset API requires database field instead of database_id
      };

      // Add optional fields (only add API-supported fields)
      if (dataset.schema) {
        requestData.schema = dataset.schema;
      }
      if (dataset.sql) {
        requestData.sql = dataset.sql;
      }
      // Note: description field is not supported during creation, needs to be set via update after creation

      console.error('Create dataset request data:', JSON.stringify(requestData, null, 2));

      const response = await this.makeProtectedRequest({
        method: 'POST',
        url: '/api/v1/dataset/',
        data: requestData
      });

      const createdDataset = response.data.result;

      // If description exists, update immediately after creation
      if (dataset.description && createdDataset.id) {
        try {
          await this.updateDataset(createdDataset.id, { description: dataset.description });
          createdDataset.description = dataset.description;
        } catch (updateError) {
          console.error('Failed to update dataset description:', updateError);
          // Don't throw error since dataset was created successfully
        }
      }

      return createdDataset;
    } catch (error) {
      console.error('Create dataset detailed error:', error);
      if (error instanceof Error && 'response' in error) {
        const axiosError = error as any;
        console.error('Response status:', axiosError.response?.status);
        console.error('Response data:', JSON.stringify(axiosError.response?.data, null, 2));
      }
      throw new Error(`Failed to create dataset: ${getErrorMessage(error)}`);
    }
  }

  // Update dataset
  async updateDataset(id: number, dataset: Partial<Dataset>): Promise<Dataset> {
    try {
      const response = await this.makeProtectedRequest({
        method: 'PUT',
        url: `/api/v1/dataset/${id}`,
        data: dataset
      });
      return response.data.result;
    } catch (error) {
      throw new Error(`Failed to update dataset ${id}: ${getErrorMessage(error)}`);
    }
  }

  // Delete dataset
  async deleteDataset(id: number): Promise<void> {
    try {
      await this.makeProtectedRequest({
        method: 'DELETE',
        url: `/api/v1/dataset/${id}`
      });
    } catch (error) {
      throw new Error(`Failed to delete dataset ${id}: ${getErrorMessage(error)}`);
    }
  }

  // Refresh dataset schema
  async refreshDatasetSchema(id: number): Promise<any> {
    try {
      const response = await this.makeProtectedRequest({
        method: 'PUT',
        url: `/api/v1/dataset/${id}/refresh`
      });
      return response.data.result;
    } catch (error) {
      throw new Error(`Failed to refresh dataset ${id} schema: ${getErrorMessage(error)}`);
    }
  }

  // Get database list
  async getDatabases(): Promise<any[]> {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.api.get('/api/v1/database/');
      return response.data.result;
    } catch (error) {
      throw new Error(`Failed to get database list: ${getErrorMessage(error)}`);
    }
  }

  // Get dataset metrics list
  async getDatasetMetrics(datasetId: number): Promise<DatasetMetric[]> {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.api.get(`/api/v1/dataset/${datasetId}`);
      return response.data.result.metrics || [];
    } catch (error) {
      throw new Error(`Failed to get dataset ${datasetId} metrics: ${getErrorMessage(error)}`);
    }
  }

  // Create dataset metric
  async createDatasetMetric(datasetId: number, metric: Partial<DatasetMetric>): Promise<DatasetMetric> {
    try {
      // First get current dataset
      const dataset = await this.getDataset(datasetId);
      const currentMetrics = dataset.metrics || [];
      
      // Generate a temporary ID for new metric (negative number indicates newly created)
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
      
      // Clean existing metrics, remove fields not accepted by API
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
      
      // Add new metric to metrics array
      const newMetrics = [...cleanedCurrentMetrics, newMetric];
      
      // Update dataset
      const response = await this.makeProtectedRequest({
        method: 'PUT',
        url: `/api/v1/dataset/${datasetId}`,
        data: { metrics: newMetrics }
      });
      
      // Return newly created metric (usually the last one in the array)
      const updatedMetrics = response.data.result.metrics || [];
      return updatedMetrics[updatedMetrics.length - 1];
    } catch (error) {
      throw new Error(`Failed to create dataset ${datasetId} metric: ${getErrorMessage(error)}`);
    }
  }

  // Update dataset metric
  async updateDatasetMetric(datasetId: number, metricId: number, metric: Partial<DatasetMetric>): Promise<DatasetMetric> {
    try {
      // Get current dataset
      const dataset = await this.getDataset(datasetId);
      const currentMetrics = dataset.metrics || [];
      
      // Find and update specified metric
      const metricIndex = currentMetrics.findIndex((m: any) => m.id === metricId);
      if (metricIndex === -1) {
        throw new Error(`Metric ${metricId} does not exist`);
      }
      
      // Clean existing metrics, remove fields not accepted by API
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
        
        // If this is the metric to update, apply updates
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
      
      // Update dataset
      const response = await this.makeProtectedRequest({
        method: 'PUT',
        url: `/api/v1/dataset/${datasetId}`,
        data: { metrics: cleanedMetrics }
      });
      
      // Return updated metric
      const finalMetrics = response.data.result.metrics || [];
      return finalMetrics[metricIndex];
    } catch (error) {
      throw new Error(`Failed to update dataset ${datasetId} metric ${metricId}: ${getErrorMessage(error)}`);
    }
  }

  // Delete dataset metric
  async deleteDatasetMetric(datasetId: number, metricId: number): Promise<void> {
    try {
      // Get current dataset
      const dataset = await this.getDataset(datasetId);
      const currentMetrics = dataset.metrics || [];
      
      // Find metric to delete
      const metricIndex = currentMetrics.findIndex((m: any) => m.id === metricId);
      if (metricIndex === -1) {
        throw new Error(`Metric ${metricId} does not exist`);
      }
      
      // Clean and filter metrics
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
      
      // Update dataset
      await this.makeProtectedRequest({
        method: 'PUT',
        url: `/api/v1/dataset/${datasetId}`,
        data: { metrics: updatedMetrics }
      });
    } catch (error) {
      throw new Error(`Failed to delete dataset ${datasetId} metric ${metricId}: ${getErrorMessage(error)}`);
    }
  }

  // Get dataset column information (for reference when creating metrics)
  async getDatasetColumns(datasetId: number): Promise<DatasetColumn[]> {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.api.get(`/api/v1/dataset/${datasetId}`);
      const dataset = response.data.result;
      
      // Return column information, including physical columns and calculated columns
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
      throw new Error(`Failed to get dataset ${datasetId} column information: ${getErrorMessage(error)}`);
    }
  }

  // Execute SQL query
  async executeSql(request: SqlExecuteRequest): Promise<SqlExecuteResponse> {
    try {
      // Build request data using correct API parameter names
      const requestData = {
        database_id: request.database_id,
        sql: request.sql,
        schema: request.schema,
        queryLimit: request.limit || 1000, // Use queryLimit instead of limit
        runAsync: false, // Use runAsync instead of async, force synchronous execution
        expand_data: request.expand_data !== false, // Default to true
        select_as_cta: false, // Disable CTA
        ctas_method: 'TABLE',
        json: true, // Add json parameter
      };

      const response = await this.makeProtectedRequest({
        method: 'POST',
        url: '/api/v1/sqllab/execute/',
        data: requestData
      });

      return response.data;
    } catch (error) {
      console.error('Execute SQL detailed error:', error);
      if (error instanceof Error && 'response' in error) {
        const axiosError = error as any;
        console.error('Response status:', axiosError.response?.status);
        console.error('Response data:', JSON.stringify(axiosError.response?.data, null, 2));
      }
      throw new Error(`Failed to execute SQL: ${getErrorMessage(error)}`);
    }
  }
} 