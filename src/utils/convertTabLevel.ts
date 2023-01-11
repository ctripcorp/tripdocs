import _ from 'lodash';
export const convertTabLevel = function (tabLevel) {
  if (_.isNumber(tabLevel)) {
    return tabLevel * 2 + 2 + 'rem';
  } else if (tabLevel) {
    return Number.parseInt(tabLevel) * 2 + 2 + 'rem';
  } else {
    return null;
  }
};
