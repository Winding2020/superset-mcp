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

// 注释层的结构
const AnnotationLayerSchema = z.object({
  annotationType: z.string(),
  color: z.string().optional(),
  descriptionColumns: z.array(z.string()).optional(),
  hideLine: z.boolean().optional(),
  intervalEndColumn: z.string().optional(),
  name: z.string(),
  opacity: z.string().optional(),
  overrides: z.record(z.any()).optional(),
  show: z.boolean(),
  showMarkers: z.boolean().optional(),
  sourceType: z.string(),
  style: z.string().optional(),
  timeColumn: z.string().optional(),
  titleColumn: z.string().optional(),
  value: z.number().optional(),
  width: z.number().optional(),
});

// 颜色对象结构
const ColorSchema = z.object({
  r: z.number().min(0).max(255),
  g: z.number().min(0).max(255),
  b: z.number().min(0).max(255),
  a: z.number().min(0).max(1),
});

// 时间序列基础参数
const TimeseriesBaseParamsSchema = z.object({
  datasource: z.string(),
  viz_type: z.string(),
  x_axis: z.string().optional(),
  time_grain_sqla: z.string().optional(),
  groupby: z.array(z.string()).default([]),
  metrics: z.array(z.union([MetricSchema, z.string()])).default([]),
  adhoc_filters: z.array(AdhocFilterSchema).default([]),
  row_limit: z.number().default(1000),
  time_range: z.string().default('No filter'),
  annotation_layers: z.array(AnnotationLayerSchema).default([]),
  color_scheme: z.string().default('supersetColors'),
});

// ===== ECharts 时间序列折线图 - viz_type: 'echarts_timeseries_line' =====
export const EchartsTimeseriesLineParamsSchema = TimeseriesBaseParamsSchema.extend({
  viz_type: z.literal('echarts_timeseries_line'),
  // 系列样式
  seriesType: z.enum(['line', 'scatter', 'smooth', 'bar', 'start', 'middle', 'end']).default('line'),
  // 图表选项
  show_value: z.boolean().default(false),
  area: z.boolean().default(false),
  opacity: z.number().min(0).max(1).default(0.7),
  markerEnabled: z.boolean().default(false),
  markerSize: z.number().min(0).max(20).default(6),
  zoomable: z.boolean().default(false),
  // 图例
  show_legend: z.boolean().default(true),
  legendType: z.enum(['scroll', 'plain']).default('scroll'),
  legendOrientation: z.enum(['top', 'bottom', 'left', 'right']).default('top'),
  // X轴
  x_axis_time_format: z.string().default('smart_date'),
  x_axis_label_rotation: z.number().default(0),
  x_axis_title: z.string().default(''),
  x_axis_title_margin: z.number().default(15),
  truncateXAxis: z.boolean().default(true),
  x_axis_bounds: z.tuple([z.union([z.string(), z.number()]).nullable(), z.union([z.string(), z.number()]).nullable()]).default([null, null]),
  // Y轴
  y_axis_format: z.string().default('SMART_NUMBER'),
  currency_format: z.object({
    symbol: z.string(),
    symbolPosition: z.enum(['prefix', 'suffix']),
  }).optional(),
  logAxis: z.boolean().default(false),
  y_axis_title: z.string().default(''),
  y_axis_title_margin: z.number().default(15),
  truncateYAxis: z.boolean().default(false),
  y_axis_bounds: z.tuple([z.number().nullable(), z.number().nullable()]).default([null, null]),
  minorSplitLine: z.boolean().default(false),
  // 工具提示
  rich_tooltip: z.boolean().default(true),
  tooltipTimeFormat: z.string().default('smart_date'),
  tooltipSortByMetric: z.boolean().default(false),
  // 高级分析
  rolling_type: z.enum(['None', 'mean', 'sum', 'std']).optional(),
  rolling_periods: z.number().optional(),
  min_periods: z.number().optional(),
  // 预测
  forecastEnabled: z.boolean().default(false),
  forecastPeriods: z.number().default(10),
  forecastInterval: z.number().default(0.8),
  forecastSeasonalityDaily: z.boolean().optional(),
  forecastSeasonalityWeekly: z.boolean().optional(),
  forecastSeasonalityYearly: z.boolean().optional(),
});

