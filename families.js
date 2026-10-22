'use strict';
(() => {
  const clean=s=>String(s||'').replace(/⁻¹/g,'^{-1}').replace(/[²³⁴ˣ]/g,c=>({'²':'^2','³':'^3','⁴':'^4','ˣ':'^x'}[c])).normalize('NFKC').replace(/[−–]/g,'-').replace(/\s+|\\left|\\right|\\[,;!]|\\[()[\]]/g,'').toLowerCase();
  const hash=s=>{let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return (h>>>0).toString(36);};
  const template=q=>clean(q.stem).replace(/【[^】]*】/g,'').replace(/(?:\d+\.)?\d+/g,(n,offset,text)=>text[offset-1]==='^'?n:'#').replace(/[，。,:：;；]/g,'');
  const make=(q,name,method,trap,scope='',confirmed=true)=>({id:'F-'+hash(q.subject+'|'+name+'|'+scope),name,method,trap,scope,confirmed,template:template(q),subject:q.subject,topic:q.topic||'未分类'});
  const single=(q,reason='本题的条件或问法单独保留')=>make(q,q.point||'独立题型','对照本题完整条件与答案复习。',reason,q.canonicalId||q.id,false);
  const polarity=q=>q.type==='判断题'?'判断陈述':q.type==='多选题'?'多项辨认':/错误|不正确|不属于|不包括|不能|不影响/.test(q.stem)?'辨认错误项':'直接辨认或回忆';
  function math(q){
    const s=clean(q.stem),p=q.point||'',t=s+'|'+p,opts=Object.values(q.options||{}).join(' ');
    const mode=/下列|以下.*函数/.test(q.stem)&&Object.keys(q.options||{}).length?'多式辨认':'单式求解';
    const result=(name,method,trap,scope='')=>make(q,name,method,trap,scope);
    if(/集合/.test(p)){
      if(/交|并|∩|∪/.test(t))return result('集合运算：交集与并集','在数轴上分别取公共部分与覆盖范围。','开闭端点与空集情形单独核对。',clean(q.stem).replace(/\d+/g,'#').replace(/[a-z]/g,'v'));
      return single(q);
    }
    if(/定义域/.test(t)&&!/反函数|奇偶|奇函数|偶函数|同一函数|函数相等|函数是否相等/.test(p)&&!/反函数|奇偶性/.test(q.stem)){
      const abstract=/f\([^)]+\).*定义域/.test(s)&&!/f\(x\)=/.test(s)&&!/^函数[fy]=/.test(s);
      if(abstract&&(/已知|设|若|定义域为/.test(s))){
        const calls=[...s.matchAll(/f\(([^()]*)\)/g)].map(x=>x[1]);
        if(calls.length>=2){
          const nontrivial=calls.filter(x=>x!=='x');
          const fn=nontrivial.join('|');
          const transform=/ln|lg|log/.test(fn)?'对数内层':/\^\{?-?x/.test(fn)?'指数内层':/\^/.test(fn)?'幂内层':/frac|\//.test(fn)?'分式内层':'一次内层';
          const direction=calls[0]==='x'?'已知原函数求复合':calls.at(-1)==='x'?'已知复合反推原函数':'两次复合之间转换';
          const count=nontrivial.length>1?'多项求交':'单项';
          const interval=s.match(/([\[(])[-+\d/]+,[-+\d/]+([\])])/);
          const scope=(/\ba\b|参数/.test(s)?'含参数':'无参数')+(interval?'·端点'+interval[1]+interval[2]:'');
          const r=result(`抽象定义域：${direction}·${transform}·${count}`,'先确定原函数允许的自变量范围，再把相应内层整体放入该范围求解。','求内层的原像与把区间映到内层的像不同；多项条件须求交。',scope);
          r.canAutoHide=count==='多项求交'&&direction==='已知原函数求复合'&&nontrivial.every(x=>/^x[-+]\d+\/\d+$/.test(x))&&!/参数|附加|非零/.test(s);return r;
        }
      }
      if(/f\(/.test(s)&&!/f\(x\)=/.test(s)&&!/^[^=]*y=/.test(s))return single(q,'抽象内层或多层括号单独保留');
      if(mode==='多式辨认')return single(q,'选项含多个表达式，不能仅按“定义域”合并隐藏');
      if(/参数|判别式|恒非负|全体|为r|ℝ|mathbbr/.test(t)&&/[ma]/.test(s))return result('定义域含参数：二次式恒非负','先分二次项系数为零与不为零两种情况，再用开口及判别式条件。','恒非负与恒正不同；退化为一次式或常数不能漏掉。',s.includes('>0')?'严格为正':'非负或全实数');
      const features=[];
      if(/二元|[xy].*[xy]/.test(p)||s.includes('z='))features.push('二元');
      const cubic=/∛|sqrt\[3\]/.test(s);
      const roots=(s.match(/√|sqrt(?!\[3\])/g)||[]).length;
      if(roots)features.push((roots>1?'多根式':'偶次根式')+(/²|\^\{?2/.test(s)?'·二次被开方式':''));
      if(cubic)features.push('奇次根式');
      if(/arcsin|arccos|反正弦|反余弦/.test(s))features.push('反正弦或反余弦');
      if(/arctan|反正切/.test(s))features.push('反正切');
      if(/ln|lg|log/.test(s))features.push(((s.match(/ln|lg|log/g)||[]).length>1?'多项':'')+'对数');
      if(/frac|\//.test(s))features.push('分母限制');
      if(/sin|cos|tan/.test(s.replace(/arc(?:sin|cos|tan)/g,'')))features.push('三角');
      if(/e\^|eˣ|\d\^x/.test(s))features.push('指数');
      if(/分段|cases/.test(t))features.push('分段取并');
      if(!features.length)return single(q);
      const label=features.join('＋');
      const r=result('直接求定义域：'+label,'分别列出根式、对数、分母和反三角函数的存在条件，再求交；分段函数按各段取并。','分母中的根式要求严格大于零；对数作分母还要排除真数等于1。',/底数|log_/.test(s)?'另含底数条件':'常规定义条件');
      r.canAutoHide=features.length===1&&['对数','偶次根式'].includes(features[0])&&!/参数|底数|log_|\^|附加|非零|且|≠/.test(s);return r;
    }
    if(/同一函数|函数相等|函数是否相等|两个函数.*相等/.test(t))return result('判断同一函数：定义域与对应关系','同时核对定义域与化简后的对应关系。','约分、平方与开方可能改变定义域或符号。',mode);
    if(/反函数/.test(t)){
      if(/图像|图象|坐标|点交换/.test(t))return result('反函数：图像与坐标交换','交换横纵坐标，并核对原函数定义域和值域。','不是关于原点或坐标轴对称。');
      if(/分段|cases/.test(t))return single(q,'分段反函数须保留各段限制');
      const kind=/arcsin|arccos|arctan|sin|cos|tan|三角/.test(t)?'三角与反三角':/ln|lg|log|e\^|指数|对数/.test(t)?'指数与对数':/sqrt|√|根式|\^\{?\d/.test(t)?'根式或幂函数':/frac|\//.test(s)?'有理分式':'一次式';
      const goal=/求值|f\^\{-1\}\([^x]|反函数值域/.test(t)?'求值或范围':'求解析式';
      const cube=/f\(x\)=x\^\{?3\}?[-+]\d+/.test(s)&&/g\(\d+\)/.test(s)&&!/附加|参数/.test(s);
      const r=result(cube?'反函数：三次平移求反函数值':`反函数：${kind}·${goal}`,'把y=f(x)反解为x关于y的式子，再交换字母，写出反函数定义域。','原值域变成反函数定义域；根式和三角函数必须保留单调区间。',/定义域|值域|区间|le|ge|≤|≥/.test(s)?'另需范围限制':'只求表达式');r.canAutoHide=cube;return r;
    }
    if(/奇偶|奇函数|偶函数|对称轴|关于.*对称/.test(t)){
      if(/周期/.test(t))return result('奇偶性与周期：函数关系推导','先用奇偶关系改写自变量，再组合平移关系得到周期。','不要把一次平移直接当成一个周期。');
      if(/参数|\ba\b|系数/.test(p))return result('奇偶性：含参条件','比较f(-x)与±f(x)，先核对定义域关于原点对称。','定义域对称是必要条件，不能只比较式子。');
      if(/构造|f\(-x\)|f\(x\)f|乘积/.test(t))return result('奇偶性：抽象关系与构造','利用已知奇偶关系或给定方程比较新函数在x与-x处的值。','乘积与和差的奇偶规律不同；无已知奇偶条件时不能套用。',/乘|f\(x\)f/.test(t)?'乘积关系':'和差或分式构造');
      if(/f\(-\d|f\(−|函数值/.test(t)&&!/=/.test(s))return result('奇偶性：由已知函数值求值','奇函数用f(-x)=-f(x)，偶函数用f(-x)=f(x)。','先确定奇偶性，再确定负号。');
      if(mode==='多式辨认'||/下列.*(?:奇函数|偶函数)|下列为.*函数/.test(q.stem))return single(q,'不同候选函数可能引入不同定义域和运算陷阱');
      const kind=/ln|lg|log/.test(s)?'含对数':/e\^|eˣ|aˣ|a\^/.test(s)?'含指数':/sin|cos|tan/.test(s)?'含三角函数':'代数式';
      const logratio=/ln|lg/.test(s)&&/1\+x/.test(s)&&/1-x/.test(s)&&!/e\^|a\^|sin|cos|附加|参数/.test(s);
      const r=result(logratio?'奇偶性：对称一次分式的对数':'奇偶性：单式判断·'+kind,'核对定义域关于原点对称，计算并化简f(-x)与f(x)比较。','必须同时检查定义域；出现根式和绝对值时不能随意消去符号。',/sqrt|√|根式|∛/.test(s)?'另含根式':/frac|\//.test(s)?'含分式':'无分式根式');r.canAutoHide=logratio;return r;
    }
    if(/分段|cases|max|绝对值写/.test(t)){
      const kind=/反函数/.test(t)?'反函数':/定义域/.test(t)?'定义域':/值域/.test(t)?'值域':/max|绝对值写/.test(t)?'改写分段式':/迭代|多层|复合/.test(t)?'复合求值':'直接求值';
      return result('分段函数：'+kind,'每一次代入都先确定自变量落在哪个分支，分层向外计算。','上一层结果才是下一层的自变量；端点应按原不等号判断。',/max/.test(t)?'max':/绝对值/.test(t)?'绝对值':'按给定分支');
    }
    if(/拆分|分解/.test(p)&&/复合/.test(t))return result('复合函数：拆分内外层','从最外层运算向内识别，逐层命名内层变量。','外层函数不能把内层变量原样重复带入。',/复杂|嵌套|多层/.test(p)?'多层':'两层');
    if(/求解析式|换元|代换|函数表达式|反解复合|求内层|求g\(x\)/.test(t)){
      if(/方程|f\(x\).*f\(|抽象函数/.test(t))return single(q,'抽象函数方程可能需要配凑或联立，不按普通换元隐藏');
      const kind=/x\+1\/x|x\+\\frac1x|x\+\\frac\{1\}\{x\}/.test(s)?'x+1/x整体':/sqrt|√|根式/.test(t)?'根式内层':/sin|cos|tan|三角/.test(t)?'三角内层':/ln|lg|log|e\^|eˣ|指数|对数/.test(t)?'指数或对数内层':/frac|1\/x/.test(s)?'分式内层':'一次内层';
      return result('换元求解析式：'+kind,'设内层整体为t，反解x并代回右侧，再还原函数自变量。','同时保留新变量取值范围；不能直接把内层中的x当成最终自变量。',/求值|和f\(|f\(2x\)|f\(1\)/.test(t)?'另需代入求值':'只求f(x)');
    }
    if(/周期/.test(t))return result('周期：'+(/正切|tan/.test(t)?'正切':/三角|sin|cos/.test(t)?'正弦或余弦':'抽象函数关系'),'先识别基本周期，再考虑自变量系数；抽象函数用关系迭代。','周期与最小正周期不能混同，和函数需取公共周期。',/和|\+/.test(s)?'组合式':'单一关系');
    if(/单调/.test(t))return result('单调性：'+(/平移/.test(t)?'区间平移':/抽象/.test(t)?'抽象关系':'由表达式判断'),'结合定义区间与内外层单调性判断；平移时反解内层区间。','内层递减会改变复合函数的增减性。',mode);
    if(/值域/.test(t))return single(q,'值域的函数形式及端点条件不同，先保留独立');
    return single(q);
  }
  const computerRules=[
    ['图灵机：纸带与读写头',/图灵机.*(?:组成|纸带|读写头)/,'区分理论模型的纸带、读写头与移动规则。','图灵机不是为了某次军事破译专门设计的实体计算机。'],
    ['图灵：计算机科学奠基人',/(计算机科学.*奠基人|人工智能.*先驱)/,'题干问人物时辨认图灵；问贡献时分别记图灵机与图灵测试。','人物与贡献的问法分开。'],
    ['图灵测试：行为判别与边界',/图灵测试/,'依据隔离对话能否区别人和机器理解测试。','通过测试不等于证明具备真正的通用智能。'],
    ['图灵奖：计算机界的诺贝尔奖',/图灵奖/,'辨认奖项、领域和称号。','奖项与图灵测试不同。'],
    ['信息论：香农',/信息论/,'把信息论与香农对应。','不要与图灵或冯·诺依曼混淆。'],
    ['存储程序：提出者',/(?:提出|科学家|谁).*(?:存储程序)|存储程序.*(?:提出|科学家|谁)/,'辨认存储程序原理的提出者。','提出者与计算机科学奠基人不是同一问法。'],
    ['存储程序：自动运行基础',/自动运行.*基于|自动运行.*原理/,'自动执行程序依赖预先存储程序。','采用二进制与存储程序的作用不同。'],
    ['冯·诺依曼结构：核心原理',/基本工作原理|体系结构.*核心|存储程序控制原理|工作原理.*存储/,'把程序与数据存入存储器，并按指令顺序或控制转移执行。','基本原理不等于只有二进制表示。'],
    ['计算机分代：划分依据',/划分.*依据|划代.*原则|阶段.*物理器件|分代.*依据/,'按主要逻辑元件划分各代。','不是按速度、容量或程序语言直接划代。'],
    ['计算机分代：各代逻辑元件',/第[一二三四1-4]代.*(?:元件|器件)|(?:元件|器件).*第[一二三四1-4]代/,'电子管→晶体管→中小规模集成电路→大规模、超大规模集成电路。','按题目所问的具体代数对应元件。'],
    ['ENIAC：诞生时间',/ENIAC.*(?:诞生|1946|时间)/i,'辨认ENIAC诞生年代；多空题逐空作答。','若同时问逻辑元件，不能只记年份。'],
    ['商用计算机：UNIVAC',/第一款商用|首款商用|UNIVAC/i,'按教材区分商用计算机UNIVAC与早期试验机。','商业化标志与首台电子计算机不是同一概念。'],
    ['分析机：现代通用计算机雏形',/雏形|巴贝奇|babbage/i,'辨认巴贝奇分析机与现代通用计算机雏形的对应。','不要把分析机当成电子计算机。'],
    ['ENIAC与EDVAC：结构辨析',/ENIAC|EDVAC/i,'分别核对进制、存储程序、逻辑元件与研制目的。','综合辨析题须逐项核对，保留不同问法。'],
    ['计算机分类：按处理对象',/处理对象|数字计算机.*模拟计算机|模拟计算机.*数字计算机/,'按数据表示与处理对象区分数字、模拟和混合计算机。','用途分类与处理对象分类不同。'],
    ['计算机分类：按用途',/专门.*用途|专用计算机|通用计算机|从计算机的用途|按照.*用途/,'按用途区分通用机和专用机。','专用强调任务针对性，不等于处理对象为模拟量。'],
    ['计算机分类：服务器',/对外提供服务|服务器/,'识别面向网络用户提供服务的服务器。','工作站与服务器的定位不同。'],
    ['嵌入式与单片机',/嵌入式|单片机|同一芯片|数量上超过/,'区分嵌入式软硬件一体化与单片机的单芯片集成。','嵌入式系统不都等同于单片机。'],
    ['微型计算机：移动设备类别',/微型计算机.*(?:种类|包括)|平板电脑|智能手机/,'辨认桌面、笔记本、平板及移动设备。','手机也是微型计算机的一种形态。'],
    ['主频：单位与含义',/主频|时钟频率/,'区分频率单位Hz与每秒指令数。','MIPS不是主频单位；主频也不是全部性能。'],
    ['运算速度：MIPS等指标',/MIPS|FLOPS|运算速度.*单位|单位.*运算速度/i,'识别每秒指令数与浮点运算次数等量纲。','运算速度与字长、存储容量不是同一指标。'],
    ['字长：位数、精度与字节换算',/字长|一次.*字节|计算精度.*指标/,'字长以位为单位，字节数=位数÷8；据题意区分精度与处理宽度。','字长不是可处理整数的全部长度上限。'],
    ['可靠性：MTBF等指标',/可靠性|MTBF|MTTR/i,'辨认可靠性相关指标，核对单位与含义。','性能速度指标不等于可靠性指标。'],
    ['计算机应用：辅助系统缩写',/CAD|CAM|CAE|CAI|CIMS|辅助设计|辅助制造|辅助教学|集成制造/i,'逐个对应辅助设计、制造、工程、教学及集成制造的缩写。','同是辅助系统，缩写与用途仍须分别记。'],
    ['计算机应用：领域判定',/科学计算|数值计算|数据处理|信息处理|过程控制|自动控制|人事档案|工资|图书.*检索|天气预报|流水线/,'根据任务目标区分数值计算、信息加工与实时控制。','同一场景可涉及多个领域；多领域问法单独保留。'],
    ['人工智能：识别与推理应用',/人工智能|人脸识别|语音识别|机器翻译|专家系统|机器人|深蓝|推荐系统|车牌识别/,'根据识别、推理和学习任务判断人工智能应用。','自动控制或普通信息管理不一定属于人工智能。'],
    ['ASCII：字符编码',/ASCII|美国信息交换/i,'先辨认字符，再按编码顺序、大小写差32等规则计算。','数字字符与整数数值不同；控制字符须单独记。'],
    ['汉字编码：区位、国标与机内码',/区位码|国标码|机内码/,'区位的两个十进制数分别转十六进制后加20H得国标，再加80H得机内码。','区位的十进制值不能直接当十六进制加法。'],
    ['点阵与字形：容量计算',/点阵|字形码|汉字字库|字模/,'单色点阵容量=字数×行数×列数÷8字节。','位与字节不同；点阵缩放性质与容量计算分开。'],
    ['机器数：原码、反码、补码',/补码|反码|原码/,'先辨认符号位和位宽，再按所问方向转换。','正数三种码相同；负数转换和求真值的方向不同。'],
    ['数制：位权与进制转换',/二进制|八进制|十六进制|位权|R进制|[₀-₉]/,'按基数和位权展开，或按分组规则在二进制与八、十六进制间转换。','整数与小数的位权不同；尾部添零要先看小数点。'],
    ['总线：数据、地址与控制',/总线/,'分别对应数据传送、寻址与控制信号。','数据总线宽度与地址总线宽度的含义不同。'],
    ['存储器：层次与读写特性',/存储器|存储媒体|RAM|ROM|CACHE|硬盘|软盘|优盘|U盘/i,'按内外存、易失性、读写与速度层次区分。','断电保持、写保护与CPU直接访问是不同问题。'],
    ['语言处理：编译、解释与汇编',/编译|汇编|解释|目标程序|源程序|高级语言|机器语言|\.EXE|\.OBJ/i,'根据源语言及是否生成目标文件判断编译、解释、汇编和链接。','目标文件不一定能独立执行。'],
    ['操作系统：资源管理与用户接口',/操作系统.*(?:主要功能|接口)|用户和计算机|操作系统是/,'把资源管理和向用户提供接口与语言翻译区分。','语言处理程序不等于操作系统。'],
    ['计算思维：抽象与自动化',/抽象|自动化|计算思维/,'按具体问法区分本质、方法、适用人群及可计算性。','一个知识点下的不同任务保留为不同题型。'],
    ['可计算性：理论可解与现实可行',/可计算|停机问题|复杂性|复杂度/,'区分可计算性、时间/空间复杂性与实际资源限制。','理论可计算不代表在现实中能高效完成。'],
  ];
  function computer(q){
    const raw=q.stem||'',s=clean(raw),point=q.point||'',mode=polarity(q);
    if(/溢出|指令流水线/.test(raw))return single(q,'运算范围或指令执行的问题单独保留');
    const out=(name,method,trap,scope='')=>make(q,name,method,trap,mode+'|'+scope);
    if(/windows|回收站|剪贴板|快捷|通配符|文件夹|扩展名|任务管理器|资源管理器|printscreen|printscreen/.test(s.replace(/printscreen/g,'printscreen'))){
      const rules=[
        ['回收站：还原与删除',/回收站/,'区分还原、普通删除、彻底删除及硬盘存放位置。','还原命令与打开命令不同。'],
        ['剪贴板：位置与复制操作',/剪贴板/,'区分内存中的剪贴板与硬盘中的回收站，辨认复制、剪切的效果。','屏幕截图和复制文字的快捷键问法单独保留。'],
        ['截图快捷键：全屏与活动窗口',/printscreen|printscreen|printscreen/i,'全屏用Print Screen，活动窗口用Alt+Print Screen。','全屏与活动窗口不能合并记一个按键。'],
        ['文件选择：连续与非连续',/选择.*文件|选.*连续|ctrl.*单击/i,'连续选择用Shift，非连续选择用Ctrl。','要区分是否连续。'],
        ['文件搜索：通配符',/搜索|通配符|查找/,'?匹配一个字符，*匹配任意个字符；按文件名与扩展名分别构造。','固定位置、长度与扩展名条件不同。'],
        ['文件名、扩展名与路径',/扩展名|文件名|文件的名称|路径/,'按文件名合法字符、扩展名及绝对路径分别判断。','更改扩展名不等于转换文件内容。'],
        ['任务管理器：调用与结束任务',/任务管理器|ctrl.*delete/i,'区分直接打开任务管理器与经安全选项间接进入。','Ctrl+Shift+Esc与Ctrl+Alt+Delete入口不同。'],
        ['资源管理器：目录树与文件组织',/资源管理器|树形|目录树/,'左侧目录树、右侧当前目录内容，文件系统层级按树理解。','左右区域与存储位置不要混淆。'],
        ['窗口：最小化、移动与调整',/窗口|最小化|标题栏/,'区分最小化、最大化、移动与边框调整。','最小化不会停止程序；边角与标题栏操作不同。'],
        ['Windows设置与账户',/账户|控制面板|系统设置|屏幕保护/,'按账户类型或具体设置入口辨认。','账户类型与多用户同时会话不同。'],
        ['快捷方式与桌面图标',/快捷方式|桌面|图标/,'快捷方式是指向目标的入口，桌面文件仍在磁盘目录中。','删除快捷方式不等于删除目标。'],
      ];
      for(const [name,re,method,trap] of rules)if(re.test(s)){
        // 同一功能下仍按具体任务细分，不把位置、命令和快捷键互相替代。
        const target=/PrintScreen|printscreen|print screen/i.test(raw)?(/alt/i.test(raw)?'活动窗口':'全屏'):/还原|恢复/.test(raw)?'恢复命令':/彻底/.test(raw)?'彻底删除':/连续/.test(raw)?(/非连续|不连续/.test(raw)?'非连续选择':'连续选择'):/内存|硬盘|区域|位置/.test(raw)?'存放位置':/快捷键|组合键/.test(raw)?'快捷键':clean(raw).replace(/\d+/g,'#');
        return out(name,method,trap,target);
      }
      return single(q);
    }
    for(const [name,re,method,trap] of computerRules)if(re.test(raw)){
      let detail='';
      if(name.startsWith('图灵：'))detail=/贡献|提出.*和/.test(raw)?'两项贡献':'人物辨认';
      if(name.startsWith('ENIAC与'))return single(q,'ENIAC与EDVAC综合题包含多个独立事实，保留不同题干与选项');
      if(name.startsWith('计算机分代：各'))detail=(raw.match(/第[一二三四1-4]代/)||['各代顺序'])[0];
      if(name.startsWith('ENIAC：'))detail=/元件|器件/.test(raw)?'时间及元件两项':'只问时间';
      if(name.startsWith('嵌入式'))detail=/同一芯片|单片机/.test(raw)?'单芯片定义':/数量/.test(raw)?'数量比较':'软硬件一体化';
      if(name.startsWith('主频：'))detail=/MIPS|FLOPS|全部|性能.*CPU|不影响/.test(raw)?clean(raw):/为单位|单位.*表示|单位是/.test(raw)?'单位':'频率含义';
      if(name.startsWith('字长：'))detail=/字节/.test(raw)?'位与字节换算':/精度/.test(raw)?'精度':/单位/.test(raw)?'单位':clean(raw);
      if(name.startsWith('计算机应用：辅助'))detail=(raw.match(/CIMS|CAD|CAM|CAE|CAI|集成制造|辅助设计|辅助制造|辅助教学/i)||[clean(raw)])[0].toUpperCase();
      if(name.startsWith('计算机应用：领域')){
        const hits=[/科学计算|数值计算|天气预报|ENIAC/i.test(raw),/数据处理|信息处理|人事档案|工资|图书.*检索/.test(raw),/过程控制|自动控制|流水线/.test(raw)];
        detail=hits.filter(Boolean).length>1?clean(raw):hits[0]?'数值任务':hits[1]?'信息管理任务':'生产控制任务';
      }
      if(name.startsWith('ASCII'))detail=/回车|换行|不可见|0DH/.test(raw)?'控制字符':/大小|大于|大小写|空格/.test(raw)?'编码排序':/转换|推知|已知|字符.*依次/.test(raw)?(/2026|四个字符/.test(raw)?'数字字符串':'字母偏移计算'):/总共|128|编码有|字符集/.test(raw)?'字符集大小':clean(raw);
      if(name.startsWith('汉字编码'))detail=/最高|字节/.test(raw)?'字节与最高位':/原因|区别/.test(raw)?'使用原因或区别':/机内码/.test(raw)?(/国标码/.test(raw)?'同时求国标与机内':'求机内码'):'求国标码';
      if(name.startsWith('点阵'))detail=/容量|字节|空间|字模信息/.test(raw)?'容量换算':/缩放|失真/.test(raw)?'缩放性质':'字形码辨认';
      if(name.startsWith('机器数'))detail=/原码.*反码.*补码|补码.*反码.*原码/.test(raw)?'三种码互转':/原数|真值/.test(raw)?'补码求真值':/补码是|补码为|补码是/.test(raw)?(/其.*原码|该数的原码/.test(raw)?'补码求原码':'给定机器码辨析'):'真值求机器码';
      if(name.startsWith('数制：'))detail=/末尾|添.*0|去掉.*0/.test(raw)?(/小数/.test(raw)?'小数尾添零':'整数移位'):/位权|右起/.test(raw)?'位权':/偶数|奇数/.test(raw)?'奇偶数判定':/精确/.test(raw)?'小数可表示性':/范围|状态|表示.*个/.test(raw)?'位数与范围':/相加|相减|运算/.test(raw)?'混合进制运算':/二进制.*小数|0\.\d/.test(raw)?'小数转换':/转换|等值|最小|进制数/.test(raw)?'整数转换或比较':clean(raw);
      if(name.startsWith('总线：'))detail=/地址/.test(raw)?'地址与寻址':/字长|数据/.test(raw)?'数据宽度':/分为|一般|三类/.test(raw)?'三类总线':'连接与传输';
      if(name.startsWith('存储器：'))detail=/断电|丢失/.test(raw)?'易失性':/写保护/.test(raw)?'写保护':/最快|速度|顺序/.test(raw)?'速度层次':/访问|主存|运行/.test(raw)?'CPU访问与调入':/读.*操作|取出/.test(raw)?'读取性质':clean(raw);
      if(name.startsWith('语言处理：'))detail=/\.EXE|\.OBJ|扩展名|独立执行/.test(raw)?'目标文件与可执行文件':/编写.*称为/.test(raw)?'源程序称谓':/汇编/.test(raw)?'汇编过程':/解释/.test(raw)?'解释过程':/编译|高级语言|目标程序/.test(raw)?'编译过程':clean(raw);
      if(name.startsWith('计算思维：'))detail=/本质/.test(raw)?(/和.*自动化|抽象和/.test(raw)?'本质两要素':'本质回忆'):/两个要素|形式化/.test(raw)?(/两个步骤|设计算法/.test(raw)?'抽象与自动化各步骤':'抽象要素'):/三大|设计和构造/.test(raw)?'三大思维与方法':/所有人|专属/.test(raw)?'适用人群':clean(raw);
      if(name.startsWith('可计算性：'))detail=/时间|空间|复杂/.test(raw)?'时间与空间复杂性':/停机|哥德巴赫/.test(raw)?'停机与未解猜想':/有限步骤|所有问题/.test(raw)?'可计算性定义':clean(raw);
      if(name.startsWith('图灵测试'))detail=/通用智能|唯一标准|全方位/.test(raw)?'评估边界':/被称为|称为|人称/.test(raw)?'人物称号':'行为判别';
      if(!detail)detail=clean(raw).replace(/\d+/g,'#');
      const r=out(name,method,trap,detail);
      r.canAutoHide=((name.startsWith('主频：')&&detail==='单位')||(name.startsWith('计算机应用：领域')&&detail==='生产控制任务'&&/应用/.test(point)&&mode==='直接辨认或回忆')||(name.startsWith('ENIAC：')&&detail==='只问时间'))&&!/附加|另外|同时|国别|国家|研制者|条件/.test(raw);
      return r;
    }
    return single(q);
  }
  function english(q){
    const point=q.point||'';
    let name='',method='';
    if(/两者否定neither/.test(point)){name='不定代词：两者否定neither';method='先数对象，再判断肯定与否定；两者否定用 neither。';}
    else if(/共同所有的名词所有格/.test(point)){name='名词所有格：共同所有';method='共同拥有同一事物时，只在最后一人后加所有格。';}
    else if(/名词性物主代词(?:yours|hers)$/.test(point)){name='代词：名词性物主代词独立使用';method='物主代词独立代替所属物，不在后面再加名词；按所有者确定人称。';}
    else if(/形容词性物主代词(?:your|his|our)$/.test(point)){name='代词：形容词性物主代词加名词';method='名词前用形容词性物主代词，结合说话对象判断所有者。';}
    else if(point==='主格代词they'){name='代词：复数人或物作主语they';method='代替前文复数的人或物并作主语时使用 they。';}
    else if(point==='反身代词by oneself'){name='代词：by oneself独立完成';method='by oneself 表示独自、靠自己，反身代词与主语同指。';}
    else if(point==='名词辨析explanation'){name='词义辨析：explanation表示解释';method='对提案或计划作详细解释，用 explanation of...。';}
    else if(point==='名词photo的复数'){name='名词复数：photo直接加s';method='photo 的复数为 photos；some 与 a lot of 修饰复数照片时均使用 photos。';}
    else if(point==='职业名词doctor'){name='职业名词：doctor医生';method='结合医院、就医等语境判断 doctor；a 后使用单数。';}
    else if(point==='固定搭配come to a conclusion'){name='固定搭配：come to a conclusion';method='come to a conclusion 表示经过分析得出结论；注意整个短语。';}
    else if(point==='固定搭配have access to'){name='固定搭配：have access to';method='have access to 表示能够接近、使用或获得；access 为名词。';}
    if(name){const r=make(q,name,method,'同类有错、选项多解或条件变化时保留显示。');r.canAutoHide=true;return r;}
    if(!/^CQZSB-ENG-20261016-\d{3}$/.test(q.id)){const method=/代词|两者|指代|主格|宾格/.test(point)?'代词与指代':/所有格/.test(point)?'名词所有格':/复数|不可数|可数/.test(point)?'名词单复数与可数性':/固定|搭配/.test(point)?'固定搭配':'词义辨析';return make(q,method+'：'+point,'结合完整语境核对词性、数、指代范围和搭配。','不同词条或语法条件单独保留；不据做对一道就视为掌握整类。',q.canonicalId||q.id,false);}
    const n=Number(q.id.split('-').at(-1));
    const bundles=[[[1,13,102,107],'代词替代：比较结构中的单数that','先确认比较对象相同；不可数或特指单数可用 that，复数用 those。'],[[4,42],'名词复数：man与woman作职业定语','man/woman 与后面的职业名词同时变复数。'],[[8,94],'不定代词：两者否定neither','先数对象，再判断肯定与否定；两者否定用 neither。'],[[17,101],'不定代词：三者及以上否定none','三者及以上的全否定用 none。'],[[10,100],'代词：反身代词与固定搭配','主宾同指时使用反身代词，注意 teach oneself 等搭配。'],[[55,57,62],'名词所有格：时间与距离','先确定单复数，再放所有格撇号；time 等中心名词另判。'],[[56,60],'名词所有格：共同所有','共同拥有同一事物时，只在最后一人后加所有格。'],[[53,61],'复合形容词：数词加单数名词','带连字符的定语内名词用单数，不再添加所有格。'],[[83,91],'数词：具体数量后的hundred与thousand','有具体数字时 hundred/thousand 不加 s，也不接 of。'],[[84,90],'数词：序数词fifth','第五的序数词为 fifth，注意拼写和定冠词。']];
    for(const [ids,name,method] of bundles)if(ids.includes(n)) {const r=make(q,name,method,'条件变化、判分争议或本类曾错时继续显示。');r.canAutoHide=true;return r;}
    const r=make(q,(q.topic||'英语')+'：'+(q.point||'独立考点'),'结合完整语境核对词性、数、指代范围和搭配。','相近词不等于同一条件，单个词条不代表整类掌握。',q.canonicalId||q.id,false);return r;
  }
  function classify(q){return q.subject==='高等数学'||q.subject==='数学'?math(q):q.subject==='计算机'?computer(q):q.subject==='英语'?english(q):single(q);}
  const api={classify,hash};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(typeof window!=='undefined')window.QuestionFamilies=api;
})();
