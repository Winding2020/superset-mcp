import { initializeSupersetClient } from "../client/index.js";
import { getErrorMessage } from "../utils/error.js";

// Chart tool definitions
export const chartToolDefinitions = [
  {
    name: "list_charts",
    description: "Get list of all charts in Superset with optional filtering, sorting, and pagination. Uses Rison or JSON query parameters for filtering, sorting, pagination and for selecting specific columns and metadata. Query format: filters=[{col: 'column_name', opr: 'operator', value: 'filter_value'}], order_column='column_name', order_direction='asc|desc', page=0, page_size=20, select_columns=['column1', 'column2']",
    inputSchema: {
      type: "object",
      properties: {
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
        order_column: {
          type: "string",
          description: "Column to sort by (e.g., 'changed_on_dttm', 'changed_on_delta_humanized', 'slice_name', 'viz_type', 'datasource_name_text', 'last_saved_at', 'id')",
        },
        order_direction: {
          type: "string",
          description: "Sort direction: 'asc' or 'desc'",
          enum: ["asc", "desc"],
        },
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
    name: "get_chart_params",
    description: "Get visualization parameters (params) of a chart. This tool should be called FIRST before updating chart visualization settings. The params contain all visualization-specific configurations like colors, axes, legends, etc. The structure varies based on the chart's viz_type.",
    inputSchema: {
      type: "object",
      properties: {
        chart_id: {
          type: "number",
          description: "Chart ID",
        },
      },
      required: ["chart_id"],
    },
  },
  {
    name: "update_chart_params",
    description: "Update visualization parameters (params) of a chart. Call get_chart_params FIRST to see the current configuration, then modify the params object and use this tool to apply changes. This updates ONLY the visualization settings, not the chart's metadata like name or description.",
    inputSchema: {
      type: "object",
      properties: {
        chart_id: {
          type: "number",
          description: "Chart ID",
        },
        params: {
          type: "object",
          description: "Complete params object with your modifications. The structure depends on viz_type. Common fields include: color_scheme, show_legend, x_axis_format, y_axis_format, etc.",
          additionalProperties: true,
        },
      },
      required: ["chart_id", "params"],
    },
  },
];

// Chart tool handlers
export async function handleChartTool(toolName: string, args: any) {
  const client = initializeSupersetClient();
  
  try {
    switch (toolName) {
      case "list_charts": {
        const { page = 0, page_size = 20, order_column, order_direction, filters, select_columns } = args;
        
        // Build query object
        const query: any = {
          page,
          page_size,
        };
        
        if (order_column) {
          query.order_column = order_column;
        }
        
        if (order_direction) {
          query.order_direction = order_direction;
        }
        
        if (filters && filters.length > 0) {
          query.filters = filters;
        }
        
        if (select_columns && select_columns.length > 0) {
          query.select_columns = select_columns;
        }
        
        const result = await client.charts.listCharts(query);
        
        // Format the response text
        let responseText = `Found ${result.count} charts (showing page ${page + 1}):\n\n`;
        
        result.result.forEach((chart, index) => {
          responseText += `${index + 1}. Chart ID: ${chart.id}\n`;
          responseText += `   Name: ${chart.slice_name || 'N/A'}\n`;
          responseText += `   Type: ${chart.viz_type || 'N/A'}\n`;
          responseText += `   Datasource: ${chart.datasource_name_text || 'N/A'}\n`;
          responseText += `   Description: ${chart.description || 'N/A'}\n`;
          responseText += `   Created By: ${chart.created_by_name || 'N/A'}\n`;
          responseText += `   Last Modified: ${chart.changed_on_delta_humanized || 'N/A'}\n`;
          
          if (chart.dashboards && chart.dashboards.length > 0) {
            responseText += `   Dashboards: ${chart.dashboards.map(d => `${d.dashboard_title} (ID: ${d.id})`).join(', ')}\n`;
          }
          
          if (chart.tags && chart.tags.length > 0) {
            responseText += `   Tags: ${chart.tags.map(t => t.name).join(', ')}\n`;
          }
          
          responseText += `   ---\n`;
        });
        
        // Add summary information
        if (result.count > result.result.length) {
          const totalPages = Math.ceil(result.count / page_size);
          responseText += `\nShowing ${result.result.length} of ${result.count} charts (Page ${page + 1} of ${totalPages})`;
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
      
      case "get_chart_params": {
        const { chart_id } = args;
        const params = await client.charts.getChartParams(chart_id);
        
        // Also get basic chart info for context
        const chart = await client.charts.getChart(chart_id);
        
        return {
          content: [
            {
              type: "text",
              text: `Chart ${chart_id} visualization parameters:\n\n` +
                `Chart Name: ${chart.slice_name}\n` +
                `Visualization Type: ${chart.viz_type}\n\n` +
                `Current Parameters:\n` +
                `${JSON.stringify(params, null, 2)}\n\n` +
                `Note: The structure of params depends on the viz_type. Common fields include:\n` +
                `- color_scheme: Color palette for the chart\n` +
                `- show_legend: Whether to display legend\n` +
                `- x_axis_format: Format for X axis labels\n` +
                `- y_axis_format: Format for Y axis labels\n` +
                `- metric: Metric(s) to display\n` +
                `- groupby: Dimension(s) to group by`
            },
          ],
        };
      }
      
      case "update_chart_params": {
        const { chart_id, params } = args;
        const updatedChart = await client.charts.updateChartParams(chart_id, params);
        
        return {
          content: [
            {
              type: "text",
              text: `Chart ${chart_id} visualization parameters updated successfully!\n\n` +
                `Chart Name: ${updatedChart.slice_name}\n` +
                `Visualization Type: ${updatedChart.viz_type}\n\n` +
                `Updated Parameters:\n` +
                `${JSON.stringify(params, null, 2)}`
            },
          ],
        };
      }
      
      default:
        throw new Error(`Unknown chart tool: ${toolName}`);
    }
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error(`Chart tool ${toolName} failed:`, errorMessage);
    
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