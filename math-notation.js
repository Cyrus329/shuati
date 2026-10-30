'use strict';
(() => {
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const syms={'∞':'\\infty','π':'\\pi','φ':'\\varphi','ξ':'\\xi','θ':'\\theta','α':'\\alpha','β':'\\beta','ℝ':'\\mathbb{R}','∪':'\\cup','∩':'\\cap','∈':'\\in','∉':'\\notin','∅':'\\varnothing','≤':'\\le','≥':'\\ge','≠':'\\ne','→':'\\to','↔':'\\leftrightarrow','⇒':'\\Rightarrow','⇔':'\\Leftrightarrow','±':'\\pm','·':'\\cdot','×':'\\times','÷':'\\div'};
 const sup={'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁻':'-','⁺':'+','ˣ':'x'};
 const funcs=new Set(['arcsin','arccos','arctan','sin','cos','tan','cot','ln','lg','log','lim','max','min']);
 function tex(raw){
  const s=raw.replace(/⁴√/g,'∜').replace(/[−–]/g,'-').replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺ˣ]+/g,x=>'^{'+[...x].map(c=>sup[c]).join('')+'}').replace(/[₀₁₂₃₄₅₆₇₈₉]+/g,x=>'_{'+[...x].map(c=>'₀₁₂₃₄₅₆₇₈₉'.indexOf(c)).join('')+'}').replace(/¼/g,'(1/4)').replace(/½/g,'(1/2)').replace(/¾/g,'(3/4)');
  const ts=s.match(/arcsin|arccos|arctan|sin|cos|tan|cot|ln|lg|log|lim|max|min|\d+(?:\.\d+)?|_+|[^\s]/g)||[];let i=0;
  const close={ '(':')','[':']','{':'}' },isClose=t=>[')',']','}'].includes(t);
  const plain=t=>t==='}'?'\\}':syms[t]||t;
  function atom(){
   if(i>=ts.length)return '';
   let t=ts[i++],a;
   if(close[t]) {const inner=sequence(true);const end=isClose(ts[i])?ts[i++]:'';a=(t==='{'?'\\{':t)+inner+(end==='}'?'\\}':end);}
   else if(t==='√'||t==='∛'||t==='∜'){let v=atom();if(v.startsWith('(')&&v.endsWith(')'))v=v.slice(1,-1);else if(v.startsWith('[')&&v.endsWith(']'))v=v.slice(1,-1);a=(t==='∛'?'\\sqrt[3]':t==='∜'?'\\sqrt[4]':'\\sqrt')+'{'+v+'}';}
   else if(funcs.has(t)){
    a='\\'+t+' ';
    while(ts[i]==='^'||ts[i]==='_'){const op=ts[i++];a+=op+'{'+powerArg()+'}';}
    if(t==='lim'&&ts[i]==='('){i++;a='\\lim_{'+sequence(true)+'}';if(isClose(ts[i]))i++;}
    else if(i<ts.length&&!isClose(ts[i])&&!['+','-','=',',','/','∪','∩'].includes(ts[i]))a+=atom();
   }
   else if(/^_{2,}$/.test(t))a='\\underline{\\qquad}';
   else a=plain(t);
   while(ts[i]==='^'||ts[i]==='_'){const op=ts[i++];a+=op+'{'+powerArg()+'}';}
   if(/^[A-Za-zφξθαβ]/.test(t)&&['(','['].includes(ts[i]))a+=atom();
   return a;
  }
  function powerArg(){if(ts[i]==='{'){i++;const v=sequence(true);if(ts[i]==='}')i++;return v;}return atom();}
  function sequence(nested=false){const parts=[];while(i<ts.length&&!(nested&&isClose(ts[i]))){if(ts[i]==='/'){i++;const left=parts.pop()||'',right=atom();parts.push('\\frac{'+left+'}{'+right+'}');}else parts.push(atom());}return parts.join(' ');}
  return sequence();
 }
 function inlineHTML(s){
  const re=/[A-Za-z0-9πφξθαβℝ∞∪∩∈∉∅≤≥≠→↔⇒⇔±·×÷√∛∜⁴⁰¹²³⁵⁶⁷⁸⁹⁻⁺ˣ₀₁₂₃₄₅₆₇₈₉¼½¾=+\-−–/<>^_()\[\]{}|.,'′\s]+/g;
  let result='',at=0;
  for(const m of s.matchAll(re)){
   result+=esc(s.slice(at,m.index));const run=m[0];
   if(!/[A-Za-z0-9πφξθαβℝ∞∪∩∈∉∅≤≥≠√∛∜]/.test(run))result+=esc(run);
   else {const left=run.match(/^\s*/)[0],right=run.match(/\s*$/)[0];result+=left+'\\('+esc(tex(run.trim()))+'\\)'+right;}
   at=m.index+run.length;
  }
  return result+esc(s.slice(at));
 }
 function casesTex(content){
  const rows=[];let start=0,depth=0;
  for(let i=0;i<content.length;i++){const c=content[i];if(c==='('||c==='（')depth++;if(c===')'||c==='）')depth--;if(depth===0&&/[，,；;]/.test(c)){rows.push(content.slice(start,i));start=i+1;}}
  rows.push(content.slice(start));if(rows.length<2||depth!==0)return '';
  const parsed=rows.map(row=>row.trim().match(/^(.+?)\s*[（(]([^（）()]*)[）)]$/));
  if(parsed.some(m=>!m||!/[<>=≤≥≠∈]/.test(m[2])))return '';
  return '\\begin{cases}'+parsed.map(m=>tex(m[1].trim())+' & '+tex(m[2].trim())).join(' \\\\ ')+'\\end{cases}';
 }
 function rawHTML(s){
  let result='',at=0;
  for(const match of s.matchAll(/\{([^{}]+)\}/g)){const block=casesTex(match[1]);if(!block)continue;result+=inlineHTML(s.slice(at,match.index))+'\\('+esc(block)+'\\)';at=match.index+match[0].length;}
  return result+inlineHTML(s.slice(at));
 }
 function html(subject,value){let text=String(value??'');if(!['数学','高等数学'].includes(subject))return esc(text);text=text.replace(/[\u{1D400}-\u{1D7FF}]/gu,c=>c.normalize('NFKC'));let result='',at=0;const re=/\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]/g;for(const m of text.matchAll(re)){result+=rawHTML(text.slice(at,m.index))+esc(m[0]);at=m.index+m[0].length;}return result+rawHTML(text.slice(at));}
 let pending=Promise.resolve();
 function typeset(box){
  if(!box)return Promise.resolve();
  pending=pending.catch(()=>{}).then(async()=>{
   if(!box.isConnected)return;
   const m=window.MathJax;
   if(m?.startup?.promise)await m.startup.promise;
   if(box.isConnected && m?.typesetPromise)await m.typesetPromise([box]);
  });
  return pending.catch(error=>{console.warn('公式排版暂未完成',error);});
 }
 const api={html,tex,typeset};if(typeof module!=='undefined'&&module.exports)module.exports=api;if(typeof window!=='undefined')window.MathNotation=api;
})();
