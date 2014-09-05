var glue = (function (glue) {
  'use strict';

  var doc = document;
  var win = window;

  glue.extend(glue, {

    run: function () {

      //1、装载所有组件依赖文件（暂时先本地装载）
      //2、初始化组件。调用组件的create构造组件
      installDepWidget();
      sortPriority();

      if (glue.options.useCombineServer) {
        loadWidgetScript(function () {
          startWidgets();
        });
      } else {
        startWidgets();
      }
    },

    /**
     * 将依赖参数组件的组件进行实例化。
     * @param  {[type]} widgetInstance [description]
     * @return {[type]}                [description]
     */
    notityDepExce: function (widgetInstance) {
      var widget = glue.WidgetRegList[widgetInstance.uuid];

      if (typeof widget !== 'undefined') {
        var priority = widget.priority;
        var depWidget = glue.WidgetPriorityGroup[priority];
        var nexts = widget.nexts;
        //清除需要依赖的队列，只执行一次
        widget.nexts = [];

        for (var i = 0; i < nexts.length; i++) {
          //将依赖启动的组件放置到当前组件所在的优先组中,这里忽略依赖启动的组件创建顺序
          depWidget.push(nexts[i]);
        }

        //如果没有启动则启动服务创建功能
        if (nexts.length > 0 && glue.WidgetStartState === false) {
          startWidgets();
        }
      }
    }
  });

  /**
   * 将需要依赖启动的组件安装到相应的组件上
   */
  var installDepWidget = function () {
    var widget;

    for (var p in glue.WidgetDepList) {

      widget = glue.WidgetRegList[p];
      if (typeof glue.WidgetRegList[p] !== 'undefined') {

        // 这里需要将数组进行合并，避免多次执行run的时候，对nexts进行覆盖的问题出现。
        widget.nexts = widget.nexts.concat(glue.WidgetDepList[p]);

        // 置空需要依赖列表，防止重复实例化
        glue.WidgetDepList[p] = [];

        // 如果组件已经实例化，并且组件已经启用了依赖他的组件
        if (widget.instance && widget.instance.isNext === true) {
          glue.notityDepExce(widget.instance);
        }
      }
    }
  };

  var serializeWidgetName = function (widgetNames) {

    var result = [];
    var widgetName;
    var version;
    var widgetMap = win.glueComponentVerMap || {};

    for (var i = 0, iLen = widgetNames.length; i < iLen; i++) {
      widgetName = widgetNames[i];
      version = widgetMap[widgetName] || '';
      result.push(widgetName + '#' + version);
    }

    return result.join(',');
  };

  /**
   * 装载组件相关的脚本。使用combine方式时候使用
   * @callback 脚本装载完的回调
   */
  var loadWidgetScript = function (callback) {

    if (glue.WidgetComboState === true) {
      glue.WidgetComboQuestList.push(callback);
      return;
    }

    glue.WidgetComboState = true;
    //将需要导入的Widget装配为请求地址
    var cnames = [];
    var comboCnames = [];
    var options = glue.options;
    var head = doc.head || doc.getElementsByTagName("head")[0];

    for (var key in glue.WidgetComboedNames) {
      comboCnames.push(key);
    }

    for (var cname in glue.WidgetNames) {
      cnames.push(cname);
      // 将相应组件加入到已combo组件列表中
      glue.WidgetComboedNames[cname] = cname;
    }

    // 将待combo数组清空，以备下次使用。
    glue.WidgetNames = {};

    // 如果没有需要加载的组件，则直接调用回调
    if (cnames.length === 0) {

      if (callback) {
        callback();//直接回调  
      }

      // 调用下一个脚本加载
      loadWidgetScriptNext();
      return;
    }

    //将canme排序，不同转载顺序的组件请求的地址一样
    cnames.sort();
    comboCnames.sort();

    //待请求的脚本地址
    var url = options.combineServer + '?c=' + encodeURIComponent(serializeWidgetName(cnames)) +
        '&f=' + encodeURIComponent(serializeWidgetName(comboCnames));
    var debugConfig = glue.debug.debugConfigGet();
    if (debugConfig.isCompress === false) {
      url = url + '&isCompress=false';
    } else {
      url = url + '&isCompress=true';
    }

    //通过script节点加载目标模块
    var node = doc.createElement("script");
    node.className = '$' + (new Date() - 0);

    node[glue.W3C ? "onload" : "onreadystatechange"] = function () {

      if (glue.W3C || /loaded|complete/i.test(node.readyState)) {
        glue.WidgetComboState = false;
        if (callback) {
          callback();
        }

        // 调用下一个脚本加载
        loadWidgetScriptNext();
      }
    };

    node.onerror = function () {
      alert('装载失败！');
    };

    node.src = url; //插入到head的第一个节点前，防止IE6下head标签没闭合前使用appendChild抛错
    head.insertBefore(node, head.firstChild); //chrome下第二个参数不能为null        
  };

  var loadWidgetScriptNext = function () {

    var comboCallback;

    if (glue.WidgetComboQuestList.length > 0) {
      comboCallback = glue.WidgetComboQuestList.shift();
      loadWidgetScript(comboCallback);
    }

  };

  var sortPriority = function () {

    glue.WidgetPriorityArray = [];

    //对优先级队列排序
    for (var priority in glue.WidgetPriorityGroup) {
      glue.WidgetPriorityArray.push(priority);
    }

    glue.WidgetPriorityArray.sort(function (a, b) {
      return b - a;  //降序
    });
  };

  /**
   * 按照组件优先级装载组件
   */
  var startWidgets = function () {
    // @todo 这里有可能运行多个定时器，需要进行一次清除操作。
    setTimeout(function () {
      //找到优先级最高的widget进行
      var hasWidget = false;
      var widgets, widget;
      var i;
      var j, jLen;

      for (i = 0; i < glue.WidgetPriorityArray.length; i++) {
        widgets = glue.WidgetPriorityGroup[glue.WidgetPriorityArray[i]];

        for (j = 0, jLen = widgets.length; j < jLen; j++) {
          widget = widgets[j];

          // 如果启用了脚本的combo服务，则需要判断需要要实例化的组件是否已经加载了。
          if (glue.options.useCombineServer === false || glue.hasDefine[widget.cname]) {
            widgets.splice(j, 1);
            widget.start();
            hasWidget = true;
            break;
          }
        }

        // if (typeof widgets !== 'undefined' && widgets.length > 0) {
        //   var widget = widgets.shift();
        //   widget.start(); //启动脚本
        //   hasWidget = true;
        //   break;
        // }
      }

      if (hasWidget) {
        glue.WidgetStartState = true;
        startWidgets();
      } else {
        glue.WidgetStartState = false;
      }
    }, 50);
  };

  return glue;
}(glue || {}));