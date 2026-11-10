'use strict';
(() => {
  const rules=[
    [/since|完成进行时/,'since 与完成时态','先判断动作从过去延续到现在还是已结束。since 后常接起点时间或过去时从句，主句结合持续性选现在完成时或现在完成进行时。','since 也可表示原因；完成进行时通常突出持续过程，不能见到 since 就机械套时态。'],
    [/从句/,'从句：先看成分，再选连接词','先分清主语、宾语、定语或状语从句，再分析从句缺不缺成分。what 可在名词性从句中作成分；whose 表所属，后接名词；whichever 可表示无论哪一个。','that 引导名词性从句时通常不作成分；不要将名词性从句和定语从句混用。'],
    [/主谓一致|a number of|the number of|plenty of|every与/,'主谓一致：找真正的主语','先圈主语中心词，跳过介词短语。a number of + 复数名词通常配复数谓语；the number of… 以 number 为中心用单数；plenty of 看后接名词的数。','every 修饰单数名词通常配单数谓语；不要只看离动词最近的名词。'],
    [/one of/,'one of：先找范围，再看主语','one of 后通常接复数名词，表示若干中的一个；整体以 one 作主语时通常用单数谓语。','one of the + 最高级 + 复数名词；带定语从句时另看从句先行词与语境。'],
    [/分数|序数|基数|hundred|thousand|年龄段|thirties/,'数词、分数与年龄段','分数通常“基数词分子＋序数词分母”，分子大于一时分母加 s。具体数词后的 hundred/thousand 不加 s；不确切数量用 hundreds/thousands of；年龄段用 in one’s thirties 等。','序数词拼写单独记；分数修饰名词作主语时，谓语还要看所指名词，不只看分子。'],
    [/冠词|江河名称|the加形容词/,'冠词：先看特指，再看固定用法','首次泛指单数可数名词常用 a/an，已明确或特指用 the；乐器、河流、最高级前常用 the，球类、通常的三餐名称前常用零冠词。','a/an 按紧随其后的发音选择：an honor，但 a great honor；三餐名词有修饰语或特指时需按语境重新判断。'],
    [/it作形式宾语/,'it 作形式宾语','先找“动词＋it＋宾补＋真正宾语”结构。make/find/think 等后可用 it 占宾语位置，将不定式或从句放在后面。','it 只是形式宾语，不要把后面的真正宾语遗漏；与 it 指具体事物的情况分开看。'],
    [/both|anybody|many修饰|much表示/,'不定代词：范围、数量与肯否','先数范围：两者用 both/either/neither；三者及以上考虑 all/any/none。再看名词：many/few/a few 配可数复数，much/little/a little 配不可数。','few/little 偏否定，a few/a little 偏肯定；another 泛指另一个，the other 常指两者中另一个，others 独立指其他人或物。'],
    [/不规则复数|复数|Chinese|man与woman|woman作定语/,'名词的数与可数性','先看限定词和数量，再判断名词可数性。可数名词复数注意不规则变化；不可数名词不直接加 s，计量时用 a piece of 等单位结构。','man/woman 修饰职业名词时两部分都变复数；不要把 advice、information、furniture、equipment 直接变复数。'],
    [/表达|global warming|go for a walk|belong to|such/,'固定结构与语境搭配','把考点放回完整结构记忆：belong to 表所属；go for a walk 表散步；such + 名词短语 + that… 表示“如此……以至于……”。先核对结构再判断选词。','固定短语整体记，名词前的冠词和修饰语不能随意省；such 后的 a/an 取决于名词是否单数可数。'],
    [/所有格|双重所有/,'名词所有格','先判断所有者：单数名词加 ’s；以 s 结尾的规则复数加 ’；共同所有只在最后一人加，分别所有则各自加。双重所有格用 of + 名词所有格/名词性物主代词。','地点名词可在所有格后省略 shop/home；of 结构与双重所有格的意义要结合原句。'],
    [/单复数|不可数|可数|名词复数/,'名词的数与可数性','先看限定词和数量，再判断名词可数性。可数名词复数注意不规则变化；不可数名词不直接加 s，计量时用 a piece of 等单位结构。','man/woman 修饰职业名词时两部分都变复数；不要把 advice、information、furniture、equipment 直接变复数。'],
    [/复合形容词|名词作定语/,'名词作定语与复合形容词','先定位名词前的修饰语。一般名词作定语用单数；“数词-名词”构成复合形容词时，内部名词通常用单数。','sports meeting 等固定形式、man/woman 职业定语需单独记；80 words 与 an 80-word passage 结构不同。'],
    [/人称代词|主格|宾格/,'人称代词的主格与宾格','先找句中成分：作主语用主格，作动词或介词宾语用宾格。并列时将另一人暂时去掉，检查剩下的代词形式。','between him and her；invite Sarah and me。不要因代词出现在并列结构中就改用主格。'],
    [/物主代词/,'物主代词的两种位置','空后有被修饰名词，用 my/your/his/her/our/their；空后没有名词、独立代替所属物，用 mine/yours/his/hers/ours/theirs。','先确认真正的所有者；hers/theirs 等不加撇号。'],
    [/反身|相互/,'反身代词与相互代词','主语与宾语指同一人或物时考虑反身代词；by oneself 表示独自，enjoy oneself 表示玩得开心；相互行为考虑 each other/one another。','反身代词的人称和单复数跟主语一致；不能机械地把 each other 与 one another 按人数划成绝对规则。'],
    [/指示|替代|比较结构|比较对象/,'比较与指示中的代词替代','先找被替代的名词：that 常替代不可数或特指单数名词，those 替代特指复数；it 指同一个事物，one/ones 常指同类中的另一个/一些。','比较对象必须同类；that/those 与 one/ones 的限定及后置修饰条件不同，不能只按单复数选。'],
    [/疑问代词|疑问短语|疑问词/,'疑问词：问什么，先看回答','先看回答内容：身份用 who，职业常用 what，所属用 whose，限定范围选择用 which；距离 how far，时长 how long，频率 how often，多久以后 how soon。','数量按可数/不可数选 how many/how much；人口常问 What is the population of…；句首大小写与语法正确性分开看。'],
    [/不定代词|数量限定|neither|either|none|other|another|few|little/,'不定代词：范围、数量与肯否','先数范围：两者用 both/either/neither；三者及以上考虑 all/any/none。再看名词：many/few/a few 配可数复数，much/little/a little 配不可数。','few/little 偏否定，a few/a little 偏肯定；another 泛指另一个，the other 常指两者中另一个，others 独立指其他人或物。'],
    [/词义|名词辨析|搭配|职业名词/,'词义辨析与固定搭配','先读完整句子确定语境，再看空格需要的词性、可数性和固定搭配。把答案连同关键搭配一起记，并用干扰词造一个不同场景的短句。','相近词并非总能唯一排除；遇到语境不足或平台争议先核查，不背“永远只能选某词”。']
  ];
  function describe(q,spec){
    if(q.subject==='英语'){
      const point=q.point||'';
      for(const [re,name,method,trap] of rules)if(re.test(point))return {name,method,trap};
      if(!spec.method||/对照本题完整|结合完整语境/.test(spec.method))return {name:'句子结构与语境核对',method:'先划出句子主干，判断空格的句子成分与所需词性，再检查数、时态、指代和固定搭配。将关键结构与一个适用例句一起记忆。',trap:'这张卡只概括核对步骤；具体词条和例外仍要按本考点的条件记忆。'};
    }
    if(spec.method&&!/对照本题完整|结合完整语境/.test(spec.method))return {name:spec.name,method:spec.method,trap:spec.trap};
    return {name:q.point||spec.name,method:q.subject==='计算机'?'先把考点写成“定义—适用对象—限制条件”三项，再对照选项逐个判断。涉及操作时按目标→入口→步骤回忆，涉及运算先统一单位与进制。':'先列已知条件和所求，再写出适用公式或定义，逐项核对定义域、符号、端点和特殊值，最后代回原条件检验。',trap:q.subject==='计算机'?'不能把常见结论当作无条件成立；注意“不正确/不包括”、单位及软件版本语境。':'方法只适用于满足条件的题；同一考点的不同问法分别核对，不能由一道做对推断整类掌握。'};
  }
  function build(questions,classify,policy){
    const groups=new Map();
    for(const q of questions){const state=policy(q);if(!state.mistake&&!state.correct)continue;const spec=classify(q),info=describe(q,spec),key=[q.subject,info.name,info.method,info.trap].join('|');if(!groups.has(key))groups.set(key,{key,subject:q.subject,...info,correct:[],mistakes:[]});groups.get(key)[state.mistake?'mistakes':'correct'].push(q);}
    return [...groups.values()].filter(g=>g.correct.length).sort((a,b)=>a.subject.localeCompare(b.subject,'zh')||b.correct.length-a.correct.length||a.name.localeCompare(b.name,'zh'));
  }
  const api={build,describe};if(typeof module!=='undefined')module.exports=api;if(typeof window!=='undefined')window.CorrectMethods=api;
})();
