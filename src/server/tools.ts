export const toolDefinitions = [
  {
    name: "list_datasets",
    description: "获取Superset中的所有datasets列表",
    inputSchema: {
      type: "object",
      properties: {
        page: {
          type: "number",
          description: "页码（从0开始）",
          default: 0,
        },
        pageSize: {
          type: "number", 
          description: "每页数量",
          default: 20,
        },
      },
    },
  },
  {
    name: "get_dataset",
    description: "根据ID获取特定的dataset详细信息",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "number",
          description: "Dataset的ID",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "create_dataset",
    description: "创建新的dataset",
    inputSchema: {
      type: "object",
      properties: {
        database_id: {
          type: "number",
          description: "数据库ID",
        },
        table_name: {
          type: "string",
          description: "表名",
        },
        schema: {
          type: "string",
          description: "数据库schema（可选）",
        },
        description: {
          type: "string",
          description: "Dataset描述（可选）",
        },
        sql: {
          type: "string", 
          description: "自定义SQL查询（可选）",
        },
      },
      required: ["database_id", "table_name"],
    },
  },
  {
    name: "update_dataset",
    description: "更新已存在的dataset",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "number",
          description: "Dataset的ID",
        },
        table_name: {
          type: "string",
          description: "表名（可选）",
        },
        description: {
          type: "string",
          description: "Dataset描述（可选）",
        },
        sql: {
          type: "string",
          description: "自定义SQL查询（可选）",
        },
        cache_timeout: {
          type: "number",
          description: "缓存超时时间（秒）（可选）",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_dataset",
    description: "删除dataset",
    inputSchema: {
      type: "object", 
      properties: {
        id: {
          type: "number",
          description: "要删除的Dataset的ID",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "refresh_dataset_schema",
    description: "刷新dataset的schema信息",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "number",
          description: "Dataset的ID",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "list_databases",
    description: "获取Superset中配置的所有数据库",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_dataset_metrics",
    description: "获取指定dataset的所有metrics",
    inputSchema: {
      type: "object",
      properties: {
        dataset_id: {
          type: "number",
          description: "Dataset的ID",
        },
      },
      required: ["dataset_id"],
    },
  },
  {
    name: "create_dataset_metric",
    description: "为dataset创建新的metric",
    inputSchema: {
      type: "object",
      properties: {
        dataset_id: {
          type: "number",
          description: "Dataset的ID",
        },
        metric_name: {
          type: "string",
          description: "Metric名称",
        },
        expression: {
          type: "string",
          description: "Metric表达式（SQL表达式）",
        },
        metric_type: {
          type: "string",
          description: "Metric类型（可选）",
        },
        description: {
          type: "string",
          description: "Metric描述（可选）",
        },
        verbose_name: {
          type: "string",
          description: "Metric显示名称（可选）",
        },
        d3format: {
          type: "string",
          description: "D3格式化字符串（可选）",
        },
      },
      required: ["dataset_id", "metric_name", "expression"],
    },
  },
  {
    name: "update_dataset_metric",
    description: "更新dataset中的metric",
    inputSchema: {
      type: "object",
      properties: {
        dataset_id: {
          type: "number",
          description: "Dataset的ID",
        },
        metric_id: {
          type: "number",
          description: "Metric的ID",
        },
        metric_name: {
          type: "string",
          description: "Metric名称（可选）",
        },
        expression: {
          type: "string",
          description: "Metric表达式（可选）",
        },
        description: {
          type: "string",
          description: "Metric描述（可选）",
        },
        verbose_name: {
          type: "string",
          description: "Metric显示名称（可选）",
        },
        d3format: {
          type: "string",
          description: "D3格式化字符串（可选）",
        },
      },
      required: ["dataset_id", "metric_id"],
    },
  },
  {
    name: "delete_dataset_metric",
    description: "删除dataset中的metric",
    inputSchema: {
      type: "object",
      properties: {
        dataset_id: {
          type: "number",
          description: "Dataset的ID",
        },
        metric_id: {
          type: "number",
          description: "要删除的Metric的ID",
        },
      },
      required: ["dataset_id", "metric_id"],
    },
  },
  {
    name: "get_dataset_columns",
    description: "获取dataset的字段信息，用于创建metrics时参考可用字段",
    inputSchema: {
      type: "object",
      properties: {
        dataset_id: {
          type: "number",
          description: "Dataset的ID",
        },
      },
      required: ["dataset_id"],
    },
  },
  {
    name: "execute_sql",
    description: "使用/api/v1/sqllab/execute/端点执行SQL查询",
    inputSchema: {
      type: "object",
      properties: {
        database_id: {
          type: "number",
          description: "数据库ID",
        },
        sql: {
          type: "string",
          description: "要执行的SQL查询语句",
        },
        schema: {
          type: "string",
          description: "数据库schema（可选）",
        },
        limit: {
          type: "number",
          description: "查询结果行数限制（默认1000）",
          default: 1000,
        },
        expand_data: {
          type: "boolean",
          description: "是否展开数据（默认true）",
          default: true,
        },
      },
      required: ["database_id", "sql"],
    },
  },
]; 