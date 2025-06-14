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
              text: `Found ${result.count} datasets (showing page ${page + 1}):\n\n` +
                result.result.map(dataset => 
                  `ID: ${dataset.id}\n` +
                  `Name: ${dataset.table_name}\n` +
                  `Database ID: ${dataset.database_id}\n` +
                  `Schema: ${dataset.schema || 'N/A'}\n` +
                  `Description: ${dataset.description || 'N/A'}\n` +
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
              text: `Dataset Details:\n\n` +
                `ID: ${dataset.id}\n` +
                `Table Name: ${dataset.table_name}\n` +
                `Database ID: ${dataset.database_id}\n` +
                `Schema: ${dataset.schema || 'N/A'}\n` +
                `Description: ${dataset.description || 'N/A'}\n` +
                `SQL: ${dataset.sql || 'N/A'}\n` +
                `Cache Timeout: ${dataset.cache_timeout || 'N/A'}\n` +
                `Column Count: ${dataset.columns?.length || 0}\n` +
                `Metric Count: ${dataset.metrics?.length || 0}`
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
              text: `Dataset created successfully!\n\n` +
                `ID: ${newDataset.id}\n` +
                `Table Name: ${newDataset.table_name}\n` +
                `Database ID: ${newDataset.database_id}\n` +
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
              text: `Dataset ${id} updated successfully!\n\n` +
                `Table Name: ${updatedDataset.table_name}\n` +
                `Description: ${updatedDataset.description || 'N/A'}\n` +
                `Cache Timeout: ${updatedDataset.cache_timeout || 'N/A'}`
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
              text: `Dataset ${id} deleted successfully!`
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
              text: `Dataset ${id} schema refreshed successfully!\n\nRefresh result: ${JSON.stringify(result, null, 2)}`
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
              text: `Found ${databases.length} databases:\n\n` +
                databases.map(db => 
                  `ID: ${db.id}\n` +
                  `Name: ${db.database_name}\n` +
                  `Driver: ${db.sqlalchemy_uri?.split('://')[0] || 'N/A'}\n` +
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
        const { dataset_id, metric_name, expression, metric_type, description, verbose_name, d3format } = request.params.arguments as any;
        const metric = { metric_name, expression, metric_type, description, verbose_name, d3format };
        const newMetric = await client.createDatasetMetric(dataset_id, metric);
        
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
        const { dataset_id, metric_id, metric_name, expression, description, verbose_name, d3format } = request.params.arguments as any;
        const metric = { metric_name, expression, description, verbose_name, d3format };
        const updatedMetric = await client.updateDatasetMetric(dataset_id, metric_id, metric);
        
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
        const { dataset_id, metric_id } = request.params.arguments as any;
        await client.deleteDatasetMetric(dataset_id, metric_id);
        
        return {
          content: [
            {
              type: "text",
              text: `Dataset ${dataset_id} metric ${metric_id} deleted successfully!`
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
              text: `Dataset ${dataset_id} column information:\n\n` +
                columns.map(col => 
                  `• ${col.column_name} (Type: ${col.type})\n` +
                  `  Description: ${col.description || 'N/A'}\n` +
                  `  is_dttm: ${col.is_dttm ? 'Yes' : 'No'}\n` +
                  `  Expression: ${col.expression || 'N/A'}\n` +
                  `  Display Name: ${col.verbose_name || 'N/A'}\n`
                ).join('\n')
            },
          ],
        };
      }
      
      case "execute_sql": {
        const { database_id, sql, schema, limit, expand_data, display_rows = 10 } = request.params.arguments as any;
        const sqlRequest = {
          database_id,
          sql,
          schema,
          limit,
          expand_data,
        };
        
        const result = await client.executeSql(sqlRequest);
        
        // Format response
        let responseText = `SQL execution result:\n\n`;
        responseText += `Status: ${result.status}\n`;
        
        if (result.query_id) {
          responseText += `Query ID: ${result.query_id}\n`;
        }
        
        if (result.query) {
          responseText += `Schema: ${result.query.schema || 'N/A'}\n`;
          responseText += `Rows returned: ${result.query.rows}\n`;
          responseText += `Execution status: ${result.query.state}\n`;
          
          if (result.query.errorMessage) {
            responseText += `Error message: ${result.query.errorMessage}\n`;
          }
        }
        
        if (result.columns && result.columns.length > 0) {
          responseText += `\nColumn information:\n`;
          result.columns.forEach(col => {
            responseText += `• ${col.name} (${col.type})\n`;
          });
        }
        
        if (result.data && result.data.length > 0) {
          const displayRowCount = Math.max(1, Math.min(display_rows, result.data.length));
          responseText += `\nData preview (first ${displayRowCount} rows):\n`;
          const previewData = result.data.slice(0, displayRowCount);
          
          // Create table format output
          if (result.columns && result.columns.length > 0) {
            // Headers
            const headers = result.columns.map(col => col.name);
            responseText += headers.join(' | ') + '\n';
            responseText += headers.map(() => '---').join(' | ') + '\n';
            
            // Data rows
            previewData.forEach(row => {
              const values = headers.map(header => {
                const value = row[header];
                return value !== null && value !== undefined ? String(value) : 'NULL';
              });
              responseText += values.join(' | ') + '\n';
            });
          } else {
            // If no column information, display JSON directly
            responseText += JSON.stringify(previewData, null, 2);
          }
          
          if (result.data.length > displayRowCount) {
            responseText += `\n... ${result.data.length - displayRowCount} more rows\n`;
          }
        }
        
        if (result.error) {
          responseText += `\nError: ${result.error}\n`;
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
        throw new Error(`Unknown tool: ${request.params.name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${getErrorMessage(error)}`,
        },
      ],
      isError: true,
    };
  }
} 