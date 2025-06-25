import { Chart, ChartUpdateRequest, ChartListQuery, ChartListResponse, ChartDataQueryContext, ChartDataResponse, ChartDataFilter } from "../types/index.js";
import { BaseSuperset } from "./base-client.js";
import { getErrorMessage } from "../utils/error.js";

/**
 * Client for Superset Chart operations
 */
export class ChartClient extends BaseSuperset {
  /**
   * Get list of charts with optional filtering, sorting, and pagination
   */
  async listCharts(query: ChartListQuery = {}): Promise<ChartListResponse> {
    await this.ensureAuthenticated();
    
    try {
      const params: any = {};
      
      // Build query parameters
      if (Object.keys(query).length > 0) {
        params.q = JSON.stringify(query);
      }
      
      const response = await this.api.get('/api/v1/chart/', { params });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to list charts: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get chart information by ID
   */
  async getChart(chartId: number): Promise<Chart> {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.api.get(`/api/v1/chart/${chartId}`);
      return response.data.result;
    } catch (error) {
      throw new Error(`Failed to get chart ${chartId}: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get chart visualization parameters
   * This is a convenience method that returns the parsed params object
   */
  async getChartParams(chartId: number): Promise<any> {
    const chart = await this.getChart(chartId);
    
    if (!chart.params) {
      return {};
    }
    
    try {
      return JSON.parse(chart.params);
    } catch (error) {
      throw new Error(`Failed to parse chart params: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update chart properties
   */
  async updateChart(chartId: number, updates: ChartUpdateRequest): Promise<Chart> {
    try {
      const response = await this.makeProtectedRequest({
        method: 'PUT',
        url: `/api/v1/chart/${chartId}`,
        data: updates
      });
      return response.data.result;
    } catch (error) {
      throw new Error(`Failed to update chart ${chartId}: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Update chart visualization parameters
   * This is a convenience method that handles params serialization
   */
  async updateChartParams(chartId: number, params: any): Promise<Chart> {
    const paramsString = JSON.stringify(params);
    return this.updateChart(chartId, { params: paramsString });
  }

  /**
   * Get chart data with current filters applied
   * This extracts filters from the chart's query_context or form_data
   */
  async getChartFilters(chartId: number): Promise<ChartDataFilter[]> {
    await this.ensureAuthenticated();
    
    try {
      const chart = await this.getChart(chartId);
      
      // Try to extract filters from query_context first
      if (chart.query_context) {
        try {
          const queryContext = JSON.parse(chart.query_context);
          if (queryContext.queries && queryContext.queries.length > 0) {
            const firstQuery = queryContext.queries[0];
            return firstQuery.filters || [];
          }
        } catch (error) {
          // Fall through to form_data parsing
        }
      }
      
      // Try to extract filters from params/form_data
      if (chart.params) {
        try {
          const params = JSON.parse(chart.params);
          return params.filters || params.adhoc_filters || [];
        } catch (error) {
          // Return empty array if parsing fails
        }
      }
      
      return [];
    } catch (error) {
      throw new Error(`Failed to get chart filters for chart ${chartId}: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Execute chart query with custom filters
   * This creates a new query context with the specified filters and executes it
   */
  async executeChartWithFilters(chartId: number, filters: ChartDataFilter[]): Promise<ChartDataResponse> {
    await this.ensureAuthenticated();
    
    try {
      const chart = await this.getChart(chartId);
      
      // Build query context from chart configuration
      let queryContext: ChartDataQueryContext;
      
      if (chart.query_context) {
        // Use existing query context as base
        queryContext = JSON.parse(chart.query_context);
      } else {
        // Create basic query context from chart params
        const params = chart.params ? JSON.parse(chart.params) : {};
        queryContext = {
          datasource: {
            id: chart.datasource_id || 0,
            type: chart.datasource_type || 'table'
          },
          queries: [{
            datasource: {
              id: chart.datasource_id || 0,
              type: chart.datasource_type || 'table'
            },
            filters: [],
            columns: params.groupby || [],
            metrics: params.metrics || params.metric ? [params.metric] : [],
            row_limit: params.row_limit || 1000,
            granularity: params.granularity_sqla || params.granularity,
            is_timeseries: params.viz_type?.includes('time') || false
          }],
          result_format: 'json',
          result_type: 'full'
        };
      }
      
      // Apply the new filters to the first query
      if (queryContext.queries && queryContext.queries.length > 0) {
        queryContext.queries[0].filters = filters;
      }
      
      // Execute the query
      const response = await this.api.post('/api/v1/chart/data', queryContext);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to execute chart with filters for chart ${chartId}: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Set chart filters by updating the chart's query context
   * This permanently updates the chart with the new filters
   */
  async setChartFilters(chartId: number, filters: ChartDataFilter[]): Promise<Chart> {
    await this.ensureAuthenticated();
    
    try {
      const chart = await this.getChart(chartId);
      
      // Build or update query context
      let queryContext: ChartDataQueryContext;
      
      if (chart.query_context) {
        queryContext = JSON.parse(chart.query_context);
      } else {
        // Create basic query context from chart params
        const params = chart.params ? JSON.parse(chart.params) : {};
        queryContext = {
          datasource: {
            id: chart.datasource_id || 0,
            type: chart.datasource_type || 'table'
          },
          queries: [{
            datasource: {
              id: chart.datasource_id || 0,
              type: chart.datasource_type || 'table'
            },
            filters: [],
            columns: params.groupby || [],
            metrics: params.metrics || params.metric ? [params.metric] : [],
            row_limit: params.row_limit || 1000,
            granularity: params.granularity_sqla || params.granularity,
            is_timeseries: params.viz_type?.includes('time') || false
          }],
          result_format: 'json',
          result_type: 'full'
        };
      }
      
      // Apply filters to all queries
      queryContext.queries.forEach(query => {
        query.filters = filters;
      });
      
      // Update the chart with new query context
      const updatedChart = await this.updateChart(chartId, {
        query_context: JSON.stringify(queryContext)
      });
      
      return updatedChart;
    } catch (error) {
      throw new Error(`Failed to set chart filters for chart ${chartId}: ${getErrorMessage(error)}`);
    }
  }
} 