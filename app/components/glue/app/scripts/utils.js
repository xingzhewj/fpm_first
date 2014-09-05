define('F_WidgetBase/utils', [], function () {
  'use strict';

  // @todo 如果以后需要外部配置，需要其可配置。
  var openTag = '{{';
  var closeTag = '}}';

  /**
   * 扫描字符串，将字符串转换成一个token数组
   * 主要用在扫描文本节点，将其中的{{}}标签
   * @param  {String} str 带解析的字符串
   * @return {Object} 解析结果
   * {
   *   value: model中的属性名，可以使用.连写
   *   scope: model名
   *   expr: true | false 是否为 {{}} 的内容
   * }
   * example:
   * var output = scanExpr('{{model.a.b}}');
   * output: 
   * {
   *   value: 'a.b',
   *   scope: 'model',
   *   expr: true
   * }
   */
  var scanExpr = function (str) {
    var tokens = [],
        value, start = 0,
        scope,
        stop;

    do {
      stop = str.indexOf(openTag, start);

      if (stop === -1) {
        break;
      }

      value = str.slice(start, stop);

      if (value) { // {{ 左边的文本
        tokens.push({
          value: value,
          expr: false
        });
      }

      start = stop + openTag.length;
      stop = str.indexOf(closeTag, start);

      if (stop === -1) {
        break;
      }

      value = str.slice(start, stop);

      if (value) { //处理{{ }}插值表达式
        value = value.split('.');
        scope = value.shift();
        value = value.join('.');
        tokens.push({
          value: value,
          scope: scope,
          expr: true
        });
      }

      start = stop + closeTag.length;
    } while (1);

    value = str.slice(start);


    if (value) { //}} 右边的文本
      tokens.push({
        value: value,
        scope: '',
        expr: false
      });
    }

    return tokens;
  };

  /**
   * 转换上下文，主要是将原始上下文转换为一个新的上下文
   * @param  {Object} context       原始上下文
   * @param  {String} propertyNames 以逗号连接的作用域下面的属性名。
   * @return {Object}               新的上下文
   * example:
   * var a = {b: c: {d: 1}};
   * var o = transContext(a, 'b.c');
   * alert(o.d === 1);
   */
  var transContext = function (context, propertyNames) {
    var orgContext = context;
    var propertyName;

    for (var i = 0, iLen = propertyNames.length; i < iLen; i++) {
      propertyName = propertyNames[i];

      if (!(propertyName in context)) {
        var errorMsg = orgContext.type + '组件中不存在' + propertyNames.join('.') + '属性,请检查';
        alert(errorMsg);
        throw new Error(errorMsg);
      }

      context = context[propertyName];
    }

    return context;
  };

  return {
    scanExpr: scanExpr,
    transContext: transContext
  };

});