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

// 通用基础参数
const BaseParamsSchema = z.object({
  datasource: z.string(),
  viz_type: z.string(),
  adhoc_filters: z.array(AdhocFilterSchema).default([]),
  row_limit: z.number().default(1000),
  time_range: z.string().default('No filter'),
  annotation_layers: z.array(z.any()).default([]),
});

// ===== 柱状图 (Bar Chart) - viz_type: 'bar' =====
export const BarChartParamsSchema = BaseParamsSchema.extend({
  viz_type: z.literal('bar'),
  groupby: z.array(z.string()).default([]),
  metrics: z.array(z.union([MetricSchema, z.string()])).default([]),
  color_scheme: z.string().default('supersetColors'),
  show_brush: z.boolean().default(false),
  show_legend: z.boolean().default(true),
  show_bar_value: z.boolean().default(false),
  rich_tooltip: z.boolean().default(true),
  bar_stacked: z.boolean().default(false),
  line_interpolation: z.string().default('linear'),
  show_controls: z.boolean().default(false),
  bottom_margin: z.union([z.number(), z.literal('auto')]).default('auto'),
  x_axis_label: z.string().default(''),
  y_axis_label: z.string().default(''),
  x_ticks_layout: z.enum(['auto', 'flat', '45°', 'staggered']).default('auto'),
  x_axis_format: z.string().default(''),
  x_axis_showminmax: z.boolean().default(true),
  y_axis_showminmax: z.boolean().default(true),
  y_log_scale: z.boolean().default(false),
  y_axis_format: z.string().default('SMART_NUMBER'),
  y_axis_bounds: z.tuple([z.number().nullable(), z.number().nullable()]).default([null, null]),
  reduce_x_ticks: z.boolean().default(false),
  left_margin: z.union([z.number(), z.literal('auto')]).default('auto'),
});

// ===== 折线图 (Line Chart) - viz_type: 'line' =====
export const LineChartParamsSchema = BaseParamsSchema.extend({
  viz_type: z.literal('line'),
  groupby: z.array(z.string()).default([]),
  metrics: z.array(z.union([MetricSchema, z.string()])).default([]),
  color_scheme: z.string().default('supersetColors'),
  show_brush: z.boolean().default(false),
  show_legend: z.boolean().default(true),
  rich_tooltip: z.boolean().default(true),
  line_interpolation: z.enum(['linear', 'basis', 'cardinal', 'monotone', 'step-before', 'step-after']).default('linear'),
  show_markers: z.boolean().default(false),
  x_axis_label: z.string().default(''),
  y_axis_label: z.string().default(''),
  x_axis_format: z.string().default(''),
  y_axis_format: z.string().default('SMART_NUMBER'),
  y_axis_bounds: z.tuple([z.number().nullable(), z.number().nullable()]).default([null, null]),
  y_log_scale: z.boolean().default(false),
});

// ===== 饼图 (Pie Chart) - viz_type: 'pie' =====
export const PieChartParamsSchema = BaseParamsSchema.extend({
  viz_type: z.literal('pie'),
  groupby: z.array(z.string()).default([]),
  metric: z.union([MetricSchema, z.string()]),
  color_scheme: z.string().default('supersetColors'),
  show_labels_threshold: z.number().default(5),
  rose_type: z.enum(['area', 'radius']).nullable().default(null),
  show_legend: z.boolean().default(true),
  label_type: z.enum([
    'key', 'value', 'percent', 'key_value', 
    'key_percent', 'key_value_percent', 'value_percent', 'template'
  ]).default('key'),
  label_template: z.string().optional(),
  number_format: z.string().default('SMART_NUMBER'),
  currency_format: z.object({
    symbol: z.string(),
    symbolPosition: z.enum(['prefix', 'suffix']),
  }).optional(),
  date_format: z.string().default('smart_date'),
  show_labels: z.boolean().default(true),
  labels_outside: z.boolean().default(true),
  donut: z.boolean().default(false),
  inner_radius: z.number().min(0).max(100).default(30),
  outer_radius: z.number().min(0).max(100).default(70),
  sort_by_metric: z.boolean().default(true),
});

