'use strict';
(()=>{
const specs={
'高等数学':[
['一元函数定义域','函数'],['函数表达式及其函数值','函数'],['函数的基本概念与相等','函数'],['函数值域','函数'],['反函数','函数'],['函数奇偶性','函数'],['函数单调性','函数'],['函数周期性','函数'],['分段函数与图像','函数'],['复合函数及其分解','函数'],['函数有界性','函数'],['二元函数定义域','多元函数'],['集合与集合运算','预备知识'],['积分求原函数','积分'],['极限与连续','极限'],['导数与微分','导数'],['综合考点待细分','待细分']],
'计算机':[
['计算机发展与历史','计算机基础'],['计算机发展趋势','计算机基础'],['计算机分类','计算机基础'],['计算机性能指标','计算机基础'],['计算机特点','计算机基础'],['计算机应用领域','计算机基础'],['数制与进制运算','信息表示'],['信息存储单位与容量','信息表示'],['信息编码','信息表示'],['硬件系统与存储器','计算机系统'],['软件系统与操作系统','计算机系统'],['系统组成与工作原理','计算机系统'],['计算思维','计算思维'],['Windows基本操作','操作系统'],['Windows文件管理','操作系统'],['信息与数据','计算机基础'],['综合考点待细分','待细分']],
'英语':[
['可数与不可数名词','名词'],['名词单复数','名词'],['名词所有格','名词'],['名词作定语与复合形容词','名词'],['名词词义辨析','词汇'],['人称代词与物主代词','代词'],['反身代词与相互代词','代词'],['指示代词与比较替代','代词'],['不定代词与数量限定','代词'],['疑问代词与疑问短语','代词'],['冠词','冠词与数词'],['数词','冠词与数词'],['介词与固定搭配','词汇与搭配'],['名词性从句','从句'],['定语从句','从句'],['状语从句','从句'],['词性与句型结构','语法结构'],['阅读理解','阅读'],['听力理解','听力'],['时态与语态','动词'],['非谓语动词','动词'],['主谓一致','语法结构'],['形容词与副词','语法结构'],['英译汉与句子翻译','翻译'],['it的形式主语与形式宾语','代词'],['综合考点待细分','待细分']]
};
const chinese=n=>n<=10?['','一','二','三','四','五','六','七','八','九','十'][n]:n<20?'十'+chinese(n-10):chinese(Math.floor(n/10))+'十'+(n%10?chinese(n%10):'');
function classify(q){const subject=q.subject||'未分学科',p=String(q.point||''),t=String(q.topic||''),stem=String(q.stem||'');let index;
if(subject==='高等数学'){
 index=/积分|由f[′']及初值|给定f[′']求f/.test(p)?13:/二元|多元/.test(p)?11:/集合/.test(p+' '+t)?12:/判断.*相等|同一函数|函数相等|函数的.*概念/.test(p)?2:/反函数|反解.*函数/.test(p)?4:/值域/.test(p)?3:/奇偶|奇函数|偶函数/.test(p)?5:/周期/.test(p)?7:/单调/.test(p)?6:/有界/.test(p)?10:/定义域|分母|底数限制|反推定义域|根式与分母限制|反三角与分母根式/.test(p)?0:/分段|绝对值写|图像/.test(p)&&!/求值|代入|计算|复合/.test(p)?8:/拆分|分解|复合函数可行性/.test(p)?9:/极限|连续|间断/.test(p+' '+t)?14:/导数|微分/.test(p+' '+t)?15:/函数|代入|换元|解析式|表达式|三角|含参多项式|根式/.test(p+' '+t)?1:16;
}else if(subject==='计算机'){
 index=/发展趋势/.test(p)?1:/计算机分类/.test(p)?2:/性能指标/.test(p)?3:/计算机特点/.test(p)?4:/应用|人工智能|多媒体/.test(p)?5:/计算思维/.test(p+' '+t)?12:/Windows/.test(p+' '+t)?(/文件|文件夹|通配符|扩展名|路径|回收站/.test(p+' '+stem)?14:13):/信息与数据/.test(p)?15:/数制|编码/.test(p+' '+t)?(/ASCII|Unicode|UTF|汉字|编码|原码|反码|补码/.test(stem)?8:/字节|存储单位|容量|多少位|多少个二进制/.test(stem)?7:6):/存储器|硬件/.test(p)?9:/软件|操作系统/.test(p)?10:/系统组成/.test(p)?11:/发展|文化|历史/.test(p)?(/存储程序|程序控制|工作原理|二进制|运算器|控制器|CPU/.test(stem)?11:0):16;
}else if(subject==='英语'){
 index=/英译汉|汉译英|句子翻译/.test(p)?23:/形式宾语|形式主语/.test(p)?24:/阅读/.test(t+' '+p)?17:/听力/.test(t+' '+p)?18:/时态|语态|完成进行时|完成时/.test(p+' '+t)?19:/非谓语/.test(p+' '+t)?20:/定语从句|关系代词|whose|to whom/.test(p)?14:/主语从句|宾语从句|表语从句|同位语从句|名词性从句/.test(p)?13:/状语从句|让步|such\.\.\.that/.test(p)?15:/所有格/.test(p)?2:/名词作定语|复合形容词|woman作定语|年龄段/.test(p)?3:/物主代词|人称代词|主格|宾格/.test(p)?5:/反身|相互代词|oneself/.test(p)?6:/比较.*替代|指示代词|比较结构|one替代|it指代/.test(p)?7:/不定代词|数量限定|两者|some.*others|neither|none|little|much表示|anybody|somebody|anyone|everyone|other与others/.test(p)?8:/疑问代词|疑问短语/.test(p)?9:/冠词/.test(p+' '+t)?10:/数词/.test(p+' '+t)?11:/固定|搭配|介词/.test(p)?12:/不可数|可数性|可数名词/.test(p)?0:/单复数|复数|量词/.test(p)?1:/名词|词义辨析/.test(p)?4:/主谓一致/.test(p)?21:/形容词|副词|比较级|最高级/.test(p)?22:/词性|句型|结构|从句/.test(p)?16:25;
}
const rows=specs[subject]||[['综合考点待细分','待细分']],rank=index===undefined?0:index,row=rows[rank]||rows.at(-1),bookNumber=subject==='计算机'?({'计算机性能指标':'1.1.5','信息编码':'1.3.2'})[row[0]]||null:null;
return {id:subject+':'+rank,subject,chapter:row[1],point:row[0],rank,number:rank+1,label:'知识点'+chinese(rank+1)+' · '+row[0],bookNumber,source:'依据现有题目考点归纳，编号为本程序整理序号'};
}
function build(questions,eventsOf=q=>q.events||[],wrongOf=()=>0){const groups=new Map(),seen=new Set();for(const q of questions){if(seen.has(q.id))continue;seen.add(q.id);const events=eventsOf(q);if(!events.length)continue;const point=classify(q);if(!groups.has(point.id))groups.set(point.id,{...point,total:0,right:0,wrong:0,uncertain:0,disputed:0,recordOnly:0,corrected:0,errors:0,regressions:0,questions:[]});const g=groups.get(point.id),last=events.at(-1);g.total++;g[last.result==='已订正'?'corrected':last.result==='原答未留存'?'recordOnly':last.result==='会了'?'right':last.result==='不会'?'wrong':last.result==='题源问题'?'disputed':'uncertain']++;g.errors+=Math.max(0,Number(wrongOf(q))||0);let right=false,regression=false;for(const e of events){if(e.result==='会了')right=true;else if(e.result==='不会'&&right)regression=true;}if(regression)g.regressions++;g.questions.push(q.id);}return [...groups.values()].sort((a,b)=>['高等数学','英语','计算机'].indexOf(a.subject)-['高等数学','英语','计算机'].indexOf(b.subject)||a.rank-b.rank);}
const api={classify,build};if(typeof module!=='undefined')module.exports=api;if(typeof window!=='undefined')window.KnowledgeCore=api;
})();
