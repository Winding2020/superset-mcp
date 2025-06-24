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

      // Parse dashboard filters
      let dashboardFilters: DashboardFilterConfig = {};
      if (dashboard.json_metadata) {
        dashboardFilters = this.parseDashboardFilters(dashboard.json_metadata);
      }

      // Parse chart params
      let defaultParams: any = {};
      if (targetChart.params) {
        try {
          defaultParams = JSON.parse(targetChart.params);
        } catch (error) {
          console.warn(`Failed to parse chart params for chart ${chartId}:`, error);
        }
      }

      // Extract dataset information
      const datasetId = targetChart.datasource_id || 0;
      const datasetName = targetChart.datasource_name || 'Unknown';

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