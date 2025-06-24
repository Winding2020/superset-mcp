import { initializeSupersetClient } from "../client/index.js";
import { getErrorMessage } from "../utils/error.js";

// Dashboard tool definitions
export const dashboardToolDefinitions = [
  {
    name: "list_dashboards",
    description: "Get paginated list of all dashboards with optional filtering, sorting, and pagination. Uses Rison or JSON query parameters for filtering, sorting, pagination and for selecting specific columns and metadata. Query format: filters=[{col: 'column_name', opr: 'operator', value: 'filter_value'}], order_column='column_name', order_direction='asc|desc', page=0, page_size=20, select_columns=['column1', 'column2']",
    inputSchema: {
      type: "object",
      properties: {
        filters: {
          type: "array",
          description: "Array of filter conditions",
          items: {
            type: "object",
            properties: {
              col: {
                type: "string",
                description: "Column name to filter on",
              },
              opr: {
                type: "string",
                description: "Filter operator (e.g., 'eq', 'like', 'in', 'gt', 'lt')",
              },
              value: {
                description: "Filter value (can be string, number, boolean, or array)",
              },
            },
            required: ["col", "opr", "value"],
          },
        },
        order_column: {
          type: "string",
          description: "Column to sort by (e.g., 'changed_on_utc', 'changed_on_delta_humanized', 'dashboard_title', 'published', 'created_on_delta_humanized', 'slug', 'id')",
        },
        order_direction: {
          type: "string",
          enum: ["asc", "desc"],
          description: "Sort direction: 'asc' or 'desc'",
        },
        page: {
          type: "number",
          description: "Page number (starting from 0)",
          default: 0,
        },
        page_size: {
          type: "number",
          description: "Number of items per page",
          default: 20,
        },
        select_columns: {
          type: "array",
          description: "Specific columns to return in the response",
          items: {
            type: "string",
          },
        },
      },
    },
  },
  {
    name: "get_dashboard_chart_query_context",
    description: "Get the complete query context for a specific chart in a dashboard, including the chart's dataset ID, default parameters, and all applied dashboard filters (native filters and global filters). This combines the chart's saved configuration with the dashboard's filter settings to show the final query scope.",
    inputSchema: {
      type: "object",
      properties: {
        dashboard_id: {
          type: "string",
          description: "Dashboard ID or slug",
        },
        chart_id: {
          type: "number",
          description: "Chart ID within the dashboard",
        },
      },
      required: ["dashboard_id", "chart_id"],
    },
  },
  {
    name: "get_dashboard_charts",
    description: "Get all charts in a specific dashboard with their basic information including chart IDs, names, visualization types, and dataset information.",
    inputSchema: {
      type: "object",
      properties: {
        dashboard_id: {
          type: "string",
          description: "Dashboard ID or slug",
        },
      },
      required: ["dashboard_id"],
    },
  },
  {
    name: "get_dashboard_filters",
    description: "Get the dashboard's filter configuration including native filters, global filters, and their scope settings.",
    inputSchema: {
      type: "object",
      properties: {
        dashboard_id: {
          type: "string",
          description: "Dashboard ID or slug",
        },
      },
      required: ["dashboard_id"],
    },
  },
];

