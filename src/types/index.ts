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
  database_id?: number; // Keep for backward compatibility
  database?: {
    id: number;
    database_name: string;
  };
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

// Chart data structure
export interface Chart {
  id: number;
  slice_name: string;
  viz_type: string;
  params?: string;
  query_context?: string;
  query_context_generation?: boolean;
  cache_timeout?: number;
  certification_details?: string;
  certified_by?: string;
  changed_on_delta_humanized?: string; // From API
  dashboards?: Array<{
    id: number;
    dashboard_title: string;
    json_metadata?: string;
  }>;
  datasource_id?: number;
  datasource_type?: string;
  description?: string;
  external_url?: string;
  is_managed_externally?: boolean;
  owners?: Array<{
    id: number;
    first_name: string;
    last_name: string;
  }>;
  tags?: Array<{
    id: number;
    name: string;
    type: number;
  }>;
  thumbnail_url?: string; // From API
  url?: string; // From API
}

// Chart params structure (parsed from JSON string)
export interface ChartParams {
  [key: string]: any;  // Dynamic structure based on viz_type
}

// Chart create request
export interface ChartCreateRequest {
  slice_name: string; // Required
  datasource_id: number; // Required
  datasource_type: string; // Required
  viz_type?: string;
  params?: string;
  query_context?: string;
  query_context_generation?: boolean;
  cache_timeout?: number;
  certification_details?: string;
  certified_by?: string;
  dashboards?: number[];
  datasource_name?: string;
  description?: string;
  external_url?: string;
  is_managed_externally?: boolean;
  owners?: number[];
}

// Chart update request
export interface ChartUpdateRequest {
  slice_name?: string;
  viz_type?: string;
  params?: string;
  query_context?: string;
  query_context_generation?: boolean;
  cache_timeout?: number;
  certification_details?: string;
  certified_by?: string;
  dashboards?: number[];
  datasource_id?: number;
  datasource_type?: string;
  description?: string;
  external_url?: string;
  is_managed_externally?: boolean;
  owners?: number[];
  tags?: number[];
}

// Chart data filter structure
export interface ChartDataFilter {
  col: string | any; // Column name or adhoc column object
  op: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'NOT LIKE' | 'ILIKE' | 'IS NULL' | 'IS NOT NULL' | 'IN' | 'NOT IN' | 'IS TRUE' | 'IS FALSE' | 'TEMPORAL_RANGE';
  val?: any; // Value(s) to compare against
  grain?: string; // Optional time grain for temporal filters
  isExtra?: boolean; // Indicates if filter was added by filter component
}

// Chart data query object
export interface ChartDataQueryObject {
  datasource?: {
    id: number;
    type: string;
  };
  filters?: ChartDataFilter[];
  columns?: any[];
  metrics?: any[];
  groupby?: any[];
  granularity?: string;
  granularity_sqla?: string;
  is_timeseries?: boolean;
  is_rowcount?: boolean;
  row_limit?: number;
  row_offset?: number;
  order_desc?: boolean;
  orderby?: any[];
  extras?: any;
  annotation_layers?: any[];
  applied_time_extras?: any;
  apply_fetch_values_predicate?: boolean;
  having?: string;
  post_processing?: any[];
  result_type?: 'columns' | 'full' | 'query' | 'results' | 'samples' | 'timegrains' | 'post_processed' | 'drill_detail';
  series_columns?: any[];
  series_limit?: number;
  series_limit_metric?: any;
  time_range?: string;
  time_shift?: string;
  url_params?: any;
}

// Chart data query context
export interface ChartDataQueryContext {
  datasource: {
    id: number;
    type: string;
  };
  queries: ChartDataQueryObject[];
  form_data?: any;
  result_format?: 'csv' | 'json' | 'xlsx';
  result_type?: 'columns' | 'full' | 'query' | 'results' | 'samples' | 'timegrains' | 'post_processed' | 'drill_detail';
  force?: boolean;
  custom_cache_timeout?: number;
}

// Chart data response
export interface ChartDataResponse {
  result: Array<{
    query: string;
    status: string;
    error?: string;
    stacktrace?: string;
    data?: any[];
    columns?: Array<{
      name: string;
      type: string;
      is_date?: boolean;
    }>;
    applied_filters?: Array<{
      column: string;
      operator: string;
      value: any;
    }>;
    rejected_filters?: Array<{
      column: string;
      operator: string;
      value: any;
      reason: string;
    }>;
    cache_key?: string;
    cached_dttm?: string;
    cache_timeout?: number;
    annotation_data?: any;
    rowcount?: number;
    from_dttm?: number;
    to_dttm?: number;
    is_cached?: boolean;
  }>;
  message?: string;
}

// Chart list query parameters
export interface ChartListQuery {
  page?: number;
  page_size?: number;
  order_column?: string;
  order_direction?: 'asc' | 'desc';
  filters?: Array<{
    col: string;
    opr: string;
    value: any;
  }>;
  columns?: string[];
  select_columns?: string[];
  keys?: Array<'list_columns' | 'order_columns' | 'label_columns' | 'description_columns' | 'list_title' | 'none'>;
}

