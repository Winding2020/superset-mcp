import { initializeSupersetClient } from "../client/index.js";
import { getErrorMessage } from "../utils/error.js";

// Database tool definitions
export const databaseToolDefinitions = [
  {
    name: "list_databases",
    description: "Get all databases configured in Superset",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "execute_sql",
    description: "Execute SQL query using /api/v1/sqllab/execute/ endpoint",
    inputSchema: {
      type: "object",
      properties: {
        database_id: {
          type: "number",
          description: "Database ID",
        },
        sql: {
          type: "string",
          description: "SQL query statement to execute",
        },
        schema: {
          type: "string",
          description: "Database schema (optional)",
        },
        limit: {
          type: "number",
          description: "Query result row limit (default 1000)",
          default: 1000,
        },
        expand_data: {
          type: "boolean",
          description: "Whether to expand data (default true)",
          default: true,
        },
        display_rows: {
          type: "number",
          description: "Number of data rows to display (default 50)",
          default: 50,
        },
      },
      required: ["database_id", "sql"],
    },
  },
];

// Database tool handlers
export async function handleDatabaseTool(toolName: string, args: any) {
  const client = initializeSupersetClient();
  
  try {
    switch (toolName) {
      case "list_databases": {
        const databases = await client.sql.getDatabases();
        
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
      
      case "execute_sql": {
        const { database_id, sql, schema, limit, expand_data, display_rows = 50 } = args;
        const sqlRequest = {
          database_id,
          sql,
          schema,
          limit,
          expand_data,
        };
        
        const result = await client.sql.executeSql(sqlRequest);
        
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
        throw new Error(`Unknown database tool: ${toolName}`);
    }
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error(`Database tool ${toolName} failed:`, errorMessage);
    
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