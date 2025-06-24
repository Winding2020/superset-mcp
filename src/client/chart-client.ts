import { Chart, ChartUpdateRequest } from "../types/index.js";
import { BaseSuperset } from "./base-client.js";
import { getErrorMessage } from "../utils/error.js";

/**
 * Client for Superset Chart operations
 */
export class ChartClient extends BaseSuperset {
  /**
   * Get chart information by ID
   */
  async getChart(chartId: number): Promise<Chart> {
    await this.ensureAuthenticated();
    
    try {
      const response = await this.api.get(`/api/v1/chart/${chartId}`);
      return response.data.result;
    } catch (error) {
      throw new Error(`Failed to get chart ${chartId}: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get chart visualization parameters
   * This is a convenience method that returns the parsed params object
   */
  async getChartParams(chartId: number): Promise<any> {
    const chart = await this.getChart(chartId);
    
    if (!chart.params) {
      return {};
    }
    
    try {
      return JSON.parse(chart.params);
    } catch (error) {
      throw new Error(`Failed to parse chart params: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update chart properties
   */
  async updateChart(chartId: number, updates: ChartUpdateRequest): Promise<Chart> {
    try {
      const response = await this.makeProtectedRequest({
        method: 'PUT',
        url: `/api/v1/chart/${chartId}`,
        data: updates
      });
      return response.data.result;
    } catch (error) {
      throw new Error(`Failed to update chart ${chartId}: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Update chart visualization parameters
   * This is a convenience method that handles params serialization
   */
  async updateChartParams(chartId: number, params: any): Promise<Chart> {
    const paramsString = JSON.stringify(params);
    return this.updateChart(chartId, { params: paramsString });
  }
} 