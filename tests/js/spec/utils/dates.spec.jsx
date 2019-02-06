import moment from 'moment';
import {setDateToTime} from 'app/components/organizations/timeRangeSelector/utils';

describe('utils.dates', function() {
  describe('setDateToTime', function() {
    it('can set new time for current date', function() {
      const date = new Date();
      const newDate = setDateToTime(date, '11:11');
      expect(newDate).toEqual(new Date(1508238680000));
    });

    it('can set new time (including seconds) for current date', function() {
      const date = new Date();
      const newDate = setDateToTime(date, '11:11:11');
      expect(newDate).toEqual(new Date(1508238671000));
    });
  });

  describe('getUtcInLocal', function() {
    it('works', function() {
      const date = new Date();
      console.log(date.getTimezoneOffset());
      console.log(
        moment()
          .toDate()
          .getTimezoneOffset(),
        moment.utc()
      );
      moment.tz.setDefault('UTC');
      console.log(
        moment()
          .toDate()
          .getTimezoneOffset(),
        moment.utc()
      );
    });
  });
});
