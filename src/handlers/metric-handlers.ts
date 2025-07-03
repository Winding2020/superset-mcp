import { initializeSupersetClient } from "../client/index.js";
import { getErrorMessage } from "../utils/error.js";

// Metric tool definitions
export const metricToolDefinitions = [
  {
    name: "get_dataset_metrics",
    description: "Get all metrics for a specified dataset",
    inputSchema: {
      type: "object",
      properties: {
        dataset_id: {
          type: "number",
          description: "Dataset ID",
        },
      },
      required: ["dataset_id"],
    },
  },
  {
    name: "create_dataset_metric",
    description: "Create one or more new metrics for a dataset",
    inputSchema: {
      type: "object",
      properties: {
        dataset_id: {
          type: "number",
          description: "Dataset ID",
        },
        metrics: {
          type: "array",
          description: "Array of metrics to create. For a single metric creation, this array will contain one object.",
          items: {
            type: "object",
            properties: {
              metric_name: {
                type: "string",
                description: "Metric name",
              },
              expression: {
                type: "string",
                description: "Metric expression (SQL expression)",
              },
              metric_type: {
                type: "string",
                description: "Metric type (optional)",
              },
              description: {
                type: "string",
                description: "Metric description (optional)",
              },
              verbose_name: {
                type: "string",
                description: "Metric display name (optional)",
              },
              d3format: {
                type: "string",
                description: "D3 format string (optional)",
              },
            },
            required: ["metric_name", "expression"],
          },
        },
      },
      required: ["dataset_id", "metrics"],
    },
  },
  {
    name: "update_dataset_metric",
    description: "Update one or more metrics in a dataset",
    inputSchema: {
      type: "object",
      properties: {
        dataset_id: {
          type: "number",
          description: "Dataset ID",
        },
        updates: {
          type: "array",
          description: "Array of metric updates. For a single metric update, this array will contain one object.",
          items: {
            type: "object",
            properties: {
              metric_id: {
                type: "number",
                description: "ID of the metric to update",
              },
              metric_name: {
                type: "string",
                description: "New metric name (optional)",
              },
              expression: {
                type: "string",
                description: "New metric expression (optional)",
              },
              description: {
                type: "string",
                description: "New metric description (optional)",
              },
              verbose_name: {
                type: "string",
                description: "New metric display name (optional)",
              },
              d3format: {
                type: "string",
                description: "New D3 format string (optional)",
              },
              metric_type: {
                type: "string",
                description: "New metric type (optional)",
              },
            },
            required: ["metric_id"],
          },
        },
      },
      required: ["dataset_id", "updates"],
    },
  },
  {
    name: "delete_dataset_metric",
    description: "Delete one or more metrics from a dataset",
    inputSchema: {
      type: "object",
      properties: {
        dataset_id: {
          type: "number",
          description: "Dataset ID",
        },
        metric_ids: {
          type: "array",
          description: "Array of metric IDs to delete. For a single metric deletion, this array will contain one ID.",
          items: {
            type: "number",
          },
        },
      },
      required: ["dataset_id", "metric_ids"],
    },
  },
];

// Metric tool handlers
export async function handleMetricTool(toolName: string, args: any) {
  const client = initializeSupersetClient();
  
  try {
    switch (toolName) {
      case "get_dataset_metrics": {
        const { dataset_id } = args;
        const metrics = await client.metrics.getDatasetMetrics(dataset_id);
        
        return {
          content: [
            {
              type: "text",
              text: `Dataset ${dataset_id} metrics:\n\n` +
                metrics.map(metric => 
                  `ID: ${metric.id}\n` +
                  `Name: ${metric.metric_name}\n` +
                  `Type: ${metric.metric_type || 'N/A'}\n` +
                  `Expression: ${metric.expression}\n` +
                  `Description: ${metric.description || 'N/A'}\n` +
                  `---`
                ).join('\n')
            },
          ],
        };
      }
      
      case "create_dataset_metric": {
        const { dataset_id, metrics } = args;
        await client.metrics.createDatasetMetrics(dataset_id, metrics);
        
        const allMetrics = await client.metrics.getDatasetMetrics(dataset_id);
        
        return {
          content: [
            {
              type: "text",
              text: `Metrics created for dataset ${dataset_id}. The complete list of metrics is now:\n\n` +
                allMetrics.map((metric: any) => 
                  `ID: ${metric.id}\n` +
                  `Name: ${metric.metric_name}\n` +
                  `Type: ${metric.metric_type || 'N/A'}\n` +
                  `Expression: ${metric.expression}\n` +
                  `Description: ${metric.description || 'N/A'}`
                ).join('\n---\n')
            },
          ],
        };
      }
      
      case "update_dataset_metric": {
        const { dataset_id, updates } = args;
        const batchUpdates = updates.map((update: any) => ({
          metricId: update.metric_id,
          metric: {
            metric_name: update.metric_name,
            expression: update.expression,
            description: update.description,
            verbose_name: update.verbose_name,
            d3format: update.d3format,
            metric_type: update.metric_type,
          }
        }));

        const metrics = await client.metrics.updateDatasetMetrics(dataset_id, batchUpdates);
        
        return {
          content: [
            {
              type: "text",
              text: `Dataset ${dataset_id} metrics updated successfully!\n\n` +
                `Updated ${metrics.length} metric${metrics.length > 1 ? 's' : ''}:\n` +
                metrics.map((metric: any) => 
                  `- ${metric.metric_name} (ID: ${metric.id})\n` +
                  `  Type: ${metric.metric_type || 'N/A'}\n` +
                  `  Expression: ${metric.expression}\n` +
                  `  Description: ${metric.description || 'N/A'}\n` +
                  `  Display Name: ${metric.verbose_name || 'N/A'}\n` +
                  `  D3 Format: ${metric.d3format || 'N/A'}`
                ).join('\n\n')
            },
          ],
        };
      }
      
      case "delete_dataset_metric": {
        const { dataset_id, metric_ids } = args;
        await client.metrics.deleteDatasetMetrics(dataset_id, metric_ids);
        
        return {
          content: [
            {
              type: "text",
              text: `Dataset ${dataset_id} metrics deleted successfully!\n\n` +
                `Deleted ${metric_ids.length} metric${metric_ids.length > 1 ? 's' : ''} with ID${metric_ids.length > 1 ? 's' : ''}: ${metric_ids.join(', ')}`
            },
          ],
        };
      }
      
      default:
        throw new Error(`Unknown metric tool: ${toolName}`);
    }
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error(`Metric tool ${toolName} failed:`, errorMessage);
    
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