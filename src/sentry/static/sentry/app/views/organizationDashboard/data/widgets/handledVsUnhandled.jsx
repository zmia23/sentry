import {WIDGET_DISPLAY} from 'app/views/organizationDashboard/constants';

import handledVsUnhandledQuery from '../queries/handledVsUnhandled';

const handledVsUnhandled = {
  type: WIDGET_DISPLAY.LINE_CHART,
  queries: [handledVsUnhandledQuery],

  title: 'Handled vs. Unhandled',
  fieldLabelMap: {
    '0': 'Unhandled',
    '1': 'Handled',
    null: 'Unknown',
  },
};

export default handledVsUnhandled;
