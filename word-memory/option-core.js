'use strict';
(() => {
 function normalize(value,letters){const out={};if(!value||typeof value!=='object'||Array.isArray(value))return out;for(const letter of letters||Object.keys(value))if(['exclude','unsure'].includes(value[letter]))Object.defineProperty(out,letter,{value:value[letter],enumerable:true,writable:true,configurable:true});return out;}
 function mark(answer,marks,letter,kind){const next=normalize(marks);answer=String(answer||'');if(!['exclude','unsure'].includes(kind))return {answer,marks:next};if(next[letter]===kind)delete next[letter];else next[letter]=kind;if(next[letter]==='exclude')answer=answer.replaceAll(letter,'');return {answer,marks:next};}
 function choose(answer,marks,letter,multi=false){const next=normalize(marks);if(next[letter]==='exclude')delete next[letter];answer=String(answer||'');return {answer:multi?(answer.includes(letter)?answer.replaceAll(letter,''):[...answer,letter].sort().join('')):answer===letter?'':letter,marks:next};}
 function status(letter,answer,key,revealed){const selected=String(answer||'').includes(letter);if(!revealed||!key)return selected?'selected':'';if(key.includes(letter))return selected?'correct':answer?'missed':'answer';return selected?'wrong':'';}
 const api={normalize,mark,choose,status};if(typeof module!=='undefined')module.exports=api;if(typeof window!=='undefined')window.OptionCore=api;
})();
