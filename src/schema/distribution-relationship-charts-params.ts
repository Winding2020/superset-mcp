import { z } from 'zod';

// ===== 通用基础类型定义 =====

// 指标对象的结构
const MetricSchema = z.object({
  aggregate: z.string().optional(),
  column: z.object({
    column_name: z.string(),
    description: z.string().nullable(),
    expression: z.string().nullable(),
    filterable: z.boolean(),
    groupby: z.boolean(),
    id: z.number(),
    is_dttm: z.boolean(),
    optionName: z.string(),
    python_date_format: z.string().nullable(),
    type: z.string(),
    verbose_name: z.string().nullable(),
  }).optional(),
  expressionType: z.enum(['SIMPLE', 'SQL']),
  hasCustomLabel: z.boolean().optional(),
  isNew: z.boolean().optional(),
  label: z.string(),
  optionName: z.string(),
  sqlExpression: z.string().nullable(),
});

// 临时过滤器的结构
const AdhocFilterSchema = z.object({
  clause: z.enum(['WHERE', 'HAVING']),
  comparator: z.union([z.string(), z.number(), z.array(z.string()), z.array(z.number())]).optional(),
  expressionType: z.enum(['SIMPLE', 'SQL']),
  filterOptionName: z.string().optional(),
  operator: z.string().optional(),
  sqlExpression: z.string().optional(),
  subject: z.string().optional(),
});

// 列配置对象
const ColumnConfigSchema = z.record(z.object({
  radarMetricMaxValue: z.number().optional(),
  d3NumberFormat: z.string().optional(),
  d3TimeFormat: z.string().optional(),
  currencyFormat: z.object({
    symbol: z.string(),
    symbolPosition: z.enum(['prefix', 'suffix']),
  }).optional(),
}));

// 分布与关系图表基础参数
const DistributionRelationshipBaseParamsSchema = z.object({
  datasource: z.string(),
  viz_type: z.string(),
  adhoc_filters: z.array(AdhocFilterSchema).default([]),
  row_limit: z.number().default(1000),
  time_range: z.string().default('No filter'),
  color_scheme: z.string().default('supersetColors'),
});

// ===== 直方图 - viz_type: 'histogram_v2' =====
export const HistogramParamsSchema = DistributionRelationshipBaseParamsSchema.extend({
  viz_type: z.literal('histogram_v2'),
  column: z.string(), // 用于计算直方图的数值列
  groupby: z.array(z.string()).default([]),
  bins: z.number().min(1).max(100).default(5), // 直方图的分箱数量
  normalize: z.boolean().default(false), // 是否标准化
  cumulative: z.boolean().default(false), // 是否累积
  // 图表选项
  show_value: z.boolean().default(false),
  show_legend: z.boolean().default(true),
  x_axis_title: z.string().default(''),
  y_axis_title: z.string().default(''),
});

// ===== 箱形图 - viz_type: 'box_plot' =====
export const BoxPlotParamsSchema = DistributionRelationshipBaseParamsSchema.extend({
  viz_type: z.literal('box_plot'),
  columns: z.array(z.string()).min(1), // 用于计算分布的列
  time_grain_sqla: z.string().optional(),
  temporal_columns_lookup: z.record(z.boolean()).optional(),
  groupby: z.array(z.string()).default([]), // X轴上的分组维度
  metrics: z.array(z.union([MetricSchema, z.string()])).default([]),
  series_limit: z.number().default(0),
  series_limit_metric: z.union([MetricSchema, z.string()]).optional(),
  whiskerOptions: z.enum(['Tukey', 'Min/max (no outliers)', '2/98 percentiles', '9/91 percentiles']).default('Tukey'),
  // 图表选项
  x_ticks_layout: z.enum(['auto', 'flat', '45°', '90°', 'staggered']).default('auto'),
  number_format: z.string().default('SMART_NUMBER'),
  date_format: z.string().default('smart_date'),
});

// ===== 雷达图 - viz_type: 'radar' =====
export const RadarParamsSchema = DistributionRelationshipBaseParamsSchema.extend({
  viz_type: z.literal('radar'),
  groupby: z.array(z.string()).default([]),
  metrics: z.array(z.union([MetricSchema, z.string()])).default([]),
  timeseries_limit_metric: z.union([MetricSchema, z.string()]).optional(),
  row_limit: z.number().default(10),
  // 图例
  show_legend: z.boolean().default(true),
  legendType: z.enum(['scroll', 'plain']).default('scroll'),
  legendOrientation: z.enum(['top', 'bottom', 'left', 'right']).default('top'),
  // 标签
  show_labels: z.boolean().default(false),
  label_type: z.enum(['value', 'key_value']).default('value'),
  label_position: z.enum(['top', 'left', 'right', 'bottom', 'inside', 'insideLeft', 'insideRight', 'insideTop', 'insideBottom', 'insideTopLeft', 'insideBottomLeft', 'insideTopRight', 'insideBottomRight']).default('top'),
  number_format: z.string().default('SMART_NUMBER'),
  date_format: z.string().default('smart_date'),
  // 雷达图特有
  column_config: ColumnConfigSchema.default({}),
  is_circle: z.boolean().default(false), // 是否为圆形雷达图
});

