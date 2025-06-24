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
    description: "Create a new metric for a dataset",
    inputSchema: {
      type: "object",
      properties: {
        dataset_id: {
          type: "number",
          description: "Dataset ID",
        },
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
      required: ["dataset_id", "metric_name", "expression"],
    },
  },
  {
    name: "update_dataset_metric",
    description: "Update a metric in a dataset",
    inputSchema: {
      type: "object",
      properties: {
        dataset_id: {
          type: "number",
          description: "Dataset ID",
        },
        metric_id: {
          type: "number",
          description: "Metric ID",
        },
        metric_name: {
          type: "string",
          description: "Metric name (optional)",
        },
        expression: {
          type: "string",
          description: "Metric expression (optional)",
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
      required: ["dataset_id", "metric_id"],
    },
  },
  {
    name: "delete_dataset_metric",
    description: "Delete a metric from a dataset",
    inputSchema: {
      type: "object",
      properties: {
        dataset_id: {
          type: "number",
          description: "Dataset ID",
        },
        metric_id: {
          type: "number",
          description: "ID of the metric to delete",
        },
      },
      required: ["dataset_id", "metric_id"],
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
        const { dataset_id, metric_name, expression, metric_type, description, verbose_name, d3format } = args;
        const metric = { metric_name, expression, metric_type, description, verbose_name, d3format };
        const newMetric = await client.metrics.createDatasetMetric(dataset_id, metric);
        
        return {
          content: [
            {
              type: "text",
              text: `Dataset ${dataset_id} metric created successfully!\n\n` +
                `ID: ${newMetric.id}\n` +
                `Name: ${newMetric.metric_name}\n` +
                `Type: ${newMetric.metric_type || 'N/A'}\n` +
                `Expression: ${newMetric.expression}\n` +
                `Description: ${newMetric.description || 'N/A'}\n` +
                `Display Name: ${newMetric.verbose_name || 'N/A'}\n` +
                `D3 Format String: ${newMetric.d3format || 'N/A'}`
            },
          ],
        };
      }
      
      case "update_dataset_metric": {
        const { dataset_id, metric_id, metric_name, expression, description, verbose_name, d3format } = args;
        const metric = { metric_name, expression, description, verbose_name, d3format };
        const updatedMetric = await client.metrics.updateDatasetMetric(dataset_id, metric_id, metric);
        
        return {
          content: [
            {
              type: "text",
              text: `Dataset ${dataset_id} metric ${metric_id} updated successfully!\n\n` +
                `Name: ${updatedMetric.metric_name}\n` +
                `Type: ${updatedMetric.metric_type || 'N/A'}\n` +
                `Expression: ${updatedMetric.expression}\n` +
                `Description: ${updatedMetric.description || 'N/A'}\n` +
                `Display Name: ${updatedMetric.verbose_name || 'N/A'}\n` +
                `D3 Format String: ${updatedMetric.d3format || 'N/A'}`
            },
          ],
        };
      }
      
      case "delete_dataset_metric": {
        const { dataset_id, metric_id } = args;
        await client.metrics.deleteDatasetMetric(dataset_id, metric_id);
        
        return {
          content: [
            {
              type: "text",
              text: `Dataset ${dataset_id} metric ${metric_id} deleted successfully!`
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