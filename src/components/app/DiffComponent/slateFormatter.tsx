import { renderLeaf } from '@src/components/docs/plugins/SideComment/inlineSlateEditor';
import { Element as DefaultElement, Leaf as DefaultLeaf, renderElement } from '@src/components/docs/slateEditor';

import sessStorage from '@src/utils/sessStorage';
import * as jsondiffpatch from 'jsondiffpatch';
import ReactDOM from 'react-dom';
import React from 'react';
import { setCache } from '@src/utils/cacheUtils';

let _typeof =
  typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol'
    ? function (obj) {
        return typeof obj;
      }
    : function (obj) {
        return obj && typeof Symbol === 'function' && obj.constructor === Symbol && obj !== Symbol.prototype ? 'symbol' : typeof obj;
      };

let trimUnderscore = function trimUnderscore(str) {
  if (str.substr(0, 1) === '_') {
    return str.slice(1);
  }
  return str;
};

let adjustArrows = function jsondiffpatchHtmlFormatterAdjustArrows(nodeArg) {
  let node = nodeArg || document;
  let getElementText = function getElementText(_ref) {
    let textContent = _ref.textContent,
      innerText = _ref.innerText;
    return textContent || innerText;
  };
  let eachByQuery = function eachByQuery(el, query, fn) {
    let elems = el.querySelectorAll(query);
    for (let i = 0, l = elems.length; i < l; i++) {
      fn(elems[i]);
    }
  };
  let eachChildren = function eachChildren(_ref2, fn) {
    let children = _ref2.children;

    for (let i = 0, l = children.length; i < l; i++) {
      fn(children[i], i);
    }
  };
  eachByQuery(node, '.jsondiffpatch-arrow', function (_ref3) {
    let parentNode = _ref3.parentNode,
      children = _ref3.children,
      style = _ref3.style;

    let arrowParent = parentNode;
    let svg = children[0];
    let path = svg.children[1];
    svg.style.display = 'none';
    let destination = getElementText(arrowParent.querySelector('.jsondiffpatch-moved-destination'));
    let container = arrowParent.parentNode;
    let destinationElem = void 0;
    eachChildren(container, function (child) {
      if (child.getAttribute('data-key') === destination) {
        destinationElem = child;
      }
    });
    if (!destinationElem) {
      return;
    }
    try {
      let distance = destinationElem.offsetTop - arrowParent.offsetTop;
      svg.setAttribute('height', Math.abs(distance) + 6);
      style.top = -8 + (distance > 0 ? 0 : distance) + 'px';
      let curve =
        distance > 0
          ? 'M30,0 Q-10,' + Math.round(distance / 2) + ' 26,' + (distance - 4)
          : 'M30,' + -distance + ' Q-10,' + Math.round(-distance / 2) + ' 26,4';
      path.setAttribute('d', curve);
      svg.style.display = '';
    } catch (err) {}
  });
};

let showUnchanged = function showUnchanged(show, node, delay) {
  let el = node || document.body;
  let prefix = 'jsondiffpatch-unchanged-';
  let classes = {
    showing: prefix + 'showing',
    hiding: prefix + 'hiding',
    visible: prefix + 'visible',
    hidden: prefix + 'hidden',
  };
  let list = el.classList;
  if (!list) {
    return;
  }
  if (!delay) {
    list.remove(classes.showing);
    list.remove(classes.hiding);
    list.remove(classes.visible);
    list.remove(classes.hidden);
    if (show === false) {
      list.add(classes.hidden);
    }
    return;
  }
  if (show === false) {
    list.remove(classes.showing);
    list.add(classes.visible);
    setTimeout(function () {
      list.add(classes.hiding);
    }, 10);
  } else {
    list.remove(classes.hiding);
    list.add(classes.showing);
    list.remove(classes.hidden);
  }
  let intervalId = setInterval(function () {
    adjustArrows(el);
  }, 100);
  setTimeout(function () {
    list.remove(classes.showing);
    list.remove(classes.hiding);
    if (show === false) {
      list.add(classes.hidden);
      list.remove(classes.visible);
    } else {
      list.add(classes.visible);
      list.remove(classes.hidden);
    }
    setTimeout(function () {
      list.remove(classes.visible);
      clearInterval(intervalId);
    }, delay + 400);
  }, delay);
};

let hideUnchanged = function hideUnchanged(node, delay) {
  return showUnchanged(false, node, delay);
};

let defaultInstance = void 0;

let inherits = function (subClass, superClass) {
  if (typeof superClass !== 'function' && superClass !== null) {
    throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass);
  }
  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true,
    },
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : (subClass.__proto__ = superClass);
};

let classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError('Cannot call a class as a function');
  }
};
let possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === 'object' || typeof call === 'function') ? call : self;
};

