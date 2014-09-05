/**
 *
 * 组件基类
 * example
 * <script>
 *  var obj = {a:1 , b:2}
 *  var arr = [1,2,3]
 * </script>
 * <div   g-attr-xxx="a" g-attr-xxx1 ="b" g-attr-xxx2="obj.a" 
          g-attr-xxx3="obj.b" g-attr-xxx4="{a:1,b:2}" g-attr-xxx5="[1,2,3]"
          g-attr-xxx6="arr"
   ></div>
                     
 * 数据有三个作用域 window 、widget、local.
 * 数据路径的查找顺序 local-->widget-->window , 没有找到则抛出异常            
 * g-init-data 会覆盖外部的定义
 */
define('F_WidgetBase', ["F_glue", 'F_WidgetBase/utils'], function (glue, utils) {
  'use strict';

  var win = window;
  var emptyFn = function () {};
  /**
  * 基类的构造函数
  * @
  */
  var WidgetBase = glue.Class.create({

    // 组件版本
    version: '@VERSION@',

    // 组件类型
    type: 'widgetBase',

    /**
     * 组件初始化，子类在对其进行扩展的时候，禁止将this.create放置在里面，
     * 以免影响对于组件的自动化组装流程
     * @param  {Object} parent 实例化这个组件的父组件，如果不是其他组件实例化的，则parent为glue
     * @param  {String} uuid   组件唯一标识，可选，如果不传，则会在内部生成一个。
     */
    initialize: function (parent, uuid) {

      // 为了避免组件的层次关系出现问题，这里强制必须设置parent参数。
      if (typeof parent === 'undefined' ||
          !(parent instanceof WidgetBase || parent === glue)) {
        var errorMsg = '请设置组件的父组件，如果没有被其他组件包含，则将parent设置为glue';
        alert(errorMsg);
        throw new Error(errorMsg);
      }

      // 组件是否创建
      this.isCreate = false;
      // 组件是否执行了触发依赖组件的操作
      this.isNext = false;
      // 设置uuid
      this.uuid = uuid || glue.createWidgetUuid();
      // 检查uuid是否重复。
      glue.checkUuid(this.uuid);
      this.parent = parent;
      this.parent.addWidget(this);
      this.widgets = {};
    },

   /**
    * 开始进行组件真正的创建。
    * @param element 外部容器 w3c element
    * @param properties 与内部模型相对应的属性
    * @return {Object} 返回实例本身，用于链式调用。
    */
    create: function (element, /*Object*/properties) {
      
      // 组件不能重复创建。
      if (this.isCreate) {
        return;
      }

      // Widget在html中的定义节点
      this.srcNode = element || null;
      // Widget的dom对象
      this.domNode = null;
      // 构造models与实例属性
      this.createModel();
      // 混合element属性数据到实例中
      this.mixElementProperties();
      // 混合参数中的数据到实例中
      this.mixProperties(properties);
      // 创建domNode，解析模板内容
      this.relolveTemplate();
      // 解析文本节点，将文本数据中的{{}}替换成新的文本节点并将节点监听数据变化事件
      this.relolveVariables();
      // 绑定dom事件
      this.bindDomEvent();
      // 为数据模型绑定数据监听事件
      this.bindDataEvent();
      // 绑定自定义事件。
      this.bindCustomEvent();
      // 绑定消息注册
      this.bindObserver();
      // 渲染组件
      this.renderer();
      // 组件创建完成后
      this.createComplete();
      this.isCreate = true;
      return this;
    },

    
    // 构造数据模型，由子类实现
     
    createModel: emptyFn,

    /**
     * 混合标记上的属性属性
     */
    mixElementProperties: function () {

      if (!this.srcNode) {
        return;
      }

      var expr = this.srcNode.getAttribute('g-options');

      if (expr) {
        var properties = new Function('return ' + expr)();
        this.mixProperties(properties);
      }

    },

    mixProperties: function (properties) {
      var propertyNames, lasePropertyName;
      var context;

      if (!glue.isDefined(properties)) {
        return;
      }

      for (var propertyName in properties) {
        var objValue = properties[propertyName];

        if (typeof objValue === 'string' && /^[@]{2,2}/.test(objValue)) {
          this.mixModel(propertyName, objValue);
        } else {
          propertyNames = propertyName.split('.');
          lasePropertyName = propertyNames.pop();
          context = utils.transContext(this, propertyNames);
          context[lasePropertyName] = objValue;
        }
      }
    },

    // 对模型进行混合，注意，外部model只能定义在全局作用域中。
    mixModel: function (propertyName, value) {
      value = value.substring(2);
      var values = value.split('.');
      var scope = win[values.shift()];
      var expr = values.join('.');
      var _self = this;

      // ie下面需要把下面的属性也过滤掉
      var filterString = '|__const__|__data__|__proxy__|hasOwnProperty|';

      // 如果表达式为空，则表示需要对整个model进行遍历，对每个属性都要进行混合
      if (expr === '') {
        for (expr in scope) {
          if (typeof expr !== 'undefined' &&
              !/^[$]/.test(expr) &&
              filterString.indexOf('|' + expr + '|') < 0) {
            // 返回表达式的值对象
            glue.resolveObject(scope, expr, (function (propertyName) {
                return function (exprValueObj) {
                  _self.bibind(propertyName, exprValueObj);
                };

              }(propertyName + '.' + expr)));
          }
        }
      } else {
        glue.resolveObject(scope, expr, (function (propertyName) {
          return function (exprValueObj) {
            _self.bibind(propertyName, exprValueObj);
          };

        }(propertyName))); //返回表达式的值对象
      }

    },

    bibind: function (propertyName, exprValueObj) {
      var propertyNames = propertyName.split('.');
      propertyName = propertyNames.pop();
      var context = utils.transContext(this, propertyNames);
      context[propertyName] = exprValueObj.value;

      if (glue.isFunction(exprValueObj.$watch)) { //属性绑定

        //外部通知组件发生变化
        exprValueObj.$watch((function (propertyName) {
          return function (newvalue) {
            context[propertyName] = typeof newvalue === 'undefined' ? '' : newvalue;
          };
        }(propertyName)));

        //组件内部修改，通知外部对象数据
        if (context.$watch) {
          context.$watch(propertyName, (function (exprValueObj) {
            return function (newvalue) {
              exprValueObj.$set(newvalue);
            };
          }(exprValueObj)));
        }
      }
    },

    /*
     * 解析模板，由子类实现
     */
    relolveTemplate: emptyFn,

    relolveVariables: function () {

      if (!this.domNode) {
        return;
      }

      var _self = this;

      var parseTextNode = function (parent) {

        if (parent.nodeType === 3) { //文本节点
          var text = parent.nodeValue;  //得到文本节点
          var tokens = utils.scanExpr(text);
          var fragment =  glue.dom.createDocumentFragment();
          // var bindExec = [];

          for (var i = 0 ; i < tokens.length; i++) {
            var token =  tokens[i];
            var _node = glue.dom.createTextNode(token.value);

            if (token.expr) { //如果是表达式
              glue.resolveObject(_self[token.scope], token.value, function (ret) {
                _node.nodeValue = ret.value;

                if (glue.isFunction(ret.$watch)) { //绑定数据变化
                  (function (_node) {
                    ret.$watch(function (newvalue) {
                      _node.nodeValue = typeof newvalue === 'undefined' ? '' : newvalue;
                    });
                  }(_node));
                }
              });
            }

            fragment.appendChild(_node);
          }

          parent.parentNode.replaceChild(fragment, parent);
          return;
        }

        var node = parent.firstChild;

        while (node) {
          var nextNode = node.nextSibling;
          parseTextNode(node);
          node = nextNode;
        }
      };

      parseTextNode(this.domNode);
    },

    // 监听model数据变化，由子类实现
    bindDataEvent: emptyFn,

    // 绑定dom事件，由子类实现
    bindDomEvent: emptyFn,

    // 绑定自定义事件，由子类实现
    bindCustomEvent: emptyFn,

    // 绑定消息注册，由子类实现
    bindObserver: emptyFn,

    // 渲染组件，由子类实现
    renderer: emptyFn,

    // 组件创建完成，由子类实现
    createComplete: emptyFn,

    // 添加子组件
    addWidget: function (widget) {
      this.widgets[widget.uuid] = widget;
    },

    // 移除子组件
    removeWidget: function (uuid) {

      if (typeof uuid !== 'string') {
        uuid = uuid.uuid;
      }

      var widget = this.widget[uuid];
      delete this.widgets[uuid];
      widget.destroy();
    },

    // 获取子组件
    getWidget: function (uuid) {

      if (typeof uuid !== 'string') {
        uuid = uuid.uuid;
      }

      return this.widget[uuid];
    },

    // 获取所有子组件
    getAllWidget: function () {
      return this.widgets;
    },

    // 发送通知给glue
    notify: function (name, message) {
      if (typeof glue !== 'undefined') {
        glue.trigger(name, message);
      }
    },

    // 订阅glue的通知
    observer: function (name, callback, context) {
      var self = this;
      if (typeof glue !== 'undefined') {
        glue.on(name, callback, context || self);
      }
    },

    // 销毁组件
    destroy: function () {
      for (var i in this.widgets) {
        this.widgets[i].destroy();
      }
    },

    next: function () {
      if (this.isNext === false) {
        glue.notityDepExce(this);
        this.isNext = true;
      }
    }

  });

  glue.Events.mixTo(WidgetBase);

  return WidgetBase;
});
