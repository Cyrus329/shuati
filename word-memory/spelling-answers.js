(function(root){
  'use strict';
  const normalize = value => String(value || '').toLowerCase().replace(/[’‘`]/g,"'").replace(/[^a-z0-9'\s-]/g,' ').replace(/\s+/g,' ').trim();
  function variants(term) {
    // Dots belong to dictionary placeholders, not to their slash alternatives.
    const text=String(term || '').replace(/[’‘`]/g,"'").replace(/\b(sb|sth|swh)\./gi,'$1');
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
    const alternatives=/[a-zA-Z]+(?:\/[a-zA-Z]+)+/;
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
