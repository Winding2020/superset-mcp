import { z } from 'zod';
import {
  AreaChartParamsSchema,
  BarChartParamsSchema,
  BubbleChartParamsSchema,
  LineChartParamsSchema,
  PieChartParamsSchema,
  ScatterPlotParamsSchema,
  TableParamsSchema,
  WordCloudParamsSchema,
} from './basic-charts-params.js';
import {
  BoxPlotParamsSchema,
  CalendarHeatmapParamsSchema,
  GraphChartParamsSchema,
  GridHeatmapParamsSchema,
  HistogramParamsSchema,
  RadarParamsSchema,
} from './distribution-relationship-charts-params.js';
import {
  FunnelParamsSchema,
  PivotTableParamsSchema,
  SankeyParamsSchema,
  SunburstParamsSchema,
  TreeChartParamsSchema,
  TreemapParamsSchema,
} from './hierarchy-flow-charts-params.js';
import {
  EchartsTimeseriesBarParamsSchema,
  EchartsTimeseriesLineParamsSchema,
  MixedTimeseriesParamsSchema,
  WaterfallParamsSchema,
} from './timeseries-charts-params.js';

const allChartParams = [
  // Basic
  AreaChartParamsSchema,
  BarChartParamsSchema,
  BubbleChartParamsSchema,
  LineChartParamsSchema,
  PieChartParamsSchema,
  ScatterPlotParamsSchema,
  TableParamsSchema,
  WordCloudParamsSchema,
  // Distribution & Relationship
  BoxPlotParamsSchema,
  CalendarHeatmapParamsSchema,
  GraphChartParamsSchema,
  GridHeatmapParamsSchema,
  HistogramParamsSchema,
  RadarParamsSchema,
  // Hierarchy & Flow
  FunnelParamsSchema,
  PivotTableParamsSchema,
  SankeyParamsSchema,
  SunburstParamsSchema,
  TreeChartParamsSchema,
  TreemapParamsSchema,
  // Timeseries
  EchartsTimeseriesBarParamsSchema,
  EchartsTimeseriesLineParamsSchema,
  MixedTimeseriesParamsSchema,
  WaterfallParamsSchema,
] as const;

const allVizTypes = allChartParams.map(schema => schema.shape.viz_type.value);
const vizTypeEnum: [string, ...string[]] = [allVizTypes[0], ...allVizTypes.slice(1)];

export const getChartParamsSchema = [
  'get_chart_params',
  {
    description:
      'Get the required parameters format for a specific chart visualization type (viz_type). ALWAYS use this tool before creating or updating charts to ensure you have the correct parameter structure. This tool provides the exact schema needed for the params field in create_chart and update_chart.',
    inputSchema: z.object({
      viz_type: z.enum(vizTypeEnum).describe('The visualization type of the chart'),
    }),
    outputSchema: z.discriminatedUnion('viz_type', allChartParams),
  },
] as const; 