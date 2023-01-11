import _ from 'lodash';
import moment from 'moment';

export const compareUTC = (a: any, b: any) => {
  if (_.isEqual(a.modifyTime, b.modifyTime)) {
    return 0;
  }
  return moment.utc(a.modifyTime.replace(' ', 'T')).isBefore(moment.utc(b.modifyTime.replace(' ', 'T'))) ? 1 : -1;
};
