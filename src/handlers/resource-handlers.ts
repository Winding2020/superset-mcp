import { ReadResourceRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { initializeSupersetClient } from "../client/index.js";
import { getErrorMessage } from "../utils/error.js";
import { DatasetMetric } from "../types/index.js";

export async function handleResourceRead(request: any) {
  const client = initializeSupersetClient();
  
  try {
    switch (request.params.uri) {
      case "superset://datasets": {
        const result = await client.datasets.getDatasets(0, 50);
        const content = `Superset Datasets Overview\n` +
          `========================\n\n` +
          `Total: ${result.count}\n\n` +
          result.result.map((dataset: any) => 
            `• ${dataset.table_name} (ID: ${dataset.id})\n` +
            `  Database ID: ${dataset.database_id}\n` +
            `  Schema: ${dataset.schema || 'N/A'}\n` +
            `  Description: ${dataset.description || 'N/A'}\n`
          ).join('\n');
        
        return {
          contents: [
            {
              uri: request.params.uri,
              mimeType: "text/plain",
              text: content,
            },
          ],
        };
      }
      
      case "superset://databases": {
        const databases = await client.sql.getDatabases();
        const content = `Superset Database Connections\n` +
          `===================\n\n` +
          `Total: ${databases.length}\n\n` +
          databases.map((db: any) => 
            `• ${db.database_name} (ID: ${db.id})\n` +
            `  Driver: ${db.sqlalchemy_uri?.split('://')[0] || 'N/A'}\n` +
            `  Allows async: ${db.allow_run_async ? 'Yes' : 'No'}\n`
          ).join('\n');
        
        return {
          contents: [
            {
              uri: request.params.uri,
              mimeType: "text/plain", 
              text: content,
            },
          ],
        };
      }
      
      case "superset://dataset-metrics": {
        const datasetsResult = await client.datasets.getDatasets(0, 100);
        let allMetrics: Array<{datasetId: number, datasetName: string, metrics: DatasetMetric[]}> = [];
        
        // Get metrics for all datasets
        for (const dataset of datasetsResult.result) {
          try {
            const metrics = await client.metrics.getDatasetMetrics(dataset.id);
            if (metrics.length > 0) {
              allMetrics.push({
                datasetId: dataset.id,
                datasetName: dataset.table_name,
                metrics: metrics
              });
            }
          } catch (error) {
            // Ignore errors for individual datasets, continue processing others
            console.error(`Failed to get metrics for dataset ${dataset.id}:`, error);
          }
        }
        
        const totalMetrics = allMetrics.reduce((sum, item) => sum + item.metrics.length, 0);
        
        const content = `Dataset Metrics Overview\n` +
          `====================\n\n` +
          `Total metrics: ${totalMetrics}\n` +
          `Datasets with metrics: ${allMetrics.length}\n\n` +
          allMetrics.map(item => 
            `Dataset: ${item.datasetName} (ID: ${item.datasetId})\n` +
            `Metrics count: ${item.metrics.length}\n` +
            item.metrics.map(metric => 
              `  • ${metric.metric_name} (ID: ${metric.id})\n` +
              `    Expression: ${metric.expression}\n` +
              `    Type: ${metric.metric_type || 'N/A'}\n` +
              `    Description: ${metric.description || 'N/A'}\n`
            ).join('') +
            `\n`
          ).join('');
        
        return {
          contents: [
            {
              uri: request.params.uri,
              mimeType: "text/plain",
              text: content,
            },
          ],
        };
      }
      
      default:
        throw new Error(`Unknown resource: ${request.params.uri}`);
    }
  } catch (error) {
    throw new Error(`Failed to read resource: ${getErrorMessage(error)}`);
  }
} 