// ===== 面积图 (Area Chart) - viz_type: 'area' =====
export const AreaChartParamsSchema = BaseParamsSchema.extend({
  viz_type: z.literal('area'),
  groupby: z.array(z.string()).default([]),
  metrics: z.array(z.union([MetricSchema, z.string()])).default([]),
  color_scheme: z.string().default('supersetColors'),
  show_brush: z.boolean().default(false),
  show_legend: z.boolean().default(true),
  rich_tooltip: z.boolean().default(true),
  line_interpolation: z.enum(['linear', 'basis', 'cardinal', 'monotone', 'step-before', 'step-after']).default('linear'),
  stacked_style: z.enum(['stack', 'stream', 'expand']).default('stack'),
  x_axis_label: z.string().default(''),
  y_axis_label: z.string().default(''),
  x_axis_format: z.string().default(''),
  y_axis_format: z.string().default('SMART_NUMBER'),
  y_axis_bounds: z.tuple([z.number().nullable(), z.number().nullable()]).default([null, null]),
  y_log_scale: z.boolean().default(false),
});

// ===== 表格 (Table) - viz_type: 'table' =====
export const TableParamsSchema = BaseParamsSchema.extend({
  viz_type: z.literal('table'),
  query_mode: z.enum(['aggregate', 'raw']).default('aggregate'),
  // 聚合模式参数
  groupby: z.array(z.string()).default([]),
  metrics: z.array(z.union([MetricSchema, z.string()])).default([]),
  percent_metrics: z.array(z.union([MetricSchema, z.string()])).default([]),
  // 原始模式参数
  all_columns: z.array(z.string()).default([]),
  // 通用表格参数
  table_timestamp_format: z.string().default('smart_date'),
  page_length: z.enum(['0', '10', '25', '50', '100', '250', '500']).default('0'),
  include_search: z.boolean().default(false),
  show_cell_bars: z.boolean().default(true),
  align_pn: z.boolean().default(false),
  color_pn: z.boolean().default(true),
  column_config: z.record(z.object({
    alignPositiveNegative: z.boolean().optional(),
    colorPositiveNegative: z.boolean().optional(),
    columnWidth: z.number().optional(),
    currencyFormat: z.object({
      symbol: z.string(),
      symbolPosition: z.enum(['prefix', 'suffix']),
    }).optional(),
    d3NumberFormat: z.string().optional(),
    d3SmallNumberFormat: z.string().optional(),
    d3TimeFormat: z.string().optional(),
    horizontalAlign: z.enum(['left', 'center', 'right']).optional(),
    showCellBars: z.boolean().optional(),
    truncateLongCells: z.boolean().optional(),
  })).default({}),
});

// ===== 散点图 (Scatter Plot) - viz_type: 'echarts_timeseries_scatter' =====
export const ScatterPlotParamsSchema = BaseParamsSchema.extend({
  viz_type: z.literal('echarts_timeseries_scatter'),
  x_axis: z.string(),
  groupby: z.array(z.string()).default([]),
  metric: z.union([MetricSchema, z.string()]),
  size: z.union([MetricSchema, z.string()]).optional(),
  color_scheme: z.string().default('supersetColors'),
  show_legend: z.boolean().default(true),
  x_axis_title: z.string().default(''),
  y_axis_title: z.string().default(''),
  x_axis_title_margin: z.number().default(15),
  y_axis_title_margin: z.number().default(15),
  truncate_metric: z.boolean().default(true),
  x_axis_time_format: z.string().default('smart_date'),
  y_axis_format: z.string().default('SMART_NUMBER'),
  logAxis: z.boolean().default(false),
  minorSplitLine: z.boolean().default(false),
  truncateXAxis: z.boolean().default(true),
  truncateYAxis: z.boolean().default(false),
  y_axis_bounds: z.tuple([z.number().nullable(), z.number().nullable()]).default([null, null]),
  x_axis_bounds: z.tuple([z.number().nullable(), z.number().nullable()]).default([null, null]),
  rich_tooltip: z.boolean().default(true),
  tooltipTimeFormat: z.string().default('smart_date'),
  extra_form_data: z.record(z.any()).default({}),
});