// Chart list item (simplified chart data for list view)
export interface ChartListItem {
  id: number;
  slice_name: string;
  viz_type: string;
  cache_timeout?: number;
  certification_details?: string;
  certified_by?: string;
  changed_by?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  changed_by_name?: string;
  changed_on_delta_humanized?: string;
  changed_on_dttm?: string;
  changed_on_utc?: string;
  created_by?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  created_by_name?: string;
  created_on_delta_humanized?: string;
  dashboards?: Array<{
    id: number;
    dashboard_title: string;
  }>;
  datasource_id?: number;
  datasource_name_text?: string;
  datasource_type?: string;
  datasource_url?: string;
  description?: string;
  description_markeddown?: string;
  edit_url?: string;
  form_data?: any;
  is_managed_externally?: boolean;
  last_saved_at?: string;
  last_saved_by?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  owners?: Array<{
    id: number;
    first_name: string;
    last_name: string;
  }>;
  params?: string;
  slice_url?: string;
  table?: {
    table_name: string;
    default_endpoint?: string;
  };
  tags?: Array<{
    id: number;
    name: string;
    type: number;
  }>;
  thumbnail_url?: string;
  url?: string;
}

// Chart list response
export interface ChartListResponse {
  result: ChartListItem[];
  count: number;
  description_columns?: Record<string, string>;
  label_columns?: Record<string, string>;
  list_columns?: string[];
  list_title?: string;
  order_columns?: string[];
  ids?: string[];
}

// Dashboard data structure
export interface Dashboard {
  id: number;
  dashboard_title: string;
  slug?: string;
  description?: string;
  json_metadata?: string;
  position_json?: string;
  css?: string;
  published?: boolean;
  owners?: Array<{ id: number; username: string }>;
  roles?: Array<{ id: number; name: string }>;
  tags?: Array<{ id: number; name: string }>;
  changed_by?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  changed_on_dttm?: string;
  created_by?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  created_on_dttm?: string;
}

// Dashboard chart item (chart info from dashboard endpoint)
export interface DashboardChartItem {
  id: number;
  slice_name: string;
  viz_type: string;
  datasource_id?: number;
  datasource_type?: string;
  datasource_name?: string;
  params?: string;
  query_context?: string;
  description?: string;
  cache_timeout?: number;
  form_data?: any;
  is_managed_externally?: boolean;
  last_saved_at?: string;
  slice_url?: string;
  edit_url?: string;
  table?: {
    table_name: string;
    default_endpoint?: string;
  };
}

// Dashboard charts response
export interface DashboardChartsResponse {
  result: DashboardChartItem[];
}

// Dashboard filter configuration (parsed from json_metadata)
export interface DashboardFilterConfig {
  native_filter_configuration?: Array<{
    id: string;
    filterType: string;
    targets: Array<{
      datasetId: number;
      column?: {
        name: string;
      };
    }>;
    defaultDataMask?: {
      extraFormData?: any;
      filterState?: any;
    };
    cascadeParentIds?: string[];
    scope?: {
      rootPath: string[];
      excluded: number[];
    };
    controlValues?: {
      [key: string]: any;
    };
    name: string;
    description?: string;
    chartsInScope?: number[];
    tabsInScope?: string[];
  }>;
  global_chart_configuration?: {
    [chartId: string]: {
      id: number;
      crossFilters?: {
        scope?: {
          rootPath: string[];
          excluded: number[];
        };
        chartsInScope?: number[];
      };
    };
  };
  filter_scopes?: {
    [filterId: string]: {
      [chartId: string]: {
        scope: string[];
        immune: number[];
      };
    };
  };
  default_filters?: string;
  color_scheme?: string;
  expanded_slices?: { [key: string]: boolean };
  refresh_frequency?: number;
  timed_refresh_immune_slices?: number[];
  label_colors?: { [key: string]: string };
  shared_label_colors?: { [key: string]: string };
  color_scheme_domain?: string[];
  cross_filters_enabled?: boolean;
}

// Dashboard query context result
export interface DashboardQueryContext {
  dashboard_id: number;
  chart_id: number;
  chart_name: string;
  dataset_id: number;
  dataset_name: string;
  dataset_details?: any;
  used_metrics: any[];
  calculated_columns: any[];
  default_params: any;
  query_context_filters: any[];
  dashboard_filters: DashboardFilterConfig;
  applied_filters: Array<{
    filter_id: string;
    filter_name?: string;
    filter_type: string;
    column: string;
    value: any;
    default_value?: any;
    scope: {
      charts: number[];
      tabs: string[];
    };
  }>;
  final_query_context: any;
}

// Dashboard list item structure (for list API response)
export interface DashboardListItem {
  id: number;
  dashboard_title?: string;
  slug?: string;
  certification_details?: string;
  certified_by?: string;
  changed_by?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  changed_by_name?: string;
  changed_on_delta_humanized?: string;
  changed_on_utc?: string;
  created_by?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  created_on_delta_humanized?: string;
  css?: string;
  is_managed_externally?: boolean;
  json_metadata?: string;
  owners?: Array<{
    id: number;
    first_name: string;
    last_name: string;
  }>;
  position_json?: string;
  published?: boolean;
  roles?: Array<{
    id: number;
    name: string;
  }>;
  status?: string;
  tags?: Array<{
    id: number;
    name: string;
    type: number;
  }>;
  thumbnail_url?: string;
  url?: string;
}

// Dashboard list query parameters
export interface DashboardListQuery {
  page?: number;
  page_size?: number;
  order_column?: string;
  order_direction?: 'asc' | 'desc';
  filters?: Array<{
    col: string;
    opr: string;
    value: any;
  }>;
  columns?: string[];
  select_columns?: string[];
  keys?: Array<'list_columns' | 'order_columns' | 'label_columns' | 'description_columns' | 'list_title' | 'none'>;
}

// Dashboard list response
export interface DashboardListResponse {
  result: DashboardListItem[];
  count: number;
  description_columns?: Record<string, string>;
  label_columns?: Record<string, string>;
  list_columns?: string[];
  list_title?: string;
  order_columns?: string[];
  ids?: string[];
} 