// ===== 关系图 - viz_type: 'graph_chart' =====
export const GraphChartParamsSchema = DistributionRelationshipBaseParamsSchema.extend({
  viz_type: z.literal('graph_chart'),
  source: z.string(), // 源节点
  target: z.string(), // 目标节点
  metric: z.union([MetricSchema, z.string()]), // 连接权重
  source_category: z.string().optional(), // 源节点分类
  target_category: z.string().optional(), // 目标节点分类
  // 图例
  show_legend: z.boolean().default(true),
  legendType: z.enum(['scroll', 'plain']).default('scroll'),
  legendOrientation: z.enum(['top', 'bottom', 'left', 'right']).default('top'),
  // 布局
  layout: z.enum(['force', 'circular']).default('force'),
  edgeSymbol: z.enum(['none,none', 'none,arrow', 'circle,arrow', 'circle,circle']).default('none,none'),
  draggable: z.boolean().default(true), // 是否可拖拽节点（仅在力导向布局中有效）
  roam: z.union([z.boolean(), z.enum(['scale', 'move'])]).default(true), // 图形漫游控制
  selectedMode: z.union([z.boolean(), z.enum(['single', 'multiple'])]).default(false), // 节点选择模式
  showSymbolThreshold: z.number().default(0), // 标签显示阈值
  // 力导向布局参数
  gravity: z.number().default(0.1),
  friction: z.number().default(0.9),
  edgeLength: z.number().default(400),
  repulsion: z.number().default(1000),
  // 圆形布局参数
  layoutByCategory: z.boolean().default(true),
  category: z.string().optional(),
});

// ===== 日历热力图 - viz_type: 'cal_heatmap' =====
export const CalendarHeatmapParamsSchema = DistributionRelationshipBaseParamsSchema.extend({
  viz_type: z.literal('cal_heatmap'),
  metric: z.union([MetricSchema, z.string()]),
  // 日历配置
  domain_granularity: z.enum(['hour', 'day', 'week', 'month', 'year']).default('month'),
  subdomain_granularity: z.enum(['min', 'hour', 'day', 'week', 'month']).default('day'),
  // 显示选项
  cell_size: z.number().min(1).max(100).default(10),
  cell_padding: z.number().min(0).max(10).default(2),
  cell_radius: z.number().min(0).max(10).default(0),
  steps: z.number().min(3).max(11).default(10),
  // 时间范围
  since: z.string().optional(),
  until: z.string().optional(),
  // 颜色和格式
  linear_color_scheme: z.string().default('blue_white_yellow'),
  show_legend: z.boolean().default(true),
  show_values: z.boolean().default(false),
  y_axis_format: z.string().default('.3s'),
});

// ===== 网格热力图 - viz_type: 'heatmap_v2' =====
export const GridHeatmapParamsSchema = DistributionRelationshipBaseParamsSchema.extend({
  viz_type: z.literal('heatmap_v2'),
  x_axis: z.string(),
  time_grain_sqla: z.string().optional(),
  groupby: z.array(z.string()).default([]),
  metric: z.union([MetricSchema, z.string()]),
  // 排序
  sort_x_axis: z.enum(['alpha_asc', 'alpha_desc', 'value_asc', 'value_desc']).default('alpha_asc'),
  sort_y_axis: z.enum(['alpha_asc', 'alpha_desc', 'value_asc', 'value_desc']).default('alpha_asc'),
  // 标准化
  normalize_across: z.enum(['heatmap', 'x', 'y']).default('heatmap'),
  // 图例
  legend_type: z.enum(['continuous', 'piecewise']).default('continuous'),
  show_legend: z.boolean().default(true),
  // 颜色
  linear_color_scheme: z.string().default('blue_white_yellow'),
  // 缩放和边距
  xscale_interval: z.number().default(-1), // -1 表示自动
  yscale_interval: z.number().default(-1),
  left_margin: z.union([z.number(), z.literal('auto')]).default('auto'),
  bottom_margin: z.union([z.number(), z.literal('auto')]).default('auto'),
  value_bounds: z.tuple([z.number().nullable(), z.number().nullable()]).default([null, null]),
  // 轴格式
  y_axis_format: z.string().default('SMART_NUMBER'),
  x_axis_time_format: z.string().default('smart_date'),
  currency_format: z.object({
    symbol: z.string(),
    symbolPosition: z.enum(['prefix', 'suffix']),
  }).optional(),
  show_percentage: z.boolean().default(false),
});

// ===== 联合类型：所有分布与关系图表参数 =====
export type DistributionRelationshipChartParams = 
  | z.infer<typeof HistogramParamsSchema>
  | z.infer<typeof BoxPlotParamsSchema>
  | z.infer<typeof RadarParamsSchema>
  | z.infer<typeof GraphChartParamsSchema>
  | z.infer<typeof CalendarHeatmapParamsSchema>
  | z.infer<typeof GridHeatmapParamsSchema>;

