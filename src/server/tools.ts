export const toolDefinitions = [
  {
    name: "list_datasets",
    description: "Get list of all datasets in Superset",
    inputSchema: {
      type: "object",
      properties: {
        page: {
          type: "number",
          description: "Page number (starting from 0)",
          default: 0,
        },
        pageSize: {
          type: "number", 
          description: "Number of items per page",
          default: 20,
        },
      },
    },
  },
  {
    name: "get_dataset",
    description: "Get detailed information of a specific dataset by ID",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "number",
          description: "Dataset ID",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "create_dataset",
    description: "Create a new dataset",
    inputSchema: {
      type: "object",
      properties: {
        database_id: {
          type: "number",
          description: "Database ID",
        },
        table_name: {
          type: "string",
          description: "Table name",
        },
        schema: {
          type: "string",
          description: "Database schema (optional)",
        },
        description: {
          type: "string",
          description: "Dataset description (optional)",
        },
        sql: {
          type: "string", 
          description: "Custom SQL query (optional)",
        },
      },
      required: ["database_id", "table_name"],
    },
  },
  {
    name: "update_dataset",
    description: "Update an existing dataset",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "number",
          description: "Dataset ID",
        },
        table_name: {
          type: "string",
          description: "Table name (optional)",
        },
        description: {
          type: "string",
          description: "Dataset description (optional)",
        },
        sql: {
          type: "string",
          description: "Custom SQL query (optional)",
        },
        cache_timeout: {
          type: "number",
          description: "Cache timeout in seconds (optional)",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_dataset",
    description: "Delete a dataset",
    inputSchema: {
      type: "object", 
      properties: {
        id: {
          type: "number",
          description: "ID of the dataset to delete",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "refresh_dataset_schema",
    description: "Refresh dataset schema information",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "number",
          description: "Dataset ID",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "list_databases",
    description: "Get all databases configured in Superset",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_dataset_metrics",
    description: "Get all metrics for a specified dataset",
    inputSchema: {
      type: "object",
      properties: {
        dataset_id: {
          type: "number",
          description: "Dataset ID",
        },
      },
      required: ["dataset_id"],
    },
  },
  {
    name: "create_dataset_metric",
    description: "Create a new metric for a dataset",
    inputSchema: {
      type: "object",
      properties: {
        dataset_id: {
          type: "number",
          description: "Dataset ID",
        },
        metric_name: {
          type: "string",
          description: "Metric name",
        },
        expression: {
          type: "string",
          description: "Metric expression (SQL expression)",
        },
        metric_type: {
          type: "string",
          description: "Metric type (optional)",
        },
        description: {
          type: "string",
          description: "Metric description (optional)",
        },
        verbose_name: {
          type: "string",
          description: "Metric display name (optional)",
        },
        d3format: {
          type: "string",
          description: "D3 format string (optional)",
        },
      },
      required: ["dataset_id", "metric_name", "expression"],
    },
  },
  {
    name: "update_dataset_metric",
    description: "Update a metric in a dataset",
    inputSchema: {
      type: "object",
      properties: {
        dataset_id: {
          type: "number",
          description: "Dataset ID",
        },
        metric_id: {
          type: "number",
          description: "Metric ID",
        },
        metric_name: {
          type: "string",
          description: "Metric name (optional)",
        },
        expression: {
          type: "string",
          description: "Metric expression (optional)",
        },
        description: {
          type: "string",
          description: "Metric description (optional)",
        },
        verbose_name: {
          type: "string",
          description: "Metric display name (optional)",
        },
        d3format: {
          type: "string",
          description: "D3 format string (optional)",
        },
      },
      required: ["dataset_id", "metric_id"],
    },
  },
  {
    name: "delete_dataset_metric",
    description: "Delete a metric from a dataset",
    inputSchema: {
      type: "object",
      properties: {
        dataset_id: {
          type: "number",
          description: "Dataset ID",
        },
        metric_id: {
          type: "number",
          description: "ID of the metric to delete",
        },
      },
      required: ["dataset_id", "metric_id"],
    },
  },
  {
    name: "get_dataset_columns",
    description: "Get column information of a dataset, useful for referencing available fields when creating metrics",
    inputSchema: {
      type: "object",
      properties: {
        dataset_id: {
          type: "number",
          description: "Dataset ID",
        },
      },
      required: ["dataset_id"],
    },
  },
  {
    name: "execute_sql",
    description: "Execute SQL query using /api/v1/sqllab/execute/ endpoint",
    inputSchema: {
      type: "object",
      properties: {
        database_id: {
          type: "number",
          description: "Database ID",
        },
        sql: {
          type: "string",
          description: "SQL query statement to execute",
        },
        schema: {
          type: "string",
          description: "Database schema (optional)",
        },
        limit: {
          type: "number",
          description: "Query result row limit (default 1000)",
          default: 1000,
        },
        expand_data: {
          type: "boolean",
          description: "Whether to expand data (default true)",
          default: true,
        },
        display_rows: {
          type: "number",
          description: "Number of data rows to display (default 50)",
          default: 50,
        },
      },
      required: ["database_id", "sql"],
    },
  },
  {
    name: "create_calculated_column",
    description: "Create a new calculated column for a dataset",
    inputSchema: {
      type: "object",
      properties: {
        dataset_id: {
          type: "number",
          description: "Dataset ID",
        },
        column_name: {
          type: "string",
          description: "Column name",
        },
        expression: {
          type: "string",
          description: "SQL expression for the calculated column",
        },
        type: {
          type: "string",
          description: "Data type (optional, e.g., 'VARCHAR', 'NUMERIC', 'TIMESTAMP')",
        },
        description: {
          type: "string",
          description: "Column description (optional)",
        },
        verbose_name: {
          type: "string",
          description: "Column display name (optional)",
        },
        filterable: {
          type: "boolean",
          description: "Whether the column can be used for filtering (optional, default: true)",
        },
        groupby: {
          type: "boolean",
          description: "Whether the column can be used for grouping (optional, default: true)",
        },
        is_dttm: {
          type: "boolean",
          description: "Whether this is a datetime column (optional, default: false)",
        },
        is_active: {
          type: "boolean",
          description: "Whether the column is active (optional, default: true)",
        },
        extra: {
          type: "string",
          description: "Extra configuration in JSON format (optional)",
        },
        advanced_data_type: {
          type: "string",
          description: "Advanced data type (optional)",
        },
        python_date_format: {
          type: "string",
          description: "Python date format for datetime columns (optional)",
        },
      },
      required: ["dataset_id", "column_name", "expression"],
    },
  },
  {
    name: "update_calculated_column",
    description: "Update an existing calculated column in a dataset",
    inputSchema: {
      type: "object",
      properties: {
        dataset_id: {
          type: "number",
          description: "Dataset ID",
        },
        column_id: {
          type: "number",
          description: "Column ID",
        },
        column_name: {
          type: "string",
          description: "Column name (optional)",
        },
        expression: {
          type: "string",
          description: "SQL expression for the calculated column (optional)",
        },
        type: {
          type: "string",
          description: "Data type (optional)",
        },
        description: {
          type: "string",
          description: "Column description (optional)",
        },
        verbose_name: {
          type: "string",
          description: "Column display name (optional)",
        },
        filterable: {
          type: "boolean",
          description: "Whether the column can be used for filtering (optional)",
        },
        groupby: {
          type: "boolean",
          description: "Whether the column can be used for grouping (optional)",
        },
        is_dttm: {
          type: "boolean",
          description: "Whether this is a datetime column (optional)",
        },
        is_active: {
          type: "boolean",
          description: "Whether the column is active (optional)",
        },
        extra: {
          type: "string",
          description: "Extra configuration in JSON format (optional)",
        },
        advanced_data_type: {
          type: "string",
          description: "Advanced data type (optional)",
        },
        python_date_format: {
          type: "string",
          description: "Python date format for datetime columns (optional)",
        },
      },
      required: ["dataset_id", "column_id"],
    },
  },
  {
    name: "delete_calculated_column",
    description: "Delete a calculated column from a dataset",
    inputSchema: {
      type: "object",
      properties: {
        dataset_id: {
          type: "number",
          description: "Dataset ID",
        },
        column_id: {
          type: "number",
          description: "ID of the column to delete",
        },
      },
      required: ["dataset_id", "column_id"],
    },
  },
  {
    name: "get_chart_params",
    description: "Get visualization parameters (params) of a chart. This tool should be called FIRST before updating chart visualization settings. The params contain all visualization-specific configurations like colors, axes, legends, etc. The structure varies based on the chart's viz_type.",
    inputSchema: {
      type: "object",
      properties: {
        chart_id: {
          type: "number",
          description: "Chart ID",
        },
      },
      required: ["chart_id"],
    },
  },
  {
    name: "update_chart_params",
    description: "Update visualization parameters (params) of a chart. Call get_chart_params FIRST to see the current configuration, then modify the params object and use this tool to apply changes. This updates ONLY the visualization settings, not the chart's metadata like name or description.",
    inputSchema: {
      type: "object",
      properties: {
        chart_id: {
          type: "number",
          description: "Chart ID",
        },
        params: {
          type: "object",
          description: "Complete params object with your modifications. The structure depends on viz_type. Common fields include: color_scheme, show_legend, x_axis_format, y_axis_format, etc.",
          additionalProperties: true,
        },
      },
      required: ["chart_id", "params"],
    },
  },
]; 