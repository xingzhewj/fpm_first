define('TestWidgetA', ["F_glue", 'F_WidgetBase', 'jquery'], function (glue, WidgetBase, $) {
  'use strict';

  var TestWidget = WidgetBase.extend({
    version: '@VERSION',
    type: 'TestWidgetA',
    createModel: function () {
      this.detail = glue.modelFactory.define(function (vm) {
        vm.url = '';
        vm.guid = '';
        vm.d = {a: '',
                b: []};
      });

      this.map = glue.modelFactory.define(function (vm) {
        vm.a = '';
        vm.b = [];
        vm.c = {
          d: '',
          e: []
        };
      });
      this.isDisable = false;
    },

    bindDataEvent: function () {
      this.detail.$watch('url', function (newValue) {
        glue.log('change--->', newValue);
      });
      this.detail.$watch('guid', function (newValue) {
        glue.log('change--->b', newValue);
      });
      this.detail.d.$watch('a', function (newValue) {
        glue.log('change--->d.a', newValue);
      });
      this.detail.d.b.$watch('push', function (newValue) {
        glue.log('change--->d.b', newValue);
      });

      this.map.$watch('a', function (newValue) {
        glue.log('map--->a', newValue);
      });

      this.map.b.$watch('push', function (newValue) {
        glue.log('map--->b.push', newValue);
      });

      this.map.$watch('c', function (newValue) {
        glue.log('map--->c', newValue);
      });

      this.map.c.$watch('d', function (newValue) {
        glue.log('map--->c.d', newValue);
      });

      this.map.c.e.$watch('push', function (newValue) {
        glue.log('map--->c.e.push', newValue);
      });
    },

    createComplete: function () {
      this.sendMessage('widget5Complete');
    },

    sendMessage: function (message) {
      this.notify('test', message);
    }
  });

  return TestWidget;
});