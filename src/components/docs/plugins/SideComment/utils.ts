import { f } from '@src/resource/string';
import { ELTYPE } from '../config';
import { CommentType } from './commentOps';
import { Path, Range } from '@src/components/slate-packages/slate';

export const timeFormat = function (dt = new Date(), fmt = 'yyyy-MM-dd hh:mm:ss:S') {
  let date;
  if (dt) {
    date = dt;
  } else {
    let timezone = 8;
    let offset_GMT = new Date().getTimezoneOffset();
    let nowDate = new Date().getTime();
    date = new Date(nowDate + offset_GMT * 60 * 1000 + timezone * 60 * 60 * 1000);
  }

  let o = {
    'M+': date.getMonth() + 1,
    'd+': date.getDate(),
    'h+': date.getHours(),
    'm+': date.getMinutes(),
    's+': date.getSeconds(),
    'q+': Math.floor((date.getMonth() + 3) / 3),
    S: date.getMilliseconds(),
  };
  if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
  Object.keys(o).forEach(k => {
    if (new RegExp('(' + k + ')').test(fmt))
      fmt = fmt.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] + '' : ('00' + o[k]).substr(('' + o[k]).length));
  });
  return fmt;
};

export const commentTypeMapToString = (commentType: CommentType) => {
  const typeMap = {
    [ELTYPE.INLINEIMAGE]: f('image'),
    [ELTYPE.CODE_BLOCK]: f('codeBlock'),
    [ELTYPE.FILE]: f('localFile'),
    [ELTYPE.VIDEO]: f('video'),
    [ELTYPE.TABLE]: f('table'),
  };
  return `[${typeMap[commentType] || commentType}]`;
};

export const rangesMap = comments => {
  let obj = {};
  comments.forEach(item => {
    item.rangeIdList &&
      item.rangeIdList.forEach(rangeId => {
        const jsonRangeId = JSON.parse(rangeId);
        const { selection, refContent, commentType } = jsonRangeId;

        if (Range.isCollapsed(selection) && Path.equals(selection.focus.path, [0, 0]) && selection.focus.offset === 0) {
          return;
        }
        if (!obj[rangeId]) {
          obj[rangeId] = {
            text: !!commentType ? refContent : item.text,
            commentContent: item.commentContent,
          };
        } else {
          obj[rangeId].commentContent = [...obj[rangeId].commentContent, ...item.commentContent];
        }
      });
  });

  return obj;
};