// Dashboard tool handlers
export async function handleDashboardTool(toolName: string, args: any) {
  const client = initializeSupersetClient();
  
  try {
    switch (toolName) {
      case "list_dashboards": {
        const query: any = {
          filters: args.filters || [],
          order_column: args.order_column,
          order_direction: args.order_direction,
          page: args.page || 0,
          page_size: args.page_size || 20,
          select_columns: args.select_columns,
        };
        
        // Remove undefined values
        Object.keys(query).forEach(key => {
          if (query[key] === undefined) {
            delete query[key];
          }
        });
        
        const dashboardList = await client.dashboards.listDashboards(query);
        
        // Format the response text
        let responseText = `Dashboard List:\n\n`;
        responseText += `Total Count: ${dashboardList.count}\n`;
        responseText += `Page: ${(query.page || 0) + 1}\n`;
        responseText += `Page Size: ${query.page_size || 20}\n`;
        responseText += `Results: ${dashboardList.result.length}\n\n`;
        
        if (dashboardList.result.length === 0) {
          responseText += `No dashboards found matching the criteria.\n`;
        } else {
          responseText += `Dashboards:\n\n`;
          dashboardList.result.forEach((dashboard, index) => {
            responseText += `${index + 1}. Dashboard ID: ${dashboard.id}\n`;
            responseText += `   Title: ${dashboard.dashboard_title || 'Untitled'}\n`;
            responseText += `   Slug: ${dashboard.slug || 'N/A'}\n`;
            // responseText += `   Published: ${dashboard.published ? 'Yes' : 'No'}\n`;
            // responseText += `   Certified: ${dashboard.certified_by ? `Yes (by ${dashboard.certified_by})` : 'No'}\n`;
            // responseText += `   Changed By: ${dashboard.changed_by ? `${dashboard.changed_by.first_name} ${dashboard.changed_by.last_name}` : 'N/A'}\n`;
            // responseText += `   Changed On: ${dashboard.changed_on_delta_humanized || 'N/A'}\n`;
            // responseText += `   Created By: ${dashboard.created_by ? `${dashboard.created_by.first_name} ${dashboard.created_by.last_name}` : 'N/A'}\n`;
            // responseText += `   Created On: ${dashboard.created_on_delta_humanized || 'N/A'}\n`;
            // responseText += `   Owners: ${dashboard.owners?.length || 0}\n`;
            // responseText += `   Tags: ${dashboard.tags?.length || 0}\n`;
            // responseText += `   Roles: ${dashboard.roles?.length || 0}\n`;
            // responseText += `   Managed Externally: ${dashboard.is_managed_externally ? 'Yes' : 'No'}\n`;
            // responseText += `   URL: ${dashboard.url || 'N/A'}\n`;
            responseText += `   ---\n`;
          });
        }
        
        // Add available columns info if requested
        if (dashboardList.list_columns && dashboardList.list_columns.length > 0) {
          responseText += `\nAvailable Columns: ${dashboardList.list_columns.join(', ')}\n`;
        }
        
        if (dashboardList.order_columns && dashboardList.order_columns.length > 0) {
          responseText += `Available Sort Columns: ${dashboardList.order_columns.join(', ')}\n`;
        }
        
        return {
          content: [
            {
              type: "text",
              text: responseText
            },
          ],
        };
      }
      
      case "get_dashboard_chart_query_context": {
        const { dashboard_id, chart_id } = args;
        const queryContext = await client.dashboards.getChartQueryContext(dashboard_id, chart_id);
        
        // Format the response text
        let responseText = `Dashboard Chart Query Context:\n\n`;
        responseText += `Dashboard ID: ${queryContext.dashboard_id}\n`;
        responseText += `Chart ID: ${queryContext.chart_id}\n`;
        responseText += `Chart Name: ${queryContext.chart_name}\n`;
        responseText += `Dataset ID: ${queryContext.dataset_id}\n`;
        responseText += `Dataset Name: ${queryContext.dataset_name}\n\n`;
        
        // Chart default parameters
        responseText += `Chart Default Parameters:\n`;
        responseText += `${JSON.stringify(queryContext.default_params, null, 2)}\n\n`;
        
        // Dashboard filters
        responseText += `Dashboard Filter Configuration:\n`;
        if (queryContext.dashboard_filters.native_filter_configuration && 
            queryContext.dashboard_filters.native_filter_configuration.length > 0) {
          responseText += `Native Filters (${queryContext.dashboard_filters.native_filter_configuration.length}):\n`;
          queryContext.dashboard_filters.native_filter_configuration.forEach((filter, index) => {
            responseText += `  ${index + 1}. ${filter.name} (${filter.filterType})\n`;
            responseText += `     ID: ${filter.id}\n`;
            responseText += `     Description: ${filter.description || 'N/A'}\n`;
            responseText += `     Targets: ${filter.targets?.length || 0} dataset(s)\n`;
            if (filter.targets) {
              filter.targets.forEach(target => {
                responseText += `       - Dataset ${target.datasetId}, Column: ${target.column.name}\n`;
              });
            }
            responseText += `     Charts in Scope: ${filter.chartsInScope?.length || 0}\n`;
            responseText += `     Tabs in Scope: ${filter.tabsInScope?.length || 0}\n`;
          });
        } else {
          responseText += `No native filters configured.\n`;
        }
        
        // Global chart configuration
        if (queryContext.dashboard_filters.global_chart_configuration) {
          responseText += `\nGlobal Chart Configuration:\n`;
          Object.entries(queryContext.dashboard_filters.global_chart_configuration).forEach(([chartId, config]) => {
            responseText += `  Chart ${chartId}: ${JSON.stringify(config, null, 4)}\n`;
          });
        }
        
        // Applied filters
        responseText += `\nApplied Filters for This Chart:\n`;
        if (queryContext.applied_filters.length > 0) {
          queryContext.applied_filters.forEach((filter, index) => {
            responseText += `  ${index + 1}. Filter: ${filter.filter_id}\n`;
            responseText += `     Type: ${filter.filter_type}\n`;
            responseText += `     Column: ${filter.column}\n`;
            responseText += `     Value: ${JSON.stringify(filter.value)}\n`;
            responseText += `     Scope - Charts: ${filter.scope.charts.length}, Tabs: ${filter.scope.tabs.length}\n`;
          });
        } else {
          responseText += `No filters applied to this chart.\n`;
        }
        
        // Final query context
        responseText += `\nFinal Query Context (Merged):\n`;
        responseText += `${JSON.stringify(queryContext.final_query_context, null, 2)}\n`;
        
        return {
          content: [
            {
              type: "text",
              text: responseText
            },
          ],
        };
      }
      
      case "get_dashboard_charts": {
        const { dashboard_id } = args;
        const dashboardCharts = await client.dashboards.getDashboardCharts(dashboard_id);
        
        // Format the response text
        let responseText = `Dashboard ${dashboard_id} Charts:\n\n`;
        responseText += `Found ${dashboardCharts.result.length} charts:\n\n`;
        
        dashboardCharts.result.forEach((chart, index) => {
          responseText += `${index + 1}. Chart ID: ${chart.id}\n`;
          responseText += `   Name: ${chart.slice_name}\n`;
          responseText += `   Type: ${chart.viz_type}\n`;
          responseText += `   Dataset ID: ${chart.datasource_id || 'N/A'}\n`;
          responseText += `   Dataset Name: ${chart.datasource_name || 'N/A'}\n`;
          responseText += `   Dataset Type: ${chart.datasource_type || 'N/A'}\n`;
          responseText += `   Description: ${chart.description || 'N/A'}\n`;
          responseText += `   Cache Timeout: ${chart.cache_timeout || 'Default'}\n`;
          responseText += `   Last Saved: ${chart.last_saved_at || 'N/A'}\n`;
          responseText += `   Managed Externally: ${chart.is_managed_externally ? 'Yes' : 'No'}\n`;
          responseText += `   ---\n`;
        });
        
        return {
          content: [
            {
              type: "text",
              text: responseText
            },
          ],
        };
      }
      
      case "get_dashboard_filters": {
        const { dashboard_id } = args;
        const dashboard = await client.dashboards.getDashboard(dashboard_id);
        
        let responseText = `Dashboard ${dashboard_id} Filter Configuration:\n\n`;
        responseText += `Dashboard Title: ${dashboard.dashboard_title}\n`;
        responseText += `Description: ${dashboard.description || 'N/A'}\n\n`;
        
        if (!dashboard.json_metadata) {
          responseText += `No filter configuration found (json_metadata is empty).\n`;
        } else {
          try {
            const filterConfig = client.dashboards.parseDashboardFilters(dashboard.json_metadata);
            
            // Native filters
            if (filterConfig.native_filter_configuration && filterConfig.native_filter_configuration.length > 0) {
              responseText += `Native Filters (${filterConfig.native_filter_configuration.length}):\n\n`;
              filterConfig.native_filter_configuration.forEach((filter, index) => {
                responseText += `${index + 1}. ${filter.name}\n`;
                responseText += `   ID: ${filter.id}\n`;
                responseText += `   Type: ${filter.filterType}\n`;
                responseText += `   Description: ${filter.description || 'N/A'}\n`;
                responseText += `   Targets:\n`;
                if (filter.targets) {
                  filter.targets.forEach(target => {
                    responseText += `     - Dataset ${target.datasetId}, Column: ${target.column.name}\n`;
                  });
                }
                responseText += `   Charts in Scope: ${filter.chartsInScope?.join(', ') || 'All'}\n`;
                responseText += `   Tabs in Scope: ${filter.tabsInScope?.join(', ') || 'All'}\n`;
                responseText += `   Default Value: ${JSON.stringify(filter.defaultDataMask?.filterState) || 'None'}\n`;
                responseText += `   Cascade Parent IDs: ${filter.cascadeParentIds?.join(', ') || 'None'}\n`;
                responseText += `   ---\n`;
              });
            } else {
              responseText += `No native filters configured.\n\n`;
            }
            
            // Global chart configuration
            if (filterConfig.global_chart_configuration) {
              responseText += `Global Chart Configuration:\n`;
              Object.entries(filterConfig.global_chart_configuration).forEach(([chartId, config]) => {
                responseText += `   Chart ${chartId}:\n`;
                responseText += `     ${JSON.stringify(config, null, 6)}\n`;
              });
              responseText += `\n`;
            }
            
            // Filter scopes
            if (filterConfig.filter_scopes) {
              responseText += `Filter Scopes:\n`;
              Object.entries(filterConfig.filter_scopes).forEach(([filterId, scopes]) => {
                responseText += `   Filter ${filterId}:\n`;
                Object.entries(scopes).forEach(([chartId, scope]) => {
                  responseText += `     Chart ${chartId}: Scope ${scope.scope.join(', ')}, Immune: ${scope.immune.join(', ')}\n`;
                });
              });
              responseText += `\n`;
            }
            
            // Other settings
            responseText += `Other Settings:\n`;
            responseText += `   Color Scheme: ${filterConfig.color_scheme || 'Default'}\n`;
            responseText += `   Refresh Frequency: ${filterConfig.refresh_frequency || 'Not set'}\n`;
            responseText += `   Cross Filters Enabled: ${filterConfig.cross_filters_enabled ? 'Yes' : 'No'}\n`;
            responseText += `   Default Filters: ${filterConfig.default_filters || 'None'}\n`;
            
            if (filterConfig.timed_refresh_immune_slices && filterConfig.timed_refresh_immune_slices.length > 0) {
              responseText += `   Timed Refresh Immune Charts: ${filterConfig.timed_refresh_immune_slices.join(', ')}\n`;
            }
            
            if (filterConfig.expanded_slices) {
              responseText += `   Expanded Slices: ${Object.keys(filterConfig.expanded_slices).length} configured\n`;
            }
            
          } catch (error) {
            responseText += `Error parsing filter configuration: ${getErrorMessage(error)}\n`;
            responseText += `\nRaw json_metadata:\n${dashboard.json_metadata}\n`;
          }
        }
        
        return {
          content: [
            {
              type: "text",
              text: responseText
            },
          ],
        };
      }
      
      default:
        throw new Error(`Unknown dashboard tool: ${toolName}`);
    }
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error(`Dashboard tool ${toolName} failed:`, errorMessage);
    
    return {
      content: [
        {
          type: "text",
          text: errorMessage,
        },
      ],
      isError: true,
    };
  }
} 