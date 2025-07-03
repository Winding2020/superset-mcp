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

  // Create calculated columns
  async createCalculatedColumns(datasetId: number, columns: CalculatedColumn[]): Promise<void> {
    try {
      const dataset = await this.datasetClient.getDataset(datasetId);
      const currentColumns = dataset.columns || [];

      const newColumnsToAdd = columns.map(column => ({
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
      }));

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

      const combinedColumns = [...cleanedCurrentColumns, ...newColumnsToAdd];

      await this.makeProtectedRequest({
        method: 'PUT',
        url: `/api/v1/dataset/${datasetId}`,
        data: { columns: combinedColumns }
      });
    } catch (error) {
      throw new Error(`Failed to create calculated columns for dataset ${datasetId}: ${getErrorMessage(error)}`);
    }
  }

  // Update calculated columns
  async updateCalculatedColumns(datasetId: number, updates: Array<{ columnId: number; column: Partial<CalculatedColumn> }>): Promise<DatasetColumn[]> {
    try {
      const dataset = await this.datasetClient.getDataset(datasetId);
      const currentColumns = dataset.columns || [];
      
      const updateMap = new Map(updates.map(update => [update.columnId, update.column]));
      
      const missingColumns = updates.filter(update => 
        !currentColumns.some((c: any) => c.id === update.columnId)
      );
      if (missingColumns.length > 0) {
        throw new Error(`Columns do not exist: ${missingColumns.map(c => c.columnId).join(', ')}`);
      }
      
      const cleanedColumns = currentColumns.map((c: any) => {
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
        
        const update = updateMap.get(c.id);
        if (update) {
          return {
            ...cleanedColumn,
            ...Object.fromEntries(
              Object.entries(update).filter(([_, value]) => value !== undefined)
            )
          };
        }
        return cleanedColumn;
      });
      
      const response = await this.makeProtectedRequest({
        method: 'PUT',
        url: `/api/v1/dataset/${datasetId}`,
        data: { columns: cleanedColumns }
      });
      
      const finalColumns = response.data.result.columns || [];
      return updates.map(update => {
        const columnIndex = finalColumns.findIndex((c: any) => c.id === update.columnId);
        return finalColumns[columnIndex];
      });
    } catch (error) {
      throw new Error(`Failed to update calculated columns for dataset ${datasetId}: ${getErrorMessage(error)}`);
    }
  }

  // Delete calculated columns
  async deleteCalculatedColumns(datasetId: number, columnIds: number[]): Promise<void> {
    try {
      // Sequentially delete each column
      for (const columnId of columnIds) {
        await this.makeProtectedRequest({
          method: 'DELETE',
          url: `/api/v1/dataset/${datasetId}/column/${columnId}`
        });
      }
    } catch (error) {
      throw new Error(`Failed to delete calculated columns from dataset ${datasetId}: ${getErrorMessage(error)}`);
    }
  }
} 