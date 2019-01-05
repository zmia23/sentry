import {WIDGET_DISPLAY} from 'app/views/organizationDashboard/constants';
import {
  getChartData,
  getChartDataByDay,
} from 'app/views/organizationDiscover/result/utils';
import {isTimeSeries} from 'app/views/organizationDashboard/utils/isTimeSeries';

/**
 * Get data function based on widget properties
 */
export function getChartDataFunc({queries, type, fieldLabelMap}) {
  if (queries.some(isTimeSeries)) {
    return [
      getChartDataByDay,
      [
        {
          useTimestamps: true,
          assumeEmptyAsZero: true,
          fieldLabelMap,
        },
      ],
    ];
  }

  return [
    getChartData,
    [
      {
        hideFieldName: true,
        includePercentages: type === WIDGET_DISPLAY.TABLE,
      },
    ],
  ];
}