// ===== ECharts 时间序列柱状图 - viz_type: 'echarts_timeseries_bar' =====
export const EchartsTimeseriesBarParamsSchema = TimeseriesBaseParamsSchema.extend({
  viz_type: z.literal('echarts_timeseries_bar'),
  // 方向
  orientation: z.enum(['vertical', 'horizontal']).default('vertical'),
  // 图表选项
  show_value: z.boolean().default(false),
  stack: z.boolean().default(false),
  zoomable: z.boolean().default(false),
  // 图例
  show_legend: z.boolean().default(true),
  legendType: z.enum(['scroll', 'plain']).default('scroll'),
  legendOrientation: z.enum(['top', 'bottom', 'left', 'right']).default('top'),
  // X轴
  x_axis_time_format: z.string().default('smart_date'),
  x_axis_label_rotation: z.number().default(0),
  x_axis_title: z.string().default(''),
  x_axis_title_margin: z.number().default(15),
  x_axis_title_position: z.enum(['Low', 'Middle', 'High']).default('Low'),
  truncateXAxis: z.boolean().default(true),
  x_axis_bounds: z.tuple([z.union([z.string(), z.number()]).nullable(), z.union([z.string(), z.number()]).nullable()]).default([null, null]),
  // Y轴
  y_axis_format: z.string().default('SMART_NUMBER'),
  currency_format: z.object({
    symbol: z.string(),
    symbolPosition: z.enum(['prefix', 'suffix']),
  }).optional(),
  logAxis: z.boolean().default(false),
  y_axis_title: z.string().default(''),
  y_axis_title_margin: z.number().default(15),
  y_axis_title_position: z.enum(['Low', 'Middle', 'High']).default('Low'),
  truncateYAxis: z.boolean().default(false),
  y_axis_bounds: z.tuple([z.number().nullable(), z.number().nullable()]).default([null, null]),
  minorSplitLine: z.boolean().default(false),
  // 工具提示
  rich_tooltip: z.boolean().default(true),
  tooltipTimeFormat: z.string().default('smart_date'),
  tooltipSortByMetric: z.boolean().default(false),
});

