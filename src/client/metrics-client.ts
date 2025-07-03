import { BaseSuperset } from "./base-client.js";
import { DatasetClient } from "./dataset-client.js";
import { DatasetMetric } from "../types/index.js";
import { getErrorMessage, formatDatasetError } from "../utils/error.js";

/**
 * Metrics management client
 */
export class MetricsClient extends BaseSuperset {
  private datasetClient: DatasetClient;

  constructor(config: any) {
    super(config);
    this.datasetClient = new DatasetClient(config);
  }

  // Get dataset metrics list
  async getDatasetMetrics(datasetId: number): Promise<DatasetMetric[]> {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.api.get(`/api/v1/dataset/${datasetId}`);
      return response.data.result.metrics || [];
    } catch (error) {
      throw new Error(formatDatasetError(error, "Get Metrics", datasetId));
    }
  }

  // Create dataset metrics
  async createDatasetMetrics(datasetId: number, metrics: Partial<DatasetMetric>[]): Promise<void> {
    try {
      // First get current dataset
      const dataset = await this.datasetClient.getDataset(datasetId);
      const currentMetrics = dataset.metrics || [];
      
      const newMetricsToAdd = metrics.map(metric => ({
        metric_name: metric.metric_name,
        expression: metric.expression,
        metric_type: metric.metric_type,
        description: metric.description,
        verbose_name: metric.verbose_name,
        d3format: metric.d3format,
        warning_text: metric.warning_text,
        extra: metric.extra,
        is_restricted: metric.is_restricted,
      }));
      
      // Clean existing metrics, remove fields not accepted by API
      const cleanedCurrentMetrics = currentMetrics.map((m: any) => ({
        id: m.id,
        metric_name: m.metric_name,
        expression: m.expression,
        metric_type: m.metric_type,
        description: m.description,
        verbose_name: m.verbose_name,
        d3format: m.d3format,
        warning_text: m.warning_text,
        extra: m.extra,
        is_restricted: m.is_restricted,
      }));
      
      // Add new metrics to metrics array
      const combinedMetrics = [...cleanedCurrentMetrics, ...newMetricsToAdd];
      
      // Update dataset
      await this.makeProtectedRequest({
        method: 'PUT',
        url: `/api/v1/dataset/${datasetId}`,
        data: { metrics: combinedMetrics }
      });
    } catch (error) {
      throw new Error(`Failed to create dataset ${datasetId} metrics: ${getErrorMessage(error)}`);
    }
  }

  // Update dataset metrics
  async updateDatasetMetrics(datasetId: number, updates: Array<{ metricId: number; metric: Partial<DatasetMetric> }>): Promise<DatasetMetric[]> {
    try {
      // Get current dataset
      const dataset = await this.datasetClient.getDataset(datasetId);
      const currentMetrics = dataset.metrics || [];
      
      // Create a map of metric IDs to updates for efficient lookup
      const updateMap = new Map(updates.map(update => [update.metricId, update.metric]));
      
      // Check if all metrics to update exist
      const missingMetrics = updates.filter(update => 
        !currentMetrics.find((m: any) => m.id === update.metricId)
      );
      
      if (missingMetrics.length > 0) {
        throw new Error(`Metrics do not exist: ${missingMetrics.map(m => m.metricId).join(', ')}`);
      }
      
      // Clean and update metrics
      const updatedMetrics = currentMetrics.map((m: any) => {
        const cleanedMetric = {
          id: m.id,
          metric_name: m.metric_name,
          expression: m.expression,
          metric_type: m.metric_type,
          description: m.description,
          verbose_name: m.verbose_name,
          d3format: m.d3format,
          warning_text: m.warning_text,
          extra: m.extra,
          is_restricted: m.is_restricted,
        };
        
        // If this metric has updates, apply them
        const update = updateMap.get(m.id);
        if (update) {
          return {
            ...cleanedMetric,
            ...Object.fromEntries(
              Object.entries(update).filter(([_, value]) => value !== undefined)
            )
          };
        }
        
        return cleanedMetric;
      });
      
      // Update dataset
      const response = await this.makeProtectedRequest({
        method: 'PUT',
        url: `/api/v1/dataset/${datasetId}`,
        data: { metrics: updatedMetrics }
      });
      
      // Return the updated metrics
      const finalMetrics = response.data.result.metrics || [];
      return updates.map(update => {
        const metricIndex = finalMetrics.findIndex((m: any) => m.id === update.metricId);
        return finalMetrics[metricIndex];
      });
    } catch (error) {
      throw new Error(`Failed to batch update dataset ${datasetId} metrics: ${getErrorMessage(error)}`);
    }
  }

  // Delete dataset metrics
  async deleteDatasetMetrics(datasetId: number, metricIds: number[]): Promise<void> {
    try {
      // Get current dataset
      const dataset = await this.datasetClient.getDataset(datasetId);
      const currentMetrics = dataset.metrics || [];
      
      // Check if all metrics to delete exist
      const missingMetrics = metricIds.filter(metricId => 
        !currentMetrics.find((m: any) => m.id === metricId)
      );
      
      if (missingMetrics.length > 0) {
        throw new Error(`Metrics do not exist: ${missingMetrics.join(', ')}`);
      }
      
      // Clean and filter metrics
      const updatedMetrics = currentMetrics
        .filter((m: any) => !metricIds.includes(m.id))
        .map((m: any) => ({
          id: m.id,
          metric_name: m.metric_name,
          expression: m.expression,
          metric_type: m.metric_type,
          description: m.description,
          verbose_name: m.verbose_name,
          d3format: m.d3format,
          warning_text: m.warning_text,
          extra: m.extra,
          is_restricted: m.is_restricted,
        }));
      
      // Update dataset
      await this.makeProtectedRequest({
        method: 'PUT',
        url: `/api/v1/dataset/${datasetId}`,
        data: { metrics: updatedMetrics }
      });
    } catch (error) {
      throw new Error(`Failed to batch delete dataset ${datasetId} metrics: ${getErrorMessage(error)}`);
    }
  }
} 