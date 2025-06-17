import { BaseSuperset } from "./base-client.js";
import { DatasetClient } from "./dataset-client.js";
import { DatasetColumn, CalculatedColumn } from "../types/index.js";
import { getErrorMessage } from "../utils/error.js";

/**
 * Columns management client
 */
export class ColumnsClient extends BaseSuperset {
  private datasetClient: DatasetClient;

  constructor(config: any) {
    super(config);
    this.datasetClient = new DatasetClient(config);
  }

  // Get dataset column information (for reference when creating metrics)
  async getDatasetColumns(datasetId: number): Promise<DatasetColumn[]> {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.api.get(`/api/v1/dataset/${datasetId}`);
      const dataset = response.data.result;
      
      // Return column information, including physical columns and calculated columns
      const columns = dataset.columns || [];
      return columns.map((col: any) => ({
        id: col.id,
        column_name: col.column_name,
        type: col.type,
        description: col.description,
        is_dttm: col.is_dttm,
        expression: col.expression,
        verbose_name: col.verbose_name,
        filterable: col.filterable,
        groupby: col.groupby,
        is_active: col.is_active,
        extra: col.extra,
        advanced_data_type: col.advanced_data_type,
        python_date_format: col.python_date_format,
        uuid: col.uuid,
      }));
    } catch (error) {
      throw new Error(`Failed to get dataset ${datasetId} column information: ${getErrorMessage(error)}`);
    }
  }

  // Create calculated column
  async createCalculatedColumn(datasetId: number, column: CalculatedColumn): Promise<DatasetColumn> {
    try {
      // Get current dataset
      const dataset = await this.datasetClient.getDataset(datasetId);
      const currentColumns = dataset.columns || [];
      
      // Create new calculated column (without ID for creation)
      const newColumn = {
        column_name: column.column_name,
        expression: column.expression,
        type: column.type || 'UNKNOWN',
        description: column.description,
        verbose_name: column.verbose_name,
        filterable: column.filterable !== undefined ? column.filterable : true,
        groupby: column.groupby !== undefined ? column.groupby : true,
        is_dttm: column.is_dttm || false,
        is_active: column.is_active !== undefined ? column.is_active : true,
        extra: column.extra,
        advanced_data_type: column.advanced_data_type,
        python_date_format: column.python_date_format,
      };
      
      // Clean existing columns, remove fields not accepted by API
      const cleanedCurrentColumns = currentColumns.map((c: any) => ({
        id: c.id,
        column_name: c.column_name,
        expression: c.expression,
        type: c.type,
        description: c.description,
        verbose_name: c.verbose_name,
        filterable: c.filterable,
        groupby: c.groupby,
        is_dttm: c.is_dttm,
        is_active: c.is_active,
        extra: c.extra,
        advanced_data_type: c.advanced_data_type,
        python_date_format: c.python_date_format,
        uuid: c.uuid,
      }));
      
      // Add new column to columns array
      const newColumns = [...cleanedCurrentColumns, newColumn];
      
      // Update dataset
      const response = await this.makeProtectedRequest({
        method: 'PUT',
        url: `/api/v1/dataset/${datasetId}`,
        data: { columns: newColumns }
      });
      
      // Return newly created column (usually the last one in the array)
      const updatedColumns = response.data.result.columns || [];
      return updatedColumns[updatedColumns.length - 1];
    } catch (error) {
      throw new Error(`Failed to create calculated column for dataset ${datasetId}: ${getErrorMessage(error)}`);
    }
  }

  // Update calculated column
  async updateCalculatedColumn(datasetId: number, columnId: number, column: Partial<CalculatedColumn>): Promise<DatasetColumn> {
    try {
      // Get current dataset
      const dataset = await this.datasetClient.getDataset(datasetId);
      const currentColumns = dataset.columns || [];
      
      // Find and update specified column
      const columnIndex = currentColumns.findIndex((c: any) => c.id === columnId);
      if (columnIndex === -1) {
        throw new Error(`Column ${columnId} does not exist`);
      }
      
      // Clean existing columns, remove fields not accepted by API
      const cleanedColumns = currentColumns.map((c: any, index: number) => {
        const cleanedColumn = {
          id: c.id,
          column_name: c.column_name,
          expression: c.expression,
          type: c.type,
          description: c.description,
          verbose_name: c.verbose_name,
          filterable: c.filterable,
          groupby: c.groupby,
          is_dttm: c.is_dttm,
          is_active: c.is_active,
          extra: c.extra,
          advanced_data_type: c.advanced_data_type,
          python_date_format: c.python_date_format,
          uuid: c.uuid,
        };
        
        // If this is the column to update, apply updates
        if (index === columnIndex) {
          return {
            ...cleanedColumn,
            ...Object.fromEntries(
              Object.entries(column).filter(([_, value]) => value !== undefined)
            )
          };
        }
        
        return cleanedColumn;
      });
      
      // Update dataset
      const response = await this.makeProtectedRequest({
        method: 'PUT',
        url: `/api/v1/dataset/${datasetId}`,
        data: { columns: cleanedColumns }
      });
      
      // Return updated column
      const finalColumns = response.data.result.columns || [];
      return finalColumns[columnIndex];
    } catch (error) {
      throw new Error(`Failed to update calculated column ${columnId} for dataset ${datasetId}: ${getErrorMessage(error)}`);
    }
  }

  // Delete calculated column
  async deleteCalculatedColumn(datasetId: number, columnId: number): Promise<void> {
    try {
      // Use the dedicated delete column endpoint
      await this.makeProtectedRequest({
        method: 'DELETE',
        url: `/api/v1/dataset/${datasetId}/column/${columnId}`
      });
    } catch (error) {
      throw new Error(`Failed to delete calculated column ${columnId} from dataset ${datasetId}: ${getErrorMessage(error)}`);
    }
  }
} 