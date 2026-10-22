window.LISTENING_ROUTE_ITEMS=[
 ['A1-1','working on','动作词组'],['A1-2','market investigation report','具体任务'],
 ['A2-1','shown up','是否出现'],['A2-2','urgent meeting','缺席原因'],
 ['A3-1','reserve a meeting room','目的与动作'],['A3-1','next Wednesday','时间'],
 ['A4-2','market researcher','职业'],['A4-2','product development','工作用途'],
 ['A5-1','still valid','预订状态'],['A5-2','reservation record','核查内容'],
 ['B1-2','former colleague','信息来源'],['B1-6','salary range','薪资信息'],['B1-6','annual leave','福利信息'],['B1-9','next Monday morning','面试时间'],
 ['B2-2','western industrial park','目的地'],['B2-4','product exhibition','活动'],['B2-6','second trip','次数'],['B2-8','before dinner','返回时间'],
 ['C-1','trust','主旨关键词'],['C-3','communication','主旨关键词'],['C-5','reasonable rules','解决方式'],['C-8','regular contact','维系关系的方式']
].map(([sentenceId,answer,focus],i)=>({id:'LR-'+String(i+1).padStart(2,'0'),sentenceId,answer,focus}));
