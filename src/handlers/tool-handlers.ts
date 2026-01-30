import { chartToolDefinitions } from "./chart-handlers.js";
import { datasetToolDefinitions } from "./dataset-handlers.js";
import { metricToolDefinitions } from "./metric-handlers.js";
import { columnToolDefinitions } from "./column-handlers.js";
import { databaseToolDefinitions } from "./database-handlers.js";
import { dashboardToolDefinitions } from "./dashboard-handlers.js";

// Combine all tool definitions
export const toolDefinitions = [
  ...chartToolDefinitions,
  ...datasetToolDefinitions,
  ...metricToolDefinitions,
  ...columnToolDefinitions,
  ...databaseToolDefinitions,
  ...dashboardToolDefinitions,
];

import { handleChartTool } from "./chart-handlers.js";
import { handleDatasetTool } from "./dataset-handlers.js";
import { handleMetricTool } from "./metric-handlers.js";
import { handleColumnTool } from "./column-handlers.js";
import { handleDatabaseTool } from "./database-handlers.js";
import { handleDashboardTool } from "./dashboard-handlers.js";

// Tool routing map
const toolRoutes = {
  // Chart tools
  "list_charts": handleChartTool,
  "create_chart": handleChartTool,
  "get_chart_params": handleChartTool,
  "get_current_chart_config": handleChartTool,
  "update_chart": handleChartTool,
  "get_chart_filters": handleChartTool,
  "set_chart_filters": handleChartTool,
  
  // Dataset tools
  "list_datasets": handleDatasetTool,
  "get_dataset": handleDatasetTool,
  "create_dataset": handleDatasetTool,
  "update_dataset": handleDatasetTool,
  "delete_dataset": handleDatasetTool,
  "refresh_dataset_schema": handleDatasetTool,
  "find_and_replace_in_sql": handleDatasetTool,
  
  // Metric tools
  "get_dataset_metrics": handleMetricTool,
  "create_dataset_metric": handleMetricTool,
  "update_dataset_metric": handleMetricTool,
  "delete_dataset_metric": handleMetricTool,
  
  // Column tools
  "get_dataset_columns": handleColumnTool,
  "create_calculated_column": handleColumnTool,
  "update_calculated_column": handleColumnTool,
  "delete_calculated_column": handleColumnTool,
  
  // Database tools
  "list_databases": handleDatabaseTool,
  "execute_sql": handleDatabaseTool,
  
  // Dashboard tools
  "list_dashboards": handleDashboardTool,
  "get_dashboard_chart_query_context": handleDashboardTool,
  "get_dashboard_charts": handleDashboardTool,
  "get_dashboard_filters": handleDashboardTool,
  "get_dashboard_config": handleDashboardTool,
  "update_dashboard_config": handleDashboardTool,
  "add_chart_to_dashboard": handleDashboardTool,
  "remove_chart_from_dashboard": handleDashboardTool,
};

export async function handleToolCall(request: any) {
  const toolName = request.params.name;
  const args = request.params.arguments;
  
  const handler = toolRoutes[toolName as keyof typeof toolRoutes];
  
  if (!handler) {
    return {
      content: [
        {
          type: "text",
          text: `Unknown tool: ${toolName}`,
        },
      ],
      isError: true,
    };
  }
  
  return await handler(toolName, args);
} 