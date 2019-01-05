import {WIDGET_DISPLAY} from 'app/views/organizationDashboard/constants';
import errorsByGeoQuery from 'app/views/organizationDashboard/data/queries/errorsByGeo';

const errorsByGeo = {
  type: WIDGET_DISPLAY.WORLD_MAP,
  queries: [errorsByGeoQuery],
};

export default errorsByGeo;
