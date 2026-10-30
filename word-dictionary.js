'use strict';
(()=>{const D=window.WORD_DICTIONARY_DATA;const hyphenWords={"first-time":"adj. 初次的；第一次的","new-born":"adj. 新生的；刚出生的","blue-sky":"adj. 蓝天的；晴朗的；（想法、研究等）富于想象的，不受现实限制的","rail-thin":"adj. 骨瘦如柴的；瘦得像竹竿的","t-shirt":"n. T恤衫；圆领短袖衫","elder-generation":"adj. 年长一代的","role-models":"n. 榜样；行为楷模（role model 的复数）","low-priced":"adj. 低价的；价格低廉的","e-books":"n. 电子书（e-book 的复数）","newly-opened":"adj. 新开业的；新开设的","fast-paced":"adj. 快节奏的；进展迅速的","internet-famous":"adj. 网络走红的；在网上出名的","long-term":"adj. 长期的；长远的","re-examine":"v. 重新审视；重新检查","single-use":"adj. 一次性使用的","10-foot-tall":"adj. 十英尺高的","foot-tall":"构词结构：……英尺高的（前接数字，如 10-foot-tall）","mid-crash":"adv./adj. 在撞击过程中；处于撞击进行到一半的状态","eco-friendly":"adj. 环保的；对环境友好的","plastic-related":"adj. 与塑料有关的","face-to-face":"adj./adv. 面对面的；面对面地","short-time":"adj. 短时间的；短期的","light-weight":"adj. 轻量的；不繁重的；轻松简单的","long-time":"adj. 长时间的；长期的","sell-by":"adj. 最迟销售日期的；建议销售期限的（sell-by date：最迟销售日期）","small-size":"adj. 小尺寸的；小份的","poor-area":"adj. 贫困地区的","animal-assisted":"adj. 动物辅助的；由动物协助的","specially-trained":"adj. 经过专门训练的","nursing-home":"adj. 养老院的；护理院的","job-hunting":"n./adj. 求职；找工作的"};const supplementalWords={
 'after-school':'adj./adv. 课外的；放学后的；放学后地',
 'coworking':'n. 联合办公；共享办公',
 'forty-two':'数词：四十二',
 'hip-hop':'n. 嘻哈音乐；嘻哈文化',
 'strong-willed':'adj. 意志坚强的；有主见的',
 'well-built':'adj. 体格健壮的；建造坚固的',
 'years-old':'年龄表达的片段；规范的前置复合形容词用“数字-year-old”，表语用“数字 years old”',
 'peaces':'peace 的复数拼写；peace 表示“和平”通常不可数，本题中的 global peaces 不合适',
 'percents':'percent 的复数形式；数字后表示百分之……时通常仍用 percent，如 eighty percent',
 'want to':'想要；打算（后接动词原形）',
 'working on':'work on 的进行形式：正在从事；正在处理',
 'for the':'介词加冠词片段：for 表示为了、给、供等，the 限定后面的名词',
 'shown up':'show up 的过去分词形式：出现；到场',
 'urgent meeting':'紧急会议',
 'reserve a':'动词加冠词片段：reserve 表示预订、保留，a 引出后面的单数可数名词',
 'next wednesday':'下周三',
 'works as':'work as 的第三人称单数形式：担任；从事……工作',
 'for product':'介词加名词片段：for 表示为了、供……使用等；product 表示产品',
 'could i':'委婉请求或征求许可的开头：我可以……吗',
 'wait a moment':'等一会儿；稍等片刻',
 'learn about':'了解；获悉有关……的情况',
 'talked about':'talk about 的过去式或过去分词形式：谈论；讨论',
 'heading for':'head for 的进行形式：正前往；正朝……走去',
 'get back before':'在……之前回来；before 后接时间或从句',
 'trust is':'主语加系动词片段：trust 表示信任，is 表示是；完整意思需看后文',
 'can be avoided':'能够被避免；can + be + 过去分词构成含情态动词的被动语态',
 'contact with':'与……的接触；与……的联系'
};
function dictionaryMeaning(key){return D.words[key]||(D.forms[key]?D.words[D.forms[key]]:'')||'';}
function lookup(value){
 const key=String(value||'').normalize('NFKC').toLowerCase().replace(/[’‘`]/g,"'").replace(/‿/g,' ').replace(/[‐‑‒–−﹘﹣－]/g,'-').replace(/\s+/g,' ').trim();
 const contraction=key.match(/^(i|you|he|she|it|we|they|that|there|what|who|how|where|when|why)('m|'re|'ve|'ll|'d|'s)$/);
 if(contraction){const [,subject,suffix]=contraction;const allowed={"'m":['i'],"'re":['you','we','they','what','who','where','how'],"'ve":['i','you','we','they'],"'ll":['i','you','he','she','it','we','they','that','there','who','what'],"'d":['i','you','he','she','it','we','they','that','there','who','what'],"'s":['he','she','it','that','there','what','who','how','where','when','why']};if(allowed[suffix].includes(subject)){const expanded={"'m":'am',"'re":'are',"'ve":'have',"'ll":'will',"'d":'had 或 would',"'s":'is 或 has'}[suffix];return subject+suffix+'：'+subject+' '+expanded+' 的缩写，具体含义取决于后文';}}
 const negatives={"aren't":'are not',"isn't":'is not',"wasn't":'was not',"weren't":'were not',"haven't":'have not',"hasn't":'has not',"hadn't":'had not',"don't":'do not',"doesn't":'does not',"didn't":'did not',"can't":'cannot',"couldn't":'could not',"won't":'will not',"wouldn't":'would not',"shouldn't":'should not',"mustn't":'must not',"needn't":'need not',"shan't":'shall not'};
 if(negatives[key])return negatives[key]+' 的缩写（否定形式）';
 const direct=hyphenWords[key]||supplementalWords[key]||dictionaryMeaning(key);if(direct)return direct;
 // Number + unit compounds are productive; explain malformed test choices instead of treating them as valid adjectives.
 const compound=key.match(/^(\d+)-(year|hour|minute|day|word|foot)(s?)(-old|-long|-tall)?('s)?$/);
 if(compound){const [,amount,unit,plural,tail='',possessive='']=compound;const units={year:'年',hour:'小时',minute:'分钟',day:'天',word:'词',foot:'英尺'};if(tail==='-old'&&unit!=='year'||tail==='-tall'&&unit!=='foot'||tail==='-long'&&!['year','hour','minute','day','foot'].includes(unit))return '';const meaning=tail==='-old'?amount+'岁的':tail==='-tall'?amount+'英尺高的':amount+units[unit]+(tail==='-long'?'长的':'的');return '复合修饰语：'+meaning+(plural||possessive?'；作前置复合定语时单位名词应为单数，不加所有格，规范形式为 '+amount+'-'+unit+tail:'');}
 const possessive=key.endsWith("'s")?key.slice(0,-2):key.endsWith("s'")?key.slice(0,-1):'';
 const base=possessive&&dictionaryMeaning(possessive);return base?base+'（原句带所有格）':'';
}
function contextual(value,context={}){const k=String(value||'').toLowerCase().replace(/[‐‑‒–−﹘﹣－]/g,'-').trim(),sentence=String(context.text||'').replace(/[‐‑‒–−﹘﹣－]/g,'-');if(k==='blue-sky'&&/blue-sky\s+days/i.test(sentence))return {meaning:lookup(k),sense:'蓝天的；晴朗的',construction:'blue-sky days：蓝天晴朗的日子',reason:'blue-sky 在这里作形容词修饰 days，描述天气；此处不取金融或不切实际的引申义。'};return null;}window.WordDictionary={lookup,contextual};})();
