var glue = (function (glue) {
  
  'use strict';
  // 暂时使用Events混入的方式，
  // 如果要加入更多控制的时候，可以自行进行扩展，接口符合Events的接口即可
  glue.Events.mixTo(glue);

  var win = window;
  var events = {};
  var messages = {};

  glue.extend(glue, {

    /**
     * 注册一个自定义事件
     * @param  {String }   name    事件名称
     * @param  {Function} callback 该事件的回调函数
     * @param  {Object}   context  回调函数执行的上下文，如果没有传入的话，会指向window
     * 对于一个自定义事件，可以反复定义的。
     */
    on: function (name, callback, context) {
      context = context || win;

      if (typeof events[name] === 'undefined') {
        events[name] = [];
      }

      events[name].push({callback: callback, context: context});

      var message = this.getMessage(name);

      if (message.length > 0) {
        callback.apply(context, message[message.length - 1]);
      }
    },

    /**
     * 触发一个自定义事件
     * @param  {String} name 事件名称
     */
    trigger: function (name) {

      var eventList = events[name];
      var event;
      var params = [].slice.call(arguments, 1);
      this.addMessage(name, params);

      if (typeof eventList === 'undefined') {
        return;
      }

      for (var i = 0, iLen = eventList.length; i < iLen; i++) {
        event = eventList[i];
        event.callback.apply(event.context, params);
      }
    },

    /**
     * 注销一个自定义事件
     * @param  {String}   name     自定义事件名称
     * @param  {Function} callback 对应的函数，如果没有传入的话，
     *                             则会将此自定义事件名下的所有注册函数都注销掉
     *                             如果有多次注册的函数，也会一次全部注销
     */
    off: function (name, callback) {

      if (typeof events[name] === 'undefined') {
        return;
      }

      if (typeof callback === 'undefined') {
        delete events[name];
        return;
      }

      var eventList = events[name];
      var event;

      for (var i = eventList.length - 1; i >= 0; i--) {
        event = eventList[i];

        if (event.callback === callback) {
          eventList.splice(i, 1);
        }
      }

      if (eventList.length === 0) {
        delete events[name];
      }
    },

    /**
     * 获取自定义事件列表
     * @param  {String} name 需要获取的自定义事件名称，如果不传，则获取所有自定义事件的列表
     */
    getEvent: function (name) {
      
      if (typeof name === 'undefined') {
        return events;
      }

      return events[name] || [];
    },

    /**
     * 添加一条触发自定义事件发出的消息
     * @param {String} name    消息名称
     * @param {Array}  message 消息对应的参数，以数组形式返回。
     */
    addMessage: function (name, message) {

      if (typeof messages[name] === 'undefined') {
        messages[name] = [];
      }

      messages[name].push(message);
    },

    /**
     * 获取消息
     * @param  {String} name 消息对应自定义事件名称，如果没有传，则获取所有消息
     */
    getMessage: function (name) {

      if (typeof name === 'undefined') {
        return messages;
      }

      return messages[name] || [];
    }
  });

  return glue;
}(glue || {}));