// ===== 根据 viz_type 获取对应的 Schema =====
export function getDistributionRelationshipSchemaByVizType(vizType: string) {
  const schemaMap = {
    'histogram_v2': HistogramParamsSchema,
    'histogram': HistogramParamsSchema, // 别名
    'box_plot': BoxPlotParamsSchema,
    'radar': RadarParamsSchema,
    'graph_chart': GraphChartParamsSchema,
    'cal_heatmap': CalendarHeatmapParamsSchema,
    'heatmap_v2': GridHeatmapParamsSchema,
    'heatmap': GridHeatmapParamsSchema, // 别名
  } as const;

  return schemaMap[vizType as keyof typeof schemaMap];
}

// ===== 验证函数 =====
export function validateDistributionRelationshipChartParams(vizType: string, params: any): { success: boolean; error?: string; data?: any } {
  const schema = getDistributionRelationshipSchemaByVizType(vizType);
  
  if (!schema) {
    return {
      success: false,
      error: `Unsupported distribution/relationship viz_type: ${vizType}`,
    };
  }

  try {
    const validatedData = schema.parse(params);
    return {
      success: true,
      data: validatedData,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Validation failed',
    };
  }
}

// ===== 生成默认参数 =====
export function generateDistributionRelationshipDefaultParams(vizType: string, datasource: string): DistributionRelationshipChartParams | null {
  const baseParams = {
    datasource,
    viz_type: vizType,
    adhoc_filters: [],
    row_limit: 1000,
    time_range: 'No filter',
    color_scheme: 'supersetColors',
  };

  switch (vizType) {
    case 'histogram_v2':
    case 'histogram':
      return HistogramParamsSchema.parse({
        ...baseParams,
        column: '',
        groupby: [],
        bins: 5,
      });
    case 'box_plot':
      return BoxPlotParamsSchema.parse({
        ...baseParams,
        columns: [],
        groupby: [],
        metrics: [],
      });
    case 'radar':
      return RadarParamsSchema.parse({
        ...baseParams,
        groupby: [],
        metrics: [],
      });
    case 'graph_chart':
      return GraphChartParamsSchema.parse({
        ...baseParams,
        source: '',
        target: '',
        metric: 'count',
      });
    case 'cal_heatmap':
      return CalendarHeatmapParamsSchema.parse({
        ...baseParams,
        metric: 'count',
      });
    case 'heatmap_v2':
    case 'heatmap':
      return GridHeatmapParamsSchema.parse({
        ...baseParams,
        x_axis: '',
        groupby: [],
        metric: 'count',
      });
    default:
      return null;
  }
}

// ===== 工具函数：验证分布图表必需字段 =====
export function validateDistributionChartRequiredFields(params: any): string[] {
  const errors: string[] = [];
  
  if (!params.datasource) {
    errors.push('datasource is required');
  }
  
  switch (params.viz_type) {
    case 'histogram_v2':
    case 'histogram':
      if (!params.column) {
        errors.push('column is required for histogram');
      }
      break;
      
    case 'box_plot':
      if (!params.columns || params.columns.length === 0) {
        errors.push('At least one column is required for box plot');
      }
      break;
      
    case 'radar':
      if (!params.metrics || params.metrics.length === 0) {
        errors.push('At least one metric is required for radar chart');
      }
      break;
      
    case 'graph_chart':
      if (!params.source) {
        errors.push('source is required for graph chart');
      }
      if (!params.target) {
        errors.push('target is required for graph chart');
      }
      if (!params.metric) {
        errors.push('metric is required for graph chart');
      }
      break;
      
    case 'cal_heatmap':
    case 'heatmap_v2':
    case 'heatmap':
      if (!params.metric) {
        errors.push('metric is required for heatmap');
      }
      break;
  }
  
  return errors;
}

// ===== 工具函数：创建分布分析的基础配置 =====
export function createDistributionAnalysisConfig() {
  return {
    // 基础统计配置
    show_legend: true,
    color_scheme: 'supersetColors',
    
    // 数值格式
    number_format: 'SMART_NUMBER',
    date_format: 'smart_date',
    
    // 行数限制
    row_limit: 1000,
  };
}

// ===== 工具函数：创建关系分析的基础配置 =====
export function createRelationshipAnalysisConfig() {
  return {
    // 基础显示配置
    show_legend: true,
    color_scheme: 'supersetColors',
    
    // 交互配置
    roam: true, // 允许缩放和移动
    selectedMode: 'single', // 单选模式
    
    // 布局配置
    layout: 'force', // 力导向布局
    draggable: true, // 可拖拽
  };
}

// ===== 枚举：直方图分箱策略 =====
export enum HistogramBinStrategy {
  Fixed = 'fixed',
  Auto = 'auto',
  Sturges = 'sturges',
  Scott = 'scott',
  FreedmanDiaconis = 'fd',
}

// ===== 枚举：箱形图异常值检测方法 =====
export enum BoxPlotWhiskerMethod {
  Tukey = 'Tukey',
  MinMax = 'Min/max (no outliers)',
  Percentile98 = '2/98 percentiles',
  Percentile91 = '9/91 percentiles',
}

// ===== 枚举：图布局类型 =====
export enum GraphLayoutType {
  Force = 'force',
  Circular = 'circular',
} 