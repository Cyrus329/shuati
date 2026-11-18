'use strict';
(()=>{
const D=window.COMPUTER_SPECIAL_DATA,C=window.ComputerClozeCore,$=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let api,chapter=0,selected='',shown=new Set(),lastRendered='',onlyWeak=false,wholeChapter=true;
const sections=()=>D.chapters.flatMap(c=>c.sections),sectionById=id=>sections().find(s=>s.id===id)||{parts:[]};
function state(){return api.get()||{records:{}};}
function entry(id){return C.record(sectionById(id),state().records?.[id]||{});}
async function update(id,patch){const s=structuredClone(state());s.records=s.records||{};s.records[id]={...entry(id),...patch,at:new Date().toISOString()};s.selected=id;const ok=await api.save(s);if($('computerSave'))$('computerSave').textContent=ok?'学习记录已保存':'保存失败，请重试或导出整站备份';return ok;}
function merge(a={},b={}){const out={...a,records:{...(a.records||{})}};if(!out.selected&&b.selected)out.selected=b.selected;for(const[id,item]of Object.entries(b.records||{}))out.records[id]=C.mergeRecord(sectionById(id),out.records[id]||{},item);return out;}
const chapterWeak=ch=>ch.sections.reduce((total,s)=>total+C.weakCount(s,entry(s.id)),0);
function comparisonTable(caption,headers,rows,rowHeaders=false){
 return `<div class="computer-table-scroll" tabindex="0" role="region" aria-label="${esc(caption)}"><table class="computer-base-table"><caption>${esc(caption)}</caption><thead><tr>${headers.map(label=>`<th scope="col">${esc(label)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map((cell,i)=>i===0&&rowHeaders?`<th scope="row">${cell}</th>`:`<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function tableRows(block,runHTML){
 const blanks=[];
 const text=block.runs.map(run=>run.blank?`«${blanks.push(run)-1}»`:run.text).join('');
 return text.trim().split(/\n/).map(line=>line.trim().split(/\s+/).map(cell=>{
  const match=cell.match(/^«(\d+)»$/);
  return match?runHTML(blanks[Number(match[1])]):C.html(cell);
 }));
}
function displayBlocks(part,guide){
 const blocks=[];
 for(const block of C.blocks(part)){
  const first=block.runs[0]?.text||'';
  if(guide&&!block.runs.some(run=>run.blank)){
   const text=block.runs.map(run=>run.text).join('').trim();
   const chunks=text.split(/❖|(?=(?:10 计算机文化|16 字符编码|17 汉字编码)$)/);
   for(const chunk of chunks){
    const title=chunk.trim();
    if(!title)continue;
    const kind=/^(?:第[一二三四五六七]章|考纲要求$|主要考点$)/.test(title)?'guide-heading':/^\d{2}\s+\p{Script=Han}|^\d{2}\s+(?:CPU|HTML|IIS)$/u.test(title)?'guide-point':title.startsWith('·')?'guide-bullet':'paragraph';
    blocks.push({kind,runs:[{text:title}]});
   }
   continue;
  }
  if(block.kind==='formula'&&block.runs.length===1&&first.trim()==='2 2')continue;
  const previous=blocks.at(-1),tail=previous?.runs.at(-1)?.text?.trimEnd();
  const shortContinuation=/^[\p{Script=Han}]{1,3}[；，。！？]\s*$/u.test(first);
  const continuedHeading=previous?.kind==='subheading'&&tail&&!/[。！？；：:]$/.test(tail)&&!/^\s*(?:[（(]\d|\d+[、.．]|[①-⑩]|[-•·])/.test(first);
  if(previous&&block.kind==='paragraph'&&(continuedHeading||shortContinuation)&&previous?.kind!=='formula'&&previous?.kind!=='case'){
   blocks[blocks.length-1]={...previous,runs:[...previous.runs,...block.runs]};
  }else blocks.push(block);
 }
 return blocks;
}
const inlineFigures = {
 "computer-ch4-37:16": {
  "anchor": "如下图所示",
  "title": "案例 2 · 剪贴板操作流程",
  "path": "computer-special/figures/ch4-p16-37-clipboard.png",
  "answer": false,
  "showWithMarkedContext": true
 },
 "computer-ch4-35:11": {
  "anchor": "在如下图所示的树形结构中",
  "title": "案例 2 · Windows 文件目录树",
  "path": "computer-special/figures/ch4-p11-35-directory-tree.png",
  "answer": false,
  "showWithMarkedContext": true
 },
 "computer-ch5-39:7": {"title": "OSI 七层之间的通信", "path": "computer-special/figures/ch5-p07-39.png", "anchor": "其结构如下图所示"},
 "computer-ch5-39:8": {"title": "OSI/RM 与 TCP/IP 层次对照", "path": "computer-special/figures/ch5-p08-39.png", "anchor": "对照关系如下图所示"},
 "computer-ch5-43:19": {"title": "IPv4 地址的类别及各位分配", "path": "computer-special/figures/ch5-p19-43.png", "anchor": ""},
 "computer-ch5-44:21": {"title": "IP 地址与子网掩码按位运算", "path": "computer-special/figures/ch5-p21-44.png", "anchor": "进行下列计算"},
 "computer-ch5-48:30": {"title": "家庭网络连接示意", "path": "computer-special/figures/ch5-p30-48.png", "anchor": "案例1"},
 "computer-ch5-48:31": {"title": "工作站 IP 配置输出", "path": "computer-special/figures/ch5-p31-48.png", "anchor": ""},
 "computer-ch5-48:32": {"title": "连通性测试输出", "path": "computer-special/figures/ch5-p32-48.png", "anchor": "执行ping 命令的结果如下图"},
 "computer-ch5-48:33": {"title": "学校有线网络设计", "path": "computer-special/figures/ch5-p33-48.png", "anchor": "案例2"},

 "computer-ch2-13:7": {
  "anchor": "小数点向右移动|一个字节的",
  "title": "二进制左移示意图",
  "path": "computer-special/figures/ch2-p7-13.png",
  "answer": false
 },
 "computer-ch2-15:13": {
  "anchor": "各类数据在计算机中的转换过程",
  "title": "各类数据的编码与解码",
  "path": "computer-special/figures/ch2-p13-15.png",
  "answer": false
 },
 "computer-ch2-17:17": {
  "anchor": "转换，过程如下图",
  "title": "汉字输入、交换、处理和输出的编码过程",
  "path": "computer-special/figures/ch2-p17-17.png",
  "answer": false
 },
 "computer-ch3-18:3": {
  "anchor": "一个完整的计算机系统",
  "title": "计算机系统的硬件和软件组成",
  "path": "computer-special/figures/ch3-p3-18.png?v=fit-1",
  "answer": false
 },
 "computer-ch3-18:4": {
  "anchor": "实线为数据流",
  "title": "冯·诺依曼计算机基本结构（实线为数据流，虚线为控制流）",
  "path": "computer-special/figures/ch3-p4-18.png?v=fit-1",
  "answer": false
 },
 "computer-ch3-19:6": {
  "anchor": null,
  "title": "指令执行与判断流程",
  "path": "computer-special/figures/ch3-p6-19.png",
  "answer": false
 },
 "computer-ch3-21:10": {
  "anchor": "在计算机开机时",
  "title": "计算机开机启动流程",
  "path": "computer-special/figures/ch3-p10-21.png",
  "answer": false
 },
 "computer-ch2-16:16": {
  "anchor": "将下表中ASCII",
  "title": "ASCII 编码表（原讲义答案）",
  "path": "computer-special/figures/ch2-p16-16.png",
  "answer": true
 }
};

function inlineFigureHTML(figure, source, markedContext = false) {
 if (!figure || (onlyWeak && !markedContext)) return '';
 const image = `<figure class="computer-inline-figure">
  <a class="computer-figure-image" href="${figure.path}" target="_blank" rel="noopener" aria-label="查看大图：${esc(figure.title)}"><img src="${figure.path}" alt="${esc(figure.title)}" loading="lazy"></a>
  <figcaption><strong>${esc(figure.title)}</strong><span>${esc(source.label)}</span><a href="${source.url}" target="_blank" rel="noopener">对照原页 ↗</a></figcaption>
 </figure>`;
 return figure.answer ? `<details class="computer-inline-answer"><summary>对照 ASCII 编码表答案</summary>${image}</details>` : image;
}

const figureClozeLayouts = {"ch2-p7-13.png": [716, 276, {"72": [17, 119, 426, 36], "73": [17, 216, 426, 36]}], "ch2-p13-15.png": [983, 348, {"94": [153, 91, 135, 33], "95": [466, 175, 52, 29], "96": [696, 91, 139, 33], "97": [153, 146, 86, 33], "98": [725, 146, 113, 33], "99": [152, 200, 180, 35], "100": [726, 200, 109, 35], "101": [215, 254, 96, 36], "102": [674, 254, 99, 36]}], "ch2-p17-17.png": [1039, 309, {"62": [210, 201, 82, 34], "63": [290, 265, 65, 27], "64": [366, 201, 81, 34], "65": [452, 265, 64, 27], "66": [520, 201, 80, 34], "67": [931, 79, 86, 36]}, {"66": [517, 82, 87, 33]}], "ch3-p3-18.png": [1073, 541, {"18": [315, 147, 108, 44], "19": [315, 430, 108, 44], "20": [620, 23, 56, 25], "21": [611, 122, 76, 26], "22": [611, 202, 77, 24], "23": [611, 243, 77, 24], "24": [611, 283, 77, 24], "25": [752, 1, 104, 25], "26": [752, 42, 101, 25], "27": [752, 82, 166, 26], "28": [752, 123, 148, 26], "29": [752, 164, 173, 26], "30": [483, 392, 64, 23], "31": [483, 490, 64, 23], "32": [613, 350, 70, 26], "33": [603, 391, 91, 25], "34": [613, 431, 70, 26], "35": [603, 471, 91, 23], "36": [603, 512, 91, 25]}], "ch3-p4-18.png": [784, 443, {"37": [147, 105, 31, 115], "38": [338, 156, 105, 31], "39": [604, 105, 31, 115], "40": [339, 74, 105, 29], "41": [349, 242, 84, 29], "42": [350, 325, 83, 29]}], "ch3-p6-19.png": [1039, 261, {"21": [155, 122, 85, 33], "22": [314, 122, 104, 33], "23": [791, 122, 107, 33]}], "ch3-p10-21.png": [371, 550, {"33": [98, 146, 170, 39], "34": [48, 257, 276, 37], "35": [102, 366, 166, 38]}]};

function figureClozeHTML(exercise,figure,source,runHTML){
 const key=figure.path.split('/').at(-1).split('?')[0];
 const [width,height,boxes,mirrors={}]=figureClozeLayouts[key];
 const boxStyle=([x,y,w,h])=>`left:${100*x/width}%;top:${100*y/height}%;width:${100*w/width}%;height:${100*h/height}%`;
 const runs=exercise.rows.flat().filter(run=>run.blank);
 const blanks=runs.map(run=>{
  const rect=boxes[run.number];
  return `<span class="computer-figure-slot ${key==='ch2-p7-13.png'?'computer-figure-bits':''} ${rect[3]>2*rect[2]?'computer-figure-vertical':''}" style="${boxStyle(rect)};--figure-characters:${Math.max(4,run.text.length)}">${runHTML(run)}</span>`;
 });
 const copies=runs.filter(run=>mirrors[run.number]).map(run=>
  `<span class="computer-figure-mirror" style="${boxStyle(mirrors[run.number])}" data-computer-figure-mirror="${esc(run.blank)}" aria-hidden="true" ${shown.has(run.blank)?'hidden':''}>____</span>`);
 return `<figure class="computer-inline-figure computer-figure-cloze">
  <div class="computer-figure-scroll" tabindex="0" aria-label="${esc(exercise.title)}图内填空，可横向查看">
   <div class="computer-figure-canvas" style="--figure-width:${width}px;--figure-min:${Math.min(width,680)}px">
    <img src="${figure.path}" width="${width}" height="${height}" loading="lazy" alt="${esc(exercise.title)}">
    ${blanks.join('')}${copies.join('')}
   </div>
  </div>
  <div class="computer-figure-speech-answer"></div>
  <figcaption><strong>${esc(exercise.title)}</strong><span>${esc(source.label)}</span><a href="${source.url}" target="_blank" rel="noopener">对照原页 ↗</a></figcaption>
 </figure>`;
}

function partHTML(part,weak,guide,figure,source){
 const runHTML=run=>{if(!run.blank)return C.html(run.text);const open=shown.has(run.blank),marked=weak.has(run.blank),label='第'+run.number+'空'+(open?'，点击收起答案':'，点击查看答案');return `<span class="computer-blank-unit"><button type="button" class="computer-blank ${open?'is-revealed':''}" data-computer-blank="${run.blank}" aria-label="${label}" aria-expanded="${open}" style="--blank-width:${Math.min(12,Math.max(2.8,run.text.length*.75+1.6))}em"><span class="blank-number">${String(run.number).padStart(2,'0')}</span><span class="blank-value">${open?C.html(run.text):'____'}</span></button><button type="button" class="computer-weak-toggle ${marked?'is-weak':''}" data-computer-weak="${run.blank}" aria-label="${marked?'取消':'标记'}第${run.number}空不太会" aria-pressed="${marked}" title="${marked?'取消不太会标记':'标记不太会'}"><span aria-hidden="true">${marked?'⚑':'⚐'}</span></button></span>`;};
 const blocks=displayBlocks(part,guide);
 const exercise=blocks.find(block=>block.kind==='figure-cloze');
 const visible=(...group)=>!onlyWeak||group.some(block=>block.runs.some(run=>run.blank&&weak.has(run.blank)));
 const conversion=blocks.findIndex(b=>b.runs.some(run=>run.blank==='computer-ch2-11-blank-36'));
 const ascii=blocks.findIndex(b=>b.runs.some(run=>run.blank==='computer-ch2-16-blank-14'));
 const tableStart=blocks.findIndex(b=>b.runs.some(run=>run.text==='进位制 二进制 八进制 十进制 十六进制')&&b.runs.some(run=>run.blank==='computer-ch2-11-blank-10'));
 const formulaStart=tableStart>=0?blocks.findIndex(b=>b.runs[0]?.text?.startsWith('任意一个r进制数N可表示为')):-1;
 const anchor = figure?.anchor
  ? blocks.findIndex(block => new RegExp(figure.anchor).test(block.runs.map(run => run.text).join('')))
  : -1;
 const markedContext = figure?.showWithMarkedContext && anchor >= 0 && visible(blocks[anchor]);
 const figureMarkup = exercise
  ? visible(exercise) && (figureClozeHTML(exercise,figure,source,runHTML)
    +(!onlyWeak?'<details class="computer-inline-answer"><summary>对照原图答案</summary>'+inlineFigureHTML(figure,source)+'</details>':''))
  : inlineFigureHTML(figure, source, markedContext);
 const paragraphs = blocks.map((b,index)=>{
  if(b===exercise)return '';
  if(conversion>=0&&index>=conversion-2&&index<=conversion){
   if(index!==conversion||!visible(b))return '';
   const digits=new Map();
   for(const cells of tableRows(b,runHTML)){
    const [,octal,binaryOctal,decimalHex,hex,binaryHex,upper,upperHex,upperBinary]=cells;
    digits.set(decimalHex,[decimalHex,octal,binaryOctal,hex,binaryHex]);
    if(upper)digits.set(upper,[upper,'—','—',upperHex,upperBinary]);
   }
   const rows=[...digits.values()].sort((a,b)=>Number(a[0])-Number(b[0]));
   return comparisonTable('十进制、八进制与十六进制换算',['十进制','八进制','二进制（按三位分组）','十六进制','二进制（按四位分组）'],rows,true);
  }
  if(ascii>=0&&index>=ascii-1&&index<=ascii){
   return index===ascii&&visible(b)?comparisonTable('ASCII 编码对照',['字符','二进制','十进制','十六进制'],tableRows(b,runHTML),true):'';
  }
  const truth=b.runs.find(run=>/^computer-ch2-13-blank-(12|14|18|20|22|26)$/.test(run.blank||''));
  if(blocks[index+1]?.runs.some(run=>/^computer-ch2-13-blank-(12|14|18|22|26)$/.test(run.blank||'')))return '';
  if(truth){
   if(!visible(b))return '';
   const labels={12:'逻辑非',14:'逻辑与',18:'逻辑或',20:'逻辑或（续）',22:'逻辑异或',26:'逻辑同或'};
   return comparisonTable(labels[truth.number]+'真值表',truth.number===12?['A','结果 F']:['A','B','结果 F'],tableRows(b,runHTML));
  }
  if(index===tableStart){
   if(!visible(...blocks.slice(index,index+8)))return '';
   const byNumber=new Map(blocks.slice(index,index+8).flatMap(row=>row.runs).filter(run=>run.blank).map(run=>[run.number,run]));
   const blank=n=>runHTML(byNumber.get(n));
   const rows=[
    ['进退位规则',...[0,1,2,3].map(i=>`逢${blank(10+i*2)}进 1<br>借 1 当${blank(11+i*2)}`)],
    ['基数',...[18,19,20,21].map(n=>'r = '+blank(n))],
    ['基本符号','0、1','0–7','0–9','0–9、'+blank(22)],
    ['位权',...[23,24,25,26].map(n=>blank(n)+'<sup>i</sup>')],
    ['字母标记',...['Binary','Octal','Decimal','Hexadecimal'].map((label,i)=>blank(27+i)+'<br><small>'+label+'</small>')]
   ];
   return comparisonTable('常用进位制对照',['项目','二进制','八进制','十进制','十六进制'],rows,true);
  }
  if(tableStart>=0&&index>tableStart&&index<=tableStart+8)return '';
  if(!onlyWeak&&index===formulaStart){
   return '<p class="cloze-paragraph">任意一个 r 进制数 N 可按位权展开。</p><div class="cloze-formula"><div>(N)<sub>r</sub> = a<sub>n−1</sub>r<sup>n−1</sup> + ⋯ + a<sub>0</sub> + a<sub>−1</sub>r<sup>−1</sup> + ⋯ + a<sub>−m</sub>r<sup>−m</sup><br>= ∑ a<sub>i</sub>r<sup>i</sup>（i 从 −m 到 n−1）</div></div>';
  }
  if(!onlyWeak&&formulaStart>=0&&index>formulaStart&&index<=formulaStart+8&&!b.runs.some(run=>run.blank))return '';
  if(!onlyWeak&&formulaStart>=0&&index===formulaStart+10&&b.runs.length===1&&b.runs[0].text.trim()==='𝑖')return '';
  if(!visible(b))return '';
  const proseFormula=b.kind==='formula'&&b.runs[0]?.text?.startsWith('数 。 例 如');
  const html=proseFormula?b.runs.map(run=>run.blank?runHTML(run):C.html(run.text.replace(/(?<=[\p{Script=Han}，。]) (?=[\p{Script=Han}，。])/gu,''))).join(''):b.runs.map(runHTML).join('');
  if(b.kind==='guide-heading')return `<h4 class="computer-guide-heading">${html}</h4>`;
  if(b.kind==='guide-point')return `<h5 class="computer-guide-point">${html}</h5>`;
  if(b.kind==='guide-bullet')return `<p class="computer-guide-bullet">${html}</p>`;
  if(b.kind==='case')return `<h4 class="cloze-case">${html}</h4>`;
  if(b.kind==='subheading'){
   const comma=b.runs.findIndex(run=>!run.blank&&run.text.includes('，'));
   if(comma>=0){
    const {text}=b.runs[comma],separator=text.indexOf('，');
    const heading=b.runs.slice(0,comma).map(runHTML).join('')+C.html(text.slice(0,separator));
    const body=C.html(text.slice(separator+1))+b.runs.slice(comma+1).map(runHTML).join('');
    return `<div class="computer-numbered-item"><h5 class="cloze-subheading">${heading.replace(/^01、(?=8、)/,'')}</h5><p class="cloze-paragraph">${body}</p></div>`;
   }
   return `<h5 class="cloze-subheading">${html}</h5>`;
  }
  if(b.kind==='formula'&&!proseFormula)return `<div class="cloze-formula"><small>公式 / 表格 · 可对照原页</small><div>${html}</div></div>`;
  return `<p class="cloze-paragraph">${html}</p>`;
 });
 if (figureMarkup) paragraphs.splice(anchor + 1, 0, figureMarkup);
 return paragraphs.join('');
}
function renderPart(chapterData,p,weak,sectionId){
 const section = chapterData.sections.find(item => item.id === sectionId);
 const source = {
  label: `第${chapterData.number}章 ${chapterData.title} · ${section.number} ${section.title} · 原 PDF 第 ${p.page} 页`,
  url: chapterData.pdf + '#page=' + p.page
 };
 return `<section class="computer-page-part" data-computer-page="${p.page}"><div class="computer-source-line"><span>原 PDF 第 ${p.page} 页</span><a href="${chapterData.pdf}#page=${p.page}" target="_blank" rel="noopener">对照原页 ↗</a></div><div class="computer-text">${partHTML(p,weak,sectionId.endsWith('-intro'),inlineFigures[sectionId+':'+p.page],source)}</div><details class="computer-original"><summary>查看原页图片 · 公式、表格与图示</summary><img src="${p.image}" loading="lazy" alt="第${chapterData.number}章原 PDF 第${p.page}页"></details></section>`;}
function reviewButton(section){
 const marked=entry(section.id).reviewed?.value===true;
 return `<button type="button" class="study-stamp computer-reviewed" data-computer-reviewed="${section.id}" aria-pressed="${marked}"><i aria-hidden="true">▣</i><span><strong>${marked?'已复习完':'标记已复习完'}</strong><small>${marked?'本节已盖章 · 点此取消':'复习完本节后点一下'}</small></span></button>`;
}
function bindReviewButtons(host){
 host.querySelectorAll('[data-computer-reviewed]').forEach(button=>button.onclick=async()=>{
  const id=button.dataset.computerReviewed,marked=button.getAttribute('aria-pressed')==='true';
  button.disabled=true;
  const saved=await update(id,{reviewed:{value:!marked,at:new Date().toISOString()}});
  if(!saved){button.textContent='保存失败，点击重试';button.disabled=false;return;}
  if(!button.isConnected)return;
  render();
  host.querySelector('[data-computer-reviewed="'+id+'"]')?.focus({preventScroll:true});
 });
}
function speechPages(section,options={},correction=''){
 return section.parts.map((part,index)=>{
  const tail=index===section.parts.length-1&&correction?'\n'+correction:'';
  const segments=[];
  let text='';
  for(const block of C.blocks(part,options)){
   for(const run of block.runs){
    if(run.blank){
     if(text.trim())segments.push({text});
     text='';
     segments.push({blank:run.blank,number:run.number,answer:C.spoken(run.text)});
    }else text+=C.spoken(run.text);
   }
   text+='\n';
  }
  text+=tail;
  if(text.trim())segments.push({text});
  return {page:part.page,text:C.text({...section,parts:[part]},shown,options)+tail,segments};
 });
}
function renderChapter(ch) {
 const host=$('computerSpecialView');
 const paper=host.querySelector('.computer-paper');
 paper.innerHTML=`<div class="computer-section-title"><span>第${ch.number}章 · 整章阅读</span><h3>${esc(ch.title)}</h3><p>${ch.sections.length} 节连续显示 · 点编号看答案，点旗标标记“不太会”。</p></div><div class="computer-cloze-toolbar" role="group" aria-label="整章答案"><div><button type="button" class="btn neutral" id="computerChapterShowAll">显示全章答案</button><button type="button" class="mini-link" id="computerChapterHideAll">遮住全章答案</button></div></div><div id="computerChapterSpeech"></div>
 ${ch.sections.map(section=>{const e=entry(section.id),weak=C.weakIds(section,e);return `<section class="computer-chapter-unit ${e.reviewed?.value?'is-reviewed':''}" id="computer-unit-${section.id}" data-computer-unit="${section.id}"><header><h4>${esc(section.number)} · ${esc(section.title)}</h4><div class="computer-unit-actions">${reviewButton(section)}<button type="button" class="mini-link" data-computer-detail="${section.id}">本节朗读与笔记 →</button></div></header>
 ${section.parts.map(part=>renderPart(ch,part,weak,section.id)).join('')}</section>`;}).join('')}`;
 window.ComputerSpeech.attachChapter(ch.number,ch.sections.map(section=>{
  return {
   id:section.id,
   title:section.title,
   get items(){return [section.title,C.text(section,shown)];},
   get pages(){return speechPages(section);}
  };
 }),$('computerChapterSpeech'));
 bindReviewButtons(host);
 host.querySelectorAll('[data-computer-section]').forEach(button=>button.onclick=()=>$(`computer-unit-${button.dataset.computerSection}`)?.scrollIntoView({block:'start'}));
 paper.querySelectorAll('[data-computer-detail]').forEach(button=>button.onclick=()=>{window.ComputerSpeech.cancel();wholeChapter=false;selected=button.dataset.computerDetail;render();window.scrollTo(0,0);});
 const chapterBlanks = new Map(ch.sections.flatMap(section=>C.blanks(section)).map(blank=>[blank.id,blank]));
 const answerButtons = paper.querySelectorAll('[data-computer-blank]');
 function setAnswer(button,open){
  const id=button.dataset.computerBlank;
  const run=chapterBlanks.get(id);
  if(!run||shown.has(id)===open)return;
  if(open)shown.add(id);else shown.delete(id);
  button.closest('.computer-figure-cloze')?.querySelectorAll('[data-computer-figure-mirror]').forEach(mask=>{
   if(mask.dataset.computerFigureMirror===id)mask.hidden=open;
  });
  button.classList.toggle('is-revealed',open);
  button.setAttribute('aria-expanded',String(open));
  button.setAttribute('aria-label','第'+button.querySelector('.blank-number').textContent+'空，'+(open?'点击收起答案':'点击查看答案'));
  button.querySelector('.blank-value').innerHTML=open?C.html(run.answer??run.text):'____';
 }
 answerButtons.forEach(button=>button.onclick=()=>{setAnswer(button,!shown.has(button.dataset.computerBlank));window.ComputerSpeech.syncBlankPrompt();});
 $('computerChapterShowAll').onclick=()=>{answerButtons.forEach(button=>setAnswer(button,true));window.ComputerSpeech.syncBlankPrompt();};
 $('computerChapterHideAll').onclick=()=>answerButtons.forEach(button=>setAnswer(button,false));
 $('computerChapterShowAll').disabled=$('computerChapterHideAll').disabled=!answerButtons.length;
 paper.querySelectorAll('[data-computer-weak]').forEach(button=>button.onclick=async()=>{
  const section=sectionById(button.closest('[data-computer-unit]').dataset.computerUnit),id=button.dataset.computerWeak;
  const record=entry(section.id),marked=!C.weakIds(section,record).has(id);
  button.disabled=true;
  try { if(await update(section.id,{weakBlanks:C.markWeak(section,record,id,marked).weakBlanks})){render();host.querySelector('[data-computer-weak="'+id+'"]')?.focus({preventScroll:true});} }
  finally {button.disabled=false;}
 });
}
function render(){const all=sections();if(!selected)selected=state().selected||all.find(s=>C.blanks(s).length)?.id||all[0].id;if(!all.some(x=>x.id===selected))selected=all[0].id;if(lastRendered!==selected){shown=new Set();lastRendered=selected;}chapter=D.chapters.findIndex(c=>c.sections.some(s=>s.id===selected));const c=D.chapters[chapter],section=c.sections.find(x=>x.id===selected),e=entry(selected),blanks=C.blanks(section),weak=C.weakIds(section,e),nav=onlyWeak?c.sections.filter(s=>C.weakCount(s,entry(s.id))):c.sections,index=nav.findIndex(s=>s.id===selected),visibleParts=section.parts.filter(p=>!onlyWeak||C.blocks(p,{onlyWeak:true,weakIds:weak}).length);
const paper=visibleParts.length?visibleParts.map(p=>renderPart(c,p,weak,section.id)).join(''):'<div class="computer-weak-empty"><strong>本节没有标记“不太会”的空。</strong><p>取消“本节只看不会”，可继续查看完整内容。</p></div>';
$('computerSpecialView').innerHTML=`<header class="computer-heading"><p class="eyebrow">COMPUTER STUDY</p><h2>计算机专项</h2><p>点击编号看答案 · 点旗标标记“不太会”，再集中复习</p></header><div class="computer-chapters">${D.chapters.map((ch,i)=>`<div class="computer-chapter-group"><button type="button" class="btn ${i===chapter?'primary':'neutral'}" data-computer-chapter="${i}">第${ch.number}章 · ${esc(ch.title)}</button><button type="button" class="mini-link computer-chapter-weak" data-computer-chapter-weak="${i}" ${chapterWeak(ch)?'':'disabled'}>本章不会 · ${chapterWeak(ch)} 空</button></div>`).join('')}</div><div class="computer-mode"><button type="button" class="btn neutral" id="computerMode">${wholeChapter?'切换单节精练':'查看整章知识点'}</button><span>${wholeChapter?'整章阅读':'单节精练'}</span></div><div class="computer-layout"><aside class="computer-index"><p>本章目录</p>${c.sections.map(s=>{const count=C.weakCount(s,entry(s.id));return `<button type="button" class="computer-section ${s.id===selected?'selected':''} ${entry(s.id).reviewed?.value?'is-reviewed':''}" data-computer-section="${s.id}"><span>${esc(s.number)}</span><strong>${esc(s.title)}</strong><small>${[entry(s.id).reviewed?.value?'✓ 已复习完':entry(s.id).read?'已读':'',count?'不会 '+count+' 空':''].filter(Boolean).join(' · ')}</small></button>`;}).join('')}<a href="${c.pdf}" target="_blank" rel="noopener">打开本章原 PDF ↗</a></aside><article class="computer-paper"><div class="computer-section-title"><span>第${c.number}章 / ${esc(section.number)}</span><h3>${esc(section.title)}</h3><p>来源：2026强化班讲义 · 原 PDF 第 ${[...new Set(section.parts.map(x=>x.page))].join('、')} 页</p></div>${reviewButton(section)}<div id="computerSpeechHost"></div>${D.errata.filter(x=>x.section===section.id).map(x=>`<aside class="computer-errata"><strong>原文核对 · ${esc(x.title)}</strong><p>${esc(x.text)}</p><a href="${x.url}" target="_blank" rel="noopener">核对标准依据 ↗</a></aside>`).join('')}<div class="computer-cloze-toolbar"><div><strong>${blanks.length?'本节 '+blanks.length+' 个空':'章节导读'}</strong><span>${blanks.length?'已看 '+shown.size+' 个 · 不太会 '+weak.size+' 个':'这一节没有填空，可直接阅读'}</span></div>${blanks.length?`<div><label class="computer-weak-filter"><input type="checkbox" id="computerOnlyWeak" ${onlyWeak?'checked':''}>本节只看不会</label><button type="button" class="btn neutral" id="computerShowAll" ${blanks.length?'':'disabled'}>显示本节答案</button><button type="button" class="mini-link" id="computerHideAll" ${blanks.length?'':'disabled'}>全部遮住</button></div>`:''}</div>${onlyWeak?'<p class="computer-filter-note">保留不会的空所在段落，方便结合上下文复习。标记不计错题次数，也不改变已读和听完记录。</p>':''}${paper}<label class="input-row"><span>本节笔记 · 自动保存</span><textarea id="computerNote" rows="3" placeholder="记下易混淆处或老师补充的内容"></textarea></label><div class="computer-bottom"><button class="btn neutral" id="computerPrev" ${index<=0?'disabled':''}>← ${onlyWeak?'上个不会小节':'上一节'}</button><button class="btn ${e.read?'neutral':'primary'}" id="computerRead">${e.read?'✓ 本节已读过':'标记本节已读过'}</button><button class="btn neutral" id="computerNext" ${index>=nav.length-1||!nav.length?'disabled':''}>${onlyWeak?'下个不会小节':'下一节'} →</button></div><p class="fine-note">已完整听完 ${e.plays.length} 次 · 已读过只作学习进度，不记为答题正确。</p><p id="computerSave" role="status">记录随整站备份一起保留。</p></article></div>`;
$('computerMode').onclick=()=>{window.ComputerSpeech.cancel();wholeChapter=!wholeChapter;onlyWeak=false;render();};
async function choose(id){if(!id)return;window.ComputerSpeech.cancel();selected=id;const saved=update(id,{});render();window.scrollTo({top:0,behavior:'auto'});return saved;}
document.querySelectorAll('[data-computer-chapter]').forEach(b=>b.onclick=()=>{onlyWeak=false;return choose(D.chapters[Number(b.dataset.computerChapter)].sections[0].id);});document.querySelectorAll('[data-computer-chapter-weak]').forEach(b=>b.onclick=()=>{const ch=D.chapters[Number(b.dataset.computerChapterWeak)],next=ch.sections.find(s=>C.weakCount(s,entry(s.id)));if(next){wholeChapter=false;onlyWeak=true;return choose(next.id);}});document.querySelectorAll('[data-computer-section]').forEach(b=>b.onclick=()=>choose(b.dataset.computerSection));$('computerPrev').onclick=()=>choose(nav[index-1]?.id);$('computerNext').onclick=()=>choose(nav[index+1]?.id);$('computerRead').onclick=async()=>{if(await update(section.id,{read:true}))render();};$('computerNote').value=e.note||'';$('computerNote').oninput=()=>update(section.id,{note:$('computerNote').value});
document.querySelectorAll('[data-computer-blank]').forEach(button=>button.onclick=()=>{const id=button.dataset.computerBlank;if(shown.has(id))shown.delete(id);else shown.add(id);render();document.querySelector('[data-computer-blank="'+id+'"]').focus({preventScroll:true});});document.querySelectorAll('[data-computer-weak]').forEach(button=>button.onclick=async()=>{const id=button.dataset.computerWeak,next=C.markWeak(section,entry(section.id),id,!C.weakIds(section,entry(section.id)).has(id));if(await update(section.id,{weakBlanks:next.weakBlanks})){render();(document.querySelector('[data-computer-weak="'+id+'"]')||$('computerOnlyWeak')).focus({preventScroll:true});}});if($('computerOnlyWeak'))$('computerOnlyWeak').onchange=ev=>{onlyWeak=ev.target.checked;render();};if($('computerShowAll'))$('computerShowAll').onclick=()=>{shown=new Set(blanks.map(b=>b.id));render();};if($('computerHideAll'))$('computerHideAll').onclick=()=>{shown.clear();render();};
if(wholeChapter){renderChapter(c);return;}
bindReviewButtons($('computerSpecialView'));
const correction=D.errata.filter(x=>x.section===section.id).map(x=>'原文核对。'+x.text).join('。');window.ComputerSpeech.attachText(section.id,section.title,C.text(section,shown,{onlyWeak,weakIds:weak})+(correction?'\n'+correction:''),$('computerSpeechHost'),async()=>{await update(section.id,{plays:[...entry(section.id).plays,new Date().toISOString()]});if(selected===section.id&&!$('computerSpecialView').classList.contains('hidden'))render();},speechPages(section,{onlyWeak,weakIds:weak},correction));}
window.ComputerSpecialUI={init:x=>api=x,render,merge};
})();
