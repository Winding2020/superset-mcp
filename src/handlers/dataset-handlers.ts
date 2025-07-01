import { initializeSupersetClient } from "../client/index.js";
import { getErrorMessage, formatSqlError } from "../utils/error.js";
import { AxiosError } from "axios";

// Dataset tool definitions
export const datasetToolDefinitions = [
  {
    name: "list_datasets",
    description: "Retrieves a list of all datasets in Superset. Supports powerful filtering, sorting, and pagination. You can specify which columns to return, making it efficient for fetching just the needed information. For example, to find datasets with 'sales' in their name, you can use filters=[{col: 'table_name', opr: 'like', value: '%sales%'}]",
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
    description: "Fetches detailed information for a single dataset by its ID. For virtual datasets, this tool returns the raw SQL query.",
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
    description: "Creates a new dataset in Superset. You can create a physical dataset by linking to a table in a database, or a virtual dataset by providing a custom SQL query. For a physical dataset, provide `database_id` and `table_name`. For a virtual dataset, provide `database_id`, a `table_name` (as an alias), and a `sql` query.",
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
    description: "Updates an existing dataset's properties. You can change its name, description, or underlying SQL query. This is also the tool to adjust settings like cache timeout. Note: To add, remove, or update individual columns in a virtual dataset's SQL, prefer using the more specific tools: `add_dataset_column`, `update_dataset_column`, or `remove_dataset_column`.",
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
    description: "Deletes a dataset from Superset. This is a permanent operation and cannot be undone. Be cautious, as deleting a dataset will also break any charts and dashboards that depend on it.",
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
    description: "Refreshes a dataset's schema by syncing it with the latest information from the source database table. This is useful when the underlying table structure has changed (e.g., columns were added or removed) to ensure Superset has the most up-to-date column information.",
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
    name: "find_and_replace_in_sql",
    description: "Performs a simple text find-and-replace on a virtual dataset's SQL query. This is a powerful but direct tool; be sure to provide the exact text to find and its replacement to maintain valid SQL.",
    inputSchema: {
      type: "object",
      properties: {
        dataset_id: {
          type: "number",
          description: "ID of the dataset to modify.",
        },
        find_string: {
          type: "string",
          description: "The exact string to find within the SQL. This is a simple text search, not a regex.",
        },
        replace_string: {
          type: "string",
          description: "The string to replace all occurrences of the found text with.",
        },
      },
      required: ["dataset_id", "find_string", "replace_string"],
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
        const client = initializeSupersetClient();
        const dataset = await client.datasets.getDataset(id);
        
        const baseDetails = `Dataset Details:\n\n` +
          `ID: ${dataset.id}\n` +
          `Table Name: ${dataset.table_name}\n` +
          `Database ID: ${(dataset as any).database?.id || 'N/A'}\n` +
          `Database Name: ${(dataset as any).database?.database_name || 'N/A'}\n` +
          `Schema: ${dataset.schema || 'N/A'}\n` +
          `Description: ${dataset.description || 'N/A'}`;

        let sqlDetails = `SQL: ${dataset.sql || 'N/A'}`;

        const otherDetails = `\nCache Timeout: ${dataset.cache_timeout || 'N/A'}\n` +
          `Column Count: ${dataset.columns?.length || 0}\n` +
          `Metric Count: ${dataset.metrics?.length || 0}`;

        return {
          content: [
            {
              type: "text",
              text: `${baseDetails}\n${sqlDetails}${otherDetails}`
            },
          ],
        };
      }
      
      case "create_dataset": {
        const datasetData = args;
        try {
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
        } catch (error) {
          if (
            error instanceof AxiosError &&
            error.response?.status === 500 &&
            datasetData.sql
          ) {
            // Likely an invalid SQL error. Try executing the SQL to get a better message.
            try {
              // Let's wrap the query to limit it and reduce cost.
              let validationSql = datasetData.sql.trim();
              if (validationSql.endsWith(';')) {
                validationSql = validationSql.slice(0, -1);
              }
              // We wrap the user's query to apply a limit safely.
              validationSql = `SELECT * FROM (${validationSql}) AS _superset_tools_validation LIMIT 1`;

              await client.sql.executeSql({
                database_id: datasetData.database_id,
                sql: validationSql,
              });
              // If it somehow succeeds, the original error was something else.
              throw error; 
            } catch (sqlError) {
              // This is the expected path. The SQL execution failed.
              // We report the error with the *original* SQL.
              const detailedError = getErrorMessage(sqlError);
              
              // Check if the error is already a formatted SQL error message
              // to avoid double formatting.
              if (detailedError.includes("SQL Execution Error")) {
                throw new Error(detailedError);
              }

              const formattedError = formatSqlError(sqlError, datasetData.sql, datasetData.database_id);
              const finalMessage = `${formattedError}`;
              // Throw a new error that will be caught by the outer catch block
              throw new Error(finalMessage);
            }
          }
          // For other errors, re-throw to be caught by the main handler.
          throw error;
        }
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
      
      case "find_and_replace_in_sql": {
        const { dataset_id, find_string, replace_string } = args;
        const client = initializeSupersetClient();
        const dataset = await client.datasets.getDataset(dataset_id);
        if (!dataset.sql) {
            throw new Error(`Dataset ${dataset_id} does not have a virtual SQL query to modify.`);
        }
        
        // Using split/join for a safe, global replacement without dealing with regex escaping.
        const newSql = dataset.sql.split(find_string).join(replace_string);
        
        await client.datasets.updateDataset(dataset_id, { sql: newSql });

        return {
            content: [{ type: "text", text: `Successfully performed find/replace in dataset ${dataset_id}. New SQL is:\n${newSql}` }],
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