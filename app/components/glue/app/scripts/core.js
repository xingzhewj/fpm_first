(function (glue) {
  'use strict';

  var win = window;

  // 将原有的glue备份。无冲突处理
  glue.__old = win.glue;
  win.glue = glue;
  win.__glue = glue;

  var orgDefine = win.define;
  glue.hasDefine = {};
  win.define = function (id) {
    glue.hasDefine[id] = id;
    orgDefine.apply(null, arguments);
  };

  // 修复jquery使用define的条件。
  win.define.amd = {
    jQuery: true
  };

  var toString  = Object.prototype.toString;
  var emptyFn = function () {};

  if (typeof emptyFn.bind !== 'function') {

    Function.prototype.bind = function (scope) {

      if (arguments.length < 2 && scope === void 0) {
        return this;
      }

      var fn = this,
          argv = arguments;

      return function () {
        var args = [],
            i;
        for (i = 1; i < argv.length; i++) {
          args.push(argv[i]);
        }

        for (i = 0; i < arguments.length; i++) {
          args.push(arguments[i]);
        }

        return fn.apply(scope, args);
      };
    };
  }

  glue.extend = function () {
    var orgObject = arguments[0];
    var extendObjects = [].slice.call(arguments, 1);
    var obj;
    var key;

    for (var i = 0, iLen = extendObjects.length; i < iLen; i++) {
      obj = extendObjects[i];

      for (key in obj) {
        orgObject[key] = obj[key];
      }
    }

    return orgObject;
  };

  glue.extend(glue, {
    version: '@VERSION',
    options: {
      combineServer : 'http://localhost:9001/combine/',
      useCombineServer : false,  //默认不使用combine server
      prefix : 'g-',   //全局标记前缀
      attrPrefix : 'g-attr-',  //自定义属性前缀
      alias : {}       //组件别名
    },

    noConflict: function () {
      var _tempGlue = glue;
      window['glue'] = glue.__old;
      return _tempGlue;
    },

    config: function (config) {
      if (typeof config !== 'undefined' &&  glue.isObject(config)) {
        for (var p in config) {
          glue.options[p] = config[p];
        }
      }
    },

    // 判断是否为标准浏览器
    W3C: win.dispatchEvent,

    isDefined: function (value) {
      return typeof value !== 'undefined';
    },

    isString: function (value) {
      return typeof value === 'string';
    },

    isNumber: function (value) {
      return typeof value === 'number';
    },

    isDate: function (value) {
      return toString.call(value) === '[object Date]';
    },

    isObject: function (value) {
      return value !== null && typeof value === 'object';
    },

    isArray: function (value) {
      return toString.call(value) === '[object Array]';
    },

    isFunction: function (value) {
      return typeof value === 'function';
    },

    isWindow: function (obj) {
      return obj && obj.document && obj.location && obj.alert && obj.setInterval;
    },

    // 抛出一个错误。
    error: function (str, E) {
      E = E || Error;
      throw new E(str);
    },

    isArrayLike: function (obj) {

      if (typeof obj === 'undefined' || obj === null || glue.isWindow(obj)) {
        return false;
      }

      var length = obj.length;

      if (obj.nodeType === 1 && length) {
        return true;
      }

      return glue.isString(obj) || glue.isArray(obj) || length === 0 ||
          typeof length === 'number' && length > 0 && (length - 1) in obj;
    },

    trim: (function () {
      if (!String.prototype.trim) {
        return function (value) {
          return glue.isString(value) ? value.replace(/^\s\s*/, '').replace(/\s\s*$/, '') : value;
        };
      }
      return function (value) {
        return glue.isString(value) ? value.trim() : value;
      };
    }()),

    capitalize: function (str) {
      return str.replace(/(^|\s)([a-z|A-Z])(\w*)/g, function (m, p1, p2, p3) {
        return p1 + p2.toUpperCase() + p3.toLowerCase();
      });
    },

    log: function () {
      if (typeof console !== 'undefined' && typeof console.log === 'function') {
        console.log.apply(console, arguments);
      }
    }
  });

  return glue;
}({}));

