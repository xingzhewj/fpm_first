var glue = (function (glue) {
  'use strict';

  var doc = document;

  glue.extend(glue, {

    // 组件注册表，主要用于记录
    WidgetRegList: {/*id : widget*/},
    // 组件注册表，基于优先级进行注册，
    // 注意：每次在run的时候，都会将此对象进行重置，防止重复实例化组件。
    WidgetPriorityGroup: {/*priority: [widget, widget]*/},
    // 组件优先级顺序 @todo，这个可以改为局部变量。
    WidgetPriorityArray: [],
    // 组件名称表，用于记录注册的组件名称
    // 注意：如果使用combo服务，则每次combo的时候，都要将此表中的数据，
    //      移动到WidgetComboedNames中防止重复注册

    WidgetNames: {},
    // 已经通过combo服务加载过的组件。
    // @todo，回头还需要将页面上没有通过combo服务加载的组件也放进来。
    WidgetComboedNames: {},
    // 等待执行的combo任务的队列，
    // 因为如果一个页面进行多次combo请求的话，为了避免后面的combo比前面的先完成，
    // 导致请求的文件缺少依赖，combo请求只能已队列的形式顺序进行，
    WidgetComboQuestList: [],
    // combo状态，false代表没进行combo请求，true代表正在进行combo请求
    WidgetComboState: false,

    // 组件依赖列表，放置那些需要被依赖组件(depId)进行操作才能实例化的组件
    WidgetDepList: {/*depId : [widget, ..]*/},

    // 组件初始化的状态，false代表没进行初始化，true代表正在进行初始化
    WidgetStartState: false,

    /**
     * 注册一个组件，为脚本形式装载
     * @param {String}container 组件所在容器
     * @param {String}cid 组件实例id
     * @param {String}cname 组件类型
     * @param {String}depId 依赖组件
     * @param {Number}priority 优先级
     * @param {object} properties 实例create时传入的参数
     * @param {object} parent 创建实例的父实例，如果没有，传入glue。
     */
    widgetRegist: function (container, cid, cname, depId, priority, properties, parent) {

      if (typeof priority === 'undefined' || priority === null) {
        priority = 1;
      }

      // 如果已combo过的map中不存在这个组件，则加入glue.WidgetNames中
      // 记录组件名称，为以后combo加载脚本做准备。
      // 如果组件已经加载过，则不加入combo数组。
      if (typeof glue.WidgetComboedNames[cname] === 'undefined' &&
          typeof glue.hasDefine[cname] === 'undefined') {
        glue.WidgetNames[cname] = cname;
      }

      var widget = {
        'id': cid,  //组件id
        'priority': priority, //优先级
        'nexts': [],  //依赖改widget
        'instance': null,  //widget实例
        'depId': depId,  //需要依赖启动的widget
        'cname': cname,
        'regTime': new Date().valueOf(),
        'startTime': '',
        'createTime': '',
        'start': function () {  //组件启动
          var self = this;
          self.startTime = new Date().valueOf();
          parent = parent || glue;

          try {
            //得到cname对应的组件真实名称,div上使用的可能是别名
            var _cname = typeof glue.options.alias[cname] === 'undefined' ? cname : glue.options.alias[cname];
            require([_cname], function (Widget) {
              var widget =  new Widget(parent, cid);
              widget.create(container, properties);
              self.instance = widget;
              self.createTime = new Date().valueOf();
            });
          } catch (error) {
            glue.log('require ：cname ' + error);
          }
        }
      };
           
      if (typeof depId !== 'undefined' && depId !== null) {

        if (typeof glue.WidgetDepList[depId] === 'undefined') {
          glue.WidgetDepList[depId] = []; //需要依赖
        }

        glue.WidgetDepList[depId].push(widget);
      } else {

        if (typeof glue.WidgetPriorityGroup[priority] === 'undefined') {
          glue.WidgetPriorityGroup[priority] = []; //优先级
        }

        glue.WidgetPriorityGroup[priority].push(widget);
      }

      glue.WidgetRegList[cid] = widget;
    }

  });

  return glue;
}(glue || {}));