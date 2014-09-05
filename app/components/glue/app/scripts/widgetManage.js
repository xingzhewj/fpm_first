var glue = (function (glue) {
  'use strict';

  var widgets = {};
  var allUuid = {};

  var uuid = 0;

  glue.extend(glue, {
    
    // 创建一个uuid;
    createWidgetUuid: function () {
      uuid++;
      return '__glue_widget_' + uuid;
    },

    // 添加一个组件
    addWidget: function (widget) {

      if (typeof widget.uuid === 'undefined') {
        widget.uuid = glue.createWidgetUuid();
      }

      widgets[widget.uuid] = widget;
    },

    // 移除一个组件
    removeWidget: function (uuid) {

      if (typeof uuid !== 'string') {
        uuid = uuid.uuid;
      }

      var widget = widgets[uuid];
      delete widgets[uuid];
      widget.destroy();
    },

    // 获得一个组件
    getWidget: function (uuid) {

      if (typeof uuid !== 'string') {
        uuid = uuid.uuid;
      }

      return widgets[uuid];
    },

    // 获得所有组件
    getAllWidget: function () {
      return widgets;
    },

    // 检查uuid是否重复。
    checkUuid: function (uuid) {

      if (allUuid[uuid] === true) {
        var errMsg = '组件的Uuid冲突，请检查你设置的uuid值是否重复，冲突uuid: ' + uuid;
        alert(errMsg);
        throw new Error(errMsg);
      }

      allUuid[uuid] = true;
    }
  });

  glue.Events.mixTo(glue);

  return glue;

}(glue || {}));