// ===== 混合时间序列图 - viz_type: 'mixed_timeseries' =====
export const MixedTimeseriesParamsSchema = TimeseriesBaseParamsSchema.extend({
  viz_type: z.literal('mixed_timeseries'),
  // 共享字段
  x_axis: z.string(),
  time_grain_sqla: z.string().default('P1D'),
  
  // 查询A (没有后缀的是查询A)
  metrics: z.array(z.union([MetricSchema, z.string()])).default([]),
  groupby: z.array(z.string()).default([]),
  adhoc_filters: z.array(AdhocFilterSchema).default([]),
  limit: z.number().default(0),
  timeseries_limit_metric: z.union([MetricSchema, z.string()]).optional(),
  order_desc: z.boolean().default(false),
  row_limit: z.number().default(1000),
  truncate_metric: z.boolean().default(true),
  
  // 查询B (带_b后缀)
  metrics_b: z.array(z.union([MetricSchema, z.string()])).default([]),
  groupby_b: z.array(z.string()).default([]),
  adhoc_filters_b: z.array(AdhocFilterSchema).default([]),
  limit_b: z.number().default(0),
  timeseries_limit_metric_b: z.union([MetricSchema, z.string()]).optional(),
  order_desc_b: z.boolean().default(false),
  row_limit_b: z.number().default(1000),
  truncate_metric_b: z.boolean().default(true),
  
  // 查询A的自定义选项 (没有后缀)
  seriesType: z.enum(['line', 'scatter', 'smooth', 'bar', 'start', 'middle', 'end']).default('line'),
  stack: z.boolean().default(false),
  area: z.boolean().default(false),
  show_value: z.boolean().default(false),
  opacity: z.number().min(0).max(1).default(0.7),
  markerEnabled: z.boolean().default(false),
  markerSize: z.number().min(0).max(100).default(6),
  yAxisIndex: z.number().default(0),
  
  // 查询B的自定义选项 (带B后缀)
  seriesTypeB: z.enum(['line', 'scatter', 'smooth', 'bar', 'start', 'middle', 'end']).default('line'),
  stackB: z.boolean().default(false),
  areaB: z.boolean().default(false),
  show_valueB: z.boolean().default(false),
  opacityB: z.number().min(0).max(1).default(0.7),
  markerEnabledB: z.boolean().default(false),
  markerSizeB: z.number().min(0).max(100).default(6),
  yAxisIndexB: z.number().default(1),
  
  // 图表选项
  zoomable: z.boolean().default(false),
  minorTicks: z.boolean().default(false),
  
  // 图例
  show_legend: z.boolean().default(true),
  legendType: z.enum(['scroll', 'plain']).default('scroll'),
  legendOrientation: z.enum(['top', 'bottom', 'left', 'right']).default('top'),
  
  // X轴
  x_axis_time_format: z.string().default('smart_date'),
  xAxisLabelRotation: z.number().default(0),
  truncateXAxis: z.boolean().default(true),
  xAxisBounds: z.tuple([z.union([z.string(), z.number()]).nullable(), z.union([z.string(), z.number()]).nullable()]).default([null, null]),
  
  // 主Y轴
  y_axis_format: z.string().default('SMART_NUMBER'),
  y_axis_title: z.string().default(''),
  logAxis: z.boolean().default(false),
  truncateYAxis: z.boolean().default(false),
  y_axis_bounds: z.tuple([z.number().nullable(), z.number().nullable()]).default([null, null]),
  minorSplitLine: z.boolean().default(false),
  
  // 次Y轴
  y_axis_format_secondary: z.string().default('SMART_NUMBER'),
  yAxisTitleSecondary: z.string().default(''),
  logAxisSecondary: z.boolean().default(false),
  truncateYAxisSecondary: z.boolean().default(false),
  y_axis_bounds_secondary: z.tuple([z.number().nullable(), z.number().nullable()]).default([null, null]),
  currency_format_secondary: z.object({
    symbol: z.string(),
    symbolPosition: z.enum(['prefix', 'suffix']),
  }).optional(),
  
  // 工具提示
  rich_tooltip: z.boolean().default(true),
  tooltipTimeFormat: z.string().default('smart_date'),
  tooltipSortByMetric: z.boolean().default(false),
});

// ===== 瀑布图 - viz_type: 'waterfall' =====
export const WaterfallParamsSchema = TimeseriesBaseParamsSchema.extend({
  viz_type: z.literal('waterfall'),
  groupby: z.string().optional(), // 瀑布图的 groupby 是单个字符串，不是数组
  metric: z.union([MetricSchema, z.string()]),
  // 图表选项
  show_value: z.boolean().default(false),
  show_legend: z.boolean().default(false),
  // 系列颜色
  increase_color: ColorSchema.default({ r: 90, g: 193, b: 137, a: 1 }),
  decrease_color: ColorSchema.default({ r: 224, g: 67, b: 85, a: 1 }),
  total_color: ColorSchema.default({ r: 102, g: 102, b: 102, a: 1 }),
  // X轴
  x_axis_label: z.string().default(''),
  x_axis_time_format: z.string().default('smart_date'),
  x_ticks_layout: z.enum(['auto', 'flat', '45°', '90°', 'staggered']).default('auto'),
  // Y轴
  y_axis_label: z.string().default(''),
  y_axis_format: z.string().default('SMART_NUMBER'),
  currency_format: z.object({
    symbol: z.string(),
    symbolPosition: z.enum(['prefix', 'suffix']),
  }).optional(),
});

// ===== 联合类型：所有时间序列图表参数 =====
export type TimeseriesChartParams = 
  | z.infer<typeof EchartsTimeseriesLineParamsSchema>
  | z.infer<typeof EchartsTimeseriesBarParamsSchema>
  | z.infer<typeof MixedTimeseriesParamsSchema>
  | z.infer<typeof WaterfallParamsSchema>;

