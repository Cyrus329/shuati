'use strict';
(() => {
  // Convert division only when the surrounding notation identifies both operands.
  const command = String.raw`\\(?:pi|theta|alpha|beta|gamma|lambda|phi|varphi|omega|mu|rho|xi|infty|Delta)(?![A-Za-z])`;
  const func = String.raw`\\(?:arcsin|arccos|arctan|sin|cos|tan|cot|sec|csc|ln|lg|log|exp|sinh|cosh)(?![A-Za-z])`;
  const binding = String.raw`\\(?:i?i?int|oint|sum|prod|lim(?:sup|inf)?)(?![A-Za-z])`;
  const curl = String.raw`\{(?:[^{}]|\{[^{}]*\})*\}`;
  const paren = String.raw`(?:\\left\s*)?\((?:[^()]|\([^()]*\))*?(?:\\right\s*)?\)`;
  const bracket = String.raw`(?:\\left\s*)?\[(?:[^\[\]]|\[[^\[\]]*\])*?(?:\\right\s*)?\]`;
  const letter = '[A-Za-zα-ωΑ-Ω]';
  const scalar = String.raw`(?:\d+(?:\.\d+)?|${command}|${letter})`;
  const script = String.raw`(?:[\^_]\s*(?:${curl}|${command}|[A-Za-z0-9]))`;
  const macroArg = String.raw`(?:${curl}|${command}|[A-Za-z0-9])`;
  const sqrt = String.raw`\\sqrt(?:\[[^\[\]]+\])?\s*${macroArg}`;
  const frac = String.raw`\\(?:t|d)?frac\s*${macroArg}\s*${macroArg}`;
  const bindingScripts = new RegExp(binding+script+'*','g');
  const abs = String.raw`\\lvert\s*[^|{}]*?\\rvert`;
  const det = String.raw`\\det\s*${scalar}`;
  const basic = String.raw`(?:${sqrt}|${frac}|${abs}|${det}|${paren}|${bracket}|${scalar})${script}*`;
  const functionCall = String.raw`(?:${func}${script}*\s*(?:${paren}|(?:${scalar}${script}*)+)|${letter}(?:'|′)*${paren}|${letter}(?:'|′)+)`;
  const factor = String.raw`(?:${functionCall}|${basic})`;
  const leftPattern = new RegExp(String.raw`(?<![\\A-Za-z])(?:${factor})+$`);
  const rightPattern = new RegExp(String.raw`^(-?)(?:${factor})+`);
  const operators = /\\(?:to|rightarrow|Rightarrow|leftarrow|leq?|geq?|ne|sim|cdot|times|approx|equiv|pm|mp|in)(?![A-Za-z])/g;
  const mathCharacters = /^[\s\dA-Za-zα-ωΑ-Ω\\^_{}()[\].,'′+|/−-]+$/;
  const rawParen = String.raw`\((?:[A-Za-z0-9πθ√²³⁴⁵⁶⁷⁸⁹⁰₀-₉. +*−^′'-]|\([A-Za-z0-9πθ√²³⁴⁵⁶⁷⁸⁹⁰₀-₉. +*−^′'-]+\))+\)`;
  const rawUnit = String.raw`(?:[a-z](?:['′]+)?${rawParen}|\|[a-z0-9+−-]+\||√(?:${rawParen}|\d+|[a-z])|${rawParen}|\d+(?:\.\d+)?|[a-zπθ])(?:[²³⁴⁵⁶⁷⁸⁹⁰₀-₉]+|['′]+)?`;
  const plainFraction = new RegExp(String.raw`(?<![\w./:^{πθ√²³⁴⁵⁶⁷⁸⁹⁰₀-₉])((?:${rawUnit})+)\s*\/\s*((?:${rawUnit})+)(?![\w./:^}²³⁴⁵⁶⁷⁸⁹⁰₀-₉])`,'g');
  const plainOperand = /^[a-zπθ0-9.√²³⁴⁵⁶⁷⁸⁹⁰₀-₉()|+*−'′ -]+$/;
  const superscripts='⁰¹²³⁴⁵⁶⁷⁸⁹', subscripts='₀₁₂₃₄₅₆₇₈₉';
  const rawTex=text=>text.replace(/−/g,'-').replace(/π/g,'\\pi ').replace(/θ/g,'\\theta ')
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g,x=>'^{'+[...x].map(c=>superscripts.indexOf(c)).join('')+'}')
    .replace(/[₀-₉]+/g,x=>'_{'+[...x].map(c=>subscripts.indexOf(c)).join('')+'}')
    .replace(/√(\([^(]+\)|\d+|[a-z])/g,(_,x)=>'\\sqrt{'+(x.startsWith('(')?x.slice(1,-1):x)+'}')
    .replace(/\|([^|]+)\|/g,'\\lvert $1\\rvert ').replace(/\b(sin|cos|tan|ln|log)(?=\()/g,'\\$1');

  function notation(tex) {
    let offset=0;
    while((offset=tex.indexOf('/',offset))!==-1){
      const head=tex.slice(0,offset).trimEnd(), tail=tex.slice(offset+1).trimStart();
      if(!head||!tail||head.endsWith('\\')||tail.startsWith('/')){offset++;continue;}
      // Operators and binding commands must not become part of a numerator.
      let boundary=0;
      for(const m of head.matchAll(operators))boundary=m.index+m[0].length;
      const bindingMatches=[...head.matchAll(bindingScripts)];
      for(const m of bindingMatches)boundary=Math.max(boundary,m.index+m[0].length);
      const left=head.slice(boundary).match(leftPattern),right=tail.match(rightPattern);
      if(!left||!right){offset++;continue;}
      const numerator=left[0];
      let denominator=right[0];
      if(!/^d[xtuyrs]$/.test(numerator))
        denominator=denominator.replace(/(?<=[A-Za-z0-9})])d[xtuyrs]$/,'');
      const from=head.length-numerator.length;
      const after=tail.slice(denominator.length);
      if(!denominator||(from>0&&/[\\^_]/.test(head[from-1]))
         ||!mathCharacters.test(numerator)||!mathCharacters.test(denominator)
         ||(/[A-Za-z]{3,}/.test(numerator)&&!/[\\(]/.test(numerator))
         ||(/[A-Za-z]{3,}/.test(denominator)&&!/[\\(]/.test(denominator))
         ||(/^[0-9]+[A-Za-z]/.test(denominator))){
        offset++;continue;
      }
      const replacement='\\frac{'+numerator+'}{'+denominator+'}';
      tex=head.slice(0,from)+replacement+after;
      // Re-scan the fraction body for divisions inside grouped operands.
      offset=from+6;
    }
    return tex;
  }
  function format(value) {
    const source=String(value??'');
    const prose=text=>text.replace(plainFraction,(part,left,right)=>{
      if(!plainOperand.test(left)||!plainOperand.test(right)
        ||/^[0-9]+[a-z]/.test(right)
        ||[left,right].some(value=>/[a-z]{3,}/.test(value)&&!/^\s*(?:sin|cos|tan|ln|log)\(/.test(value)))return part;
      return '\\(\\frac{'+rawTex(left)+'}{'+rawTex(right)+'}\\)';
    });
    let result='',start=0;
    for(const match of source.matchAll(/(\\\(|\\\[)([\s\S]*?)(\\\)|\\\])/g)){
      result+=prose(source.slice(start,match.index))+match[1]+notation(match[2])+match[3];
      start=match.index+match[0].length;
    }
    return result+prose(source.slice(start));
  }
  if(typeof module!=='undefined')module.exports=format;
  if(typeof window!=='undefined')window.formatExamFractions=format;
})();
