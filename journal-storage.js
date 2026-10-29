'use strict';
(() => {
 const clone=x=>JSON.parse(JSON.stringify(x));
 const object=x=>x&&typeof x==='object'&&!Array.isArray(x);
 const normalize=x=>({...(object(x)?x:{}),format:'cqzsb-personal-journal-state-v1',custom:Array.isArray(x?.custom)?x.custom:[],attempts:object(x?.attempts)?x.attempts:{},edits:object(x?.edits)?x.edits:{}});
 function merge(older,newer){
  const epochA=Number(older?._resetEpoch||0),epochB=Number(newer?._resetEpoch||0);if(epochA!==epochB)return normalize(clone(epochA>epochB?older:newer));
  const a=normalize(older),b=normalize(newer),out={...a,...b,custom:[],attempts:{},edits:{},ui:{...(a.ui||{}),...(b.ui||{})}};
  const questions=new Map();for(const q of [...a.custom,...b.custom])if(q&&q.id)questions.set(q.id,{...(questions.get(q.id)||{}),...q});out.custom=[...questions.values()];
  for(const id of new Set([...Object.keys(a.attempts),...Object.keys(b.attempts)])){
   const events=new Map();for(const e of [...(Array.isArray(a.attempts[id])?a.attempts[id]:[]),...(Array.isArray(b.attempts[id])?b.attempts[id]:[])])if(object(e)){const key=e.eventId||[e.at,e.result,e.answer,e.note].join('|');events.set(key,{...(events.get(key)||{}),...e});}
   out.attempts[id]=[...events.values()].sort((x,y)=>Number(!!y.originalTimeUnknown)-Number(!!x.originalTimeUnknown)||String(x.at||'').localeCompare(String(y.at||'')));
  }
  for(const id of new Set([...Object.keys(a.edits),...Object.keys(b.edits)])){const x=a.edits[id]||{},y=b.edits[id]||{};out.edits[id]=String(x.modifiedAt||'')>String(y.modifiedAt||'')?{...y,...x}:{...x,...y};}
  return out;
 }
 function create({key='cqzsb-personal-journal-v1',onStatus=()=>{},indexedDB:providedIDB,localStorage:providedLocal}={}){
  let db=null,mode='loading',lastError='',pending=0,dirty=false,tail=Promise.resolve(),recovery=[],lastSavedAt='',local,hasStoredRecord=false;
  let idb=providedIDB;try{if(idb===undefined)idb=globalThis.indexedDB;}catch(e){lastError=e.name;}
  try{local=providedLocal===undefined?globalThis.localStorage:providedLocal;}catch(e){lastError=e.name;}
  function status(message=''){const info={mode,pending,dirty,lastError,lastSavedAt,message};onStatus(info);return info;}
  function open(){return new Promise((resolve,reject)=>{
   if(!idb){reject(new Error('IndexedDBUnavailable'));return;}
   let req,settled=false;const timer=setTimeout(()=>finish(new Error('IndexedDBOpenTimeout')),5000);
   const finish=(err,value)=>{if(settled){if(value)value.close();return;}settled=true;clearTimeout(timer);err?reject(err):resolve(value);};
   try{req=idb.open('cqzsb-personal-journal-v2',1);}catch(e){finish(e);return;}
   req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('journal'))req.result.createObjectStore('journal');};
   req.onsuccess=()=>finish(null,req.result);req.onerror=()=>finish(req.error||new Error('IndexedDBOpenFailed'));req.onblocked=()=>finish(new Error('IndexedDBBlocked'));
  });}
  function transaction(write,value){return new Promise((resolve,reject)=>{
   let tx,req,result;try{tx=db.transaction('journal',write?'readwrite':'readonly');const store=tx.objectStore('journal');req=write?store.put(value,key):store.get(key);}catch(e){reject(e);return;}
   req.onsuccess=()=>{result=req.result;};tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error||req.error||new Error('IndexedDBTransactionFailed'));tx.onabort=()=>reject(tx.error||new Error('IndexedDBAborted'));
  });}
  function decode(raw,label){if(!raw)return null;try{const value=typeof raw==='string'?JSON.parse(raw):raw;if(!object(value))throw new Error('InvalidState');return normalize(value);}catch(e){recovery.push({source:label,raw});lastError='UnreadablePreviousState';return null;}}
  async function load(){
   let legacy=null,current=null;
   try{legacy=decode(local?.getItem(key),'localStorage');}catch(e){lastError=e.name||e.message;}
   try{db=await open();current=decode(await transaction(false),'IndexedDB');mode='indexedDB';db.onversionchange=()=>{db.close();db=null;mode='memory';dirty=true;status('存储连接已关闭，请导出备份并重新打开。');};}
   catch(e){db=null;mode=local?'localStorage':'memory';lastError=e.name||e.message;}
   hasStoredRecord=!!(legacy||current);
   const state=Number(legacy?._storageUpdatedAt||0)>Number(current?._storageUpdatedAt||0)?merge(current||{},legacy||{}):merge(legacy||{},current||{});
   if(Array.isArray(state._storageRecovery))recovery.push(...state._storageRecovery);
   if(recovery.length)state._storageRecovery=clone(recovery);
   if(db&&legacy){try{await transaction(true,state);lastSavedAt=new Date().toISOString();}catch(e){mode=local?'localStorage':'memory';db.close();db=null;lastError=e.name||e.message;}}
   status(recovery.length?'检测到无法读取的旧存储，原内容已保留；请导出备份以便恢复。':mode==='memory'?'浏览器未开放持久存储，当前记录仅在本页；请导出备份。':'');
   return state;
  }
  function save(state,{replace=false}={}){
   if(replace)recovery=[];
   let snapshot;try{snapshot=clone(normalize(state));snapshot._storageUpdatedAt=Date.now();if(recovery.length)snapshot._storageRecovery=clone(recovery);}catch(e){dirty=true;lastError=e.name;status('记录暂未写入，请立即导出备份。');return Promise.resolve(false);}
   pending++;dirty=true;status('正在保存学习记录…');
   const task=tail.then(async()=>{
    let okay=false;
    if(db){try{await transaction(true,snapshot);mode='indexedDB';okay=true;}catch(e){lastError=e.name||e.message;}}
    if((!okay||replace)&&local){try{local.setItem(key,JSON.stringify(snapshot));if(!okay)mode='localStorage';okay=true;}catch(e){lastError=e.name||e.message;}}
    pending--;if(okay){hasStoredRecord=true;lastSavedAt=new Date().toISOString();dirty=pending>0;status(recovery.length?'旧存储有无法解析内容，请保留导出备份。':'');}
    else{mode='memory';dirty=true;status('未能保存到浏览器。新记录仍在当前页面，请立即导出备份，暂勿刷新或关闭。');}
    return okay;
   });tail=task.catch(()=>false);return task;
  }
  return {load,save,replace:state=>save(state,{replace:true}),flush:()=>tail,getStatus:()=>({mode,pending,dirty,lastError,lastSavedAt,hasStoredRecord}),getRecovery:()=>clone(recovery)};
 }
 const api={create,merge,normalize};if(typeof module!=='undefined'&&module.exports)module.exports=api;if(typeof window!=='undefined')window.JournalStorage=api;
})();
