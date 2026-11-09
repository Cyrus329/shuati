'use strict';
(() => {
 const sets = [
  { subject:'高等数学', title:'函数、极限与连续', material:'设 f(x) 在 x<0 时等于 (√(1+x)−1)/x，在 x=0 时等于 a，在 x>0 时等于 1/(2+x)。', parts:[
   ['定义域','写出 f 的定义域。','[−1,+∞)','根号要求 x≥−1；第一段本来就不含 0。其余两段覆盖 [0,+∞)。'],
   ['左右极限','求 x 趋于 0 时的左、右极限。','左、右极限都是 1/2。','左边分子有理化得到 1/(√(1+x)+1)，右边直接代入。'],
   ['连续性','求使 f 在 0 处连续的 a。','a=1/2','左右极限相等，所以只需令函数值等于共同极限。'],
   ['间断点','若 a=0，判断 0 的间断类型并说明原因。','可去间断点','极限存在且有限，函数值 0 不等于极限 1/2；改函数值即可连续。']
  ],challenge:['定义域、极限、连续与可导','令 a=1/2。只用差商求 0 处的左右导数，并判断是否可导。','左导数 −1/8，右导数 −1/4，不可导。','根号要求 x≥−1，三段合并得定义域 [−1,+∞)。左式有理化得 1/(√(1+x)+1)，左右极限均为 1/2，因此 a=1/2 时才连续。此时左、右差商的极限分别是 −1/8、−1/4，故不可导。']},
  { subject:'英语', title:'阅读、词义与翻译', material:'Last year, a library started lending tools to local residents. Many people borrowed them to repair things at home. The library also offered free workshops, which helped beginners use the tools safely.', parts:[
   ['阅读定位','What did the library lend, and why did many people borrow them?','It lent tools. Many people borrowed them to repair things at home.','第一句定位 tools，第二句用 to repair 表示目的。'],
   ['代词指代','What does “them” refer to?','The tools.','borrowed 的宾语回指前一句出借的物品。'],
   ['词义搭配','说明 lend 和 borrow 在文中各是谁的动作，并写出各自的介词搭配。','lend sth. to sb.；borrow sth. from sb.','出借人是图书馆，借入人是当地居民。'],
   ['句子翻译','翻译最后一句，明确 which 指什么。','图书馆还举办了免费培训活动，帮助初学者安全使用工具。','which 在这里指免费培训活动，后半句补充其作用。']
  ],challenge:['倒装改写','用 Not only 开头，写出“图书馆不仅出借工具，还举办了免费培训”。','Not only did the library lend tools, but it also offered free workshops.','Not only 位于句首且修饰第一个分句时，该分句用 did 倒装，lend 用原形。']},
  { subject:'计算机', title:'基础知识与操作系统', material:'图书馆用一台电脑采集 8 位无符号传感器数据，并将日志写入磁盘。某条记录的数据为 10101100₂。管理员使用 Windows 管理日志。', parts:[
   ['数制转换','将这条数据转换为十进制和十六进制。','172；AC','按位权展开得 128+32+8+4；分成 1010 和 1100 得 A 和 C。'],
   ['信息单位','仅算数据本身，1024 条这样的记录需要多少字节？','1024 字节，即 1 KiB。','8 位等于 1 字节，1024 条共 1024 字节。'],
   ['系统组成','指出传感器、处理器、磁盘在这个场景中的主要作用。','传感器采集并提供输入；处理器执行运算和控制；磁盘持久保存数据。','按数据的输入、处理、存储区分。'],
   ['文件管理','误删日志后，什么情况下能从回收站恢复？','日志仍在回收站里时，可以选中并还原到原位置。','若已清空或删除时绕过回收站，应另查备份等恢复方式。']
  ],challenge:['校验设计','给 10101100₂ 增加一位偶校验位。解释为什么无法发现任意两位翻转。','校验位为 0；两位翻转后 1 的个数奇偶性保持不变。','原数据有四个 1；两次翻转对奇偶性影响抵消。']}
 ];
 const examItems = [
  [
   ['函数 f(x) 的定义域为（　）。','[−1,+∞)','(−1,+∞)','[−1,0)∪(0,+∞)','(−∞,+∞)'],
   ['当 x 趋于 0 时，f(x) 的左、右极限依次为（　）。','1/2，1/2','1，1/2','−1/2，1/2','1/2，0'],
   ['若 f(x) 在 x=0 处连续，则 a=（　）。','1/2','0','1','−1/2'],
   ['当 a=0 时，x=0 是 f(x) 的（　）。','可去间断点','跳跃间断点','无穷间断点','连续点'],
   ['关于 f(x) 的定义域及其在 x=0 处的连续性、可导性，下列说法正确的是（　）。','定义域为 [−1,+∞)；a=1/2 时连续但不可导。','定义域为 (−1,+∞)；a=1/2 时连续但不可导。','定义域为 [−1,+∞)；a=0 时连续但不可导。','定义域为 [−1,+∞)；a=1/2 时连续且可导。']
  ],
  [
   ['Why did many residents borrow tools from the library?','To repair things at home.','To sell them online.','To lend them to the library.','To build a new library.'],
   ['What does “them” in the second sentence refer to?','Tools.','Residents.','Workshops.','Beginners.'],
   ['Residents can borrow tools _____ the library, which lends them _____ local people.','from; to','to; from','for; from','with; for'],
   ['下列哪项最符合末句的意思？','图书馆还举办免费培训活动，帮助初学者安全使用工具。','图书馆向参加培训的初学者收取工具使用费。','初学者举办了培训，教图书馆工作人员如何使用工具。','图书馆举办培训，是为了让初学者自己制造工具。'],
   ['Not only _____ tools, but it also offered free workshops.','did the library lend','the library did lend','did the library lent','the library lends']
  ],
  [
   ['二进制数 10101100 的十进制和十六进制表示分别为（　）。','172，AC','172，CA','170，AC','176，B0'],
   ['若每条记录只保存 8 位数据，1024 条记录占用的空间为（　）。','1024 字节','128 字节','1024 位','8192 字节'],
   ['在该系统中，负责执行运算和控制的部件是（　）。','处理器','传感器','磁盘','显示器'],
   ['误删的日志仍在 Windows 回收站中。要把它放回原位置，应选择（　）。','还原','清空回收站','刷新','属性'],
   ['对数据 10101100 添加一位偶校验位，校验位及两位同时翻转时的检出情况为（　）。','0，无法检出','1，无法检出','0，一定检出','1，一定检出']
  ]
 ];
 function examFields(index, part, challenge){
  const row = challenge ? 4 : part;
  const [stem, ...choices] = examItems[index][row];
  const answerIndex = (index + row + 1) % choices.length;
  const letters = 'ABCD';
  const options = Object.fromEntries([...letters].map((letter,i)=>[letter,choices[(i-answerIndex+choices.length)%choices.length]]));
  return {stem,options,type:'单选题',verifiedAnswer:letters[answerIndex],sourceAnswer:letters[answerIndex],autoGradeDisabled:false};
 }
 function section(q) {
  const topic = q.topic || '';
  if (q.subject === '高等数学') {
   if (/^极限·/.test(q.skillTag)) return '极限';
   if (/^(连续|间断)·/.test(q.skillTag)) return '连续与间断';
   if (/^函数·/.test(q.skillTag)) return '函数';
   if (/连续|间断/.test(topic)) return '连续与间断';
   if (/极限/.test(topic)) return '极限';
   return topic || q.section;
  }
  if (q.subject === '英语' && /名词|代词/.test(topic) && !/词义/.test(topic)) return '名词与代词';
  if (q.subject === '计算机') {
   if (/编码|数制|进制|单位/.test(topic)) return '进制、单位与编码';
   if (/Windows|操作系统/.test(topic)) return '操作系统与 Windows';
   if (/文化|应用|分类|基础知识/.test(topic)) return '计算机文化基础';
  }
  return topic || q.section;
 }
 function authored(subject, date, challenge) {
  const index = sets.findIndex(set => set.subject === subject);
  const set = sets[index];
  const label = challenge ? '选做挑战' : '章末综合 · ' + set.title;
  const parts = challenge ? [set.challenge] : set.parts;
  const records = parts.map(([point, , , analysis], i) => {
   const exam = examFields(index,i,challenge);
   return {
   ...exam,
   id:'CHAPTER-PRACTICE-'+index+'-'+(challenge?'C':i+1),
   subject, section:label, topic:set.title, point,
   stem:set.material+'\n\n'+(challenge?'选做挑战 · 拓展题':'第 '+(i+1)+' / '+parts.length+' 问')+'\n'+exam.stem,
   analysis,
   dailyNew:true, dailyDate:date, dailyRole:challenge?'challenge':'comprehensive',
   firstStatus:'未作答', custom:true, difficulty:challenge?'难':'中', source:'自编章节练习',
   batch:date+' · '+label, sourceImageRefs:[]
  };});
  records.forEach(record => { record.canonicalId=record.id; });
  return {records, group:{subject, section:label, ids:records.map(record=>record.id), mode:challenge?'challenge':'comprehensive'}};
 }
 function refreshUnanswered(q){
  const oldMathChallenge=q.id==='CHAPTER-PRACTICE-0-C'&&!q.stem.includes('连续性、可导性');
  if(!oldMathChallenge&&(!q.autoGradeDisabled||Object.keys(q.options||{}).length))return q;
  const match=/^CHAPTER-PRACTICE-([0-2])-(C|[1-4])$/.exec(q.id);
  if(!match)return q;
  const revised=authored(sets[Number(match[1])].subject,q.dailyDate,match[2]==='C').records.find(record=>record.id===q.id);
  return {...q,...revised};
 }
 window.ChapterPractice={sets, section, authored, refreshUnanswered};
})();

