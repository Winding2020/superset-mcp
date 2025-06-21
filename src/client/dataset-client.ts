import { BaseSuperset } from "./base-client.js";
import { Dataset, DatasetListResponse } from "../types/index.js";
import { getErrorMessage, formatDatasetError } from "../utils/error.js";

/**
 * Dataset management client
 */
export class DatasetClient extends BaseSuperset {
  
  // Get all datasets
  async getDatasets(page = 0, pageSize = 20): Promise<DatasetListResponse> {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.api.get('/api/v1/dataset/', {
        params: {
          q: JSON.stringify({
            page,
            page_size: pageSize,
            order_column: 'changed_on_delta_humanized',
            order_direction: 'desc',
          }),
        },
      });
      
      return {
        result: response.data.result,
        count: response.data.count,
      };
    } catch (error) {
      throw new Error(formatDatasetError(error, "List"));
    }
  }

  // Get single dataset by ID
  async getDataset(id: number): Promise<Dataset> {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.api.get(`/api/v1/dataset/${id}`);
      return response.data.result;
    } catch (error) {
      throw new Error(formatDatasetError(error, "Get", id));
    }
  }

  // Create new dataset
  async createDataset(dataset: Partial<Dataset>): Promise<Dataset> {
    try {
      // Build correct request data format, only include API-supported fields
      const requestData: any = {
        table_name: dataset.table_name,
        database: dataset.database_id, // Superset API requires database field instead of database_id
      };

      // Add optional fields (only add API-supported fields)
      if (dataset.schema) {
        requestData.schema = dataset.schema;
      }
      if (dataset.sql) {
        requestData.sql = dataset.sql;
      }
      // Note: description field is not supported during creation, needs to be set via update after creation

      console.error('Create dataset request data:', JSON.stringify(requestData, null, 2));

      const response = await this.makeProtectedRequest({
        method: 'POST',
        url: '/api/v1/dataset/',
        data: requestData
      });

      const createdDataset = {
        ...response.data.result,
        id: response.data.id,
        database_id: response.data.result.database.id,
      };

      // If description exists, update immediately after creation
      if (dataset.description && createdDataset.id) {
        try {
          await this.updateDataset(createdDataset.id, { description: dataset.description });
          createdDataset.description = dataset.description;
        } catch (updateError) {
          console.error('Failed to update dataset description:', updateError);
          // Don't throw error since dataset was created successfully
        }
      }

      return createdDataset;
    } catch (error) {
      console.error('Create dataset detailed error:', error);
      if (error instanceof Error && 'response' in error) {
        const axiosError = error as any;
        console.error('Response status:', axiosError.response?.status);
        console.error('Response data:', JSON.stringify(axiosError.response?.data, null, 2));
      }
      throw new Error(formatDatasetError(error, "Create"));
    }
  }

  // Update dataset
  async updateDataset(id: number, dataset: Partial<Dataset>): Promise<Dataset> {
    try {
      const response = await this.makeProtectedRequest({
        method: 'PUT',
        url: `/api/v1/dataset/${id}`,
        data: dataset
      });
      return response.data.result;
    } catch (error) {
      throw new Error(`Failed to update dataset ${id}: ${getErrorMessage(error)}`);
    }
  }

  // Delete dataset
  async deleteDataset(id: number): Promise<void> {
    try {
      await this.makeProtectedRequest({
        method: 'DELETE',
        url: `/api/v1/dataset/${id}`
      });
    } catch (error) {
      throw new Error(`Failed to delete dataset ${id}: ${getErrorMessage(error)}`);
    }
  }

  // Refresh dataset schema
  async refreshDatasetSchema(id: number): Promise<any> {
    try {
      const response = await this.makeProtectedRequest({
        method: 'PUT',
        url: `/api/v1/dataset/${id}/refresh`
      });
      return response.data.result;
    } catch (error) {
      throw new Error(`Failed to refresh dataset ${id} schema: ${getErrorMessage(error)}`);
    }
  }
} 