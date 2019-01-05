import {WIDGET_DISPLAY} from 'app/views/organizationDashboard/constants';
import AreaChart from 'app/components/charts/areaChart';
import BarChart from 'app/components/charts/barChart';
import LineChart from 'app/components/charts/lineChart';
import PercentageTableChart from 'app/components/charts/percentageTableChart';
import PieChart from 'app/components/charts/pieChart';
import WorldMapChart from 'app/components/charts/worldMapChart';

const CHART_MAP = {
  [WIDGET_DISPLAY.LINE_CHART]: LineChart,
  [WIDGET_DISPLAY.AREA_CHART]: AreaChart,
  [WIDGET_DISPLAY.BAR_CHART]: BarChart,
  [WIDGET_DISPLAY.PIE_CHART]: PieChart,
  [WIDGET_DISPLAY.WORLD_MAP]: WorldMapChart,
  [WIDGET_DISPLAY.TABLE]: PercentageTableChart,
};

export function getChartComponent({type}) {
  return CHART_MAP[type];
}
