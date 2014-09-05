var glue = (function (glue) {
  'use strict';

  var doc = document;
  var root = doc.documentElement;

  glue.extend(glue, {

    /**
     * 扫描方法，用来识别组件.
     * @param ele 需要扫描的范围
     */
    scan: function (ele) {
      ele = ele || root;  //如果没有指定则扫描全部
      //1、分析出所有有cid的
      scanNodes(ele);
    }

  });

  /**
   * 扫描所有节点，碰到g-cid的组件后退出，由组件自身去完成初始化工作
   * @param ele  扫描的节点
   * @param model 节点的数据对象
   */
  var scanNodes = function (ele) {
    var options = glue.options;
    var cid = ele.getAttribute(options.prefix + 'cid');     //组件实例id
    var cname = ele.getAttribute(options.prefix + 'cname'); //组件名称
    var priority = ele.getAttribute(options.prefix + 'priority');  //组件的优先调用时间
    var depWidgetId = ele.getAttribute(options.prefix + 'depId'); //依赖启动的组件
    var isRegister = ele.getAttribute(options.prefix + 'isRegister');
   
    if (glue.isString(cid) && glue.isString(cname) && isRegister !== 'registered') {
      ele.setAttribute('g-isRegister', 'registered');
      glue.widgetRegist(ele, cid, cname, depWidgetId, priority);
      // @todo 这里如果不return的话，会对组件内部的dom节点进行继续扫描。
      return;
    }

    var node = ele.firstChild;

    while (node) {
      var nextNode = node.nextSibling;

      if (node.nodeType === 1) {
        scanNodes(node); //扫描元素节点
      }

      node = nextNode;
    }
  };

  return glue;
}(glue || {}));