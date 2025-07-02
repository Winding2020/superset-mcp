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

// 层级与流程图表基础参数
const HierarchyFlowBaseParamsSchema = z.object({
  datasource: z.string(),
  viz_type: z.string(),
  adhoc_filters: z.array(AdhocFilterSchema).default([]),
  row_limit: z.number().default(1000),
  time_range: z.string().default('No filter'),
  color_scheme: z.string().default('supersetColors'),
});

// ===== 树状图 - viz_type: 'treemap_v2' =====
export const TreemapParamsSchema = HierarchyFlowBaseParamsSchema.extend({
  viz_type: z.literal('treemap_v2'),
  groupby: z.array(z.string()).min(1), // 层级分组字段
  metric: z.union([MetricSchema, z.string()]), // 用于确定矩形大小的指标
  sort_by_metric: z.boolean().default(true),
  // 标签选项
  show_labels: z.boolean().default(true),
  show_upper_labels: z.boolean().default(true), // 是否显示上级节点标签
  label_type: z.enum(['Key', 'value', 'key_value']).default('Key'),
  number_format: z.string().default('SMART_NUMBER'),
  currency_format: z.object({
    symbol: z.string(),
    symbolPosition: z.enum(['prefix', 'suffix']),
  }).optional(),
  date_format: z.string().default('smart_date'),
});

// ===== 旭日图 - viz_type: 'sunburst_v2' =====
export const SunburstParamsSchema = HierarchyFlowBaseParamsSchema.extend({
  viz_type: z.literal('sunburst_v2'),
  columns: z.array(z.string()).min(1), // 层级列，从内到外
  metric: z.union([MetricSchema, z.string()]), // 主要指标，用于确定扇形大小
  secondary_metric: z.union([MetricSchema, z.string()]).optional(), // 次要指标，用于颜色映射
  sort_by_metric: z.boolean().default(true),
  // 颜色方案
  linear_color_scheme: z.string().default('blue_white_yellow'), // 用于次要指标的线性颜色
  // 标签选项
  show_labels: z.boolean().default(true),
  show_labels_threshold: z.number().min(0).max(100).default(5), // 显示标签的最小百分比阈值
  show_total: z.boolean().default(false), // 是否显示总计
  label_type: z.enum(['key', 'value', 'key_value']).default('key'),
  number_format: z.string().default('SMART_NUMBER'),
  currency_format: z.object({
    symbol: z.string(),
    symbolPosition: z.enum(['prefix', 'suffix']),
  }).optional(),
  date_format: z.string().default('smart_date'),
});

// ===== 树形图 - viz_type: 'tree_chart' =====
export const TreeChartParamsSchema = HierarchyFlowBaseParamsSchema.extend({
  viz_type: z.literal('tree_chart'),
  id: z.string(), // ID 列
  parent: z.string(), // 父节点 ID 列
  name: z.string().optional(), // 节点名称列
  root_node_id: z.string().optional(), // 根节点 ID
  metric: z.union([MetricSchema, z.string()]).optional(), // 节点值指标
  // 布局选项
  layout: z.enum(['orthogonal', 'radial']).default('orthogonal'),
  orient: z.enum(['LR', 'RL', 'TB', 'BT']).default('LR'), // 仅在正交布局中有效
  node_label_position: z.enum(['left', 'top', 'right', 'bottom']).default('left'),
  child_label_position: z.enum(['left', 'top', 'right', 'bottom']).default('bottom'),
  emphasis: z.enum(['ancestor', 'descendant']).default('ancestor'), // 鼠标悬停时高亮的相关节点
  // 符号和线条
  symbol: z.enum(['emptyCircle', 'circle', 'rect', 'roundRect', 'triangle', 'diamond', 'pin', 'arrow']).default('emptyCircle'),
  symbolSize: z.number().min(1).max(100).default(7),
  edgeShape: z.enum(['curve', 'polyline']).default('curve'),
  edgeForkPosition: z.string().default('50%'),
  // 交互
  roam: z.union([z.boolean(), z.enum(['scale', 'move'])]).default(false),
  initialTreeDepth: z.number().min(1).max(10).default(2),
});

