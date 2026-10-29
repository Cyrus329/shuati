'use strict';
(()=>{
const rows={
'A1-1':[['these days','these days','最近；如今'],['working on','work on sth.','从事／着手处理某事']],
'A1-2':[['busy finishing','be busy doing sth.','忙于做某事'],['market investigation','market investigation','市场调查']],
'A1-3':[['busy with','be busy with sth.','忙于某事']],
'A2-1':[['shown up','show up','出现；到场']],
'A2-2':[['just now','just now','刚才'],['has to','have to do sth.','不得不／必须做某事']],
'A3-1':[['I’d like to','would like to do sth.','想要做某事（委婉表达）'],['reserve a meeting room','reserve a meeting room','预订会议室']],
'A3-2':[['Let me check','let sb. do sth.','让某人做某事'],['room availability','room availability','房间的可用情况']],
'A4-2':[['works as','work as ...','担任……；从事……职业'],['collects information','collect information','收集信息'],['product development','product development','产品开发']],
'A5-1':[['could I speak to','could I speak to sb.?','请问可以让某人接电话吗？'],['make sure','make sure (that) ...','确保……；核实……']],
'A5-2':[['wait a moment','wait a moment','稍等片刻'],['reservation record','reservation record','预订记录']],
'B1-1':[['learn about','learn about sth.','得知／了解某事']],
'B1-2':[['a former colleague','a former colleague','一位以前的同事']],
'B1-3':[['come from','come from ...','来自……'],['job‑hunting apps','job-hunting apps','求职应用程序'],['these days','these days','最近；如今']],
'B1-4':[['I’d like to','would like to do sth.','想要做某事（委婉表达）']],
'B1-6':[['salary range','salary range','薪资范围'],['annual leave','annual leave','年假']],
'B1-7':[['talked about','talk about sth.','谈论某事'],['face‑to‑face interview','face-to-face interview','面对面面试']],
'B1-9':[['How about','how about ...?','……怎么样？（提出建议／征求意见）']],
'B1-10':[['works for me','work for sb.','对某人适用／合适（另可指为某人工作）']],
'B1-11':[['job information','job information','职位／招聘信息']],
'B1-12':[['know about','know about sth.','了解有关某事的情况']],
'B2-1':[['business bag','business bag','公文包；商务用包']],
'B2-2':[['heading for','head for ...','朝……前进；前往……'],['industrial park','industrial park','工业园区']],
'B2-3':[['business activity','business activity','商务活动；经营活动']],
'B2-4':[['product exhibition','product exhibition','产品展览'],['over there','over there','在那边']],
'B2-5':[['quite often','quite often','相当经常；常常']],
'B2-7':[['the whole day','the whole day','一整天']],
'B2-8':[['plan to','plan to do sth.','计划做某事'],['get back','get back','回来；返回']],
'B2-10':[['plan to','plan to do sth.','计划做某事']],
'C-1':[['Building trust','build trust','建立信任'],['long‑term business partnership','long-term business partnership','长期商业合作关系']],
'C-2':[['choose to cooperate','choose to do sth.','选择做某事'],['forms the foundation of','form the foundation of ...','构成……的基础'],['joint work','joint work','共同工作；合作']],
'C-3':[['key point','key point','关键点；要点']],
'C-4':[['in time','in time','及时；最终（依语境）'],['can be avoided','can be done','可以被……（情态动词的被动结构）']],
'C-5':[['set reasonable rules','set rules','制定规则'],['dealing with','deal with sth.','处理／应对某事'],['unexpected risks','unexpected risks','意外风险']],
'C-6':[['all the time','all the time','一直；始终']],
'C-7':[['both sides','both sides','双方'],['solve problems','solve problems','解决问题']],
'C-8':[['keeping regular contact with','keep contact with sb.','与某人保持联系'],['a lot','a lot','非常；很多']],
'C-9':[['strengthen ties','strengthen ties','加强联系'],['maintain stable business relations','maintain business relations','维持业务关系'],['both sides','both sides','双方']]
};
for(const phrases of Object.values(rows))for(const phrase of phrases)phrase[3]=phrase[1].replace(/\s*\([^)]*\)/g,'').replace(/[.?]/g,'').trim().toLowerCase();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function render(sentence){const phrases=rows[sentence.id]||[];if(!phrases.length)return '';return `<section class="read-study-structures listen-phrase-structures" data-listen-phrase-sentence="${esc(sentence.id)}"><h4>本句短语结构 · 点击可收藏</h4>${phrases.map(([surface,term,meaning],i)=>`<article><button type="button" data-listen-phrase="${i}">${esc(term)}</button><span>${esc(meaning)}</span></article>`).join('')}</section>`;}
document.addEventListener('click',event=>{const button=event.target.closest('[data-listen-phrase]');if(!button)return;const id=button.closest('[data-listen-phrase-sentence]')?.dataset.listenPhraseSentence;const phrase=rows[id]?.[Number(button.dataset.listenPhrase)];if(!phrase)return;const group=window.LISTENING_DATA.groups.find(g=>g.sentences.some(s=>s.id===id)),sentence=group?.sentences.find(s=>s.id===id);if(!sentence)return;event.preventDefault();event.stopPropagation();const take=group.takes.find(t=>t.cues.some(c=>c.sentenceId===id&&!c.partial))||group.takes.find(t=>t.cues.some(c=>c.sentenceId===id)),cue=take?.cues.find(c=>c.sentenceId===id);const [surface,structure,meaning,term]=phrase;window.ListeningVocabUI.open(term,{id:window.LISTENING_DATA.id+':'+id,sentenceId:id,group:group.id+' '+group.title,source:'蓝色森林 · 听力精听',text:sentence.text,translation:sentence.translation,surface,meaning,meaningKind:'phrase',track:take?.track??null,start:cue?.start??null,end:cue?.end??null});});
window.ListeningPhrases={rows,render};
})();
