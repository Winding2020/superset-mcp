import { SupersetClient } from "./superset-client.js";
import { SupersetConfig } from "../types/index.js";

// Global Superset client instance
let supersetClient: SupersetClient | null = null;

// Initialize Superset client
export function initializeSupersetClient(): SupersetClient {
  if (!supersetClient) {
    const config: SupersetConfig = {
      baseUrl: process.env.SUPERSET_BASE_URL || 'http://localhost:8088',
      username: process.env.SUPERSET_USERNAME,
      password: process.env.SUPERSET_PASSWORD,
      accessToken: process.env.SUPERSET_ACCESS_TOKEN,
      authProvider: process.env.SUPERSET_AUTH_PROVIDER,
    };
    
    supersetClient = new SupersetClient(config);
  }
  
  return supersetClient;
}

// Main client class
export { SupersetClient };

// Specialized client modules
export { BaseSuperset } from './base-client.js';
export { DatasetClient } from './dataset-client.js';
export { MetricsClient } from './metrics-client.js';
export { ColumnsClient } from './columns-client.js';
export { SqlClient } from './sql-client.js';
export { ChartClient } from './chart-client.js';

// Type definitions
export { 
  SupersetConfig, 
  Dataset, 
  DatasetMetric, 
  DatasetColumn, 
  CalculatedColumn,
  DatasetListResponse, 
  CsrfTokenResponse,
  SqlExecuteRequest,
  SqlExecuteResponse
} from '../types/index.js'; 