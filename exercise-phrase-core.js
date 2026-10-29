'use strict';
(() => {
 function tokens(text){return [...String(text||'').matchAll(/[A-Za-z]+(?:['’‐‑-][A-Za-z]+)*/g)].map(m=>({word:m[0],start:m.index,end:m.index+m[0].length}));}
 function select(text,first,last){const ts=tokens(text);if(!Number.isInteger(first)||!Number.isInteger(last)||first<0||last<0||first>=ts.length||last>=ts.length)throw Error('请在同一段文字中选择词组的首词和末词。');const start=Math.min(first,last),end=Math.max(first,last),surface=String(text).slice(ts[start].start,ts[end].end),term=surface.replace(/[’‘]/g,"'").replace(/[‐‑–]/g,'-').trim().replace(/\s+/g,' ').toLowerCase();if(!/^[a-z][a-z' -]{0,89}$/.test(term))throw Error('请选择不跨句、不含标点且不超过90个字符的单词或词组。');return {term,surface,first:start,last:end};}
 const api={tokens,select};if(typeof module!=='undefined')module.exports=api;if(typeof window!=='undefined')window.ExercisePhraseCore=api;
})();
