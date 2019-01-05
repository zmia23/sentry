import {withRouter} from 'react-router';
import PropTypes from 'prop-types';
import React from 'react';

import {Panel, PanelBody, PanelHeader} from 'app/components/panels';
import {WIDGET_DISPLAY} from 'app/views/organizationDashboard/constants';
import {getChartComponent} from 'app/views/organizationDashboard/utils/getChartComponent';
import {getData} from 'app/views/organizationDashboard/utils/getData';
import {getQueryStringFromQuery} from 'app/views/organizationDiscover/utils';
import Button from 'app/components/button';
import SentryTypes from 'app/sentryTypes';
import withOrganization from 'app/utils/withOrganization';

import DiscoverQuery from './discoveryQuery';

class Widget extends React.Component {
  static propTypes = {
    widget: SentryTypes.Widget,
    organization: SentryTypes.Organization,
    selection: SentryTypes.GlobalSelection,
    router: PropTypes.object,
  };

  handleExportToDiscover = () => {
    const {organization, widget, router} = this.props;
    const [firstQuery] = widget.queries;

    // Discover does not support importing these
    const {
      groupby, // eslint-disable-line no-unused-vars
      rollup, // eslint-disable-line no-unused-vars
      orderby,
      ...query
    } = firstQuery;

    const orderbyTimeIndex = orderby.indexOf('time');
    if (orderbyTimeIndex !== -1) {
      query.orderby = `${orderbyTimeIndex === 0 ? '' : '-'}${query.aggregations[0][2]}`;
    }

    router.push(
      `/organizations/${organization.slug}/discover/${getQueryStringFromQuery(query)}`
    );
  };

  renderChart() {
    const {widget} = this.props;
    const {includePreviousPeriod, queries} = widget;

    return (
      <DiscoverQuery queries={queries} includePreviousPeriod={includePreviousPeriod}>
        {({results}) => {
          if (!results) {
            return null;
          }

          // get visualization based on widget data
          const ChartComponent = getChartComponent(widget);
          // get data func based on query
          const chartData = getData(results, widget);

          return <ChartComponent {...chartData} />;
        }}
      </DiscoverQuery>
    );
  }

  render() {
    const {widget} = this.props;
    const {type, title} = widget;
    const isTable = type === WIDGET_DISPLAY.TABLE;

    if (isTable) {
      return this.renderChart();
    }

    return (
      <Panel>
        <PanelHeader hasButtons>
          {title}

          <Button size="xsmall" onClick={this.handleExportToDiscover}>
            DISCOVER
          </Button>
        </PanelHeader>

        <PanelBody>{this.renderChart()}</PanelBody>
      </Panel>
    );
  }
}
export default withRouter(withOrganization(Widget));
export {Widget};
