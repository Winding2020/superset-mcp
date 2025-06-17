import { BaseSuperset } from "./base-client.js";
import { DatasetClient } from "./dataset-client.js";
import { DatasetMetric } from "../types/index.js";
import { getErrorMessage } from "../utils/error.js";

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
      throw new Error(`Failed to get dataset ${datasetId} metrics: ${getErrorMessage(error)}`);
    }
  }

  // Create dataset metric
  async createDatasetMetric(datasetId: number, metric: Partial<DatasetMetric>): Promise<DatasetMetric> {
    try {
      // First get current dataset
      const dataset = await this.datasetClient.getDataset(datasetId);
      const currentMetrics = dataset.metrics || [];
      
      // Generate a temporary ID for new metric (negative number indicates newly created)
      const newMetric = {
        metric_name: metric.metric_name,
        expression: metric.expression,
        metric_type: metric.metric_type,
        description: metric.description,
        verbose_name: metric.verbose_name,
        d3format: metric.d3format,
        warning_text: metric.warning_text,
        extra: metric.extra,
        is_restricted: metric.is_restricted,
      };
      
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
      
      // Add new metric to metrics array
      const newMetrics = [...cleanedCurrentMetrics, newMetric];
      
      // Update dataset
      const response = await this.makeProtectedRequest({
        method: 'PUT',
        url: `/api/v1/dataset/${datasetId}`,
        data: { metrics: newMetrics }
      });
      
      // Return newly created metric (usually the last one in the array)
      const updatedMetrics = response.data.result.metrics || [];
      return updatedMetrics[updatedMetrics.length - 1];
    } catch (error) {
      throw new Error(`Failed to create dataset ${datasetId} metric: ${getErrorMessage(error)}`);
    }
  }

  // Update dataset metric
  async updateDatasetMetric(datasetId: number, metricId: number, metric: Partial<DatasetMetric>): Promise<DatasetMetric> {
    try {
      // Get current dataset
      const dataset = await this.datasetClient.getDataset(datasetId);
      const currentMetrics = dataset.metrics || [];
      
      // Find and update specified metric
      const metricIndex = currentMetrics.findIndex((m: any) => m.id === metricId);
      if (metricIndex === -1) {
        throw new Error(`Metric ${metricId} does not exist`);
      }
      
      // Clean existing metrics, remove fields not accepted by API
      const cleanedMetrics = currentMetrics.map((m: any, index: number) => {
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
        
        // If this is the metric to update, apply updates
        if (index === metricIndex) {
          return {
            ...cleanedMetric,
            ...Object.fromEntries(
              Object.entries(metric).filter(([_, value]) => value !== undefined)
            )
          };
        }
        
        return cleanedMetric;
      });
      
      // Update dataset
      const response = await this.makeProtectedRequest({
        method: 'PUT',
        url: `/api/v1/dataset/${datasetId}`,
        data: { metrics: cleanedMetrics }
      });
      
      // Return updated metric
      const finalMetrics = response.data.result.metrics || [];
      return finalMetrics[metricIndex];
    } catch (error) {
      throw new Error(`Failed to update dataset ${datasetId} metric ${metricId}: ${getErrorMessage(error)}`);
    }
  }

  // Delete dataset metric
  async deleteDatasetMetric(datasetId: number, metricId: number): Promise<void> {
    try {
      // Get current dataset
      const dataset = await this.datasetClient.getDataset(datasetId);
      const currentMetrics = dataset.metrics || [];
      
      // Find metric to delete
      const metricIndex = currentMetrics.findIndex((m: any) => m.id === metricId);
      if (metricIndex === -1) {
        throw new Error(`Metric ${metricId} does not exist`);
      }
      
      // Clean and filter metrics
      const updatedMetrics = currentMetrics
        .filter((m: any) => m.id !== metricId)
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
      throw new Error(`Failed to delete dataset ${datasetId} metric ${metricId}: ${getErrorMessage(error)}`);
    }
  }
} 