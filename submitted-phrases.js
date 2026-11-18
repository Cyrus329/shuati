'use strict';
(() => {
  const vocabulary = {
    'have a taste for':'喜欢；欣赏；对……有鉴赏兴趣',
    'take pleasure in':'以……为乐；从……中获得乐趣',
    'in favor of':'赞成；支持；有利于……',
    'do sb a favor':'帮某人一个忙',
    'have an interest in':'对……感兴趣',
    'appointment of sb as director':'任命某人担任主任',
    'appointment of sb as':'任命某人担任……',
    'there is nothing wrong with':'……没有问题；……没有毛病',
    'teach oneself':'自学',
    'piece of equipment':'一件设备',
    'raw materials':'原材料',
    'no longer':'不再',
    'private life':'私人生活',
    'the number of':'……的数量',
    'a number of':'一些；许多（后接可数名词复数）',
    'play an important role in':'在……中起重要作用',
    'in many ways':'在许多方面',
    'after-class activities':'课外活动',
    "try one's best to do":'尽某人最大努力做……',
    'traditional culture':'传统文化',
    'two pieces of advice':'两条建议',
    'take immediate measures':'立即采取措施',
    'take immediate action':'立即采取行动',
    'take measures':'采取措施',
    'take action':'采取行动',
    'knowledge of':'对……的了解；……方面的知识',
    'have breakfast':'吃早饭',
    'have lunch':'吃午饭',
    'have dinner':'吃晚饭',
    'go for a walk':'去散步',
    'play the piano':'弹钢琴',
    'play basketball':'打篮球',
    'struggle to do':'努力做……；艰难地做……',
    'a variety of':'各种各样的……',
    'hundreds of':'数以百计的；数百',
    'thousands of':'数以千计的；数千',
    "in one's thirties":'在某人三十多岁时',
    'twice as large as':'是……的两倍大',
    'twice the number of':'是……数量的两倍',
    'so far':'到目前为止',
    'make it clear that':'明确说明……',
    'ask somebody for help':'向某人求助',
    'ask sb for help':'向某人求助',
    'work out':'想出；解决；算出',
    'ahead of schedule':'提前；早于预定时间',
    'on schedule':'按计划；如期',
    'at an early age':'在年纪很小时',
    'at the age of':'在……岁时',
    'be beneficial to':'对……有益',
    'respect sb for sth':'因某事而尊重某人',
    'sense of responsibility':'责任感',
    'heavy rain':'大雨',
    'because of':'因为；由于',
    'due to':'由于；因为',
    'thanks to':'多亏；由于',
    'instead of':'代替；而不是',
    'be based on':'以……为依据；基于……',
    'be famous for':'因……而闻名',
    'be familiar with':'熟悉……',
    'be familiar to':'为……所熟悉',
    'stare at':'盯着……看',
    'in amazement':'惊讶地',
    'be occupied in':'忙于做……',
    'on the contrary':'正相反；恰恰相反',
    'be strict in':'对某事要求严格',
    'date from':'始于；追溯到……',
    'take the blame for':'为……承担责任',
    'take charge of':'负责；掌管……',
    'face an accusation':'面临指控',
    'take office':'就职；上任',
    'take up':'开始从事；占用',
    'nature reserve':'自然保护区',
    'bird sanctuary':'鸟类保护区',
    'sharp contrast to':'与……形成鲜明对比',
    'fill out the form':'填表',
    'sports facilities':'体育设施',
    'sports equipment':'体育器材',
    'the basics of':'……的基础知识',
    'reliable source':'可靠的来源',
    'on the basis of':'以……为根据；在……的基础上',
    'be experienced in doing':'有做……的经验',
    'chances are':'很可能……',
    'worth the effort':'值得付出努力',
    'tuition fees':'学费',
    'per month':'每月',
    'complain to':'向……抱怨',
    'approach to':'处理……的方法',
    'response to':'对……的回应',
    'follow instructions':'遵照指示',
    'in support of':'为了支持……；赞成……',
    'native language':'母语',
    'car crash':'车祸',
    'car accident':'车祸；交通事故',
    'car park':'停车场',
    'be noted for':'因……而出名',
    'greenhouse gases':'温室气体',
    'global warming':'全球变暖',
    "lose one's appetite":'失去食欲',
    'go on a diet':'节食',
    'give sb advice on':'就……给某人建议',
    'make a commitment to':'承诺做……',
    'commitment to donate':'捐赠的承诺',
    'make a decision':'作出决定',
    'make a promise':'作出承诺',
    'make a plan':'制定计划',
    'as is known to all':'众所周知',
    'in addition to':'除……之外（还）',
    'be accustomed to':'习惯于……',
    'be used to':'习惯于……',
    'get used to':'逐渐习惯……',
    'used to do':'过去常常做……',
    'make use of':'利用……',
    'make the most of':'充分利用……',
    'make full use of':'充分利用……',
    'be made up of':'由……组成',
    'consist of':'由……组成',
    'be responsible for':'对……负责',
    'take responsibility for':'为……承担责任',
    'keep in mind':'记住；牢记',
    'bear in mind':'牢记',
    'have difficulty in':'做……有困难',
    'have trouble with':'在……方面有困难',
    'be likely to':'可能做……',
    'be willing to':'愿意做……',
    'be supposed to':'应该；被期望做……',
    'be about to':'即将做……',
    'be regarded as':'被视为……',
    'be regarded as a whole':'被看作一个整体',
    'come up with':'想出；提出',
    'get rid of':'摆脱；除掉',
    'take advantage of':'利用……',
    'make a difference':'产生影响；起作用',
    'have an effect on':'对……产生影响',
    'result in':'导致；造成',
    'result from':'由……引起；起因于……',
    'contribute to':'促进；促成；为……作贡献',
    'lead to':'导致；通向……',
    'account for':'解释……的原因；占（比例）',
    'make up for':'弥补',
    'put up with':'忍受；容忍',
    'come across':'偶遇；偶然发现',
    'run out of':'用完；耗尽……',
    'set out to':'着手做……',
    'put aside':'把……放在一边；留出',
    'turn down':'拒绝；调低',
    'turn to':'向……求助；转向……',
    'carry out':'执行；实施',
    'take over':'接管',
    'at least':'至少',
    'at most':'至多',
    'after all':'毕竟；终究',
    'by the way':'顺便说一下',
    'as a result':'结果；因此',
    'as a result of':'由于……；作为……的结果',
    'as well as':'也；和；以及',
    'as soon as':'一……就……',
    'as long as':'只要；长达……（依语境）',
    'in case of':'万一发生……；遇到……时',
    'by means of':'借助；通过……方式',
    'by no means':'绝不；决不',
    'in terms of':'就……而言；从……方面看',
    'in spite of':'尽管；不顾',
    'in order to':'为了做……',
    'so as to':'以便；为了做……',
    'in particular':'特别；尤其',
    'in return':'作为回报',
    'in charge of':'负责；主管',
    'in front of':'在……的前面',
    'in the long run':'从长远来看',
    'in other words':'换句话说',
    'on purpose':'故意地',
    'by accident':'偶然地；意外地',
    'by mistake':'错误地；无意中',
    'on behalf of':'代表……',
    'with regard to':'关于；就……而言',
    'pay for':'为……付款；为……付出代价',
    'be worth doing':'值得做……',
    'prevent sb from doing':'阻止某人做……',
    'stop sb from doing':'阻止某人做……',
    'provide sth for sb':'为某人提供某物',
    'provide sb with sth':'给某人提供某物',
    'learn sth from sth':'从……学到……',
    'learn from':'向……学习；从……中学习',
    'prefer to do':'更愿意做……',
    'prefer doing':'更喜欢做……',
    'would rather':'宁愿',
    'had better':'最好……',
    'be able to':'能够做……',
    'be afraid of':'害怕……',
    'be afraid to':'不敢做……',
    'agree with':'同意某人或某观点；与……一致',
    'agree to':'同意……；答应做……',
    'compare with':'与……比较',
    'compare to':'与……比较；把……比作……',
    'pay a visit to':'拜访；参观……',
    'take turns':'轮流',
    'catch up with':'赶上；追上',
    'donate to charity':'向慈善机构捐赠',
    'draw a conclusion':'得出结论',
    'make an observation':'提出观察所得的看法；作观察',
    'end up':'最终成为；最后落得……',
    'have a good appetite':'胃口好',
    "give up one's life":'献出生命；牺牲',
    'be held up':'被耽搁；受阻',
    "to one's surprise":'令某人惊讶的是',
    "to one's delight":'令某人高兴的是',
    'drop a case':'撤销案件；不再追究案件',
    'by air':'乘飞机；通过航空运输',
    'in public':'当众；公开地',
    'lose weight':'减肥；体重减轻',
    "lose one's temper":'发脾气',
    'lose sight of':'看不见；忽略……',
    'interfere in':'干涉；介入',
    'find a flaw in':'找出……的缺陷',
    'lack of time':'缺少时间',
    'shortage of time':'时间不足',
    'pace of life':'生活节奏',
    'come to an end':'结束',
    'devotion to':'对……的奉献；对……的忠诚',
    'faith in':'对……的信心；对……的信任',
    'trust in':'对……的信任；信任……',
    'make a commitment':'作出承诺',
    'have free access to':'可以免费使用；可自由进入',
    'musical instrument':'乐器',
    'favorite pastime':'最喜欢的消遣',
    'body and mind':'身心',
    'a burden on sb':'某人的负担',
    'mental tension':'精神紧张',
    'mental relaxation':'精神放松',
    'take notice of':'注意到……',
    'take no notice of':'不理会……；没注意……',
    'catch sight of':'看见；瞥见……',
    'here and there':'到处；各处',
    'in disorder':'杂乱；无序',
    'than any other':'比其他任何一个都……',
    'make a promise to sb':'向某人作出承诺',
    'keep a promise':'遵守承诺',
    'help oneself to':'请随便取用……；自取……',
    'find sb guilty':'判定某人有罪',
    "do one's best":'尽某人最大努力',
    'get everything ready':'把一切准备好',
    'the purpose of':'……的目的',
    'appointment of sb as':'任命某人担任……',
    'make an effort':'作出努力',
    'make an appointment with sb':'与某人预约',
    'have an opportunity to':'有机会做……',
    'do an experiment':'做实验',
    'bear the loss':'承担损失',
    'afford to':'有能力做……；承担得起做……',
    'lose confidence':'丧失信心',
    'loss of confidence':'信心丧失',
    'give sb an explanation of sth':'向某人解释某事',
    'explain sth to sb':'向某人解释某事',
    'give a detailed explanation of':'详细解释……',
    'search for':'搜寻；寻找',
    'pay particular attention to':'特别留意……',
    "perform one's duty":'履行某人的职责',
    'root cause':'根本原因',
    'the reason for':'……的原因',
    'too much':'太多（修饰不可数名词）',
    'too many':'太多（修饰可数名词复数）',
    'take photos':'拍照',
    'a cup of':'一杯……',
    'a sense of achievement':'成就感',
    'achieve a goal':'实现目标',
    'teaching experience':'教学经验',
    'make great progress in':'在……方面取得很大进步',
    'have an eye for':'对……有鉴赏力；善于识别……',
    'an answer to':'……的答案',
    'an introduction to':'对……的介绍；……的入门',
    'bring pleasure to sb':'给某人带来快乐',
    'book review':'书评',
    'send for sb':'派人去请某人',
    'be full of energy':'精力充沛',
    'of noble origin':'出身高贵',
    'have the ability to do':'有能力做……',
    'by oneself':'独自；靠自己',
    'believe in':'信任；相信……的价值或存在',
    'one and a half':'一个半',
    'of importance':'重要的',
    'come out':'出版；问世；公布',
    'capital city':'首都；首府',
    'a large number of':'大量（修饰可数名词复数）',
    'a large quantity of':'大量；很多',
    'a quantity of':'一定数量的；大量的',
    'many a time':'多次；常常',
    'a piece of advice':'一条建议',
    'how much':'多少（问数量或价格）',
    'a piece of furniture':'一件家具',
    'in a difficult situation':'处于困境',
    'negative impact':'负面影响',
    'make money':'赚钱',
    'no excuse for':'没有理由为……辩解',
    'traffic congestion':'交通拥堵',
    'morning rush hour':'早高峰',
    'from the perspective of':'从……的角度来看',
    'hold a reception':'举办招待会；举行接待活动',
    'set a benchmark':'设立基准',
    'make a timetable':'制订时间表',
    'follow a procedure':'遵循程序',
    'leave a good impression on':'给……留下好印象',
    'set a precedent':'开先例',
    'take a chance to do':'利用机会做……',
    'have good business sense':'有良好的商业判断力',
    'boost morale':'鼓舞士气',
    'in the aftermath of':'在……过后；在……余波中',
    'keep a diary':'写日记',
    'cover letter':'求职信；附函',
    'apply for a job':'申请工作',
    'give advice on sth':'就某事给出建议',
    'win high praise from':'赢得……的高度赞扬',
    'plot twist':'情节转折',
    'have a passion for':'对……有热情；酷爱……',
    'a habit of doing sth':'做某事的习惯',
    'gain experience':'积累经验',
    'written consent':'书面同意',
    'have patience':'有耐心',
    'none of them':'他们中没有一人；它们中没有一个',
    'neither of them':'他们两人都不；两者都不',
    'both of them':'他们两人都；两者都',
    'either of them':'他们两人中的任意一人；两者中的任一个',
    'all of them':'他们全都；它们全部'
  };

  const aliases = {
    'a taste for':'have a taste for',
    'taste for':'have a taste for',
    'interest in':'have an interest in',
    'ask somebody for help':'ask sb for help',
    'do somebody a favor':'do sb a favor',
    'do someone a favor':'do sb a favor',
    'do sb a favour':'do sb a favor',
    'in favour of':'in favor of',
    'help yourself to':'help oneself to',
    'help yourselves to':'help oneself to',
    'taught herself':'teach oneself',
    'teach himself':'teach oneself',
    'teach herself':'teach oneself',
    'by himself':'by oneself',
    'by herself':'by oneself',
    'by yourself':'by oneself',
  };
  const negativeBefore = /(?:不能(?:用|说|写|搭配|构成|套用|直接用|自然对应)|不(?:说|写|应用|构成|该用|能搭配|可以用)|错误(?:写法|形式|搭配)(?:是|为)?|误(?:用|写|作)|避免(?:使用|写成)|应排除|不应(?:写成|用)|而非|并非|不是|不是这里的|不是此处的)[\s“‘"'「（(：:]*(?:这里的)?[\s“‘"'「（(：:]*$/;
  const negativeAfter = /^\s*[”’"'」）)]?\s*(?:是(?:错误|误用)|(?:搭配|用法|形式)错误|不(?:成立|自然|正确|规范|地道|能用在此处)|系误写)/;
  const asText = value => String(value || '').trim();
  const termKey = value => asText(value).normalize('NFKC').toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g,' ').replace(/[.…]+$/,'');
  const isPhrase = value => /^[a-z][a-z' -]* [a-z][a-z' -]*$/i.test(termKey(value));
  const hasChinese = value => /[\p{Script=Han}]/u.test(value);
  function glossedPhrases(content, requireCue=false) {
    const result = [];
    for (const part of asText(content).split(/[，,；;。！？\n]/)) {
      const match = part.trim().match(/^[“‘"「]?([a-z][a-z'’ -]*(?:[ .…]+[a-z][a-z'’ -]*)?)[.…\s”’"」]*([=:：＝]|表示|意思是|意为|指的是|指|译为|是)?\s*[“‘"「]?([\p{Script=Han}…][^a-zA-Z]+?)[”’"」]?$/iu);
      if (!match) continue;
      if (requireCue && !match[2]) continue;
      const term = termKey(match[1]);
      const meaning = match[3].replace(/(?:的意思|的含义)$/, '').trim();
      if (!isPhrase(term) || /^(?:the|a|an) (?:[a-z]+ )?(?:and|or)$/.test(term)) continue;
      if (/^(?:和|与|或|用|加|中|后|前|作(?=主语|谓语|宾语|定语|表语|状语|补语|介词|名词|动词|形容词)|接|修饰|不能|不要|不说|不成立|不正确|常见|均可|都可|都能|均可|可作|可接|可修饰|强调|侧重|偏|更|后接|也可|只|通常|可用于|可以用于|可替代|等于|不等于|一般|为正确|为错误|比|语法|适用|表达式|用法|固定|两个搭配|单复数|不可数|可数)/.test(meaning)) continue;
      if (/错误|误写|不地道|不宜|不搭配|宾语补足语|主谓一致|修饰动词|接名词|接从句|后置|用复数|用单数/.test(meaning)) continue;
      if (meaning.length > 36 || !hasChinese(meaning)) continue;
      result.push({term, meaning, example:part.trim()});
    }
    return result;
  }
  const isActualSubmission = event => Boolean(event && !event.importedEvidence && !event.originalTimeUnknown && !event.viewOnly && !event.seeded && asText(event.at) && (asText(event.answer) || Object.values(event.answers || {}).some(value => asText(value))));
  const label = '已做英语题 · 重点短语';
  const root = typeof window === 'undefined' ? {} : window;
  const fallbackKey = value => root.WordLinkCore?.key(value) || termKey(value);
  let provider, last, currentWords = new Map();

  function collectExercise(questions, env=root) {
    const dictionary = {...env.EnglishPhraseUI?.dictionary(), ...vocabulary};
    for (const [alias, term] of Object.entries(aliases)) dictionary[alias] = vocabulary[term];
    const result = new Map();
    let count = 0;
    for (const question of questions) {
      if (question.subject !== '英语' || !question.events?.some(isActualSubmission)) continue;
      if (question.bookCode==='3.3' || /阅读理解|阅读精读|逐段精读/.test([question.topic,question.type,question.section].join(' '))) continue;
      count++;
      const lesson = env.EnglishLesson?.get(question) || question.englishLesson;
      const option = env.CompletionCore?.choiceKey(question);
      const fillAnswer = option?.length === 1 ? question.options?.[option] : '';
      const analysis = [
        ['参考解析', question.analysis],
        ['详细解析', lesson?.answerExplanation],
        ['解题线索', lesson?.steps?.join('\n')],
        ['记住这一点', lesson?.memoryTip],
        ...Object.entries(lesson?.optionAnalysis || {}).map(([letter, detail]) => [`选项 ${letter} 解析`, detail.reason]),
      ];
      const add = (term, meaning, location, phrase) => {
        if (['taste for','a taste for','interest in'].includes(term) && !analysis.some(([,text]) => asText(text).includes(aliases[term]))) return;
        const normalized=aliases[term] || term;
        const canonical = root.ExerciseVocabularyDedupe?.termInfo(normalized)?.term || normalized;
        if(root.ExerciseVocabularyDedupe?.isDisposable({term:canonical,groups:[label]}))return;
        const vetted=root.ExerciseVocabularyDedupe?.termInfo(canonical)?.meaning||(Object.hasOwn(vocabulary,canonical)?vocabulary[canonical]:'');
        if(!vetted)return;
        addWord(result, canonical, vetted, {
          phrase, location, source:question.source || '个人学习册 · 英语刷题', id:question.id,
        });
      };
      const source = env.EnglishPhraseCore?.extract({stem:question.stem}, dictionary, {fillAnswer}) || [];
      for (const phrase of source) {
        const origin = phrase.origins[0];
        add(phrase.term, phrase.meaning, origin.location, origin.text);
      }
      for (const [location, content] of analysis) {
        for (const line of asText(content).split(/[。；！？\n]/)) {
          if (!line) continue;
          const matches = env.EnglishPhraseCore?.extract({stem:line}, dictionary) || [];
          for (const phrase of matches) {
            if (!phrase.origins.some(hit => !negativeBefore.test(line.slice(0,hit.start)) && !negativeAfter.test(line.slice(hit.end)))) continue;
            add(phrase.term, phrase.meaning, location, line);
          }
        }
        for (const {term,meaning,example} of glossedPhrases(content,location!=='记住这一点')) {
          add(term, meaning, location, example);
        }
      }
      for (const [letter, detail] of Object.entries(lesson?.optionAnalysis || {})) {
        const term = termKey(question.options?.[letter]);
        if (!Object.hasOwn(dictionary,term) || !hasChinese(asText(detail.meaning)) || /错误|不成词|误写|用词有误/.test(detail.meaning)) continue;
        add(term, dictionary[term], `选项 ${letter} 释义`, asText(detail.reason));
      }
    }
    return {words:result, count};
  }

  function addWord(words, term, meaning, {location, phrase, source, id}) {
    const key = termKey(term);
    if (!isPhrase(key) || key.length>90 || !hasChinese(asText(meaning))) return;
    let word = words.get(key);
    if (!word) {
      word = {term:key, meaning:asText(meaning), note:'', phrase:'', groups:[label], sources:[]};
      words.set(key, word);
    }
    appendLine(word, 'meaning', asText(meaning), 4);
    appendLine(word, 'phrase', asText(phrase), 6);
    appendLine(word, 'note', `${location} · ${id || source}`, 10);
    if (!word.sources.includes(source) && word.sources.length < 10) word.sources.push(source);
  }

  function appendLine(word, property, text, limit) {
    const lines = word[property] ? word[property].split('\n') : [];
    if (text && lines.length < limit && !lines.includes(text)) word[property] = [...lines,text].join('\n');
  }

  function contains(confirmed, word) {
    if (!confirmed) return false;
    const includesAll = (actual,expected) => expected.every(value => actual.includes(value));
    return ['meaning','phrase','note'].every(property => includesAll(asText(confirmed[property]).split('\n'), asText(word[property]).split('\n').filter(Boolean)))
      && ['groups','sources'].every(property => includesAll(confirmed[property] || [],word[property] || []));
  }

  function snapshots() {
    const {pending=[],receipts={}} = root.WordLink?.snapshot() || {};
    const queued = new Map(pending.map(entry => [fallbackKey(entry.word.term),entry.word]));
    const saved = new Map();
    for (const [term,receipt] of Object.entries(receipts)) {
      try { saved.set(term,JSON.parse(receipt.snapshot)); } catch { /* Old receipts may not have a snapshot. */ }
    }
    return {queued,saved};
  }

  function queue(words, connect) {
    const {queued,saved} = snapshots();
    const fresh = [...words.values()].filter(word => {
      const key = fallbackKey(word.term);
      return !contains(queued.get(key),word) && !contains(saved.get(key),word);
    });
    if (fresh.length && root.WordLink?.enqueue(fresh,{connect})===false) throw Error('待发送列表保存失败，请重试。');
    else if (!fresh.length && connect && queued.size) root.WordLink?.connect();
  }

  function status() {
    if (!last) return null;
    const {queued,saved} = snapshots();
    let alreadySynced = 0, pending = 0;
    for (const [key, word] of currentWords) {
      const normalized = fallbackKey(key);
      if (contains(saved.get(normalized),word)) alreadySynced++;
      else if (queued.has(normalized)) pending++;
    }
    return {...last,terms:currentWords.size,alreadySynced,pending};
  }

  async function sync({connect=false}={}) {
    const exercise = collectExercise(provider?.questions?.() || []);
    last = {questions:exercise.count};
    currentWords = exercise.words;
    queue(currentWords,connect);
    return status();
  }

  function queueQuestion(question,event) {
    if (question.subject !== '英语' || !isActualSubmission(event)) return 0;
    const {words} = collectExercise([{...question,events:[event]}]);
    if (!words.size) return 0;
    try { queue(words,false); }
    catch (error) { root.WordLink?.status(error.message || '短语暂未加入待发送列表'); return 0; }
    return words.size;
  }

  const api = {init: options => { provider = options; },sync,status,queueQuestion,collectExercise,isActualSubmission};
  if (typeof module !== 'undefined') module.exports = api;
  if (typeof window !== 'undefined') window.SubmittedPhrases = api;
})();
