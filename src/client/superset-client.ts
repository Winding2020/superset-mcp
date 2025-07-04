import { SupersetConfig } from "../types/index.js";
import { BaseSuperset } from "./base-client.js";
import { DatasetClient } from "./dataset-client.js";
import { MetricsClient } from "./metrics-client.js";
import { ColumnsClient } from "./columns-client.js";
import { SqlClient } from "./sql-client.js";
import { ChartClient } from "./chart-client.js";
import { DashboardClient } from "./dashboard-client.js";

/**
 * Main Superset API client that composes all specialized client modules
 */
export class SupersetClient extends BaseSuperset {
  // Specialized client modules
  public readonly datasets: DatasetClient;
  public readonly metrics: MetricsClient;
  public readonly columns: ColumnsClient;
  public readonly sql: SqlClient;
  public readonly charts: ChartClient;
  public readonly dashboards: DashboardClient;

  constructor(config: SupersetConfig) {
    super(config);
    
    // Initialize specialized clients
    this.datasets = new DatasetClient(config);
    this.metrics = new MetricsClient(config);
    this.columns = new ColumnsClient(config);
    this.sql = new SqlClient(config);
    this.charts = new ChartClient(config);
    this.dashboards = new DashboardClient(config);
  }
} 