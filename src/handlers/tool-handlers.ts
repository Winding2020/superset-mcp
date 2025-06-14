import { CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { initializeSupersetClient } from "../client/index.js";
import { getErrorMessage } from "../utils/error.js";
import { DatasetMetric } from "../types/index.js";

export async function handleToolCall(request: any) {
  const client = initializeSupersetClient();
  
  try {
    switch (request.params.name) {
      case "list_datasets": {
        const { page = 0, pageSize = 20 } = request.params.arguments as any;
        const result = await client.getDatasets(page, pageSize);
        
        return {
          content: [
            {
              type: "text",
              text: `找到 ${result.count} 个datasets（显示第 ${page + 1} 页）:\n\n` +
                result.result.map(dataset => 
                  `ID: ${dataset.id}\n` +
                  `名称: ${dataset.table_name}\n` +
                  `数据库ID: ${dataset.database_id}\n` +
                  `Schema: ${dataset.schema || 'N/A'}\n` +
                  `描述: ${dataset.description || 'N/A'}\n` +
                  `---`
                ).join('\n')
            },
          ],
        };
      }
      
      case "get_dataset": {
        const { id } = request.params.arguments as any;
        const dataset = await client.getDataset(id);
        
        return {
          content: [
            {
              type: "text",
              text: `Dataset详细信息:\n\n` +
                `ID: ${dataset.id}\n` +
                `表名: ${dataset.table_name}\n` +
                `数据库ID: ${dataset.database_id}\n` +
                `Schema: ${dataset.schema || 'N/A'}\n` +
                `描述: ${dataset.description || 'N/A'}\n` +
                `SQL: ${dataset.sql || 'N/A'}\n` +
                `缓存超时: ${dataset.cache_timeout || 'N/A'}\n` +
                `列数量: ${dataset.columns?.length || 0}\n` +
                `指标数量: ${dataset.metrics?.length || 0}`
            },
          ],
        };
      }
      
      case "create_dataset": {
        const datasetData = request.params.arguments as any;
        const newDataset = await client.createDataset(datasetData);
        
        return {
          content: [
            {
              type: "text",
              text: `Dataset创建成功！\n\n` +
                `ID: ${newDataset.id}\n` +
                `表名: ${newDataset.table_name}\n` +
                `数据库ID: ${newDataset.database_id}\n` +
                `Schema: ${newDataset.schema || 'N/A'}`
            },
          ],
        };
      }
      
      case "update_dataset": {
        const { id, ...updateData } = request.params.arguments as any;
        const updatedDataset = await client.updateDataset(id, updateData);
        
        return {
          content: [
            {
              type: "text",
              text: `Dataset ${id} 更新成功！\n\n` +
                `表名: ${updatedDataset.table_name}\n` +
                `描述: ${updatedDataset.description || 'N/A'}\n` +
                `缓存超时: ${updatedDataset.cache_timeout || 'N/A'}`
            },
          ],
        };
      }
      
      case "delete_dataset": {
        const { id } = request.params.arguments as any;
        await client.deleteDataset(id);
        
        return {
          content: [
            {
              type: "text",
              text: `Dataset ${id} 删除成功！`
            },
          ],
        };
      }
      
      case "refresh_dataset_schema": {
        const { id } = request.params.arguments as any;
        const result = await client.refreshDatasetSchema(id);
        
        return {
          content: [
            {
              type: "text",
              text: `Dataset ${id} schema刷新成功！\n\n刷新结果: ${JSON.stringify(result, null, 2)}`
            },
          ],
        };
      }
      
      case "list_databases": {
        const databases = await client.getDatabases();
        
        return {
          content: [
            {
              type: "text",
              text: `找到 ${databases.length} 个数据库:\n\n` +
                databases.map(db => 
                  `ID: ${db.id}\n` +
                  `名称: ${db.database_name}\n` +
                  `驱动: ${db.sqlalchemy_uri?.split('://')[0] || 'N/A'}\n` +
                  `---`
                ).join('\n')
            },
          ],
        };
      }
      
      case "get_dataset_metrics": {
        const { dataset_id } = request.params.arguments as any;
        const metrics = await client.getDatasetMetrics(dataset_id);
        
        return {
          content: [
            {
              type: "text",
              text: `Dataset ${dataset_id} metrics:\n\n` +
                metrics.map(metric => 
                  `ID: ${metric.id}\n` +
                  `名称: ${metric.metric_name}\n` +
                  `类型: ${metric.metric_type || 'N/A'}\n` +
                  `表达式: ${metric.expression}\n` +
                  `描述: ${metric.description || 'N/A'}\n` +
                  `---`
                ).join('\n')
            },
          ],
        };
      }
      
      case "create_dataset_metric": {
        const { dataset_id, metric_name, expression, metric_type, description, verbose_name, d3format } = request.params.arguments as any;
        const metric = { metric_name, expression, metric_type, description, verbose_name, d3format };
        const newMetric = await client.createDatasetMetric(dataset_id, metric);
        
        return {
          content: [
            {
              type: "text",
              text: `Dataset ${dataset_id} metric创建成功！\n\n` +
                `ID: ${newMetric.id}\n` +
                `名称: ${newMetric.metric_name}\n` +
                `类型: ${newMetric.metric_type || 'N/A'}\n` +
                `表达式: ${newMetric.expression}\n` +
                `描述: ${newMetric.description || 'N/A'}\n` +
                `显示名称: ${newMetric.verbose_name || 'N/A'}\n` +
                `D3格式化字符串: ${newMetric.d3format || 'N/A'}`
            },
          ],
        };
      }
      
      case "update_dataset_metric": {
        const { dataset_id, metric_id, metric_name, expression, description, verbose_name, d3format } = request.params.arguments as any;
        const metric = { metric_name, expression, description, verbose_name, d3format };
        const updatedMetric = await client.updateDatasetMetric(dataset_id, metric_id, metric);
        
        return {
          content: [
            {
              type: "text",
              text: `Dataset ${dataset_id} metric ${metric_id} 更新成功！\n\n` +
                `名称: ${updatedMetric.metric_name}\n` +
                `类型: ${updatedMetric.metric_type || 'N/A'}\n` +
                `表达式: ${updatedMetric.expression}\n` +
                `描述: ${updatedMetric.description || 'N/A'}\n` +
                `显示名称: ${updatedMetric.verbose_name || 'N/A'}\n` +
                `D3格式化字符串: ${updatedMetric.d3format || 'N/A'}`
            },
          ],
        };
      }
      
      case "delete_dataset_metric": {
        const { dataset_id, metric_id } = request.params.arguments as any;
        await client.deleteDatasetMetric(dataset_id, metric_id);
        
        return {
          content: [
            {
              type: "text",
              text: `Dataset ${dataset_id} metric ${metric_id} 删除成功！`
            },
          ],
        };
      }
      
      case "get_dataset_columns": {
        const { dataset_id } = request.params.arguments as any;
        const columns = await client.getDatasetColumns(dataset_id);
        
        return {
          content: [
            {
              type: "text",
              text: `Dataset ${dataset_id} 字段信息:\n\n` +
                columns.map(col => 
                  `• ${col.column_name} (类型: ${col.type})\n` +
                  `  描述: ${col.description || 'N/A'}\n` +
                  `  is_dttm: ${col.is_dttm ? '是' : '否'}\n` +
                  `  表达式: ${col.expression || 'N/A'}\n` +
                  `  显示名称: ${col.verbose_name || 'N/A'}\n`
                ).join('\n')
            },
          ],
        };
      }
      
      default:
        throw new Error(`未知工具: ${request.params.name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `错误: ${getErrorMessage(error)}`,
        },
      ],
      isError: true,
    };
  }
} 