// ===== 漏斗图 - viz_type: 'funnel' =====
export const FunnelParamsSchema = HierarchyFlowBaseParamsSchema.extend({
  viz_type: z.literal('funnel'),
  groupby: z.array(z.string()).min(1), // 漏斗各阶段的分组
  metric: z.union([MetricSchema, z.string()]), // 用于计算漏斗值的指标
  row_limit: z.number().default(10),
  sort_by_metric: z.boolean().default(true),
  // 百分比计算方式
  percent_calculation_type: z.enum(['first_step', 'previous_step', 'total']).default('first_step'),
  // 图例
  show_legend: z.boolean().default(true),
  legendType: z.enum(['scroll', 'plain']).default('scroll'),
  legendOrientation: z.enum(['top', 'bottom', 'left', 'right']).default('top'),
  // 标签
  label_type: z.enum(['key', 'value', 'percent', 'key_value', 'key_percent', 'key_value_percent', 'value_percent']).default('key'),
  tooltip_label_type: z.enum(['key', 'value', 'percent', 'key_value', 'key_percent', 'key_value_percent']).default('key_value_percent'),
  show_labels: z.boolean().default(true),
  show_tooltip_labels: z.boolean().default(true),
  number_format: z.string().default('SMART_NUMBER'),
  currency_format: z.object({
    symbol: z.string(),
    symbolPosition: z.enum(['prefix', 'suffix']),
  }).optional(),
});

// ===== 桑基图 - viz_type: 'sankey_v2' =====
export const SankeyParamsSchema = HierarchyFlowBaseParamsSchema.extend({
  viz_type: z.literal('sankey_v2'),
  source: z.string(), // 源节点列
  target: z.string(), // 目标节点列
  metric: z.union([MetricSchema, z.string()]), // 流量大小指标
  sort_by_metric: z.boolean().default(true),
});

// ===== 透视表 - viz_type: 'pivot_table_v2' =====
export const PivotTableParamsSchema = HierarchyFlowBaseParamsSchema.extend({
  viz_type: z.literal('pivot_table_v2'),
  groupbyRows: z.array(z.string()).default([]), // 行分组
  groupbyColumns: z.array(z.string()).default([]), // 列分组
  metrics: z.array(z.union([MetricSchema, z.string()])).min(1), // 指标
  // 聚合选项
  aggregateFunction: z.enum(['Sum', 'Average', 'Median', 'Count', 'Count Unique', 'List Unique', 'Min', 'Max', 'Standard Deviation', 'First', 'Last']).default('Sum'),
  // 显示选项
  transpose_pivot: z.boolean().default(false),
  combineMetric: z.boolean().default(false),
  // 条件格式
  conditional_formatting: z.array(z.object({
    operator: z.enum(['>', '<', '>=', '<=', '==', '!=', 'between']),
    targetValue: z.number().optional(),
    targetValueLeft: z.number().optional(),
    targetValueRight: z.number().optional(),
    column: z.string(),
    colorScheme: z.string().optional(),
  })).default([]),
  // 数值格式
  number_format: z.string().default('SMART_NUMBER'),
  currency_format: z.object({
    symbol: z.string(),
    symbolPosition: z.enum(['prefix', 'suffix']),
  }).optional(),
  date_format: z.string().default('smart_date'),
  // 表格选项
  table_timestamp_format: z.string().default('smart_date'),
  column_config: z.record(z.object({
    d3NumberFormat: z.string().optional(),
    d3SmallNumberFormat: z.string().optional(),
    d3TimeFormat: z.string().optional(),
    columnWidth: z.number().optional(),
    horizontalAlign: z.enum(['left', 'center', 'right']).optional(),
    showCellBars: z.boolean().optional(),
    alignPositiveNegative: z.boolean().optional(),
    colorPositiveNegative: z.boolean().optional(),
    currencyFormat: z.object({
      symbol: z.string(),
      symbolPosition: z.enum(['prefix', 'suffix']),
    }).optional(),
  })).default({}),
});

