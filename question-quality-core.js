'use strict';
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.QuestionQuality=api;})(typeof window!=='undefined'?window:null,function(){
 const text=v=>v==null?'':String(v).trim();
 function inspect(input){
  const q=input&&typeof input==='object'?input:{},blockers=[],warnings=[];
  const add=(list,code,field,message)=>list.push({code,field,message});
  const stem=text(q.stem),type=text(q.type),manual=q.autoGradeDisabled===true||q.sourceGradingDispute===true;
  const options=q.options&&typeof q.options==='object'&&!Array.isArray(q.options)?q.options:{};
  const keys=Object.keys(options).filter(k=>/^[A-Z]$/.test(k));
  const choice=/选择|单选|多选/.test(type)||keys.length>0;
  const answer=text(q.verifiedAnswer)||text(q.sourceAnswer);
  if(!stem)add(blockers,'missing-stem','stem','缺少可阅读的题干，请对照原始来源补齐。');
  if(q.unusableSource)add(blockers,'unusable-source','source','原始题源已标记为无法可靠还原，请核对原图。');
  if(choice){
   if(keys.length<2)add(blockers,'missing-options','options','选择题至少需要两个完整选项，请对照原图补齐。');
   for(const k of keys)if(!text(options[k])&&!q.optionImages?.[k]?.src)add(blockers,'empty-option','options','选项 '+k+' 为空，请核对原图。');
   if(!manual&&answer){
    const normalized=answer.replace(/[\s、,，/;；]/g,'').toUpperCase();
    if(/^[A-Z]+$/.test(normalized)){
     if([...normalized].some(k=>!keys.includes(k)))add(blockers,'invalid-answer','verifiedAnswer','答案字母不在现有选项中，请核对答案与选项。');
    }else add(warnings,'answer-needs-review','verifiedAnswer','答案不是明确的选项字母，请人工核对；保留原答案。');
   }
  }
  if(!answer&&!manual)add(blockers,'missing-answer','verifiedAnswer','缺少参考答案；请补齐，或在确认需人工判定后启用人工判分。');
  if(Number(q.blankCount)>0&&!/_{2,}|＿{2,}|[（(]\s*[）)]|\[\s*\]|□|…{2,}/.test(stem))add(blockers,'missing-blank','stem','已声明填空空位，但题干未保留空位，请对照来源核对。');
  else if(/填空/.test(type)&&stem&&!/_{2,}|＿{2,}|[（(]\s*[）)]|□|求|计算|写出|填写|填入|回答|确定|表示|分别|为|是|等于/.test(stem))add(warnings,'blank-needs-review','stem','填空题未发现明确空位或作答指令，请核对原图。');
  if(/(?:^|\n)\s*(?:【?解析】?|答案解析|解题过程)\s*[:：]/.test(stem))add(warnings,'analysis-in-stem','stem','题干疑似混入解析，请对照原图拆分题干与解析。');
  if(manual)add(warnings,'manual-grading','autoGradeDisabled','此题保留人工判定，不自动判错。');
  return {id:q.id||'',status:blockers.length?'pending':warnings.length?'review':'ready',practiceAllowed:blockers.length===0,autoGradeAllowed:blockers.length===0&&!manual,manual,blockers,warnings,fields:{stem,options,answer,analysis:text(q.analysis),blankCount:Number(q.blankCount)||null,source:q.source||'',sourceImageRefs:q.sourceImageRefs|| (q.image?[q.image]:[])}};
 }
 function inspectAll(qs){const items=(Array.isArray(qs)?qs:[]).map(inspect);return {total:items.length,pending:items.filter(x=>!x.practiceAllowed).length,ready:items.filter(x=>x.practiceAllowed).length,review:items.filter(x=>x.warnings.length).length,manual:items.filter(x=>x.manual&&x.practiceAllowed).length,items};}
 function prepareImported(q){const result={...q};result.quality={version:1,...inspect(result)};return result;}
 return {version:1,inspect,inspectAll,prepareImported};
});

if(typeof window!=='undefined')window.JournalReleaseStatus?.register('question-quality','v4.0-workspace-20261108');
