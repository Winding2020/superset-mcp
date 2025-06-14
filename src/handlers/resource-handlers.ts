import { ReadResourceRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { initializeSupersetClient } from "../client/index.js";
import { getErrorMessage } from "../utils/error.js";
import { DatasetMetric } from "../types/index.js";

export async function handleResourceRead(request: any) {
  const client = initializeSupersetClient();
  
  try {
    switch (request.params.uri) {
      case "superset://datasets": {
        const result = await client.getDatasets(0, 50);
        const content = `Superset Datasets概览\n` +
          `========================\n\n` +
          `总数: ${result.count}\n\n` +
          result.result.map(dataset => 
            `• ${dataset.table_name} (ID: ${dataset.id})\n` +
            `  数据库ID: ${dataset.database_id}\n` +
            `  Schema: ${dataset.schema || 'N/A'}\n` +
            `  描述: ${dataset.description || 'N/A'}\n`
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
        const databases = await client.getDatabases();
        const content = `Superset数据库连接\n` +
          `===================\n\n` +
          `总数: ${databases.length}\n\n` +
          databases.map(db => 
            `• ${db.database_name} (ID: ${db.id})\n` +
            `  驱动: ${db.sqlalchemy_uri?.split('://')[0] || 'N/A'}\n` +
            `  是否可连接: ${db.allow_run_async ? '是' : '否'}\n`
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
        const datasetsResult = await client.getDatasets(0, 100);
        let allMetrics: Array<{datasetId: number, datasetName: string, metrics: DatasetMetric[]}> = [];
        
        // 获取所有datasets的metrics
        for (const dataset of datasetsResult.result) {
          try {
            const metrics = await client.getDatasetMetrics(dataset.id);
            if (metrics.length > 0) {
              allMetrics.push({
                datasetId: dataset.id,
                datasetName: dataset.table_name,
                metrics: metrics
              });
            }
          } catch (error) {
            // 忽略单个dataset的错误，继续处理其他datasets
            console.error(`获取dataset ${dataset.id} metrics失败:`, error);
          }
        }
        
        const totalMetrics = allMetrics.reduce((sum, item) => sum + item.metrics.length, 0);
        
        const content = `Dataset Metrics概览\n` +
          `====================\n\n` +
          `总metrics数: ${totalMetrics}\n` +
          `包含metrics的datasets数: ${allMetrics.length}\n\n` +
          allMetrics.map(item => 
            `Dataset: ${item.datasetName} (ID: ${item.datasetId})\n` +
            `Metrics数量: ${item.metrics.length}\n` +
            item.metrics.map(metric => 
              `  • ${metric.metric_name} (ID: ${metric.id})\n` +
              `    表达式: ${metric.expression}\n` +
              `    类型: ${metric.metric_type || 'N/A'}\n` +
              `    描述: ${metric.description || 'N/A'}\n`
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
        throw new Error(`未知资源: ${request.params.uri}`);
    }
  } catch (error) {
    throw new Error(`读取资源失败: ${getErrorMessage(error)}`);
  }
} 