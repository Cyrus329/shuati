(function(root){
  'use strict';
  const normalize = value => String(value || '').normalize('NFKC').toLowerCase()
    .replace(/[’‘`\u02bc]/g,"'").replace(/[\u2010\u2011\ufe63\uff0d]/g,'-').replace(/‿/g,' ')
    // Decimal points carry meaning; placeholder dots and ellipses do not.
    .replace(/\./g,(dot,index,text)=>/\d/.test(text[index-1]||'')&&/\d/.test(text[index+1]||'')?dot:' ')
    .replace(/[^\p{Script=Latin}\p{M}0-9'.\s-]/gu,' ').replace(/\s+/g,' ').trim();
  function variants(term) {
    // Dots belong to dictionary placeholders, not to their slash alternatives.
    const text=String(term || '').normalize('NFKC').replace(/[’‘`\u02bc]/g,"'").replace(/\b(sb|sth|swh)\./gi,'$1');
    let list=text.split(/\s+\/\s+/);
    const limit=512;
    if(list.length>limit) return [];
    // Parentheses denote optional text/suffixes in the imported vocabulary.
    const optional=/\(([^()]*)\)/;
    for(let i=0;i<12 && list.some(x=>optional.test(x));i++) {
      list=list.flatMap(x=>{const m=x.match(optional);return m?[x.replace(m[0],m[1]),x.replace(m[0],'')]:[x]});
      if(list.length>limit) return [];
    }
    if(list.some(x=>optional.test(x))) return [];
    const alternatives=/[\p{Script=Latin}\p{M}]+(?:\/[\p{Script=Latin}\p{M}]+)+/u;
    for(let i=0;i<12 && list.some(x=>alternatives.test(x));i++) {
      list=list.flatMap(x=>{const m=x.match(alternatives);return m?m[0].split('/').map(v=>x.replace(m[0],v)):[x]});
      if(list.length>limit) return [];
    }
    if(list.some(x=>alternatives.test(x))) return [];
    return [...new Set(list.map(normalize).filter(Boolean))];
  }
  function matches(input,term){
    const expected=new Set(variants(term));
    const answers=variants(input);
    // A slash answer may select one or several allowed forms in any order.
    // Every expansion must be valid; a correct branch cannot hide a typo.
    return answers.length>0 && answers.every(answer=>expected.has(answer));
  }
  const api={normalize,variants,matches};root.SpellingAnswers=api;
  if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