// ===== 联合类型：所有层级与流程图表参数 =====
export type HierarchyFlowChartParams = 
  | z.infer<typeof TreemapParamsSchema>
  | z.infer<typeof SunburstParamsSchema>
  | z.infer<typeof TreeChartParamsSchema>
  | z.infer<typeof FunnelParamsSchema>
  | z.infer<typeof SankeyParamsSchema>
  | z.infer<typeof PivotTableParamsSchema>;

// ===== 根据 viz_type 获取对应的 Schema =====
export function getHierarchyFlowSchemaByVizType(vizType: string) {
  const schemaMap = {
    'treemap_v2': TreemapParamsSchema,
    'treemap': TreemapParamsSchema, // 别名
    'sunburst_v2': SunburstParamsSchema,
    'sunburst': SunburstParamsSchema, // 别名
    'tree_chart': TreeChartParamsSchema,
    'funnel': FunnelParamsSchema,
    'sankey_v2': SankeyParamsSchema,
    'sankey': SankeyParamsSchema, // 别名
    'pivot_table_v2': PivotTableParamsSchema,
    'pivot_table': PivotTableParamsSchema, // 别名
  } as const;

  return schemaMap[vizType as keyof typeof schemaMap];
}

// ===== 验证函数 =====
export function validateHierarchyFlowChartParams(vizType: string, params: any): { success: boolean; error?: string; data?: any } {
  const schema = getHierarchyFlowSchemaByVizType(vizType);
  
  if (!schema) {
    return {
      success: false,
      error: `Unsupported hierarchy/flow viz_type: ${vizType}`,
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
export function generateHierarchyFlowDefaultParams(vizType: string, datasource: string): HierarchyFlowChartParams | null {
  const baseParams = {
    datasource,
    viz_type: vizType,
    adhoc_filters: [],
    row_limit: 1000,
    time_range: 'No filter',
    color_scheme: 'supersetColors',
  };

  switch (vizType) {
    case 'treemap_v2':
    case 'treemap':
      return TreemapParamsSchema.parse({
        ...baseParams,
        groupby: [],
        metric: 'count',
      });
    case 'sunburst_v2':
    case 'sunburst':
      return SunburstParamsSchema.parse({
        ...baseParams,
        columns: [],
        metric: 'count',
      });
    case 'tree_chart':
      return TreeChartParamsSchema.parse({
        ...baseParams,
        id: '',
        parent: '',
      });
    case 'funnel':
      return FunnelParamsSchema.parse({
        ...baseParams,
        groupby: [],
        metric: 'count',
        row_limit: 10,
      });
    case 'sankey_v2':
    case 'sankey':
      return SankeyParamsSchema.parse({
        ...baseParams,
        source: '',
        target: '',
        metric: 'count',
      });
    case 'pivot_table_v2':
    case 'pivot_table':
      return PivotTableParamsSchema.parse({
        ...baseParams,
        groupbyRows: [],
        groupbyColumns: [],
        metrics: ['count'],
      });
    default:
      return null;
  }
}

// ===== 工具函数：验证层级图表必需字段 =====
export function validateHierarchyChartRequiredFields(params: any): string[] {
  const errors: string[] = [];
  
  if (!params.datasource) {
    errors.push('datasource is required');
  }
  
  switch (params.viz_type) {
    case 'treemap_v2':
    case 'treemap':
      if (!params.groupby || params.groupby.length === 0) {
        errors.push('At least one groupby field is required for treemap');
      }
      if (!params.metric) {
        errors.push('metric is required for treemap');
      }
      break;
      
    case 'sunburst_v2':
    case 'sunburst':
      if (!params.columns || params.columns.length === 0) {
        errors.push('At least one hierarchy column is required for sunburst');
      }
      if (!params.metric) {
        errors.push('metric is required for sunburst');
      }
      break;
      
    case 'tree_chart':
      if (!params.id) {
        errors.push('id column is required for tree chart');
      }
      if (!params.parent) {
        errors.push('parent column is required for tree chart');
      }
      break;
      
    case 'funnel':
      if (!params.groupby || params.groupby.length === 0) {
        errors.push('At least one groupby field is required for funnel');
      }
      if (!params.metric) {
        errors.push('metric is required for funnel');
      }
      break;
      
    case 'sankey_v2':
    case 'sankey':
      if (!params.source) {
        errors.push('source is required for sankey');
      }
      if (!params.target) {
        errors.push('target is required for sankey');
      }
      if (!params.metric) {
        errors.push('metric is required for sankey');
      }
      break;
      
    case 'pivot_table_v2':
    case 'pivot_table':
      if (!params.metrics || params.metrics.length === 0) {
        errors.push('At least one metric is required for pivot table');
      }
      const hasRows = params.groupbyRows && params.groupbyRows.length > 0;
      const hasColumns = params.groupbyColumns && params.groupbyColumns.length > 0;
      if (!hasRows && !hasColumns) {
        errors.push('At least one row or column grouping is required for pivot table');
      }
      break;
  }
  
  return errors;
}

// ===== 工具函数：创建层级分析的基础配置 =====
export function createHierarchyAnalysisConfig() {
  return {
    // 基础显示配置
    show_labels: true,
    color_scheme: 'supersetColors',
    
    // 数值格式
    number_format: 'SMART_NUMBER',
    date_format: 'smart_date',
    
    // 排序配置
    sort_by_metric: true,
    
    // 行数限制
    row_limit: 1000,
  };
}

// ===== 工具函数：创建流程分析的基础配置 =====
export function createFlowAnalysisConfig() {
  return {
    // 基础显示配置
    show_labels: true,
    color_scheme: 'supersetColors',
    
    // 标签配置
    label_type: 'key_value',
    show_tooltip_labels: true,
    
    // 数值格式
    number_format: 'SMART_NUMBER',
    
    // 排序配置
    sort_by_metric: true,
  };
}

// ===== 枚举：层级图表布局类型 =====
export enum HierarchyLayoutType {
  Orthogonal = 'orthogonal',
  Radial = 'radial',
}

// ===== 枚举：树形图方向 =====
export enum TreeOrientation {
  LeftToRight = 'LR',
  RightToLeft = 'RL',
  TopToBottom = 'TB',
  BottomToTop = 'BT',
}

// ===== 枚举：漏斗图百分比计算方式 =====
export enum FunnelPercentCalculationType {
  FirstStep = 'first_step',
  PreviousStep = 'previous_step',
  Total = 'total',
}

// ===== 枚举：标签类型 =====
export enum LabelType {
  Key = 'key',
  Value = 'value',
  KeyValue = 'key_value',
  Percent = 'percent',
  KeyPercent = 'key_percent',
  KeyValuePercent = 'key_value_percent',
  ValuePercent = 'value_percent',
}

// ===== 枚举：透视表聚合函数 =====
export enum PivotAggregateFunction {
  Sum = 'Sum',
  Average = 'Average',
  Median = 'Median',
  Count = 'Count',
  CountUnique = 'Count Unique',
  ListUnique = 'List Unique',
  Min = 'Min',
  Max = 'Max',
  StandardDeviation = 'Standard Deviation',
  First = 'First',
  Last = 'Last',
}

// ===== 工具函数：创建层级路径 =====
export function createHierarchyPath(levels: string[]): string {
  return levels.join(' > ');
}

// ===== 工具函数：验证层级深度 =====
export function validateHierarchyDepth(levels: string[], maxDepth: number = 5): boolean {
  return levels.length <= maxDepth;
}

// ===== 工具函数：计算漏斗转化率 =====
export function calculateFunnelConversionRate(values: number[], calculationType: FunnelPercentCalculationType): number[] {
  if (values.length === 0) return [];
  
  switch (calculationType) {
    case FunnelPercentCalculationType.FirstStep:
      const firstValue = values[0];
      return values.map(value => (value / firstValue) * 100);
      
    case FunnelPercentCalculationType.PreviousStep:
      const rates = [100]; // 第一步总是100%
      for (let i = 1; i < values.length; i++) {
        rates.push((values[i] / values[i - 1]) * 100);
      }
      return rates;
      
    case FunnelPercentCalculationType.Total:
      const total = values.reduce((sum, value) => sum + value, 0);
      return values.map(value => (value / total) * 100);
      
    default:
      return values.map(() => 0);
  }
} 