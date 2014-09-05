define('TestWidget', ["F_glue", 'F_WidgetBase', 'jquery'], function (glue, WidgetBase, $) {
  'use strict';
  var TestWidget = WidgetBase.extend({

    version: '@VERSION@',
    type: 'TestWidget',

    createModel: function () {
      this.modelTest = glue.modelFactory.define(function (vm) {
        vm.topic = '';
      });
    },

    relolveTemplate: function () {
      this.domNode = this.srcNode;
    },

    bindDataEvent: function () {
      
      var _self = this;
      this.modelTest.$watch('topic', function (newvalue) {
        glue.log(_self.uuid + ' , ' + newvalue);
        var ele = $(_self.srcNode);
        glue.log(ele.attr('g-cid'));
        $(_self.srcNode).find('.appendedInputButton').val(newvalue);
      });
      
    },

    bindDomEvent: function () {
      var _self = this;
      $('#notityNext', this.domNode).on('click', function () {
        _self.next();
        // glue.notityDepExce(_self);
      });
      
      
      $('.btn', $(this.domNode)).on('click', function () {
        glue.log('value : ' + $(_self.srcNode).find('.appendedInputButton').val());
        _self.modelTest.topic = $(_self.srcNode).find('.appendedInputButton').val();
      });
    },

    bindObserver: function () {
      this.observer('test', this.getMessage, this);
    },

    getMessage: function (message) {
      $(this.srcNode).find('.appendedInputButton').val(message);
    }

  });

  return TestWidget;
});