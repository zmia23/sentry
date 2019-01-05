import {WIDGET_DISPLAY} from 'app/views/organizationDashboard/constants';

import eventsQuery from '../queries/events';

const events = {
  type: WIDGET_DISPLAY.LINE_CHART,
  queries: [eventsQuery],
  includePreviousPeriod: true,
  title: 'Events',
  aggregateLabelMap: {
    count: 'Events',
  },
};

export default events;