let createClass = (function () {
  function defineProperties(target, props) {
    for (let i = 0; i < props.length; i++) {
      let descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ('value' in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps?, staticProps?) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
})();

let BaseFormatter = (function () {
  function BaseFormatter() {
    classCallCheck(this, BaseFormatter);
  }

  createClass(BaseFormatter, [
    {
      key: 'format',
      value: function format(delta, left) {
        let context = {};
        this.prepareContext(context);
        this.recurse(context, delta, left);
        const formatted = this.finalize(context);
        const transformed = transformToSlate(formatted);
        const markDeleted = markDeletedNode(transformed, this.removedRootChildren);
        const result = markDeleted;
        console.log('[format] context:', context, 'result: ', result);
        return result;
      },
    },
    {
      key: 'prepareContext',
      value: function prepareContext(context) {
        context.buffer = [];
        context.out = function () {
          let _buffer;

          (_buffer = this.buffer).push.apply(_buffer, arguments);
        };
        this.removedRootChildren = [];
      },
    },
    {
      key: 'typeFormattterNotFound',
      value: function typeFormattterNotFound(context, deltaType) {
        throw new Error('cannot format delta type: ' + deltaType);
      },
    },
    {
      key: 'typeFormattterErrorFormatter',
      value: function typeFormattterErrorFormatter(context, err) {
        return err.toString();
      },
    },
    {
      key: 'finalize',
      value: function finalize(_ref) {
        let buffer = _ref.buffer;

        if (isArray$3(buffer)) {
          return buffer.join('');
        }
      },
    },
    {
      key: 'recurse',
      value: function recurse(context, delta, left, key, leftKey, movedFrom, isLast) {
        let useMoveOriginHere = delta && movedFrom;
        let leftValue = useMoveOriginHere ? movedFrom.value : left;

        if (typeof delta === 'undefined' && typeof key === 'undefined') {
          return undefined;
        }

        let type = this.getDeltaType(delta, movedFrom);
        let nodeType = type === 'node' ? (delta._t === 'a' ? 'array' : 'object') : '';

        const omittedLeftKeys = [
          'source',

          'anchorId',

          'tabLevel',
          'align',
          'lineHeight',
          'id',
          'column',
          'row',

          'key',
          'data-card-value',
          'data-codeblock-id',
        ];
        if (omittedLeftKeys.includes(leftKey) || omittedLeftKeys.includes(key)) {
          console.log(
            '[recurse][omittedLeftKeys] context:',
            context,
            'delta:',
            delta,
            'left:',
            left,
            'key:',
            key,
            'leftKey:',
            leftKey,
            'movedFrom:',
            movedFrom,
            'isLast:',
            isLast
          );
          return undefined;
        }

        if (typeof key !== 'undefined') {
          this.nodeBegin(context, key, leftKey, type, nodeType, isLast);
        } else {
          this.rootBegin(context, type, nodeType);
        }

        let typeFormattter = void 0;
        try {
          typeFormattter = this['format_' + type] || this.typeFormattterNotFound(context, type);
          typeFormattter.call(this, context, delta, leftValue, key, leftKey, movedFrom);
        } catch (err) {
          this.typeFormattterErrorFormatter(context, err, delta, leftValue, key, leftKey, movedFrom);
          if (typeof console !== 'undefined' && console.error) {
            console.error(err.stack);
          }
        }
        console.log(
          '[recurse] context:',
          context,
          'delta:',
          delta,
          'left:',
          left,
          'key:',
          key,
          'leftKey:',
          leftKey,
          'movedFrom:',
          movedFrom,
          'isLast:',
          isLast
        );
        if (typeof key !== 'undefined') {
          this.nodeEnd(context, key, leftKey, type, nodeType, isLast);
        } else {
          this.rootEnd(context, type, nodeType);
        }
      },
    },
    {
      key: 'formatDeltaChildren',
      value: function formatDeltaChildren(context, delta, left) {
        let self = this;
        this.forEachDeltaKey(delta, left, function (key, leftKey, movedFrom, isLast) {
          self.recurse(context, delta[key], left ? left[leftKey] : undefined, key, leftKey, movedFrom, isLast);
        });
      },
    },
    {
      key: 'forEachDeltaKey',
      value: function forEachDeltaKey(delta, left, fn) {
        let keys = getObjectKeys(delta);
        let arrayKeys = delta._t === 'a';
        let moveDestinations = {};
        let name = void 0;
        if (typeof left !== 'undefined') {
          for (name in left) {
            if (Object.prototype.hasOwnProperty.call(left, name)) {
              if (typeof delta[name] === 'undefined' && (!arrayKeys || typeof delta['_' + name] === 'undefined')) {
                keys.push(name);
              }
            }
          }
        }

        for (name in delta) {
          if (Object.prototype.hasOwnProperty.call(delta, name)) {
            let value = delta[name];
            if (isArray$3(value) && value[2] === 3) {
              moveDestinations[value[1].toString()] = {
                key: name,
                value: left && left[parseInt(name.substr(1))],
              };
              if (this.includeMoveDestinations !== false) {
                if (typeof left === 'undefined' && typeof delta[value[1]] === 'undefined') {
                  keys.push(value[1].toString());
                }
              }
            }
          }
        }
        if (arrayKeys) {
          keys.sort(arrayKeyComparer);
        } else {
          keys.sort();
        }
        for (let index = 0, length = keys.length; index < length; index++) {
          let key = keys[index];
          if (arrayKeys && key === '_t') {
            continue;
          }
          let leftKey = arrayKeys ? (typeof key === 'number' ? key : parseInt(trimUnderscore(key), 10)) : key;
          let isLast = index === length - 1;
          fn(key, leftKey, moveDestinations[leftKey], isLast);
        }
      },
    },
    {
      key: 'getDeltaType',
      value: function getDeltaType(delta, movedFrom) {
        if (typeof delta === 'undefined') {
          if (typeof movedFrom !== 'undefined') {
            return 'movedestination';
          }
          return 'unchanged';
        }
        if (isArray$3(delta)) {
          if (delta.length === 1) {
            return 'added';
          }
          if (delta.length === 2) {
            return 'modified';
          }
          if (delta.length === 3 && delta[2] === 0) {
            return 'deleted';
          }
          if (delta.length === 3 && delta[2] === 2) {
            return 'textdiff';
          }
          if (delta.length === 3 && delta[2] === 3) {
            return 'moved';
          }
        } else if ((typeof delta === 'undefined' ? 'undefined' : _typeof(delta)) === 'object') {
          return 'node';
        }
        return 'unknown';
      },
    },
    {
      key: 'parseTextDiff',
      value: function parseTextDiff(value) {
        let output = [];
        let lines = value.split('\n@@ ');
        for (let i = 0, l = lines.length; i < l; i++) {
          let line = lines[i];
          let lineOutput = {
            pieces: [],
          };
          let location = /^(?:@@ )?[-+]?(\d+),(\d+)/.exec(line).slice(1);
          (lineOutput as any).location = {
            line: location[0],
            chr: location[1],
          };
          let pieces = line.split('\n').slice(1);
          for (let pieceIndex = 0, piecesLength = pieces.length; pieceIndex < piecesLength; pieceIndex++) {
            let piece = pieces[pieceIndex];
            if (!piece.length) {
              continue;
            }
            let pieceOutput = {
              type: 'context',
            };
            if (piece.substr(0, 1) === '+') {
              pieceOutput.type = 'added';
            } else if (piece.substr(0, 1) === '-') {
              pieceOutput.type = 'deleted';
            }
            (pieceOutput as any).text = piece.slice(1);
            lineOutput.pieces.push(pieceOutput);
          }
          output.push(lineOutput);
        }
        return output;
      },
    },
  ]);
  return BaseFormatter;
})();

let isArray$3 =
  typeof Array.isArray === 'function'
    ? Array.isArray
    : function (a) {
        return a instanceof Array;
      };

let getObjectKeys =
  typeof Object.keys === 'function'
    ? function (obj) {
        return Object.keys(obj);
      }
    : function (obj) {
        let names = [];
        for (let property in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, property)) {
            names.push(property);
          }
        }
        return names;
      };