// ===== 根据 viz_type 获取对应的 Schema =====
export function getTimeseriesSchemaByVizType(vizType: string) {
  const schemaMap = {
    'echarts_timeseries_line': EchartsTimeseriesLineParamsSchema,
    'echarts_timeseries': EchartsTimeseriesLineParamsSchema, // 别名
    'echarts_timeseries_bar': EchartsTimeseriesBarParamsSchema,
    'mixed_timeseries': MixedTimeseriesParamsSchema,
    'waterfall': WaterfallParamsSchema,
  } as const;

  return schemaMap[vizType as keyof typeof schemaMap];
}

// ===== 验证函数 =====
export function validateTimeseriesChartParams(vizType: string, params: any): { success: boolean; error?: string; data?: any } {
  const schema = getTimeseriesSchemaByVizType(vizType);
  
  if (!schema) {
    return {
      success: false,
      error: `Unsupported timeseries viz_type: ${vizType}`,
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
export function generateTimeseriesDefaultParams(vizType: string, datasource: string): TimeseriesChartParams | null {
  const baseParams = {
    datasource,
    viz_type: vizType,
    x_axis: '',
    time_grain_sqla: 'P1D',
    groupby: [],
    metrics: ['count'],
    adhoc_filters: [],
    row_limit: 1000,
    time_range: 'No filter',
    annotation_layers: [],
    color_scheme: 'supersetColors',
  };

  switch (vizType) {
    case 'echarts_timeseries_line':
    case 'echarts_timeseries':
      return EchartsTimeseriesLineParamsSchema.parse(baseParams);
    case 'echarts_timeseries_bar':
      return EchartsTimeseriesBarParamsSchema.parse(baseParams);
    case 'mixed_timeseries':
      return MixedTimeseriesParamsSchema.parse({
        ...baseParams,
        x_axis: '',
        time_grain_sqla: 'P1D',
        metrics: ['count'],
        metrics_b: [],
        groupby: [],
        groupby_b: [],
        adhoc_filters: [],
        adhoc_filters_b: [],
      });
    case 'waterfall':
      return WaterfallParamsSchema.parse({
        ...baseParams,
        groupby: undefined, // 瀑布图的 groupby 是可选的单个字符串
        metric: 'count',
      });
    default:
      return null;
  }
}

// ===== ECharts 时间序列系列类型枚举 =====
export enum EchartsTimeseriesSeriesType {
  Line = 'line',
  Scatter = 'scatter',
  Smooth = 'smooth',
  Bar = 'bar',
  Start = 'start',
  Middle = 'middle',
  End = 'end',
}

// ===== 工具函数：创建时间序列图表的基础配置 =====
export function createTimeseriesBaseConfig(vizType: string) {
  return {
    // 基础时间配置
    time_grain_sqla: 'P1D', // 按天聚合
    time_range: 'Last week', // 最近一周
    
    // 基础显示配置
    show_legend: true,
    rich_tooltip: true,
    zoomable: true,
    
    // 轴配置
    x_axis_time_format: 'smart_date',
    y_axis_format: 'SMART_NUMBER',
    truncateXAxis: true,
    truncateYAxis: false,
    
    // 颜色方案
    color_scheme: 'supersetColors',
  };
}

// ===== 工具函数：验证时间序列必需字段 =====
export function validateTimeseriesRequiredFields(params: any): string[] {
  const errors: string[] = [];
  
  if (!params.datasource) {
    errors.push('datasource is required');
  }
  
  if (!params.metrics || params.metrics.length === 0) {
    errors.push('At least one metric is required');
  }
  
  // 对于混合时间序列，需要检查A或B至少有一个有指标
  if (params.viz_type === 'mixed_timeseries') {
    const hasMetricsA = params.metricsA && params.metricsA.length > 0;
    const hasMetricsB = params.metricsB && params.metricsB.length > 0;
    
    if (!hasMetricsA && !hasMetricsB) {
      errors.push('Mixed timeseries chart requires metrics in at least one query (A or B)');
    }
  }
  
  // 对于瀑布图，需要单个指标
  if (params.viz_type === 'waterfall' && !params.metric) {
    errors.push('Waterfall chart requires exactly one metric');
  }
  
  return errors;
} 