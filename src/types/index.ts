// Superset客户端配置接口
export interface SupersetConfig {
  baseUrl: string;
  username?: string;
  password?: string;
  accessToken?: string;
  authProvider?: string; // 认证提供者，默认为'db'，可选值: 'db', 'ldap', 'oauth'等
}

// Dataset数据结构
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

// Dataset Metric数据结构
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

// Dataset列信息
export interface DatasetColumn {
  column_name: string;
  type: string;
  description?: string;
  is_dttm?: boolean;
  expression?: string;
  verbose_name?: string;
}

// SQL执行请求参数
export interface SqlExecuteRequest {
  database_id: number;
  sql: string;
  schema?: string;
  limit?: number;
  expand_data?: boolean;
}

// SQL执行响应
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

// API响应类型
export interface DatasetListResponse {
  result: Dataset[];
  count: number;
}

// CSRF令牌响应
export interface CsrfTokenResponse {
  token: string;
  sessionCookie: string;
} 