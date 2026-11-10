'use strict';
// Ordered, shared script promises keep classic-script globals and Pages subpaths intact.
(()=>{
const documentLoaderURL=document.currentScript.src,base=new URL('.',documentLoaderURL),scripts=new Map(),features=new Map();
const computerReviewVersion='matching-notes-20261109';
const groups={
 reading:['reading-data.js','reading-sentence-data.js','reading-matching-20261108.js','reading-houseplants-20261101.js','reading-houseplants-lookup.js','reading-phrase-supplement.js','reading-sentence-core.js','reading-sentence-ui.js','reading-core.js','reading.js'],
 listening:['listening-data.js','phonology-core.js','phonology-lexicon.js','phonology-ui.js','listening-speed.js','shadow-practice.js','listening-route-data.js','listening-route-ui.js','listening-phrases.js','listening-simple.js'],
 computer:['computer-special-data.js','computer-cloze-core.js','computer-special.js'],
 english:['reading-data.js','reading-sentence-data.js','reading-matching-20261108.js','reading-houseplants-20261101.js','reading-houseplants-lookup.js','reading-phrase-supplement.js','listening-data.js','writing-practice-data.js','writing-practice-core.js','writing-practice-ui.js','english-study-ui.js']
};
function script(file){if(scripts.has(file))return scripts.get(file);const promise=new Promise((resolve,reject)=>{const el=document.createElement('script');const url=new URL(file,base);url.searchParams.set('v',new URL(documentLoaderURL).searchParams.get('v')||window.JournalRelease?.build||'');if(file==='computer-special.js'||file==='computer-cloze-core.js')url.searchParams.set('computer',computerReviewVersion);el.src=url.href;el.async=false;el.onload=()=>resolve();el.onerror=()=>{el.remove();scripts.delete(file);reject(Error('专题文件加载失败：'+file));};document.head.appendChild(el);});scripts.set(file,promise);return promise;}
function register(name,init){if(features.has(name))throw Error('重复专题注册：'+name);features.set(name,{init,ready:false,pending:null});}
function ensure(name){const f=features.get(name);if(!f)return Promise.reject(Error('未知专题：'+name));if(f.ready)return Promise.resolve();if(f.pending)return f.pending;f.pending=(async()=>{for(const file of groups[name])await script(file);await f.init();f.ready=true;})().catch(error=>{f.pending=null;throw error;});return f.pending;}
function ready(name){return !!features.get(name)?.ready;}
async function flush(){for(const name of ['WritingPractice','ReadingUI','ListeningUI'])await window[name]?.flush?.();}
function mergeReading(a={},b={}){const out={...a};for(const [id,v]of Object.entries(b)){const old=out[id];if(!old){out[id]=v;continue;}const [older,newer]=(v.at||'')>(old.at||'')?[old,v]:[v,old],words=new Map();for(const w of [...(older.words||[]),...(newer.words||[])]){const key=String(w.term||'').trim().toLowerCase().replace(/\s/g,' ');if(key)words.set(key,{...(words.get(key)||{}),...w});}const reviewed=newer.reviewed&&(!older.reviewed||Date.parse(newer.reviewed.at)>=Date.parse(older.reviewed.at))?newer.reviewed:older.reviewed;out[id]={...newer,reviewed,marks:{...(older.marks||{}),...(newer.marks||{})},words:[...words.values()],attempts:[...new Map([...(older.attempts||[]),...(newer.attempts||[])].map(x=>[x.id,x])).values()]};}return out;}
async function mergeComputer(a={},b={}){await script('computer-special-data.js');await script('computer-cloze-core.js');const out={...a,records:{...(a.records||{})}};if(!out.selected&&b.selected)out.selected=b.selected;for(const[id,item]of Object.entries(b.records||{})){const section=window.COMPUTER_SPECIAL_DATA.chapters.flatMap(c=>c.sections).find(s=>s.id===id)||{};out.records[id]=window.ComputerClozeCore.mergeRecord(section,out.records[id]||{},item);}return out;}
window.FeatureLoader={register,ensure,ready,flush,mergeReading,mergeComputer};
})();


if(typeof window!=='undefined')window.JournalReleaseStatus?.register('feature-loader','v4.0-workspace-20261108');
