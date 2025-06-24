import { Dashboard, DashboardChartsResponse, DashboardFilterConfig, DashboardQueryContext, DashboardListQuery, DashboardListResponse } from "../types/index.js";
import { BaseSuperset } from "./base-client.js";
import { getErrorMessage } from "../utils/error.js";

/**
 * Client for Superset Dashboard operations
 */
export class DashboardClient extends BaseSuperset {
  /**
   * Get paginated list of dashboards with optional filtering and sorting
   */
  async listDashboards(query: DashboardListQuery = {}): Promise<DashboardListResponse> {
    await this.ensureAuthenticated();
    
    try {
      const params: any = {};
      
      if (Object.keys(query).length > 0) {
        params.q = JSON.stringify(query);
      }
      
      const response = await this.api.get('/api/v1/dashboard/', { params });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to list dashboards: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get dashboard information by ID or slug
   */
  async getDashboard(idOrSlug: string | number): Promise<Dashboard> {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.api.get(`/api/v1/dashboard/${idOrSlug}`);
      return response.data.result;
    } catch (error) {
      throw new Error(`Failed to get dashboard ${idOrSlug}: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get all charts in a dashboard
   */
  async getDashboardCharts(idOrSlug: string | number): Promise<DashboardChartsResponse> {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.api.get(`/api/v1/dashboard/${idOrSlug}/charts`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get dashboard charts for ${idOrSlug}: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Parse dashboard filter configuration from json_metadata
   */
  parseDashboardFilters(jsonMetadata: string): DashboardFilterConfig {
    try {
      return JSON.parse(jsonMetadata) as DashboardFilterConfig;
    } catch (error) {
      throw new Error(`Failed to parse dashboard filters: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get chart query context from dashboard - combines chart params with dashboard filters
   * and provides detailed information about metrics and dataset structure
   */
  async getChartQueryContext(dashboardId: string | number, chartId: number): Promise<DashboardQueryContext> {
    await this.ensureAuthenticated();
    
    try {
      // Get dashboard information
      const dashboard = await this.getDashboard(dashboardId);
      
      // Get dashboard charts to find the target chart
      const dashboardCharts = await this.getDashboardCharts(dashboardId);
      const targetChart = dashboardCharts.result.find(chart => chart.id === chartId);
      
      if (!targetChart) {
        throw new Error(`Chart ${chartId} not found in dashboard ${dashboardId}`);
      }

      // Get detailed chart information
      const chartResponse = await this.api.get(`/api/v1/chart/${chartId}`);
      const detailedChart = chartResponse.data.result;

      // Parse dashboard filters
      let dashboardFilters: DashboardFilterConfig = {};
      if (dashboard.json_metadata) {
        dashboardFilters = this.parseDashboardFilters(dashboard.json_metadata);
      }

      // Parse chart params
      let defaultParams: any = {};
      if (detailedChart.params) {
        try {
          defaultParams = JSON.parse(detailedChart.params);
        } catch (error) {
          console.warn(`Failed to parse chart params for chart ${chartId}:`, error);
        }
      }

      // Extract dataset information
      let datasetId = targetChart.datasource_id || 0;
      let datasetName = targetChart.datasource_name || 'Unknown';
      
      // Try to extract dataset ID from datasource field in params if not available
      if (datasetId === 0 && defaultParams.datasource) {
        const datasourceMatch = defaultParams.datasource.match(/^(\d+)__/);
        if (datasourceMatch) {
          datasetId = parseInt(datasourceMatch[1]);
        }
      }

      // Get dataset details including metrics and columns if dataset exists
      let datasetDetails: any = null;
      let usedMetrics: any[] = [];
      let calculatedColumns: any[] = [];
      
      if (datasetId > 0) {
        try {
          const datasetResponse = await this.api.get(`/api/v1/dataset/${datasetId}`);
          datasetDetails = datasetResponse.data.result;
          
          // Extract metrics used in the chart
          const chartMetrics = defaultParams.metrics || [];
          
          // Handle ad-hoc metrics (single metric in params)
          const adHocMetrics = [];
          if (defaultParams.metric && typeof defaultParams.metric === 'object') {
            adHocMetrics.push({
              metric_name: defaultParams.metric.label || 'Ad-hoc Metric',
              expression: defaultParams.metric.sqlExpression || 
                         (defaultParams.metric.aggregate && defaultParams.metric.column ? 
                          `${defaultParams.metric.aggregate}(${defaultParams.metric.column.column_name})` : 
                          'Unknown'),
              metric_type: defaultParams.metric.aggregate || 'CUSTOM',
              description: 'Ad-hoc metric defined in chart configuration',
              verbose_name: defaultParams.metric.label,
              is_adhoc: true
            });
          }
          
          // Handle multiple ad-hoc metrics
          if (Array.isArray(chartMetrics)) {
            chartMetrics.forEach(metric => {
              if (typeof metric === 'object' && metric.expressionType) {
                adHocMetrics.push({
                  metric_name: metric.label || 'Ad-hoc Metric',
                  expression: metric.sqlExpression || 
                             (metric.aggregate && metric.column ? 
                              `${metric.aggregate}(${metric.column.column_name})` : 
                              'Unknown'),
                  metric_type: metric.aggregate || 'CUSTOM',
                  description: 'Ad-hoc metric defined in chart configuration',
                  verbose_name: metric.label,
                  is_adhoc: true
                });
              }
            });
          }
          
          // Get predefined metrics from dataset
          if (datasetDetails.metrics) {
            const predefinedMetrics = datasetDetails.metrics.filter((metric: any) => 
              chartMetrics.includes(metric.metric_name) || chartMetrics.includes(metric.id)
            );
            usedMetrics = [...predefinedMetrics, ...adHocMetrics];
          } else {
            usedMetrics = adHocMetrics;
          }
          
          // Get calculated columns
          if (datasetDetails.columns) {
            calculatedColumns = datasetDetails.columns.filter((col: any) => 
              col.expression && col.expression.trim() !== ''
            );
          }
        } catch (error) {
          console.warn(`Failed to get dataset details for dataset ${datasetId}:`, error);
        }
      }

      // Build applied filters from dashboard configuration
      const appliedFilters = [];
      if (dashboardFilters.native_filter_configuration) {
        for (const filter of dashboardFilters.native_filter_configuration) {
          // Check if this filter applies to the target chart
          const appliesToChart = filter.chartsInScope?.includes(chartId) || 
                                filter.scope?.excluded?.includes(chartId) === false;
          
          if (appliesToChart && filter.targets) {
            for (const target of filter.targets) {
              if (target.datasetId === datasetId) {
                appliedFilters.push({
                  filter_id: filter.id,
                  filter_type: filter.filterType,
                  column: target.column.name,
                  value: filter.defaultDataMask?.filterState || null,
                  scope: {
                    charts: filter.chartsInScope || [],
                    tabs: filter.tabsInScope || []
                  }
                });
              }
            }
          }
        }
      }

      // Build final query context (this would be the merged result)
      const finalQueryContext = {
        ...defaultParams,
        // Dashboard filters would override or supplement chart params
        dashboard_id: typeof dashboardId === 'string' ? parseInt(dashboardId) : dashboardId,
        applied_dashboard_filters: appliedFilters
      };

      return {
        dashboard_id: typeof dashboardId === 'string' ? parseInt(dashboardId) : dashboardId,
        chart_id: chartId,
        chart_name: targetChart.slice_name,
        dataset_id: datasetId,
        dataset_name: datasetName,
        dataset_details: datasetDetails,
        used_metrics: usedMetrics,
        calculated_columns: calculatedColumns,
        default_params: defaultParams,
        dashboard_filters: dashboardFilters,
        applied_filters: appliedFilters,
        final_query_context: finalQueryContext
      };
    } catch (error) {
      throw new Error(`Failed to get chart query context: ${getErrorMessage(error)}`);
    }
  }
} 