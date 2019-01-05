import {WIDGET_DISPLAY} from 'app/views/organizationDashboard/constants';
import {getChartDataFunc} from 'app/views/organizationDashboard/utils/getChartDataFunc';

export function getData(results, widget) {
  const {type, title, queries, yAxisMapping} = widget;
  const isTable = type === WIDGET_DISPLAY.TABLE;
  const [chartDataFunc, chartDataFuncArgs] = getChartDataFunc(widget);
  const hasYAxes = yAxisMapping && yAxisMapping.length === 2;

  if (isTable) {
    const [series] = chartDataFunc(results[0].data, queries[0], ...chartDataFuncArgs);

    return {
      title,
      data: series.data,
    };
  }

  let series = results
    .map((result, i) => chartDataFunc(result.data, queries[i], ...chartDataFuncArgs))
    .reduce((acc, s) => [...acc, ...s], []);

  // Has 2 y axes
  if (hasYAxes) {
    yAxisMapping.forEach((mappings, yAxisIndex) => {
      mappings.forEach(seriesIndex => {
        if (typeof series[seriesIndex] === 'undefined') {
          return;
        }

        series[seriesIndex].yAxisIndex = yAxisIndex;
      });
    });
  }
  //
  let previousPeriod = null;
  if (widget.includePreviousPeriod) {
    // `series` is an array of series objects
    // need to map through each one and split up data into 2 series objects
    // (one for previous period and one for the current period)
    [previousPeriod, series] = series
      .map(({data, seriesName, ...rest}) => {
        // Split data into halves
        const previousPeriodData = data.slice(0, Math.ceil(data.length / 2));
        const currentPeriodData = data.slice(Math.floor(data.length / 2));

        return [
          {
            seriesName: `${seriesName} (Previous Period)`,
            data: previousPeriodData.map(({name, value}, index) => ({
              value,
              originalTimestamp: name,
              name: currentPeriodData[index].name,
            })),
            ...rest,
          },
          {
            seriesName,
            data: currentPeriodData,
            ...rest,
          },
        ];
      })
      .reduce(
        // reduce down to a tuple of [PreviousPeriodSeriesObj[], CurrentPeriodSeriesObj[]]
        ([accPrev, accSeries], [prev, currentSeries]) => [
          [...accPrev, prev],
          [...accSeries, currentSeries],
        ],
        [[], []]
      );
  }

  return {
    isGroupedByDate: true,
    series,
    previousPeriod,
    yAxes: hasYAxes,
  };
}
