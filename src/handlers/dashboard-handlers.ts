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
    description: "Get the complete query context for a specific chart in a dashboard, including the chart's dataset ID, used metrics with their SQL expressions, calculated columns, and all applied dashboard filters. This tool provides comprehensive information about the chart's data sources and query structure.",
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
        
        // Format the response text - focused on SQL construction information
        let responseText = `Dashboard Chart Query Context:\n\n`;
        responseText += `Dashboard ID: ${queryContext.dashboard_id}\n`;
        responseText += `Chart ID: ${queryContext.chart_id}\n`;
        responseText += `Chart Name: ${queryContext.chart_name}\n`;
        responseText += `Dataset ID: ${queryContext.dataset_id}\n\n`;
        
        // Dataset details - essential for SQL construction
        if (queryContext.dataset_details) {
          responseText += `Dataset Details:\n`;
          responseText += `  Table Name: ${queryContext.dataset_details.table_name}\n`;
          responseText += `  Schema: ${queryContext.dataset_details.schema || 'N/A'}\n`;
          responseText += `  Database: ${queryContext.dataset_details.database?.database_name || 'N/A'}\n`;
          responseText += `  Dataset Type: ${queryContext.dataset_details.sql ? 'Virtual (SQL-based)' : 'Physical (Table-based)'}\n`;
          
          if (queryContext.dataset_details.sql) {
            responseText += `  Virtual SQL Definition:\n${queryContext.dataset_details.sql}\n\n`;
          } else {
            responseText += `\n`;
          }
        }
        
        // Used metrics - essential for SELECT clause
        if (queryContext.used_metrics.length > 0) {
          responseText += `Used Metrics (${queryContext.used_metrics.length}):\n`;
          queryContext.used_metrics.forEach((metric, index) => {
            responseText += `  ${index + 1}. ${metric.metric_name}\n`;
            responseText += `     Expression: ${metric.expression}\n`;
            responseText += `     Type: ${metric.metric_type || 'N/A'}\n`;
            responseText += `     Source: ${metric.is_adhoc ? 'Ad-hoc (from chart)' : 'Predefined (from dataset)'}\n`;
            if (metric.description) {
              responseText += `     Description: ${metric.description}\n`;
            }
            if (metric.d3format) {
              responseText += `     Format: ${metric.d3format}\n`;
            }
            responseText += `     ---\n`;
          });
          responseText += `\n`;
        } else {
          responseText += `Used Metrics: None found\n\n`;
        }
        
        // Calculated columns - may affect query structure
        if (queryContext.calculated_columns.length > 0) {
          responseText += `Calculated Columns: None found in dataset\n\n`;
        }
        
        // Query structure analysis - essential for understanding chart logic
        responseText += `Query Structure Analysis:\n`;
        responseText += `  Chart Type: ${queryContext.default_params.viz_type}\n`;
        
        const groupby = queryContext.default_params.groupby || [];
        if (groupby.length > 0) {
          responseText += `  Group By Columns: ${groupby.join(', ')}\n`;
        }
        
        const metrics = queryContext.default_params.metrics || [];
                 if (metrics.length > 0) {
          responseText += `  Metrics Usage:\n`;
          metrics.forEach((metric: any) => {
            const metricInfo = queryContext.used_metrics.find(m => m.metric_name === metric || m.id === metric);
            if (metricInfo) {
              responseText += `    - ${metricInfo.metric_name}: ${metricInfo.expression}\n`;
            } else {
              responseText += `    - ${metric}: Unknown expression\n`;
            }
          });
        }
        
        const adhocFilters = queryContext.default_params.adhoc_filters || [];
        const queryContextFilters = queryContext.query_context_filters || [];
        const allFilters = [...adhocFilters, ...queryContextFilters];
        
        if (allFilters.length > 0) {
          responseText += `  Chart-level Filters: ${allFilters.length} filter(s)\n`;
          allFilters.forEach((filter, index) => {
            if (filter.operator || filter.op) {
              const operator = filter.operator || filter.op;
              const subject = filter.subject || (typeof filter.col === 'string' ? filter.col : JSON.stringify(filter.col));
              const comparator = filter.comparator || filter.val;
              responseText += `    ${index + 1}. WHERE: ${subject} ${operator} ${JSON.stringify(comparator)}\n`;
            }
          });
        }
        
        if (queryContext.default_params.row_limit) {
          responseText += `  Row Limit: ${queryContext.default_params.row_limit}\n`;
        }
        
        responseText += `\n`;
        
        // Full expanded SQL query - the most important part for simulation
        if (queryContext.dataset_details?.sql) {
          responseText += `Full Expanded SQL Query:\n`;
          responseText += `-- This is how Superset would execute the query against the database\n`;
          responseText += `WITH virtual_dataset AS (\n`;
          const sqlLines = queryContext.dataset_details.sql.split('\n');
          sqlLines.forEach((line: string) => {
            responseText += `  ${line}\n`;
          });
          responseText += `)\n`;
          responseText += `SELECT\n`;
          
          // Add groupby columns for expanded query
          if (groupby.length > 0) {
            groupby.forEach((col: string) => {
              responseText += `  ${col},\n`;
            });
          }
          
          // Add metrics for expanded query
          if (metrics.length > 0) {
            metrics.forEach((metric: any, index: number) => {
              const metricInfo = queryContext.used_metrics.find(m => m.metric_name === metric || m.id === metric);
              if (metricInfo) {
                const isLast = index === metrics.length - 1;
                responseText += `  ${metricInfo.expression} AS "${metricInfo.metric_name}"${isLast ? '' : ','}\n`;
              } else {
                const isLast = index === metrics.length - 1;
                responseText += `  ${metric} AS "${metric}"${isLast ? '' : ','}\n`;
              }
            });
          }
          
          responseText += `FROM virtual_dataset\n`;
          
          // Add WHERE conditions for expanded query
          const whereConditionsExpanded: string[] = [];
          if (adhocFilters.length > 0) {
            adhocFilters.forEach((filter: any) => {
              whereConditionsExpanded.push(`${filter.subject} ${filter.operator} ${JSON.stringify(filter.comparator)}`);
            });
          }
          if (queryContextFilters.length > 0) {
            queryContextFilters.forEach((filter: any) => {
              const col = typeof filter.col === 'string' ? filter.col : JSON.stringify(filter.col);
              const val = filter.val !== undefined ? JSON.stringify(filter.val) : 'N/A';
              whereConditionsExpanded.push(`${col} ${filter.op} ${val}`);
            });
          }
          if (whereConditionsExpanded.length > 0) {
            responseText += `WHERE ${whereConditionsExpanded.join(' AND ')}\n`;
          }
          
          // Add GROUP BY for expanded query
          if (groupby.length > 0) {
            responseText += `GROUP BY ${groupby.join(', ')}\n`;
          }
          
          // Add LIMIT for expanded query
          if (queryContext.default_params.row_limit) {
            responseText += `LIMIT ${queryContext.default_params.row_limit}\n`;
          }
          
          responseText += `\n`;
        }
        
        // Applied dashboard filters - essential for understanding data filtering
        responseText += `Dashboard Filters Applied to This Chart:\n`;
        if (queryContext.applied_filters.length > 0) {
          const filtersWithValues = queryContext.applied_filters.filter(filter => 
            filter.default_value && Object.keys(filter.default_value).length > 0 && 
            filter.default_value.value && filter.default_value.value.length > 0
          );
          
          if (filtersWithValues.length > 0) {
            responseText += `Filters with Default Values (${filtersWithValues.length}):\n`;
            filtersWithValues.forEach((filter, index) => {
              const values = filter.default_value.value || [];
              responseText += `  ${index + 1}. ${filter.column} = ${JSON.stringify(values)}\n`;
            });
            responseText += `\n`;
          }
          
          const filtersWithoutValues = queryContext.applied_filters.filter(filter => 
            !filter.default_value || Object.keys(filter.default_value).length === 0 || 
            !filter.default_value.value || filter.default_value.value.length === 0
          );
          
          if (filtersWithoutValues.length > 0) {
            responseText += `Filters without Default Values (${filtersWithoutValues.length}):\n`;
            filtersWithoutValues.forEach((filter, index) => {
              responseText += `  ${index + 1}. ${filter.column} (no default)\n`;
            });
            responseText += `\n`;
          }
        } else {
          responseText += `No filters applied to this chart.\n\n`;
        }
        
        // Final query context - essential for understanding complete configuration
        responseText += `Final Query Context (Merged):\n`;
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
        
        // Get detailed information for each chart to get dataset info
        const chartsWithDatasetInfo = await Promise.all(
          dashboardCharts.result.map(async (chart) => {
            try {
              // Get detailed chart information to get dataset info
              const detailedChart = await client.dashboards.getChartDetails(chart.id);
              
              // Extract dataset information from detailed chart
              let datasetId = 'N/A';
              let datasetName = 'N/A';
              let datasetType = 'N/A';
              
              // Try to get dataset info from datasource_id and datasource_type
              if (detailedChart.datasource_id && detailedChart.datasource_type) {
                datasetId = detailedChart.datasource_id.toString();
                datasetType = detailedChart.datasource_type;
                
                // Try to get dataset name from datasource_name or by querying dataset
                if (detailedChart.datasource_name) {
                  datasetName = detailedChart.datasource_name;
                } else if (detailedChart.datasource_type === 'table') {
                  try {
                    const datasetDetails = await client.dashboards.getDatasetDetails(detailedChart.datasource_id);
                    datasetName = datasetDetails.table_name || 'Unknown';
                  } catch (error) {
                    console.warn(`Failed to get dataset name for dataset ${detailedChart.datasource_id}:`, error);
                  }
                }
              }
              
              // If still no dataset info, try to parse from params
              if (datasetId === 'N/A' && detailedChart.params) {
                try {
                  const params = JSON.parse(detailedChart.params);
                  if (params.datasource) {
                    const datasourceMatch = params.datasource.match(/^(\d+)__(.+)$/);
                    if (datasourceMatch) {
                      datasetId = datasourceMatch[1];
                      datasetType = 'table';
                      // Try to get dataset name
                      try {
                        const datasetDetails = await client.dashboards.getDatasetDetails(parseInt(datasetId));
                        datasetName = datasetDetails.table_name || 'Unknown';
                      } catch (error) {
                        console.warn(`Failed to get dataset name for dataset ${datasetId}:`, error);
                      }
                    }
                  }
                } catch (error) {
                  console.warn(`Failed to parse chart params for chart ${chart.id}:`, error);
                }
              }
              
              return {
                ...chart,
                viz_type: detailedChart.viz_type || 'undefined',
                datasource_id: datasetId,
                datasource_name: datasetName,
                datasource_type: datasetType,
                description: detailedChart.description,
                cache_timeout: detailedChart.cache_timeout,
                last_saved_at: detailedChart.changed_on,
                is_managed_externally: detailedChart.is_managed_externally || false
              };
            } catch (error) {
              console.warn(`Failed to get detailed info for chart ${chart.id}:`, error);
              return {
                ...chart,
                viz_type: 'undefined',
                datasource_id: 'N/A',
                datasource_name: 'N/A',
                datasource_type: 'N/A'
              };
            }
          })
        );
        
        // Format the response text
        let responseText = `Dashboard ${dashboard_id} Charts:\n\n`;
        responseText += `Found ${chartsWithDatasetInfo.length} charts:\n\n`;
        
        chartsWithDatasetInfo.forEach((chart, index) => {
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