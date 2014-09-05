var glue = (function (glue) {
  'use strict';

  var win = window;

  glue.extend(glue, {

    /**
     * 解析对象
     * @param scope 对象作用域
     * @param objPathExpr 对象路径
     * @param resolveComplete 对象解析完成后的回调
     * @return {object}
                value : 表达式值
                $watch : 表达式属性的监听方法
                $set   : 表达式的赋值方法
     */
    resolveObject: function (scope, objPathExpr, resolveComplete) {
      var ret = resolveObject(scope, objPathExpr);
      resolveComplete(ret);
    }

  });

  /**
   * 解析对象
   * @param scope 对象作用域
   * @param objPathExpr 对象路径
   * @return {object}
              value : 表达式值
              $watch : 表达式属性的监听方法
              $set   : 表达式的赋值方法
   */
  var resolveObject = function (scope, objPathExpr, parentObj) {
    var splitArray = objPathExpr.split('.');
    var firstName = splitArray.shift();

    if (!glue.isDefined(scope) || scope === null) {
      // 暂时不考虑使用组件中数据的情况。
      // 这样会导致有时组件还没有实例化就需要获取其中的属性数据，导致一些逻辑上的错误
      // 本着规则尽量简单的原则，所有关联数据都直接在外部定义。
      // scope = (Widgets[firstName] && Widgets[firstName].instance) || win[firstName];
      scope = win[firstName];
    } else {
      parentObj = scope;
      scope = scope[firstName];
    }

    if (splitArray.length === 0) {
      
      if (parentObj && parentObj.$watch) { //可监控的对象
        return {
          value: scope,

          $watch: (function (firstName, parentObj) {
              return function (fn) {
                parentObj.$watch(firstName, fn);
              };
            }(firstName, parentObj)),

          $set: (function (firstName, parentObj) {
              return function (val) {
                parentObj[firstName] = val;
              };
            }(firstName, parentObj))
        };
      }
      return {value : scope};
    } else {
      return resolveObject(scope, splitArray.join('.'), scope);
    }
  };

  return glue;
}(glue || {}));