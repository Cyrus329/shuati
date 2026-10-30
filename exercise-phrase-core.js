'use strict';
(() => {
 function tokens(text){return [...String(text||'').matchAll(/(?:[A-Za-z]\.){2,}|(?:[0-9]+(?:\.[0-9]+)?[‐‑‒–−﹘﹣－-])?[\p{Script=Latin}\p{M}]+(?:['’‘`ʼ‐‑‒–−﹘﹣－-][\p{Script=Latin}\p{M}0-9]+)*/gu)].map(m=>({word:m[0],start:m.index,end:m.index+m[0].length}));}
 function select(text,first,last){const ts=tokens(text);if(!Number.isInteger(first)||!Number.isInteger(last)||first<0||last<0||first>=ts.length||last>=ts.length)throw Error('请在同一段文字中选择词组的首词和末词。');const start=Math.min(first,last),end=Math.max(first,last),surface=String(text).slice(ts[start].start,ts[end].end),term=(typeof module!=='undefined'&&module.exports?require('./listening-vocab-core.js'):window.ListeningVocabCore).key(surface);if(!(typeof module!=='undefined'&&module.exports?require('./listening-vocab-core.js'):window.ListeningVocabCore).valid(term)||/[.!?;]/.test(term.replace(/\b(?:sb|sth|swh)\./gi,'').replace(/\b(?:[a-z]\.){2,}/gi,'').replace(/(?<=[0-9])\.(?=[0-9])/g,'')))throw Error('请选择同一句中的单词或词组（不超过90个字符）。');return {term,surface,first:start,last:end};}
 const api={tokens,select};if(typeof module!=='undefined')module.exports=api;if(typeof window!=='undefined')window.ExercisePhraseCore=api;
})();
