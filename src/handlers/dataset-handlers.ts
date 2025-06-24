import { initializeSupersetClient } from "../client/index.js";
import { getErrorMessage } from "../utils/error.js";

// Dataset tool definitions
export const datasetToolDefinitions = [
  {
    name: "list_datasets",
    description: "Get list of all datasets in Superset. Uses Rison or JSON query parameters for filtering, sorting, pagination and for selecting specific columns and metadata. Query format: filters=[{col: 'column_name', opr: 'operator', value: 'filter_value'}], order_column='column_name', order_direction='asc|desc', page=0, page_size=20, select_columns=['column1', 'column2']",
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
          description: "Column to sort by (e.g., 'changed_on_utc', 'changed_on_delta_humanized', 'table_name', 'schema', 'id')",
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
    name: "get_dataset",
    description: "Get detailed information of a specific dataset by ID",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "number",
          description: "Dataset ID",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "create_dataset",
    description: "Create a new dataset",
    inputSchema: {
      type: "object",
      properties: {
        database_id: {
          type: "number",
          description: "Database ID",
        },
        table_name: {
          type: "string",
          description: "Table name",
        },
        schema: {
          type: "string",
          description: "Database schema (optional)",
        },
        description: {
          type: "string",
          description: "Dataset description (optional)",
        },
        sql: {
          type: "string", 
          description: "Custom SQL query (optional)",
        },
      },
      required: ["database_id", "table_name"],
    },
  },
  {
    name: "update_dataset",
    description: "Update an existing dataset",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "number",
          description: "Dataset ID",
        },
        table_name: {
          type: "string",
          description: "Table name (optional)",
        },
        description: {
          type: "string",
          description: "Dataset description (optional)",
        },
        sql: {
          type: "string",
          description: "Custom SQL query (optional)",
        },
        cache_timeout: {
          type: "number",
          description: "Cache timeout in seconds (optional)",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_dataset",
    description: "Delete a dataset",
    inputSchema: {
      type: "object", 
      properties: {
        id: {
          type: "number",
          description: "ID of the dataset to delete",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "refresh_dataset_schema",
    description: "Refresh dataset schema information",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "number",
          description: "Dataset ID",
        },
      },
      required: ["id"],
    },
  },
];

// Dataset tool handlers
export async function handleDatasetTool(toolName: string, args: any) {
  const client = initializeSupersetClient();
  
  try {
    switch (toolName) {
      case "list_datasets": {
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
        
        const result = await client.datasets.getDatasets(query);
        
        return {
          content: [
            {
              type: "text",
              text: `Found ${result.count} datasets (showing page ${page + 1}):\n\n` +
                result.result.map(dataset => 
                  `ID: ${dataset.id}\n` +
                  `Name: ${dataset.table_name}\n` +
                  `Database ID: ${(dataset as any).database?.id || 'N/A'}\n` +
                  `Database Name: ${(dataset as any).database?.database_name || 'N/A'}\n` +
                  `Schema: ${dataset.schema || 'N/A'}\n` +
                  `Description: ${dataset.description || 'N/A'}\n` +
                  `---`
                ).join('\n')
            },
          ],
        };
      }
      
      case "get_dataset": {
        const { id } = args;
        const dataset = await client.datasets.getDataset(id);
        
        return {
          content: [
            {
              type: "text",
              text: `Dataset Details:\n\n` +
                `ID: ${dataset.id}\n` +
                `Table Name: ${dataset.table_name}\n` +
                `Database ID: ${(dataset as any).database?.id || 'N/A'}\n` +
                `Database Name: ${(dataset as any).database?.database_name || 'N/A'}\n` +
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
        const datasetData = args;
        const newDataset = await client.datasets.createDataset(datasetData);
        
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
        const { id, ...updateData } = args;
        const updatedDataset = await client.datasets.updateDataset(id, updateData);
        
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
        const { id } = args;
        await client.datasets.deleteDataset(id);
        
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
        const { id } = args;
        const result = await client.datasets.refreshDatasetSchema(id);
        
        return {
          content: [
            {
              type: "text",
              text: `Dataset ${id} schema refreshed successfully!\n\nRefresh result: ${JSON.stringify(result, null, 2)}`
            },
          ],
        };
      }
      
      default:
        throw new Error(`Unknown dataset tool: ${toolName}`);
    }
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error(`Dataset tool ${toolName} failed:`, errorMessage);
    
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