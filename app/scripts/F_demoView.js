define('F_demoView', ['F_glue', 'F_WidgetBase', 'F_demoView/F_demoViewTemplate', 'jquery'],
    function (glue, WidgetBase, wrapTemplate, $) {
  'use strict';

  wrapTemplate.helper('titleFormat', function (title, maxLength) {
    maxLength = maxLength || 20;

    if (title.length > maxLength) {
      title = title.slice(0, maxLength - 2) + '...';
    }

    return title;
  });

  var F_demoView = WidgetBase.extend({
    // 版本标识，请勿删除与更改
    version: '@VERSION',
    // 组件类型，请勿删除与更改
    type: 'F_demoView',

    // 创建组件内部数据
    createModel: function () {
      // model声明方式
      this.news = glue.modelFactory.define(function (vm) {
        vm.list = [];
        vm.index = '';
      });
      
      // 普通属性声明
      // this.index = 0;
    },

    // 创建并解析模板
    relolveTemplate: function () {
      // this.domNode = $('<div class="mod-demo-view">' +
      //   '<div class="w-view-box js_viewBox"></div>' +
      //   '<i class="w-pre js_preHandle">上一张</i>' +
      //   '<i class="w-next js_nextHandle">下一张</i>' +
      // '</div>');
      this.domNode = $(wrapTemplate.layout());
      this.nextHandle = this.domNode.find('.js_nextHandle');
      this.preHandle = this.domNode.find('.js_preHandle');
      this.viewBox = this.domNode.find('.js_viewBox');
    },

    // 绑定dom事件
    bindDomEvent: function () {
      // var _this = this;
      this.nextHandle.on('click', $.proxy(this.nextPic, this));
      this.preHandle.on('click', $.proxy(this.prePic, this));
    },

    // 为数据模型绑定数据监听事件
    bindDataEvent: function () {
      // 监控属性变更
      var _this = this;
      this.news.list.$watch('push', function () {
        _this.news.index = _this.news.list.length - 1;
      });

      this.news.$watch('index', function (index) {
        _this.jumpTo(index);
      });
    },

    // 绑定自定义事件
    bindCustomEvent: function () {
      // 创建一个自定义事件
      // var _this = this;
      // this.on('jumpTo', function (index) {
      //   _this.notify('newsIndex', index);
      //   _this.jumpTo(index);
      // });
    },

    // 绑定消息注册
    bindObserver: function () {
      var _this = this;
      this.observer('newsIndex', function (index) {
        if (typeof this.news.list[index] !== 'undefined') {
          _this.news.index = index;
        }
      });
    },

    // 渲染组件。
    renderer: function () {
      $(this.srcNode).append(this.domNode);
    },

    // 创建完成后的处理。
    createComplete: function () {
      if (typeof this.news.list[0] !== 'undefined') {
        this.news.index = 0;
      }
    },

    // 组件内部方法
    jumpTo: function (index) {
      var item = this.news.list[index];
      this.renderView(item);
      this.notify('newsIndex', index);
    },

    renderView: function (item) {
      // this.viewBox.html('<div class="w-view-item"><img src="' + item.poster + '" /><span>' +
      //     item.text + '</span></div>');
      this.viewBox.html(wrapTemplate.item(item));
    },

    nextPic: function () {
      this.news.index = this.news.index + 1 >= this.news.list.length ? 0 : this.news.index + 1;
    },

    prePic: function () {
      this.news.index = this.news.index - 1 < 0 ? this.news.list.length - 1 : this.news.index - 1;
    }

  });

  return F_demoView;
});