// ===== 气泡图 (Bubble Chart) - viz_type: 'bubble' =====
export const BubbleChartParamsSchema = BaseParamsSchema.extend({
  viz_type: z.literal('bubble'),
  series: z.string(),
  entity: z.string(),
  x: z.union([MetricSchema, z.string()]),
  y: z.union([MetricSchema, z.string()]),
  size: z.union([MetricSchema, z.string()]),
  color_scheme: z.string().default('supersetColors'),
  show_legend: z.boolean().default(true),
  max_bubble_size: z.number().default(25),
  x_axis_label: z.string().default(''),
  y_axis_label: z.string().default(''),
  x_log_scale: z.boolean().default(false),
  y_log_scale: z.boolean().default(false),
  x_axis_format: z.string().default(''),
  y_axis_format: z.string().default('SMART_NUMBER'),
});

// ===== 词云 (Word Cloud) - viz_type: 'word_cloud' =====
export const WordCloudParamsSchema = BaseParamsSchema.extend({
  viz_type: z.literal('word_cloud'),
  series: z.string(),
  metric: z.union([MetricSchema, z.string()]),
  color_scheme: z.string().default('supersetColors'),
  font_size_from: z.number().default(20),
  font_size_to: z.number().default(150),
  rotation: z.enum(['square', 'flat', 'random']).default('square'),
  spiral: z.enum(['archimedean', 'rectangular']).default('rectangular'),
});

// ===== 联合类型：所有基础图表参数 =====
export type BasicChartParams = 
  | z.infer<typeof BarChartParamsSchema>
  | z.infer<typeof LineChartParamsSchema>
  | z.infer<typeof PieChartParamsSchema>
  | z.infer<typeof AreaChartParamsSchema>
  | z.infer<typeof TableParamsSchema>
  | z.infer<typeof ScatterPlotParamsSchema>
  | z.infer<typeof BubbleChartParamsSchema>
  | z.infer<typeof WordCloudParamsSchema>;

// ===== 根据 viz_type 获取对应的 Schema =====
export function getSchemaByVizType(vizType: string) {
  const schemaMap = {
    'bar': BarChartParamsSchema,
    'line': LineChartParamsSchema,
    'pie': PieChartParamsSchema,
    'area': AreaChartParamsSchema,
    'table': TableParamsSchema,
    'echarts_timeseries_scatter': ScatterPlotParamsSchema,
    'bubble': BubbleChartParamsSchema,
    'word_cloud': WordCloudParamsSchema,
  } as const;

  return schemaMap[vizType as keyof typeof schemaMap];
}

// ===== 验证函数 =====
export function validateChartParams(vizType: string, params: any): { success: boolean; error?: string; data?: any } {
  const schema = getSchemaByVizType(vizType);
  
  if (!schema) {
    return {
      success: false,
      error: `Unsupported viz_type: ${vizType}`,
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
export function generateDefaultParams(vizType: string, datasource: string): BasicChartParams | null {
  const baseParams = {
    datasource,
    viz_type: vizType,
    adhoc_filters: [],
    row_limit: 1000,
    time_range: 'No filter',
    annotation_layers: [],
  };

  switch (vizType) {
    case 'bar':
      return BarChartParamsSchema.parse(baseParams);
    case 'line':
      return LineChartParamsSchema.parse(baseParams);
    case 'pie':
      return PieChartParamsSchema.parse({ ...baseParams, metric: 'count' });
    case 'area':
      return AreaChartParamsSchema.parse(baseParams);
    case 'table':
      return TableParamsSchema.parse(baseParams);
    case 'echarts_timeseries_scatter':
      return ScatterPlotParamsSchema.parse({ ...baseParams, x_axis: '', metric: 'count' });
    case 'bubble':
      return BubbleChartParamsSchema.parse({ 
        ...baseParams, 
        series: '', 
        entity: '', 
        x: 'count', 
        y: 'count', 
        size: 'count' 
      });
    case 'word_cloud':
      return WordCloudParamsSchema.parse({ ...baseParams, series: '', metric: 'count' });
    default:
      return null;
  }
} 