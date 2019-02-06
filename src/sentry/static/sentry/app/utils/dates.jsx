import moment from 'moment';

import ConfigStore from 'app/stores/configStore';

function getParser(local = false) {
  return local ? moment : moment.utc;
}

/**
 * Given a date object, format in datetime in UTC
 * given: Tue Oct 09 2018 00:00:00 GMT-0700 (Pacific Daylight Time)
 * returns: "2018-10-09T07:00:00.000"
 */
export function getUtcDateString(dateObj) {
  return moment.utc(dateObj).format(moment.HTML5_FMT.DATETIME_LOCAL_SECONDS);
}

export function getFormattedDate(dateObj, format, {local} = {}) {
  return getParser(local)(dateObj).format(format);
}

export function getUserTimezone() {
  const user = ConfigStore.get('user');
  return user && user.options && user.options.timezone;
}
