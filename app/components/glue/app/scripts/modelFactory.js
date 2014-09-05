var glue = (function (glue) {
  'use strict';

  var win = window;

  //===================修复浏览器对Object.defineProperties的支持=================
  var defineProperty = Object.defineProperty;
  var defineProperties;
  //如果浏览器不支持ecma262v5的Object.defineProperties或者存在BUG，比如IE8
  //标准浏览器使用__defineGetter__, __defineSetter__实现
  try {
    defineProperty({}, "_", {
      value: "x"
    });
    defineProperties = Object.defineProperties;
  } catch (e) {
    defineProperty = function (obj, prop, desc) {

      if ('value' in desc) {
        obj[prop] = desc.value;
      }

      if ("get" in desc) {
        obj.__defineGetter__(prop, desc.get);
      }

      if ('set' in desc) {
        obj.__defineSetter__(prop, desc.set);
      }

      return obj;
    };

    defineProperties = function (obj, descs) {
      
      for (var prop in descs) {

        if (descs.hasOwnProperty(prop)) {
          defineProperty(obj, prop, descs[prop]);
        }
      }

      return obj;
    };
  }


  //VBScript下的属性监控
  if (window.VBArray && window.execScript) {  //IE 11 已经不支持vbscript了
    var expose = new Date() - 0;
    window.execScript([
      "Function parseVB(code)",
      "\tExecuteGlobal(code)",
      "End Function"
    ].join("\n"), "VBScript");

    //这里是属性变换时的代理方法
    var VBMediator = function (accessingProperties, name, value) {
      var accessor = accessingProperties[name];
      if (arguments.length === 3) {
        accessor(value);
      } else {
        return accessor();
      }
    };

    defineProperties = function (name, accessingProperties, normalProperties) {
      var className = "VBClass" + setTimeout("1"),
          buffer = [];
      buffer.push(
        "Class " + className,
        "\tPrivate [__data__], [__proxy__]",
        "\tPublic Default Function [__const__](d, p)",
        "\t\tSet [__data__] = d: set [__proxy__] = p",
        "\t\tSet [__const__] = Me", //链式调用
        "\tEnd Function");

      //添加普通属性,因为VBScript对象不能像JS那样随意增删属性，必须在这里预先定义好
      for (name in normalProperties) {
        buffer.push("\tPublic [" + name + "]");
      }

      buffer.push("\tPublic [" + 'hasOwnProperty' + "]");

        //添加访问器属性 
      for (name in accessingProperties) {

        if (!(name in normalProperties)) { //防止重复定义
          buffer.push(
            //由于不知对方会传入什么,因此set, let都用上
            "\tPublic Property Let [" + name + "](val" + expose + ")", //setter
            "\t\tCall [__proxy__]([__data__], \"" + name + "\", val" + expose + ")",
            "\tEnd Property",
            "\tPublic Property Set [" + name + "](val" + expose + ")", //setter
            "\t\tCall [__proxy__]([__data__], \"" + name + "\", val" + expose + ")",
            "\tEnd Property",
            "\tPublic Property Get [" + name + "]", //getter
            "\tOn Error Resume Next", //必须优先使用set语句,否则它会误将数组当字符串返回
            "\t\tSet[" + name + "] = [__proxy__]([__data__],\"" + name + "\")",
            "\tIf Err.Number <> 0 Then",
            "\t\t[" + name + "] = [__proxy__]([__data__],\"" + name + "\")",
            "\tEnd If",
            "\tOn Error Goto 0",
            "\tEnd Property");
        }
      }

      buffer.push("End Class"); //类定义完毕
      buffer.push(
        "Function " + className + "Factory(a, b)", //创建实例并传入两个关键的参数
        "\tDim o",
        "\tSet o = (New " + className + ")(a, b)",
        "\tSet " + className + "Factory = o",
        "End Function");
      window.parseVB(buffer.join("\r\n")); //先创建一个VB类工厂
      return window[className + "Factory"](accessingProperties, VBMediator); //得到其产品
    };
  }


  /**
   * dataModel工厂,使用司徒的双向绑定
   * @param {function}modelFn 模型的方法，这是为了实现Vbscript兼容，只能这样，有点不符合javascript的语义。
   * @return 模型对象
   */
  var define = function (modelFn) {

    if (!glue.isFunction(modelFn)) {
      glue.error('modelFn必须是个方法或数组！');
    }

    var model = {}; //内置的对象
    modelFn(model); //初始化obj对象
    return createModel(model);
  };

  var createModel = function (model) {
         
    //model中的属性如果是数组需要封装成可见听的数组，监听数组的基本功能
    if (glue.isArray(model)) {
      return new ArrayProxy(model);
    }
         
    for (var p in model) { //设置属性变化时的触发方法

      if (glue.isObject(model[p]) || glue.isArray(model[p])) {
        model[p] =  createModel(model[p]);
      }
    }
         
    model.$events = {};  //属性监听回调事件列表
    model.$watch = function () {};
    model.$orgModel = {};

    var normalProperties = {};
    var propertiesAccessor = {};
    var vmodelRef = {};
    var orgModel = {};

    for (var pName in model) { //设置属性变化时的触发方法

      if (pName.substring(0, 1) !== '$' && !glue.isFunction(model[pName])) {
        orgModel[pName] = model[pName];
        propertiesAccessor[pName] = (function (pName) {
          return function (/* obj */) {
            var p, val, i, fn, events;
            var vmodel = vmodelRef.vmodel;

            if (arguments.length > 0) { //setting
              var value = arguments[0];
              var oldValue = vmodel.$orgModel[pName];

              if (value !== oldValue) {   //如果值相等，不做处理

                if (glue.isArray(oldValue)) {
                  val = vmodel[pName];
                  val.clear();         //清空数组
                  
                  // for (i = 0 ; i < value.length; i++) {  //重新设置值 
                  //   val.push(value[i]);
                  // }
                  // 将数组一次性push到数组中。
                  val.push.apply(val, value);

                } else if (glue.isObject(oldValue)) {
                  val = vmodel[pName];
                  
                  for (p in value) {  //__const__  __data__ __proxy__ 都是vb里申明的，这里不能调用

                    if (p.substring(0, 1) !== '$' &&
                        p !== '__const__' &&
                        p !== '__data__' &&
                        p !== '__proxy__' &&
                        p !== 'hasOwnProperty' &&
                        !glue.isFunction(value[p])) {
                      val[p] = value[p];
                    }
                  }

                  events = vmodel.$events[pName] || [];

                  for (i = 0; i < events.length; i++) {
                    fn = events[i];
                    fn.apply(vmodel, [value]);
                  }
                       
                } else {
                  vmodel.$orgModel[pName] = value;
                  events = vmodel.$events[pName];

                  if (typeof events !== 'undefined') {

                    for (i = 0; i < events.length; i++) {
                      fn = events[i];
                      fn.apply(vmodel, [value]);
                    }
                  }

                  return;
                }

                if (value.$watch && vmodel.$orgModel[pName].$watch) { //引用赋值，是否出现作用域问题？
                  /* 
                     新值是一个可监控对象并且原始也是一个可监控对象，
                     则需要将原始对象的监听事件拷贝到新值中
                   */
                  events = vmodel.$orgModel[pName].$events;

                  for (p in events) {
                    value.$watch(p, events[p]);
                  }

                  vmodel.$orgModel[pName] = value;
                }
              }
            } else { //getting
              return vmodel.$orgModel[pName];
            }
          };
        })(pName);

      } else {
        normalProperties[pName] = model[pName];
      }
    }
         
    //!(window.VBArray && window.execScript) 判断是不是IE 11版本以下
    var descriptorFactory = !(win.VBArray && win.execScript) ?
      function (obj) { //这里主要是为了适配definedProperty
        var descriptors = {};
        for (var i in obj) {
          descriptors[i] = {
            get: obj[i],   //这里的方法其实就是 propertiesAccessor
            set: obj[i]
          };
        }
        return descriptors;
      } : function (a) {
        return a;
      };
         
    var vmodel = defineProperties(model, descriptorFactory(propertiesAccessor), normalProperties);
    vmodelRef.vmodel = vmodel;  //为访问器提供对封装过的model引用
    vmodel.$events = {};      //属性监听回调事件列表
    vmodel.$watch = function () {};
    vmodel.$orgModel = orgModel;

    /* 添加属性监听事件
    * @param propertyName 属性名称
    * @param changeFn     回调方法
    */
    var addPropertyChangeListener = function (propertyName, changeFn) {

      if (typeof this.$events[propertyName] === 'undefined') {
        this.$events[propertyName] = [];
      }

      this.$events[propertyName].push(changeFn); //注册属性的监听事件
    };

    vmodel.$watch = addPropertyChangeListener.bind(vmodel);
    return vmodel;
  };
    
  //数组代理
  var ArrayProxy = function (array) {
      
    //array.$orgModel = array;
    array.$events = {};

    array.$watch = function (fnName, notifyFn) {

      if (typeof this.$events[fnName] === 'undefined') {
        this.$events[fnName] = [];
      }

      this.$events[fnName].push(notifyFn);
    };

    array.push = function () {
      var length = Array.prototype.push.apply(this, arguments);
      var args = [].slice.call(arguments);
      this.$fire('push', args);
      return length;
    };

    array.pop = function () {
      var last = Array.prototype.pop.apply(this, arguments);
      this.$fire('pop', last);
      return last;
    };

    array.unshift = function () {
      var length = Array.prototype.unshift.apply(this, arguments);
      var args = [].slice.call(arguments);
      this.$fire('unshift', args);
      return length;
    };

    array.shift = function () {
      var first = Array.prototype.shift.apply(this, arguments);
      this.$fire('shift', first);
      return first;
    };

    array.clear = function () {
      this.length = 0; //清空数组
      this.$fire('clear');
      return this;
    };

    array.unshift = function () {
      var length = Array.prototype.unshift.apply(this, arguments);
      var args = [].slice.call(arguments);
      this.$fire('unshift', args);
      return length;
    };

    array.$fire = function (fnName) {
      var args = [].slice.call(arguments);

      if (typeof this.$events[fnName] !== 'undefined') {

        for (var i = 0; i < this.$events[fnName].length; i++) {

          if (args.length > 1) {
            this.$events[fnName][i](args[1]);
          } else {
            this.$events[fnName][i]();
          }
        }
      }
    };
         
    return array;
  };

  var modelFactory = {'define' : define, 'defineArray': ArrayProxy};

  glue.modelFactory = modelFactory;

  return glue;
}(glue || {}));
