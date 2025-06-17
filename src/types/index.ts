// Superset client configuration interface
export interface SupersetConfig {
  baseUrl: string;
  username?: string;
  password?: string;
  accessToken?: string;
  authProvider?: string; // Authentication provider, default is 'db', options: 'db', 'ldap', 'oauth', etc.
}

// Dataset data structure
export interface Dataset {
  id: number;
  database_id: number;
  table_name: string;
  schema?: string;
  description?: string;
  sql?: string;
  params?: string;
  cache_timeout?: number;
  is_sqllab_view?: boolean;
  template_params?: string;
  owners?: Array<{ id: number; username: string }>;
  metrics?: Array<any>;
  columns?: Array<any>;
}

// Dataset Metric data structure
export interface DatasetMetric {
  id?: number;
  metric_name: string;
  metric_type?: string;
  expression: string;
  description?: string;
  verbose_name?: string;
  warning_text?: string;
  d3format?: string;
  extra?: string;
  is_restricted?: boolean;
}

// Dataset column information
export interface DatasetColumn {
  id?: number;
  column_name: string;
  type?: string;
  description?: string;
  is_dttm?: boolean;
  expression?: string;
  verbose_name?: string;
  filterable?: boolean;
  groupby?: boolean;
  is_active?: boolean;
  extra?: string;
  advanced_data_type?: string;
  python_date_format?: string;
  uuid?: string;
}

// SQL execution request parameters
export interface SqlExecuteRequest {
  database_id: number;
  sql: string;
  schema?: string;
  limit?: number;
  expand_data?: boolean;
}

// SQL execution response
export interface SqlExecuteResponse {
  query_id?: number;
  status: string;
  data?: Array<Record<string, any>>;
  columns?: Array<{
    name: string;
    type: string;
    is_date?: boolean;
  }>;
  selected_columns?: Array<{
    name: string;
    type: string;
  }>;
  expanded_columns?: Array<{
    name: string;
    type: string;
  }>;
  query?: {
    changedOn: string;
    changed_on: string;
    dbId: number;
    db: string;
    endDttm: number;
    errorMessage?: string;
    executedSql: string;
    id: string;
    limit: number;
    limitingFactor: string;
    progress: number;
    rows: number;
    schema: string;
    sql: string;
    sqlEditorId: string;
    startDttm: number;
    state: string;
    tab: string;
    tempSchema?: string;
    tempTable?: string;
    userId: number;
    user: string;
  };
  error?: string;
}

// API response types
export interface DatasetListResponse {
  result: Dataset[];
  count: number;
}

// CSRF token response
export interface CsrfTokenResponse {
  token: string;
  sessionCookie: string;
}

// Calculated column create/update interface
export interface CalculatedColumn {
  column_name: string;
  expression: string;
  type?: string;
  description?: string;
  verbose_name?: string;
  filterable?: boolean;
  groupby?: boolean;
  is_dttm?: boolean;
  is_active?: boolean;
  extra?: string;
  advanced_data_type?: string;
  python_date_format?: string;
} 