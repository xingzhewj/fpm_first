var glue = (function (glue) {
  'use strict';

  var win = window;
  var doc = document;

/*********dom操作**********/

  var getDom = function (id) {
    return doc.getElementById(id);
  };

  var addEventListener = (function () {
    
    if (win.addEventListener) {
      return function (elm, eventType, fn) {
        elm.addEventListener(eventType, fn, false);
      };
    } else {
      return function (elm, eventType, fn) {
        elm.attachEvent('on' + eventType, fn);
      };
    }

  }());

/*********时间处理**********/

  var formatTime = function (iTime) {
    if (iTime === '') {
      return '---';
    }
    var oDate = new Date(iTime);
    return oDate.getMinutes() + ':' + oDate.getSeconds() + ':' + oDate.getMilliseconds();
  };

  var getEndTime = function () {
    var endTime = 0;
    var time;

    for (var key in glue.WidgetRegList) {
      time = glue.WidgetRegList[key].createTime;
      if (time > endTime) {
        endTime = time;
      }
    }

    return endTime;
  };

  var getBeginTime = function () {
    var beginTime = new Date().valueOf();
    var time;

    for (var key in glue.WidgetRegList) {
      time = glue.WidgetRegList[key].startTime || beginTime;
      if (time < beginTime) {
        beginTime = time;
      }
    }

    return beginTime;
  };

  // 对组件注册对象按照开始执行时间进行排序
  var sortList = function () {
    var list = [];

    for (var key in glue.WidgetRegList) {
      list.push(glue.WidgetRegList[key]);
    }

    list.sort(function (a, b) {
      var nowTime = new Date().valueOf();
      var aTime = a.startTime || nowTime;
      var bTime = b.startTime || nowTime;
      return aTime - bTime;
    });

    return list;
  };

/***********字符串处理**********/

  var simpleStringToJson = function (sValue) {

    // 对于空字符串，之间返回空字符串
    if (sValue === '') {
      return '';
    }

    try {
      return eval('1,' + sValue);
    } catch (e) {
      alert(sValue + ' 无法转换成Json，请重新输入内容');
    }
  };

  var simpleJsonToString = function (json) {

    // 对于未定义的输入，直接返回空字符串
    if (typeof json === 'undefined') {
      return '';
    }

    var result = [];
    var temp;

    for (var key in json) {
      temp = json[key];

      // 将双引号转成转义后的
      if (typeof temp === 'string') {
        temp = '"' + temp.replace(/["]/gi, "\\windflowers").replace(/windflowers/gi, "\"") + '"';
      }

      result.push('"' + key + '": ' + temp);
    }

    return '{' + result.join(',') + '}';
  };

/*******扩展requirejs的config文件*****/

  var extendRequireConfig = function (isCompress, pathMaps) {
    var map = simpleStringToJson(pathMaps);
    var configTemp = win.requirejs.config;

    win.requirejs.config = function (options) {
      var paths = options.paths;
      var path;

      if (typeof paths !== "undefined") {

        for (var key in paths) {
          path = paths[key];

          // 如果有文件映射，则使用映射路径，否则如果关闭压缩，
          // 则将路径上的.min去掉。
          if (typeof map[path] !== "undefined") {
            options.paths[key] = map[path];
          } else if (isCompress === false) {
            options.paths[key] = path.replace(/\.min/, "");
          }
        }
      }

      configTemp.call(win.requirejs, options);
    };
  };

  // 创建合并请求链接
  var createComboLink = function (maps, localUrl) {
    var url = localUrl || 'http://localhost:9001/';
    maps = simpleStringToJson(maps);
    maps = maps || glueComponentVerMap || {};
    var params = [];

    for (var key in maps) {
      params.push(key + '#' + maps[key]);
    }

    url = url + 'combine?c=' + encodeURIComponent(params.join(',')) + '&isDebug=true';
    document.write('<script src=' + url + '><\/script>');
  };

  var getCookie = function (name) {
    var headerTag = name + '=';
    var cookie = doc.cookie;
    var begin = cookie.indexOf(headerTag);
    var end;
    var result;

    if (begin > -1) {
      end = cookie.indexOf(';', begin);

      if (end === -1) {
        result = cookie.substring(begin + headerTag.length);
      } else {
        result = cookie.substring(begin + headerTag.length, end);
      }
      result = decodeURIComponent(result);
    } else {
      result = '';
    }

    return result;
  };

  var setCookie = function (key, value) {
    doc.cookie = key + '=' + encodeURIComponent(value) + ';expires=' +
        new Date(new Date().valueOf() + 1000 * 60 * 60 * 24 * 10).toUTCString();
  };

  var clearCookie = function (key) {
    doc.cookie = key + '=null;expires=' + new Date(new Date().valueOf() - 1000 * 60 * 10).toUTCString();
  };

/*****调试代码主体******/

  var debug = {

    init: function () {
      var showDebugTools = win.location.href.indexOf('f_debug=true') > -1;

      // 获取调试设置
      var debugConfig = this.debugConfigGet();

      // 创建调试工具
      if (showDebugTools) {
        addEventListener(win, "load", function () {
          debug.creatDebugConsole(debugConfig);
        });
      }

      // 如果没有设置，则直接返回
      if (typeof debugConfig === '') {
        return;
      }

      // 路径映射的处理
      if (debugConfig.isCompress === false ||
          (typeof debugConfig.pathMaps !== 'undefined' && debugConfig.pathMaps !== '')) {
        extendRequireConfig(debugConfig.isCompress, debugConfig.pathMaps);
      }

      // 本地映射的处理
      if (debugConfig.isLocal === true) {
        createComboLink(debugConfig.compMaps, debugConfig.localUrl);
      }
    },

    debugConfigGet: function () {
      return simpleStringToJson(getCookie('f_debug'));
    },

    debugConfigSet: function (isLocal, isCompress, localUrl, pathMaps, compMaps) {
      var map = {
        'isLocal': isLocal,
        'isCompress': isCompress,
        'localUrl': localUrl || '',
        'pathMaps': pathMaps || '',
        'compMaps': compMaps || ''
      };

      var sMap = simpleJsonToString(map);
      setCookie('f_debug', sMap);
    },

    debugConfigClear: function () {
      clearCookie('f_debug');
    },

    creatDebugConsole: function (debugConfig) {
      var div = doc.createElement('div');
      div.id = 'fDebugBox';
      var html = '<div style="position: fixed; _position: absolute; right: 5px; font-size: 12px; bottom: 5px; ' +
            'background: #CCC; z-index=2147483647">' +
        '<div id="f_debugBoxIn" style="display: none; padding: 5px; border: 1px solid #999; background: #CCC;">' +
          '<div style="margin-bottom: 5px;">' +
            '<label style="margin-right: 100px;">本地调试：<input type="checkbox" id="f_debug_isLocal" /></label>' +
            '<label>取消压缩：<input type="checkbox" id="f_debug_isCompress" /></label>' +
          '</div>' +
          '<div style="margin-bottom: 5px;">' +
            '<label>服务地址：<input type="text" id="f_debug_localUrl" style="width: 304px; border: 1px solid #999; ' +
                'background: #FFF;" value="http://localhost:9001/" /></label>' +
          '</div>' +
          '<div style="overflow: hidden; *zoom: 1;">' +
            '<div style="float: left;">组件映射：</div>' +
            '<textarea id="f_debug_compMaps" style="width: 300px; height: 50px; border: 1px solid #999; ' +
                'background: #FFF;"></textarea>' +
          '</div>' +
          '<div style="overflow: hidden; *zoom:1; margin-bottom: 5px;">' +
            '<div style="float: left">路径映射：</div>' +
            '<textarea id="f_debug_pathMaps" style="width: 300px; height: 50px; border: 1px solid #999; ' +
                'background: #FFF;"></textarea>' +
          '</div>' +
          '<div style="text-align: right;">' +
            '<button id="f_debug_bt1" type="button">开启调试</button>' +
            '<button id="f_debug_bt2" type="button">关闭调试</button>' +
            '<button id="f_debug_bt3" type="button">获取组件映射</button>' +
            '<button id="f_debug_bt4" type="button">注册列表</button>' +
            '<button id="f_debug_bt5" type="button">时间轴</button>' +
          '</div>' +
        '</div>' +
        '<div id="f_debugBoxShowHide" data-toggle="hide" style = "border: 1px solid #999; background: #FFC; ' +
            'padding: 5px; cursor: pointer; text-align: right; border-top: 1px solid #CCC;">显示调试</div>' +
      '</div>';

      div.innerHTML = html;
      doc.body.appendChild(div);
      var showBtn = getDom('f_debugBoxShowHide');
      var debugBoxIn = getDom('f_debugBoxIn');
      var debugBtn1 = getDom('f_debug_bt1');
      var debugBtn2 = getDom('f_debug_bt2');
      var debugBtn3 = getDom('f_debug_bt3');
      var debugBtn4 = getDom('f_debug_bt4');
      var debugBtn5 = getDom('f_debug_bt5');
      var debugIsLocal = getDom('f_debug_isLocal');
      var debugIsCompress = getDom('f_debug_isCompress');
      var debugLocalUrl = getDom('f_debug_localUrl');
      var debugPathMaps = getDom('f_debug_pathMaps');
      var debugCompMaps = getDom('f_debug_compMaps');

      if (debugConfig !== '') {
        debugIsLocal.checked = debugConfig.isLocal;
        debugIsCompress.checked = !debugConfig.isCompress;
        debugLocalUrl.value = debugConfig.localUrl;
        debugPathMaps.value = debugConfig.pathMaps;
        debugCompMaps.value = debugConfig.compMaps;
      }

      // 显示隐藏调试台
      showBtn.onclick = function () {
        if (this.getAttribute('data-toggle') === 'hide') {
          debugBoxIn.style.display = '';
          this.setAttribute('data-toggle', 'show');
          this.innerHTML = '隐藏调试';
        } else {
          debugBoxIn.style.display = 'none';
          this.setAttribute('data-toggle', 'hide');
          this.innerHTML = '显示调试';
        }
      };

      // 设置配置
      debugBtn1.onclick = function () {
        debug.debugConfigSet(debugIsLocal.checked, !debugIsCompress.checked,
            debugLocalUrl.value, debugPathMaps.value, debugCompMaps.value);
        alert('调试配置保存成功，请刷新页面查看效果');
      };

      // 清空配置置
      debugBtn2.onclick = function () {
        debug.debugConfigClear();
        debugIsLocal.checked = false;
        debugIsCompress.checked = false;
        debugLocalUrl.value = '';
        debugPathMaps.value = '';
        debugCompMaps.value = '';
        alert('调试设置已清除，请刷新页面查看效果');
      };

      // 获取组件配置
      debugBtn3.onclick = function () {
        debugCompMaps.value = simpleJsonToString(glueComponentVerMap);
      };

      // 获取组件列表
      debugBtn4.onclick = function () {
        debug.drawViewList();
      };

      // 获取组件瀑布流列表
      debugBtn5.onclick = function () {
        debug.drawTimeLine();
      };
    },

    drawViewList: function () {
      var aList = glue.WidgetRegList;
      var oTasker;
      var elmDiv = doc.createElement('div');
      elmDiv.setAttribute('style', 'position: fixed; _position: absolute; background: #FFF; ' +
          'z-index:2147483647; bottom: 5px; right: 5px;');
      elmDiv.setAttribute('id', 'taskerViewList');

      var sHtml = '<table cellspacing="0" cellpadding="3" border="1">';
      sHtml += '<thead><tr><th>组件名</th><th>组件类型</th><th>优先级</th><th>注册事件</th><th>初始化时间</th><th>完成时间</th></tr>';
      
      for (var key in aList) {
        oTasker = aList[key];
        sHtml += '<tr>';
        sHtml += '<td style="width: 200px;">' + oTasker.id + '</td>';
        sHtml += '<td style="width: 200px;">' + oTasker.cname + '</td>';
        sHtml += '<td>' + oTasker.priority + '</td>';
        sHtml += '<td>' + formatTime(oTasker.regTime) + '</td>';
        sHtml += '<td>' + formatTime(oTasker.startTime) + '</td>';
        sHtml += '<td>' + formatTime(oTasker.createTime) + '</td>';
        sHtml += '</tr>';
      }
      
      sHtml += '</table>';
      sHtml += '<button onclick="document.body.removeChild(document.getElementById(\'taskerViewList\'))">关闭</button>';
      doc.body.appendChild(elmDiv);
      elmDiv.innerHTML = sHtml;
    },

    drawTimeLine: function () {
      var aList = sortList();
      var oTasker;
      var sIntro;
      var beginTime = getBeginTime();
      var endTime = getEndTime();
      var timeRange = endTime - beginTime;
      var iDistance =  timeRange > 0 ? 600 / timeRange : 0;
      var elmDiv = document.createElement('div');
      elmDiv.setAttribute('style', 'position: fixed; _position: absolute; background: #FFF; ' +
          'z-index:2147483647; bottom: 5px; right: 5px;');
      elmDiv.setAttribute('id', 'taskerTimeLine');

      var sHtml = '<table cellspacing="0" cellpadding="3" border="1">';
      sHtml += '<thead><tr><th>组件名</th><th>优先级</th><th>注册时间</th><th>时间轴</th></tr>';

      var blockTime, blockWidth, executeTime, executeWidth;

      for (var i = 0, iLen = aList.length; i < iLen; i++) {
        oTasker = aList[i];

        if (oTasker.startTime !== '') {
          blockTime = oTasker.startTime - beginTime;
          blockWidth = iDistance * blockTime;
        } else {
          blockWidth = 0;
          blockTime = 0;
        }

        if (oTasker.createTime !== '') {
          executeTime = oTasker.createTime - oTasker.startTime;
          executeWidth = iDistance * executeTime;
          executeWidth = executeWidth < 1 ? 1 : executeWidth;
        } else {
          executeWidth = 0;
          executeTime = 0;
        }

        sIntro = oTasker.id;
        sHtml += '<tr>';
        sHtml += '<td>' + sIntro + '</td>';
        sHtml += '<td>' + oTasker.priority + '</td>';
        sHtml += '<td>' + formatTime(oTasker.regTime) + '</td>';
        sHtml += '<td>';
        sHtml += '<div style="display: inline-block; height: 10px; background: #CCC; width: ' +
            blockWidth + 'px" title="' + blockTime + '"></div>';
        sHtml += '<div style="display: inline-block; height: 10px; background: #C60; width: ' +
            executeWidth + 'px" title="' + executeTime + '"></div>';
        sHtml += '</td>';
        sHtml += '</tr>';
      }
      
      sHtml += '</table>';
      sHtml += '<button onclick="document.body.removeChild(document.getElementById(\'taskerTimeLine\'))">关闭</button>';
      document.body.appendChild(elmDiv);
      elmDiv.innerHTML = sHtml;
    }
  };

  glue.extend(glue, {
    debug: debug
  });

  // 调试初始化。
  glue.debug.init();

  return glue;
}(glue || {}));