import moment from 'moment';

const DATE_TIME_FORMAT = 'YYYY-MM-DDTHH:mm:ss';

export const DEFAULT_DAY_START_TIME = '00:00:00';
export const DEFAULT_DAY_END_TIME = '23:59:59';

/**
 * Converts a relative stats period, e.g. `1h` to an object containing a start
 * and end date, with the end date as the current time and the start date as the
 * time that is the current time less the statsPeriod.
 *
 * @param {String} val Relative stats period
 * @returns {Object} Object containing start and end date as YYYY-MM-DDTHH:mm:ss
 *
 */
export function parseStatsPeriod(statsPeriod) {
  const statsPeriodRegex = /^(\d+)([smhd]{1})$/;

  const result = statsPeriodRegex.exec(statsPeriod);

  if (result === null) {
    throw new Error('Invalid stats period');
  }

  const value = parseInt(result[1], 10);
  const unit = {
    d: 'days',
    h: 'hours',
    s: 'seconds',
    m: 'minutes',
  }[result[2]];

  return {
    start: moment()
      .subtract(value, unit)
      .format(DATE_TIME_FORMAT),
    end: moment().format(DATE_TIME_FORMAT),
  };
}

function getParser(local = false) {
  return local ? date => moment(date).local() : moment;
}

/**
 * Given a UTC timestamp, return a local date object
 */
export function getUtcToLocalDateObject(date) {
  return moment
    .utc(date)
    .local()
    .toDate();
}

/**
 * Sets time (hours + minutes) of the current date object
 *
 * @param {String} timeStr Time in 24hr format (HH:mm)
 */
export function setDateToTime(dateObj, timeStr, {local} = {}) {
  const [hours, minutes, seconds] = timeStr.split(':');

  const date = getParser(local)(dateObj)
    .set('hours', hours)
    .set('minutes', minutes);

  if (typeof seconds !== 'undefined') {
    date.set('seconds', seconds);
  }

  return date.toDate();
}

/**
 * Given a UTC timestamp, return a local/system date object with the same date
 * e.g. given: 1/1/2001 @ 22:00 UTC, return: 1/1/2001 @ 22:00 -0700 (PST)
 */
export function getUtcToSystem(dateObj) {
  // This is required because if your system timezone !== user configured timezone
  // then there will be a mismatch of dates with `react-date-picker`
  //
  // We purposely strip the timezone when formatting from the utc timezone
  return new Date(moment.utc(dateObj).format(DATE_TIME_FORMAT));
}

/**
 * Given a timestamp, return a local/system date object with the same date
 * e.g. system: -0700 PST, preference: -0400 EST
 * given: 1/1/2001 @ 22:00 UTC --> 1/1/2001 @ 18:00 -0400 (EST) -->
 * return:  1/1/2001 @ 18:00 -0700 (PST)
 */
export function getLocalToSystem(dateObj) {
  return new Date(moment(dateObj).format(DATE_TIME_FORMAT));
}

// Get the beginning of day (e.g. midnight)
export function getStartOfDay(date, {local} = {}) {
  return moment(date)
    .startOf('day')
    .startOf('hour')
    .startOf('minute')
    .startOf('second')
    .local()
    .toDate();
}

// Get tomorrow at midnight so that default endtime
// is inclusive of today
export function getEndOfDay(date, {local} = {}) {
  return moment(date)
    .add(1, 'day')
    .startOf('hour')
    .startOf('minute')
    .startOf('second')
    .subtract(1, 'second')
    .local()
    .toDate();
}

export function getPeriodAgo(period, unit) {
  return moment()
    .local()
    .subtract(period, unit);
}

// Get the start of the day (midnight) for a period ago
//
// e.g. 2 weeks ago at midnight
export function getStartOfPeriodAgo(period, unit, options) {
  return getStartOfDay(getPeriodAgo(period, unit), options);
}
