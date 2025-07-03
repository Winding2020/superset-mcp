import { initializeSupersetClient } from "../client/index.js";
import { getErrorMessage } from "../utils/error.js";

// Column tool definitions
export const columnToolDefinitions = [
  {
    name: "get_dataset_columns",
    description: "Get column information of a dataset, useful for referencing available fields when creating metrics",
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
    name: "create_calculated_column",
    description: "Create one or more new calculated columns for a dataset",
    inputSchema: {
      type: "object",
      properties: {
        dataset_id: {
          type: "number",
          description: "Dataset ID",
        },
        columns: {
          type: "array",
          description: "Array of calculated columns to create. For a single column, this array will contain one object.",
          items: {
            type: "object",
            properties: {
              column_name: { type: "string", description: "Column name" },
              expression: { type: "string", description: "SQL expression" },
              type: { type: "string", description: "Data type (optional)" },
              description: { type: "string", description: "Description (optional)" },
              verbose_name: { type: "string", description: "Display name (optional)" },
            },
            required: ["column_name", "expression"],
          },
        },
      },
      required: ["dataset_id", "columns"],
    },
  },
  {
    name: "update_calculated_column",
    description: "Update one or more existing calculated columns in a dataset",
    inputSchema: {
      type: "object",
      properties: {
        dataset_id: { type: "number", description: "Dataset ID" },
        updates: {
          type: "array",
          description: "Array of column updates. For a single column, this array will contain one object.",
          items: {
            type: "object",
            properties: {
              column_id: { type: "number", description: "ID of the column to update" },
              column_name: { type: "string", description: "New column name (optional)" },
              expression: { type: "string", description: "New SQL expression (optional)" },
              description: { type: "string", description: "New description (optional)" },
              verbose_name: { type: "string", description: "New display name (optional)" },
            },
            required: ["column_id"],
          },
        },
      },
      required: ["dataset_id", "updates"],
    },
  },
  {
    name: "delete_calculated_column",
    description: "Delete one or more calculated columns from a dataset",
    inputSchema: {
      type: "object",
      properties: {
        dataset_id: { type: "number", description: "Dataset ID" },
        column_ids: {
          type: "array",
          description: "Array of column IDs to delete. For a single column, this array will contain one ID.",
          items: { type: "number" },
        },
      },
      required: ["dataset_id", "column_ids"],
    },
  },
];

// Column tool handlers
export async function handleColumnTool(toolName: string, args: any) {
  const client = initializeSupersetClient();
  
  try {
    switch (toolName) {
      case "get_dataset_columns": {
        const { dataset_id } = args;
        const columns = await client.columns.getDatasetColumns(dataset_id);
        
        // Separate physical and calculated columns
        const physicalColumns = columns.filter(col => !col.expression);
        const calculatedColumns = columns.filter(col => col.expression);
        
        let responseText = `Dataset ${dataset_id} column information:\n\n`;
        
        if (physicalColumns.length > 0) {
          responseText += `Physical Columns (${physicalColumns.length}):\n`;
          responseText += physicalColumns.map(col => 
            `- ${col.column_name} (ID: ${col.id}) - Type: ${col.type || 'N/A'}\n` +
            `  Description: ${col.description || 'N/A'}\n` +
            `  Is DateTime: ${col.is_dttm ? 'Yes' : 'No'}\n` +
            `  Display Name: ${col.verbose_name || 'N/A'}\n` +
            `  Filterable: ${col.filterable ? 'Yes' : 'No'}\n` +
            `  Groupable: ${col.groupby ? 'Yes' : 'No'}\n` +
            `  Active: ${col.is_active ? 'Yes' : 'No'}\n`
          ).join('\n') + '\n';
        }
        
        if (calculatedColumns.length > 0) {
          responseText += `Calculated Columns (${calculatedColumns.length}):\n`;
          responseText += calculatedColumns.map(col => 
            `- ${col.column_name} (ID: ${col.id}) - Type: ${col.type || 'N/A'}\n` +
            `  Expression: ${col.expression}\n` +
            `  Description: ${col.description || 'N/A'}\n` +
            `  Is DateTime: ${col.is_dttm ? 'Yes' : 'No'}\n` +
            `  Display Name: ${col.verbose_name || 'N/A'}\n` +
            `  Filterable: ${col.filterable ? 'Yes' : 'No'}\n` +
            `  Groupable: ${col.groupby ? 'Yes' : 'No'}\n` +
            `  Active: ${col.is_active ? 'Yes' : 'No'}\n`
          ).join('\n');
        } else {
          responseText += `Calculated Columns: None\n`;
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

      case "create_calculated_column": {
        const { dataset_id, columns } = args;
        await client.columns.createCalculatedColumns(dataset_id, columns);
        const allColumns = await client.columns.getDatasetColumns(dataset_id);
        const calculatedColumns = allColumns.filter(c => c.expression);
        
        return {
          content: [
            {
              type: "text",
              text: `Calculated columns created for dataset ${dataset_id}. The complete list of calculated columns is now:\n\n` +
                calculatedColumns.map((col: any) =>
                  `ID: ${col.id}\n` +
                  `Name: ${col.column_name}\n` +
                  `Expression: ${col.expression}\n` +
                  `Type: ${col.type || 'N/A'}`
                ).join('\n---\n')
            },
          ],
        };
      }

      case "update_calculated_column": {
        const { dataset_id, updates } = args;
        const batchUpdates = updates.map((update: any) => ({
          columnId: update.column_id,
          column: {
            column_name: update.column_name,
            expression: update.expression,
            description: update.description,
            verbose_name: update.verbose_name,
          }
        }));
        const updatedColumns = await client.columns.updateCalculatedColumns(dataset_id, batchUpdates);
        
        return {
          content: [
            {
              type: "text",
              text: `Dataset ${dataset_id} calculated columns updated successfully!\n\n` +
                `Updated ${updatedColumns.length} column(s):\n` +
                updatedColumns.map((col: any) =>
                  `- ${col.column_name} (ID: ${col.id})\n` +
                  `  Expression: ${col.expression}\n` +
                  `  Description: ${col.description || 'N/A'}`
                ).join('\n')
            },
          ],
        };
      }

      case "delete_calculated_column": {
        const { dataset_id, column_ids } = args;
        await client.columns.deleteCalculatedColumns(dataset_id, column_ids);
        
        return {
          content: [
            {
              type: "text",
              text: `Dataset ${dataset_id} calculated columns deleted successfully!\n\n` +
                `Deleted ${column_ids.length} column(s) with IDs: ${column_ids.join(', ')}`
            },
          ],
        };
      }
      
      default:
        throw new Error(`Unknown column tool: ${toolName}`);
    }
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error(`Column tool ${toolName} failed:`, errorMessage);
    
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