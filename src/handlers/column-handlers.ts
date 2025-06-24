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
    description: "Create a new calculated column for a dataset",
    inputSchema: {
      type: "object",
      properties: {
        dataset_id: {
          type: "number",
          description: "Dataset ID",
        },
        column_name: {
          type: "string",
          description: "Column name",
        },
        expression: {
          type: "string",
          description: "SQL expression for the calculated column",
        },
        type: {
          type: "string",
          description: "Data type (optional, e.g., 'VARCHAR', 'NUMERIC', 'TIMESTAMP')",
        },
        description: {
          type: "string",
          description: "Column description (optional)",
        },
        verbose_name: {
          type: "string",
          description: "Column display name (optional)",
        },
        filterable: {
          type: "boolean",
          description: "Whether the column can be used for filtering (optional, default: true)",
        },
        groupby: {
          type: "boolean",
          description: "Whether the column can be used for grouping (optional, default: true)",
        },
        is_dttm: {
          type: "boolean",
          description: "Whether this is a datetime column (optional, default: false)",
        },
        is_active: {
          type: "boolean",
          description: "Whether the column is active (optional, default: true)",
        },
        extra: {
          type: "string",
          description: "Extra configuration in JSON format (optional)",
        },
        advanced_data_type: {
          type: "string",
          description: "Advanced data type (optional)",
        },
        python_date_format: {
          type: "string",
          description: "Python date format for datetime columns (optional)",
        },
      },
      required: ["dataset_id", "column_name", "expression"],
    },
  },
  {
    name: "update_calculated_column",
    description: "Update an existing calculated column in a dataset",
    inputSchema: {
      type: "object",
      properties: {
        dataset_id: {
          type: "number",
          description: "Dataset ID",
        },
        column_id: {
          type: "number",
          description: "Column ID",
        },
        column_name: {
          type: "string",
          description: "Column name (optional)",
        },
        expression: {
          type: "string",
          description: "SQL expression for the calculated column (optional)",
        },
        type: {
          type: "string",
          description: "Data type (optional)",
        },
        description: {
          type: "string",
          description: "Column description (optional)",
        },
        verbose_name: {
          type: "string",
          description: "Column display name (optional)",
        },
        filterable: {
          type: "boolean",
          description: "Whether the column can be used for filtering (optional)",
        },
        groupby: {
          type: "boolean",
          description: "Whether the column can be used for grouping (optional)",
        },
        is_dttm: {
          type: "boolean",
          description: "Whether this is a datetime column (optional)",
        },
        is_active: {
          type: "boolean",
          description: "Whether the column is active (optional)",
        },
        extra: {
          type: "string",
          description: "Extra configuration in JSON format (optional)",
        },
        advanced_data_type: {
          type: "string",
          description: "Advanced data type (optional)",
        },
        python_date_format: {
          type: "string",
          description: "Python date format for datetime columns (optional)",
        },
      },
      required: ["dataset_id", "column_id"],
    },
  },
  {
    name: "delete_calculated_column",
    description: "Delete a calculated column from a dataset",
    inputSchema: {
      type: "object",
      properties: {
        dataset_id: {
          type: "number",
          description: "Dataset ID",
        },
        column_id: {
          type: "number",
          description: "ID of the column to delete",
        },
      },
      required: ["dataset_id", "column_id"],
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
        const { 
          dataset_id, 
          column_name, 
          expression, 
          type,
          description, 
          verbose_name, 
          filterable,
          groupby,
          is_dttm,
          is_active,
          extra,
          advanced_data_type,
          python_date_format
        } = args;
        
        const column = { 
          column_name, 
          expression, 
          type,
          description, 
          verbose_name, 
          filterable,
          groupby,
          is_dttm,
          is_active,
          extra,
          advanced_data_type,
          python_date_format
        };
        
        const newColumn = await client.columns.createCalculatedColumn(dataset_id, column);
        
        return {
          content: [
            {
              type: "text",
              text: `Dataset ${dataset_id} calculated column created successfully!\n\n` +
                `ID: ${newColumn.id}\n` +
                `Name: ${newColumn.column_name}\n` +
                `Expression: ${newColumn.expression}\n` +
                `Type: ${newColumn.type || 'N/A'}\n` +
                `Description: ${newColumn.description || 'N/A'}\n` +
                `Display Name: ${newColumn.verbose_name || 'N/A'}\n` +
                `Filterable: ${newColumn.filterable ? 'Yes' : 'No'}\n` +
                `Groupable: ${newColumn.groupby ? 'Yes' : 'No'}\n` +
                `Is DateTime: ${newColumn.is_dttm ? 'Yes' : 'No'}\n` +
                `Active: ${newColumn.is_active ? 'Yes' : 'No'}`
            },
          ],
        };
      }

      case "update_calculated_column": {
        const { 
          dataset_id, 
          column_id,
          column_name, 
          expression, 
          type,
          description, 
          verbose_name, 
          filterable,
          groupby,
          is_dttm,
          is_active,
          extra,
          advanced_data_type,
          python_date_format
        } = args;
        
        const column = { 
          column_name, 
          expression, 
          type,
          description, 
          verbose_name, 
          filterable,
          groupby,
          is_dttm,
          is_active,
          extra,
          advanced_data_type,
          python_date_format
        };
        
        const updatedColumn = await client.columns.updateCalculatedColumn(dataset_id, column_id, column);
        
        return {
          content: [
            {
              type: "text",
              text: `Dataset ${dataset_id} calculated column ${column_id} updated successfully!\n\n` +
                `Name: ${updatedColumn.column_name}\n` +
                `Expression: ${updatedColumn.expression || 'N/A'}\n` +
                `Type: ${updatedColumn.type || 'N/A'}\n` +
                `Description: ${updatedColumn.description || 'N/A'}\n` +
                `Display Name: ${updatedColumn.verbose_name || 'N/A'}\n` +
                `Filterable: ${updatedColumn.filterable ? 'Yes' : 'No'}\n` +
                `Groupable: ${updatedColumn.groupby ? 'Yes' : 'No'}\n` +
                `Is DateTime: ${updatedColumn.is_dttm ? 'Yes' : 'No'}\n` +
                `Active: ${updatedColumn.is_active ? 'Yes' : 'No'}`
            },
          ],
        };
      }

      case "delete_calculated_column": {
        const { dataset_id, column_id } = args;
        await client.columns.deleteCalculatedColumn(dataset_id, column_id);
        
        return {
          content: [
            {
              type: "text",
              text: `Dataset ${dataset_id} calculated column ${column_id} deleted successfully!`
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