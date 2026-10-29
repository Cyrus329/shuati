'use strict';
(()=>{
let clean=false;
const clone=v=>JSON.parse(JSON.stringify(v)),object=v=>v&&typeof v==='object'&&!Array.isArray(v);
const personalKeys=new Set(['ownAnswer','firstStatus','groupStatus','memo','questionNote','personal','notes','note','optionMarks','guessed','needsReview','platformStatus','userCorrection','related']);
function isCleanStart(q){return q?.cleanStart===true||clean;}
function question(q){if(!isCleanStart(q))return q;return {...q,cleanStart:true,firstStatus:'未作答',groupStatus:'未作答',ownAnswer:'',memo:'',questionNote:'',personal:'',notes:'',note:'',optionMarks:{},guessed:false,needsReview:false,platformStatus:'',userCorrection:'',related:'',initialCorrect:false};}
function shouldDefault(state,hasStoredRecord,enabled=window.FRESH_START_CONFIG?.DEFAULT_CLEAN_START===true){return enabled===true&&!hasStoredRecord;}
function reset(state={},at=Date.now()){
 const keptUI={cleanStart:true,hideCorrectFamilies:true,hideCorrectQuestions:true};
 if(state.ui?.appearance)keptUI.appearance=clone(state.ui.appearance);
 if(Array.isArray(state.ui?.dailyNew?.bank))keptUI.dailyNew={version:state.ui.dailyNew.version||1,bank:clone(state.ui.dailyNew.bank),days:{},stage:{oldQuestionsCompleted:false}};
 const edits={};for(const [id,edit]of Object.entries(state.edits||{})){if(!object(edit))continue;const kept=Object.fromEntries(Object.entries(edit).filter(([key])=>!personalKeys.has(key)));if(Object.keys(kept).some(key=>key!=='modifiedAt'))edits[id]=clone(kept);}
 const library={notes:(state.library?.notes||[]).filter(n=>n&&['formula','vocab'].includes(n.kind)).map(clone),favorites:{},reading:{}};
 const custom=clone(Array.isArray(state.custom)?state.custom:[]).map(q=>{for(const key of personalKeys)delete q[key];delete q.events;delete q.sourceAttempt;return q;});
 return {format:'cqzsb-personal-journal-state-v1',custom,attempts:{},edits,ui:keptUI,library,_resetEpoch:Math.max(Number(state._resetEpoch||0)+1,Number(at)||Date.now())};
}
function isCompleteBackup(data){const s=data?.state;return data?.format==='cqzsb-personal-journal-backup-v1'&&object(s)&&Array.isArray(s.custom)&&object(s.attempts)&&object(s.edits);}
function backupCleanStart(state,data){return isCompleteBackup(data)?data.state.ui?.cleanStart===true:state.ui?.cleanStart===true;}
function restoreEdit(current,incoming,complete=false){
 if(!object(incoming))return current;
 if(!object(current)||String(incoming.modifiedAt||'')>String(current.modifiedAt||''))return clone(incoming);
 if(!complete||String(incoming.modifiedAt||'')!==String(current.modifiedAt||''))return current;
 const restored={...current};for(const key of personalKeys)if(!Object.hasOwn(current,key)&&Object.hasOwn(incoming,key))restored[key]=clone(incoming[key]);return restored;
}
function restoreCustom(current=[],incoming=[]){
 const byId=new Map((Array.isArray(incoming)?incoming:[]).filter(q=>object(q)&&q.id).map(q=>[q.id,q]));
 return current.map(q=>{const old=byId.get(q.id);if(!old)return q;const restored={...q};for(const key of personalKeys)if(!Object.hasOwn(q,key)&&Object.hasOwn(old,key))restored[key]=clone(old[key]);return restored;});
}
window.PersonalHistory={isCleanStart,setCleanStart:value=>{clean=value===true;},question,reset,shouldDefault,isCompleteBackup,backupCleanStart,restoreEdit,restoreCustom};
})();
