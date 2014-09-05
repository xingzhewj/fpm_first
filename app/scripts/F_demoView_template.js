define("F_demoView/F_demoViewTemplate" , ["artTemplate"] , function(artTemplate){
   var _template = {};
   var F_demoViewitemTemplate = [];
   F_demoViewitemTemplate.push('<!--')
   F_demoViewitemTemplate.push('{')
   F_demoViewitemTemplate.push('  id:\'01dcc884-4cab-474c-8997-bc6ed2627fd5\',')
   F_demoViewitemTemplate.push('  link:\'http://v.ifeng.com/news/mainland/201408/01dcc884-4cab-474c-8997-bc6ed2627fd5.shtml\',')
   F_demoViewitemTemplate.push('  img:\'http://d.ifengimg.com/w120_h90/y0.ifengimg.com/pmop/2014/08/19/46ecbe09-03c6-45ba-9811-e136296b9b7e.jpg\',')
   F_demoViewitemTemplate.push('  text:\'习近平明确点出国企严重问题 动手后对高管提要求\',')
   F_demoViewitemTemplate.push('  poster:\'http://d.ifengimg.com/w480_h270/y0.ifengimg.com/pmop/2014/08/19/46ecbe09-03c6-45ba-9811-e136296b9b7e.jpg\'}')
   F_demoViewitemTemplate.push('-->')
   F_demoViewitemTemplate.push('<div class=\"w-view-item\">{{include \'F_demoViewitemInclude\' $value}}</div>')

   _template.item = artTemplate("F_demoViewitem" , F_demoViewitemTemplate.join(''));

   var F_demoViewitemIncludeTemplate = [];
   F_demoViewitemIncludeTemplate.push('<img src=\"{{poster}}\" /><span>{{text | titleFormat:15}}</span>')

   _template.itemInclude = artTemplate("F_demoViewitemInclude" , F_demoViewitemIncludeTemplate.join(''));

   var F_demoViewlayoutTemplate = [];
   F_demoViewlayoutTemplate.push('<div class=\"mod-demo-view\">')
   F_demoViewlayoutTemplate.push('  <div class=\"w-view-box js_viewBox\"></div>')
   F_demoViewlayoutTemplate.push('  <i class=\"w-pre js_preHandle\">向前</i>')
   F_demoViewlayoutTemplate.push('  <i class=\"w-next js_nextHandle\">向后</i>')
   F_demoViewlayoutTemplate.push('</div>')

   _template.layout = artTemplate("F_demoViewlayout" , F_demoViewlayoutTemplate.join(''));

   _template.helper = function(name, helper){
      artTemplate.helper(name, helper);
   }
   return _template;
});