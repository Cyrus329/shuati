'use strict';
(()=>{
 const groups=new Set(['已做英语题 · 重点短语','练习题生词','手动收藏的题目生词']);
 const families=[
  ['give a detailed explanation of','详细解释……',['a detailed explanation','detailed explanation','a detailed explanation of','detailed explanation of','give a detailed explanation']],
  ['have a taste for','喜欢；欣赏；对……有鉴赏兴趣',['a taste for','taste for']],
  ['have an interest in','对……感兴趣',['an interest in','interest in']],
  ['make a commitment to','承诺做……',['make a commitment','a commitment','make a commitment to do sth']],
  ['make a promise to sb','向某人作出承诺',['make a promise','make a promise to someone']],
  ['make an effort','作出努力',['an effort']],
  ['have an opportunity to','有机会做……',['an opportunity to','opportunity to']],
  ['appointment of sb as','任命某人担任……',['appointment of sb as director']],
  ['ask sb for help','向某人求助',['ask somebody for help','ask someone for help']],
  ['do sb a favor','帮某人一个忙',['do sb a favour','do somebody a favor','do someone a favor']],
  ['in favor of','赞成；支持',['in favour of']],
 ];
 families.push(...[["book shop","书店",["a book shop","bookshop"]],["plot twist","情节转折",["a plot twist"]],["make great progress in","在……方面取得很大进步",["make great progress"]],["teach oneself","自学",["teach oneself english"]],["have difficulty in doing sth","做某事有困难",["have difficulty in","have difficulty in finishing"]],["have a gift for","有……的天赋",["have a gift for public speaking"]],["be afraid of","害怕……",["be afraid of heights"]],["believe in","相信；信任",["believe in yourself"]],["devotion to","对……的奉献；忠诚",["devotion to the job"]],["the basics of","……的基础知识",["the basics of english grammar"]],["the reason for","……的原因",["the reason for a decision"]],["be worth the effort","值得付出努力",["worth the effort"]],["keep in mind","记住；牢记",["keep in mind that"]],["be in a difficult situation","处于困境",["in a difficult situation"]],["have good business sense","有良好的商业判断力",["a good business sense","business sense"]],["bring pleasure to sb","给某人带来快乐",["bring pleasure to people"]],["give advice on sth","就某事给出建议",["give sb advice on"]],["give sb an explanation of sth","向某人解释某事",["explanation of"]],["enjoy oneself","玩得开心",["enjoyed themselves"]],["put away","把……收起来",["put them away"]],["send for sb","派人去请某人",["send for a doctor"]],["keep a diary","写日记",["keep an english diary"]],["there is no excuse for doing sth","做某事没有借口",["no excuse for","there is no excuse for this"]],["there is nothing wrong with","……没有问题；……没有毛病",["nothing wrong with"]],["something is wrong with","……有问题；……出毛病",["something is wrong with my phone"]],["there is little doubt that","几乎可以肯定……",["little doubt"]],["it's my fault","是我的错",["my fault"]],["reliable source","可靠的来源",["a reliable source"]],["a cup of","一杯……",["a cup of coffee","a cup of tea"]],["the cause of the accident","事故的原因",["the cause of an accident"]],["have no one to talk to","没有可以说话的人",["no one to talk to"]],["take every chance to do","抓住每次机会做……",["take every chance to practice"]],["alleviate","减轻；缓解",["alleviates"]],["calf","小牛；某些大型哺乳动物的幼崽；小腿肚",["calves"]],["candidate","候选人；应试者",["candidates"]],["ceremony","仪式；典礼",["ceremonies"]],["composer","作曲家",["composers"]],["department","部门；系",["departments"]],["expose","使暴露；揭露；使接触",["exposes"]],["expand","扩大；扩展",["expands"]],["optimize","优化",["optimizes"]],["outperform","胜过；表现优于",["outperformed"]],["invitation","邀请；请柬",["invitations"]],["villa","别墅",["villas"]],["trick","把戏；骗局；诀窍",["tricks"]],["landmark","地标；里程碑",["landmarks"]],["landfill","垃圾填埋场",["landfills"]],["appliance","器具；家用电器",["appliances"]],["houseplant","室内盆栽植物",["houseplants"]],["item","项目；一件物品",["items"]],["rejection","拒绝；否决",["rejections"]],["statement","声明；陈述",["statements"]],["sculpture","雕塑；雕刻作品",["sculptures"]],["sensor","传感器",["sensors"]],["sticker","贴纸；标签",["stickers"]],["twig","细枝；小枝",["twigs"]],["virtue","美德；优点",["virtues"]],["perspective","视角；观点",["perspectives"]],["decibel","分贝",["decibels"]],["poster","海报",["posters"]],["essay","文章；短文",["essays"]],["glance","一瞥；扫视",["glances"]],["household","家庭；住户",["households"]],["fraudster","诈骗者",["fraudsters"]],["holidaymaker","度假者",["holidaymakers"]],["peer","同辈；同龄人",["peers"]],["sailor","水手；船员",["sailors"]],["manufacturer","制造商",["manufacturers"]],["senior","资深人士；年长者；高年级学生",["seniors"]],["draw","画；拉；吸引；得出",["drew"]],["tie","系；绑；打成平局",["tied"]],["strike","击打；使想到；突然发生",["struck"]],["infer","推断；推知",["inferred"]],["rearrange","重新安排；重新排列",["rearranging"]],["transform","改变；改造；转变",["transformed"]],["nursing home","养老院；护理院",["nursing-home"]]]);
 const dropped = new Set(["those over there are", "who is", "that that", "have lived", "much has been done", "will take part in", "not many qualified candidates", "who do you want to go with", "none of us are perfect", "nothing can be enjoyed unless you digest it", "should study harder", "covering translation skills", "expression on her face", "another hamburger", "a label stuck on an envelope", "a novel of my aunt's", "a photo of my school's", "a friend of mary's mother's", "tina and nina's room", "tina's and nina's rooms", "determine the cause of the accident"]);
 const index=new Map(families.flatMap(([term,meaning,variants])=>[term,...variants].map(variant=>[variant,{term,meaning}])));
 function termInfo(term){
  const key=WordLinkCore.key(term).replace(/[.]+$/,'');
  return index.get(key);
 }
 function isExercise(word){
  return word.groups?.some(group=>groups.has(group))||
   /(?:^|\n)(?:参考解析|详细解析|解题线索|记住这一点|选项 [A-Z] (?:解析|释义)) · (?:CQZSB-|KUKE-)/.test(word.note||'');
 }
 function canonicalize(word){
  if(!isExercise(word))return word;
  const info=termInfo(word.term);
  return info?{...word,...info}:word;
 }
 function isDisposable(word){
  const term=WordLinkCore.key(word.term).replace(/[.!?]+$/,'');
  const example=/^(?:(?:how (?:far|much|often|many people|long have you|to cook)|what book|what about something to eat|(?:none|either|neither|both|all) of (?:them|us|the .+)|(?:either|neither) is (?:fine|ok|okay)|another (?:one|two|three|four|[0-9]+)|the ones doing|make one|(?:still have )?(?:a )?(?:few|little) (?:people|white hairs|time|money|bread|experience|salt|progress|doubt)))$/.test(term);
  return (dropped.has(term)||example) && word.groups?.includes('已做英语题 · 重点短语') &&
    !word.groups.some(g=>g!=='已做英语题 · 重点短语'&&g!=='阅读与练习生词');
 }
 window.ExerciseVocabularyDedupe={termInfo,isExercise,canonicalize,isDisposable};
})();