let arrayKeyComparer = function arrayKeyComparer(key1, key2) {
  return arrayKeyToSortNumber(key1) - arrayKeyToSortNumber(key2);
};

let arrayKeyToSortNumber = function arrayKeyToSortNumber(key) {
  if (key === '_t') {
    return -1;
  } else {
    if (key.substr(0, 1) === '_') {
      return parseInt(key.slice(1), 10);
    } else {
      return parseInt(key, 10) + 0.1;
    }
  }
};

export let SlateFormatter = (function (_BaseFormatter) {
  inherits(SlateFormatter, _BaseFormatter);

  function SlateFormatter() {
    classCallCheck(this, SlateFormatter);
    return possibleConstructorReturn(this, ((SlateFormatter as any).__proto__ || Object.getPrototypeOf(SlateFormatter)).apply(this, arguments));
  }

  createClass(SlateFormatter, [
    {
      key: 'typeFormattterErrorFormatter',
      value: function typeFormattterErrorFormatter(context, err) {
        context.out('[ERROR]' + err);
      },
    },
    {
      key: 'formatValue',
      value: function formatValue(context, value) {
        context.out(JSON.stringify(value, null, 2));
      },
    },
    {
      key: 'formatTextDiffString',
      value: function formatTextDiffString(context, value) {
        let lines = this.parseTextDiff(value);
        for (let i = 0, l = lines.length; i < l; i++) {
          let line = lines[i];
          context.out(line.location.line + ',' + line.location.chr + ' ');
          let pieces = line.pieces;
          for (let pieceIndex = 0, piecesLength = pieces.length; pieceIndex < piecesLength; pieceIndex++) {
            let piece = pieces[pieceIndex];
            context.out(piece.text);
          }
          if (i < l - 1) {
          }
        }
      },
    },
    {
      key: 'rootBegin',
      value: function rootBegin(context, type, nodeType) {
        if (type === 'node') {
          context.out(nodeType === 'array' ? '[' : '{');
        }
      },
    },
    {
      key: 'rootEnd',
      value: function rootEnd(context, type, nodeType) {
        if (type === 'node') {
          context.out(nodeType === 'array' ? ']' : '}');
        }
      },
    },
    {
      key: 'nodeBegin',
      value: function nodeBegin(context, key, leftKey, type, nodeType) {
        const k = parseInt(key, 10);
        if (typeof k === 'number') {
          if (!isNaN(k)) {
            context.out(k === 0 ? '' : ',');
          } else {
            const index = parseInt(key.slice(1), 10);
            if (key[0] === '_' && typeof index === 'number') {
              context.out('');
              this.removedRootChildren.push(index);
            } else {
              context.out(`"${key}": `);
            }
          }
        }
        if (type === 'node') {
          context.out(nodeType === 'array' ? '[' : '{');
        }
      },
    },
    {
      key: 'nodeEnd',
      value: function nodeEnd(context, key, leftKey, type, nodeType, isLast) {
        if (type === 'node') {
          context.out(nodeType === 'array' ? ']' : '}' + (isLast ? '' : ','));
        }
        if (!isLast) {
        }
      },
    },
    {
      key: 'format_unchanged',
      value: function format_unchanged(context, delta, left) {
        if (typeof left === 'undefined') {
          return;
        }
        this.formatValue(context, left);
      },
    },
    {
      key: 'format_movedestination',
      value: function format_movedestination(context, delta, left) {
        if (typeof left === 'undefined') {
          return;
        }
        this.formatValue(context, left);
      },
    },
    {
      key: 'format_node',
      value: function format_node(context, delta, left) {
        this.formatDeltaChildren(context, delta, left);
      },
    },
    {
      key: 'format_added',
      value: function format_added(context, delta) {
        this.formatValue(context, delta[0]);
      },
    },
    {
      key: 'format_modified',
      value: function format_modified(context, delta, leftValue, key, leftKey, movedFrom) {
        console.log('[modified]', context, delta, leftValue, key, leftKey, movedFrom);
        if (key === 'text' && leftKey === 'text') {
          this.formatValue(context, delta[0]);
          context.out(',"modifiedOld": true');

          context.out('}, { "modifiedNew": true, "text":');
          this.formatValue(context, delta[1]);
          console.log('[modified]2', context);
        } else {
          this.formatValue(context, delta[1]);
        }
      },
    },
    {
      key: 'format_deleted',
      value: function format_deleted(context, delta) {
        this.formatValue(context, delta[0]);
      },
    },
    {
      key: 'format_moved',
      value: function format_moved(context, delta) {
        context.out('==> ' + delta[1]);
      },
    },
    {
      key: 'format_textdiff',
      value: function format_textdiff(context, delta) {
        this.formatTextDiffString(context, delta[0]);
      },
    },
  ]);
  return SlateFormatter;
})(BaseFormatter);

