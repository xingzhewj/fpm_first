var glue = (function (glue) {
  'use strict';

  var win = window;
  var doc = document;
  var tagWrap = {
    option: ["select"],
    tbody: ["table"],
    thead: ["table"],
    tfoot: ["table"],
    tr: ["table", "tbody"],
    td: ["table", "tbody", "tr"],
    th: ["table", "thead", "tr"],
    legend: ["fieldset"],
    caption: ["table"],
    colgroup: ["table"],
    col: ["table", "colgroup"],
    li: ["ul"]
  };

  var reTag = /<\s*([\w\:]+)/;
  var masterNode = {};
  var masterNum = 0;
  var masterName = "__" + "ToDomId";
  // var documentFragment = doc.createDocumentFragment();

  for (var param in tagWrap) {
    if (tagWrap.hasOwnProperty(param)) {
      var tw = tagWrap[param];
      tw.pre = param === "option" ? '<select multiple="multiple">' : "<" + tw.join("><") + ">";
      tw.post = "</" + tw.reverse().join("></") + ">";
    }
  }

  /**
   * [toDom description]
   * @param  {string} frag 传入的字符串
   * @param  {[type]} doc  [description]
   * @return {[type]}      [description]
   */
  var toDom = function toDom(frag, doc) {

    doc = doc || doc;
    var masterId = doc[masterName];

    if (!masterId) {
      doc[masterName] = masterId = ++masterNum + "";
      masterNode[masterId] = doc.createElement("div");
    }

    frag += "";
    var match = frag.match(reTag);
    var tag = match ? match[1].toLowerCase() : "";
    var master = masterNode[masterId];
    var wrap, i, fc, df;

    if (match && tagWrap[tag]) {
      wrap = tagWrap[tag];
      master.innerHTML = wrap.pre + frag + wrap.post;
      
      for (i = wrap.length; i; --i) {
        master = master.firstChild;
      }
    } else {
      master.innerHTML = frag;
    }

    // one node shortcut => return the node itself
    if (master.childNodes.length === 1) {
      return master.removeChild(master.firstChild); // DOMNode
    }

    // return multiple nodes as a document fragment
    df = doc.createDocumentFragment();
   
    while ((fc = master.firstChild)) { // intentional assignment
      df.appendChild(fc);
    }
    
    return df; // DocumentFragment
  };

  // var clean = function (element) {

  // };

  var createTextNode = function (text) {
    return doc.createTextNode(text);
  };

  var createDocumentFragment = function () {
    return doc.createDocumentFragment();
  };

  glue.dom = {
    'toDom': toDom,
    'createDocumentFragment': createDocumentFragment,
    "createTextNode": createTextNode
  };

  return glue;
}(glue || {}));

