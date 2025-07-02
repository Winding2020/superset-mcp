import { initializeSupersetClient } from "../client/index.js";
import { getErrorMessage } from "../utils/error.js";
import { getChartParamsSchema } from "../schema/index.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const [getChartParamsToolName, getChartParamsToolDefinition] = getChartParamsSchema;

const getChartParamsTool = {
  name: getChartParamsToolName,
  description: getChartParamsToolDefinition.description,
  inputSchema: zodToJsonSchema(getChartParamsToolDefinition.inputSchema),
};

// Chart tool definitions
export const chartToolDefinitions = [
  {
    name: "list_charts",
    description: "Get list of all charts in Superset with optional filtering, sorting, and pagination. Uses Rison or JSON query parameters for filtering, sorting, pagination and for selecting specific columns and metadata.",
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
                description: "Filter operator (e.g., 'eq', 'in', 'gt', 'lt')",
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
    name: "create_chart",
    description: "Create a new chart in Superset. Use `get_chart_params` first to understand the required parameter structure for your chosen viz_type.",
    inputSchema: {
      type: "object",
      properties: {
        slice_name: {
          type: "string",
          description: "The name of the chart (required)",
        },
        datasource_id: {
          type: "number",
          description: "The id of the dataset/datasource this chart will use (required)",
        },
        datasource_type: {
          type: "string",
          description: "The type of dataset/datasource (required)",
          enum: ["table", "dataset", "query", "saved_query", "view"],
        },
        viz_type: {
          type: "string",
          description: "The type of chart visualization (optional, defaults to 'table')",
        },
        params: {
          type: "string",
          description: "JSON string of visualization parameters. Use get_chart_params to get the correct structure for your viz_type.",
        },
        description: {
          type: "string",
          description: "A description of the chart purpose (optional)",
        },
        dashboards: {
          type: "array",
          description: "List of dashboard IDs to add this chart to (optional)",
          items: {
            type: "number",
          },
        },
        owners: {
          type: "array",
          description: "List of user IDs who will own this chart (optional)",
          items: {
            type: "number",
          },
        },
        cache_timeout: {
          type: "number",
          description: "Duration (in seconds) of the caching timeout for this chart (optional)",
        },
        query_context: {
          type: "string",
          description: "JSON string representing the query context (optional)",
        },
        external_url: {
          type: "string",
          description: "External URL for the chart (optional)",
        },
        is_managed_externally: {
          type: "boolean",
          description: "Whether the chart is managed externally (optional)",
        },
        certification_details: {
          type: "string",
          description: "Details of the certification (optional)",
        },
        certified_by: {
          type: "string",
          description: "Person or group that has certified this chart (optional)",
        },
      },
      required: ["slice_name", "datasource_id", "datasource_type"],
    },
  },
  {
    name: "get_current_chart_config",
    description: "Get complete chart information including metadata, configuration, and relationships. This provides comprehensive details about a chart including its visualization parameters, datasource info, ownership, dashboards, tags, and more.",
    inputSchema: {
      type: "object",
      properties: {
        chart_id: {
          type: "number",
          description: "Chart ID",
        },
        include_params_details: {
          type: "boolean",
          description: "Whether to include detailed breakdown of visualization parameters (default: false)",
          default: false,
        },
        include_ownership: {
          type: "boolean",
          description: "Whether to include ownership and certification information (default: false)",
          default: false,
        },
        include_relationships: {
          type: "boolean",
          description: "Whether to include dashboard relationships and tags (default: true)",
          default: true,
        },
        include_query_context: {
          type: "boolean",
          description: "Whether to include query context details (default: true)",
          default: true,
        },
        include_summary: {
          type: "boolean",
          description: "Whether to include summary statistics (default: true)",
          default: true,
        },
      },
      required: ["chart_id"],
    },
  },
  getChartParamsTool,
  {
    name: "update_chart",
    description: "Update chart properties including metadata, datasource, and visualization settings. This tool replaces the old update_chart_params with a unified interface that accepts object format params and can modify any chart property. Use `get_chart_params` to get the correct parameter structure for visualization settings.",
    inputSchema: {
      type: "object",
      properties: {
        chart_id: {
          type: "number",
          description: "Chart ID (required)",
        },
        slice_name: {
          type: "string",
          description: "The name of the chart",
        },
        viz_type: {
          type: "string",
          description: "The type of chart visualization",
        },
        params: {
          type: "object",
          description: "Visualization parameters as an object. Use get_chart_params to get the correct structure for your viz_type.",
          additionalProperties: true,
        },
        description: {
          type: "string",
          description: "A description of the chart purpose",
        },
        datasource_id: {
          type: "number",
          description: "The id of the dataset/datasource this chart will use",
        },
        datasource_type: {
          type: "string",
          description: "The type of dataset/datasource",
          enum: ["table", "dataset", "query", "saved_query", "view"],
        },
        dashboards: {
          type: "array",
          description: "List of dashboard IDs this chart belongs to",
          items: {
            type: "number",
          },
        },
        owners: {
          type: "array",
          description: "List of user IDs who own this chart",
          items: {
            type: "number",
          },
        },
        tags: {
          type: "array",
          description: "List of tag IDs to associate with this chart",
          items: {
            type: "number",
          },
        },
        cache_timeout: {
          type: "number",
          description: "Duration (in seconds) of the caching timeout for this chart",
        },
        query_context: {
          type: "string",
          description: "JSON string representing the query context",
        },
        query_context_generation: {
          type: "boolean",
          description: "Whether the query context is user generated",
        },
        external_url: {
          type: "string",
          description: "External URL for the chart",
        },
        is_managed_externally: {
          type: "boolean",
          description: "Whether the chart is managed externally",
        },
        certification_details: {
          type: "string",
          description: "Details of the certification",
        },
        certified_by: {
          type: "string",
          description: "Person or group that has certified this chart",
        },
      },
      required: ["chart_id"],
    },
  },
  {
    name: "get_chart_filters",
    description: "Get current data filters applied to a chart. This extracts filters from the chart's query context or form data. Use this tool to see what filters are currently applied before modifying them.",
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
    name: "set_chart_filters",
    description: "Set data filters for a chart. This permanently updates the chart's query context with the specified filters. Filters are applied at the data level, affecting what data is retrieved from the datasource.",
    inputSchema: {
      type: "object",
      properties: {
        chart_id: {
          type: "number",
          description: "Chart ID",
        },
        filters: {
          type: "array",
          description: "Array of filter conditions to apply to the chart data",
          items: {
            type: "object",
            properties: {
              col: {
                description: "Column name to filter on (string) or adhoc column object",
              },
              op: {
                type: "string",
                description: "Filter operator",
                enum: ["==", "!=", ">", "<", ">=", "<=", "LIKE", "NOT LIKE", "ILIKE", "IS NULL", "IS NOT NULL", "IN", "NOT IN", "IS TRUE", "IS FALSE", "TEMPORAL_RANGE"],
              },
              val: {
                description: "Value(s) to compare against. Can be string, number, boolean, array, or null depending on operator",
              },
              grain: {
                type: "string",
                description: "Optional time grain for temporal filters (e.g., 'PT1M', 'P1D')",
              },
              isExtra: {
                type: "boolean",
                description: "Optional flag indicating if filter was added by filter component",
              },
            },
            required: ["col", "op"],
          },
        },
      },
      required: ["chart_id", "filters"],
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
      
      case "create_chart": {
        const { slice_name, datasource_id, datasource_type, viz_type, params, ...otherFields } = args;
        
        const chartData: any = {
          slice_name,
          datasource_id,
          datasource_type,
          ...otherFields
        };
        
        // Add viz_type if provided, otherwise default to 'table'
        if (viz_type) {
          chartData.viz_type = viz_type;
        }
        
        // Handle params - if it's a string, use as-is; if it's an object, stringify it
        if (params) {
          if (typeof params === 'string') {
            chartData.params = params;
          } else {
            chartData.params = JSON.stringify(params);
          }
        }
        
        const createdChart = await client.charts.createChart(chartData);
        
        return {
          content: [
            {
              type: "text",
              text: `Chart created successfully!\n\n` +
                `Chart ID: ${createdChart.id}\n` +
                `Chart Name: ${createdChart.slice_name}\n` +
                `Visualization Type: ${createdChart.viz_type || 'table'}\n` +
                `Datasource ID: ${createdChart.datasource_id}\n` +
                `Datasource Type: ${createdChart.datasource_type}\n` +
                `Description: ${createdChart.description || 'N/A'}\n\n` +
                `You can now use chart ID ${createdChart.id} to update its configuration.`
            },
          ],
        };
      }
      
      case "get_current_chart_config": {
        const { 
          chart_id, 
          include_params_details = false,
          include_ownership = false,
          include_relationships = true,
          include_query_context = true,
          include_summary = true
        } = args;
        
        // Get complete chart information
        const chart = await client.charts.getChart(chart_id);
        
        let responseText = ``;
        
        // Basic Information (always shown)
        responseText += `BASIC INFORMATION\n`;
        responseText += `Chart ID: ${chart.id}\n`;
        responseText += `Chart Name: ${chart.slice_name || 'N/A'}\n`;
        responseText += `Visualization Type: ${chart.viz_type || 'N/A'}\n`;
        responseText += `Description: ${chart.description || 'N/A'}\n`;
        responseText += `External URL: ${chart.url || 'N/A'}\n`;
        responseText += `Thumbnail URL: ${chart.thumbnail_url || 'N/A'}\n`;
        responseText += `Last Modified: ${chart.changed_on_delta_humanized || 'N/A'}\n`;
        responseText += `Managed Externally: ${chart.is_managed_externally ? 'Yes' : 'No'}\n`;
        responseText += `Cache Timeout: ${chart.cache_timeout ? `${chart.cache_timeout} seconds` : 'Default'}\n\n`;
        
        // Ownership and Certification Information
        if (include_ownership) {
          let hasOwnershipInfo = false;
          
          // Certification Information
          if (chart.certified_by || chart.certification_details) {
            if (!hasOwnershipInfo) {
              responseText += `OWNERSHIP & CERTIFICATION\n`;
              hasOwnershipInfo = true;
            }
            responseText += `Certified By: ${chart.certified_by || 'N/A'}\n`;
            responseText += `Certification Details: ${chart.certification_details || 'N/A'}\n`;
          }
          
          // Ownership Information
          if (chart.owners && chart.owners.length > 0) {
            if (!hasOwnershipInfo) {
              responseText += `OWNERSHIP & CERTIFICATION\n`;
              hasOwnershipInfo = true;
            }
            responseText += `Owners:\n`;
            chart.owners.forEach((owner: any, index: number) => {
              responseText += `  ${index + 1}. ${owner.first_name} ${owner.last_name} (ID: ${owner.id})\n`;
            });
          }
          
          if (hasOwnershipInfo) {
            responseText += `\n`;
          }
        }
        
        // Relationships (Dashboards and Tags)
        if (include_relationships) {
          let hasRelationshipInfo = false;
          
          // Dashboard Relationships
          if (chart.dashboards && chart.dashboards.length > 0) {
            if (!hasRelationshipInfo) {
              responseText += `RELATIONSHIPS\n`;
              hasRelationshipInfo = true;
            }
            responseText += `Dashboards:\n`;
            chart.dashboards.forEach((dashboard: any, index: number) => {
              responseText += `  ${index + 1}. ${dashboard.dashboard_title || 'Untitled'} (ID: ${dashboard.id})\n`;
              if (dashboard.json_metadata) {
                try {
                  const metadata = JSON.parse(dashboard.json_metadata);
                  if (metadata.color_scheme) {
                    responseText += `     Color Scheme: ${metadata.color_scheme}\n`;
                  }
                } catch (e) {
                  // Ignore parsing errors for metadata
                }
              }
            });
          }
          
          // Tags
          if (chart.tags && chart.tags.length > 0) {
            if (!hasRelationshipInfo) {
              responseText += `RELATIONSHIPS\n`;
              hasRelationshipInfo = true;
            }
            responseText += `Tags:\n`;
            chart.tags.forEach((tag: any, index: number) => {
              const tagType = ['', 'Custom', 'Type', 'Owner', 'Favorite'][tag.type] || 'Unknown';
              responseText += `  ${index + 1}. ${tag.name} (Type: ${tagType}, ID: ${tag.id})\n`;
            });
          }
          
          if (hasRelationshipInfo) {
            responseText += `\n`;
          }
        }
        
        // Query Context
        if (include_query_context && chart.query_context) {
          responseText += `QUERY CONTEXT\n`;
          try {
            const queryContext = JSON.parse(chart.query_context);
            responseText += `Datasource: ${queryContext.datasource?.type || 'N/A'} (ID: ${queryContext.datasource?.id || 'N/A'})\n`;
            responseText += `Result Format: ${queryContext.result_format || 'N/A'}\n`;
            responseText += `Result Type: ${queryContext.result_type || 'N/A'}\n`;
            if (queryContext.queries && queryContext.queries.length > 0) {
              responseText += `Number of Queries: ${queryContext.queries.length}\n`;
              queryContext.queries.forEach((query: any, index: number) => {
                responseText += `  Query ${index + 1}:\n`;
                responseText += `    Columns: ${query.columns?.length || 0}\n`;
                responseText += `    Metrics: ${query.metrics?.length || 0}\n`;
                responseText += `    Filters: ${query.filters?.length || 0}\n`;
                responseText += `    Row Limit: ${query.row_limit || 'N/A'}\n`;
                if (query.granularity) {
                  responseText += `    Granularity: ${query.granularity}\n`;
                }
              });
            }
          } catch (error) {
            responseText += `Raw Query Context: ${chart.query_context.substring(0, 200)}${chart.query_context.length > 200 ? '...' : ''}\n`;
          }
          responseText += `\n`;
        }
        
        // Visualization Parameters
        if (chart.params && include_params_details) {
          responseText += `VISUALIZATION PARAMETERS\n`;
          try {
            const params = JSON.parse(chart.params);
            
            // Show key parameters in a structured way
            if (params.viz_type) {
              responseText += `Visualization Type: ${params.viz_type}\n`;
            }
            if (params.datasource) {
              responseText += `Datasource: ${params.datasource}\n`;
            }
            if (params.groupby && params.groupby.length > 0) {
              responseText += `Group By: ${params.groupby.join(', ')}\n`;
            }
            if (params.metrics && params.metrics.length > 0) {
              responseText += `Metrics: ${params.metrics.join(', ')}\n`;
            }
            if (params.metric) {
              responseText += `Metric: ${params.metric}\n`;
            }
            if (params.row_limit) {
              responseText += `Row Limit: ${params.row_limit}\n`;
            }
            if (params.color_scheme) {
              responseText += `Color Scheme: ${params.color_scheme}\n`;
            }
            if (params.show_legend !== undefined) {
              responseText += `Show Legend: ${params.show_legend ? 'Yes' : 'No'}\n`;
            }
            if (params.x_axis_format) {
              responseText += `X-Axis Format: ${params.x_axis_format}\n`;
            }
            if (params.y_axis_format) {
              responseText += `Y-Axis Format: ${params.y_axis_format}\n`;
            }
            
            // Show filters if any
            const filters = params.filters || params.adhoc_filters || [];
            if (filters.length > 0) {
              responseText += `Applied Filters: ${filters.length}\n`;
              filters.forEach((filter: any, index: number) => {
                responseText += `  ${index + 1}. ${typeof filter.col === 'string' ? filter.col : JSON.stringify(filter.col)} ${filter.op || filter.operator} ${filter.val || filter.comparator}\n`;
              });
            }
            
            responseText += `\nComplete Parameters JSON:\n`;
            responseText += `${JSON.stringify(params, null, 2)}\n\n`;
          } catch (error) {
            responseText += `Raw Parameters: ${chart.params.substring(0, 500)}${chart.params.length > 500 ? '...' : ''}\n\n`;
          }
        } else if (chart.params && !include_params_details) {
          responseText += `VISUALIZATION PARAMETERS\n`;
          responseText += `Parameters exist but details hidden (use include_params_details: true to show)\n`;
          responseText += `Parameters length: ${chart.params.length} characters\n\n`;
        }
        
        // Summary
        if (include_summary) {
          responseText += `SUMMARY\n`;
          responseText += `Total Dashboards: ${chart.dashboards?.length || 0}\n`;
          responseText += `Total Owners: ${chart.owners?.length || 0}\n`;
          responseText += `Total Tags: ${chart.tags?.length || 0}\n`;
          responseText += `Has Parameters: ${chart.params ? 'Yes' : 'No'}\n`;
          responseText += `Has Query Context: ${chart.query_context ? 'Yes' : 'No'}\n`;
          responseText += `Is Certified: ${chart.certified_by ? 'Yes' : 'No'}\n`;
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
      
      case "update_chart": {
        const { chart_id, params, ...updateFields } = args;
        
        // Handle params - serialize object to JSON string
        if (params !== undefined) {
          updateFields.params = JSON.stringify(params);
          
          // Auto-extract viz_type from params object if not explicitly provided
          if (params.viz_type && !updateFields.viz_type) {
            updateFields.viz_type = params.viz_type;
          }
        }
        
        const updatedChart = await client.charts.updateChart(chart_id, updateFields);
        
        let responseText = `Chart ${chart_id} updated successfully!\n\n`;
        responseText += `Chart Name: ${updatedChart.slice_name}\n`;
        responseText += `Visualization Type: ${updatedChart.viz_type}\n`;
        responseText += `Description: ${updatedChart.description || 'N/A'}\n`;
        
        if (updatedChart.datasource_id) {
          responseText += `Datasource ID: ${updatedChart.datasource_id}\n`;
        }
        if (updatedChart.datasource_type) {
          responseText += `Datasource Type: ${updatedChart.datasource_type}\n`;
        }
        
        // List updated fields
        const updatedFieldNames = Object.keys(updateFields).filter(key => key !== 'params');
        if (updatedFieldNames.length > 0 || params !== undefined) {
          responseText += `\nUpdated fields: `;
          const fields = [...updatedFieldNames];
          if (params !== undefined) fields.push('params');
          responseText += fields.join(', ');
        }
        
        // Show params details if they were updated
        if (params !== undefined) {
          responseText += `\n\nUpdated Parameters:\n${JSON.stringify(params, null, 2)}`;
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
        const { viz_type } = args;
        const definition = getChartParamsToolDefinition;
        const outputSchema = definition.outputSchema as z.ZodDiscriminatedUnion<"viz_type", any>;
        const targetSchema = outputSchema.optionsMap.get(viz_type);

        if (!targetSchema) {
          return {
            content: [{ type: "text", text: `Unknown viz_type: ${viz_type}` }],
            isError: true,
          };
        }

        const jsonSchema = zodToJsonSchema(targetSchema, {
          name: `${viz_type}_params`,
          $refStrategy: 'none'
        });

        return {
          content: [
            {
              type: "text",
              text: `Parameters schema for viz_type: '${viz_type}'\n\n${JSON.stringify(jsonSchema, null, 2)}`
            },
          ],
        };
      }
      
      case "get_chart_filters": {
        const { chart_id } = args;
        const filters = await client.charts.getChartFilters(chart_id);
        
        // Also get basic chart info for context
        const chart = await client.charts.getChart(chart_id);
        
        let responseText = `Chart ${chart_id} current data filters:\n\n`;
        responseText += `Chart Name: ${chart.slice_name}\n`;
        responseText += `Visualization Type: ${chart.viz_type}\n\n`;
        
        if (filters.length === 0) {
          responseText += `No data filters are currently applied to this chart.\n\n`;
        } else {
          responseText += `Current Filters (${filters.length}):\n`;
          filters.forEach((filter: any, index: number) => {
            responseText += `${index + 1}. Column: ${typeof filter.col === 'string' ? filter.col : JSON.stringify(filter.col)}\n`;
            responseText += `   Operator: ${filter.op}\n`;
            if (filter.val !== undefined) {
              responseText += `   Value: ${Array.isArray(filter.val) ? JSON.stringify(filter.val) : filter.val}\n`;
            }
            if (filter.grain) {
              responseText += `   Time Grain: ${filter.grain}\n`;
            }
            if (filter.isExtra) {
              responseText += `   Added by Filter Component: Yes\n`;
            }
            responseText += `   ---\n`;
          });
        }
        
        responseText += `\nFilter Operators Reference:\n`;
        responseText += `- ==, !=, >, <, >=, <=: Comparison operators\n`;
        responseText += `- LIKE, NOT LIKE, ILIKE: Text pattern matching\n`;
        responseText += `- IN, NOT IN: Value list matching\n`;
        responseText += `- IS NULL, IS NOT NULL: Null value checking\n`;
        responseText += `- IS TRUE, IS FALSE: Boolean value checking\n`;
        responseText += `- TEMPORAL_RANGE: Time range filtering\n`;
        
        return {
          content: [
            {
              type: "text",
              text: responseText
            },
          ],
        };
      }
      
      case "set_chart_filters": {
        const { chart_id, filters } = args;
        
        // Validate filters
        for (const filter of filters) {
          if (!filter.col || !filter.op) {
            throw new Error(`Invalid filter: both 'col' and 'op' are required. Got: ${JSON.stringify(filter)}`);
          }
        }
        
        const updatedChart = await client.charts.setChartFilters(chart_id, filters);
        
        let responseText = `Chart ${chart_id} filters updated successfully!\n\n`;
        responseText += `Chart Name: ${updatedChart.slice_name}\n`;
        responseText += `Visualization Type: ${updatedChart.viz_type}\n\n`;
        
        if (filters.length === 0) {
          responseText += `All data filters have been removed from this chart.\n`;
        } else {
          responseText += `Applied Filters (${filters.length}):\n`;
          filters.forEach((filter: any, index: number) => {
            responseText += `${index + 1}. Column: ${typeof filter.col === 'string' ? filter.col : JSON.stringify(filter.col)}\n`;
            responseText += `   Operator: ${filter.op}\n`;
            if (filter.val !== undefined) {
              responseText += `   Value: ${Array.isArray(filter.val) ? JSON.stringify(filter.val) : filter.val}\n`;
            }
            if (filter.grain) {
              responseText += `   Time Grain: ${filter.grain}\n`;
            }
            responseText += `   ---\n`;
          });
        }
        
        responseText += `\nNote: These filters are now permanently applied to the chart and will affect all future data queries for this chart.`;
        
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