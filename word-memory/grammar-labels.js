'use strict';
(function(root){
 const pairs=[['plural noun','复数名词'],['past participle','过去分词'],['time period','时间段'],['superlative','最高级'],['adjective','形容词'],['noun','名词']];
 function canonical(value){let s=String(value??'');for(const [en,zh] of pairs)s=s.split(zh).join(en);return s;}
 function display(value){let s=String(value??'');if(!s.includes('+'))return s;for(const [en,zh] of pairs)s=s.replace(new RegExp('\\b'+en+'\\b','gi'),zh);return s;}
 const api={canonical,display};root.GrammarLabels=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