export function slateHtmlFormat(delta, left) {
  if (!defaultInstance) {
    defaultInstance = new (SlateFormatter as any)();
  }
  return defaultInstance.format(delta, left);
}

function transformToSlate(formattedStr: string) {
  const res = formattedStr
    .replace(/[\n\r\s\t]/g, '')
    .replace(/\"\"\"/g, '"","')
    .replace(/(?<=[^:])\"\"(?=\S)/g, '","')
    .replace(/\,+/g, ',')
    .replace(/[\]\}](?=\")/g, '$&,')
    .replace(/\}\{/g, '},{')
    .replace(/(\d+)\:/g, (match, $1) => {
      if (match === '0:') {
        return '';
      } else {
        return ',';
      }
    })
    .replace(/\"\:(\d+)\"/g, (_, $1) => {
      return `":${$1}, "`;
    })

    .replace(/[\'\"]?(children|text|type|anchorId)[\'\"]?\:/g, (match, $1) => {
      return `"${$1}":`;
    });
  return res;
}

function markDeletedNode(str: string, arr: number[]) {
  const obj = JSON.parse(str);
  for (let i = 0; i < arr.length; i++) {
    const index = arr[i];
    const node = obj[index];
    if (node) {
      node.deleted = true;
    }
  }
  return JSON.stringify(obj);
}
