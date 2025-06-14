// Superset客户端配置接口
export interface SupersetConfig {
  baseUrl: string;
  username?: string;
  password?: string;
  accessToken?: string;
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