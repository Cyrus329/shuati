'use strict';
(function(root){
const labels='ABCDE';
const clues=[
['exercise scientifically and develop long-term fitness habits','remotely control lights, air conditioners and kitchen equipment','avoid congested roads for drivers','online virtual tour systems','fast and safe consumption transfers'],
['make full use of time and achieve better learning results','form independent thinking ability and shape correct values','sense of responsibility and self-reliance','strengthen physical fitness, improve immunity and relieve learning pressure','Positive social interaction benefits teenagers’ mental health'],
['purify air and reduce urban heat island effect','Recyclable materials can be reused after processing','Water resource protection is crucial for ecological balance','reduce resource waste','alleviates urban traffic congestion'],
['enhance the sense of national pride and cultural confidence','combines ancestor worship and spring outing','carry people’s wishes for a peaceful and prosperous new year and maintain the bond of family affection','in memory of the patriotic poet Qu Yuan','symbolizes reunion and harmony'],
['makes up for the limitations of single classroom teaching','exchange different ideas','exercise logical thinking and independent analysis ability','shapes students’ personality and values','accumulate rich vocabulary'],
['outdoor fitness equipment are open to the public for free','reduce the pressure on large public hospitals','help solve social trivial problems and spread positive social energy','reduces travel costs and improves urban operation efficiency','the diverse learning needs of people of different ages'],
['meet peers with the same hobbies','keep in touch with relatives and friends in different cities and countries','reduces the depth of real emotional communication','This indirect expression','maintain harmonious interpersonal relationships in the digital era'],
['choose to retain their original surnames after getting married','the most popular and practical method is to combine the two surnames with a hyphen','often brings great pressure to newlyweds','maintains their connection with personal achievements','sincere love and mutual companionship'],
['set villa prices at a reasonable level to keep people from feeling doubtful','a rising number of holidaymakers suffer from online booking fraud','check website reliability','steal real villa information from legal websites','the most effective protection comes from consumers themselves'],
['their research has produced conflicting results','a more equal way of fund distribution','more likely to receive extra money and professional titles','Among those who kept doing research, these close losers achieved better academic results','small failures can improve work ability']
];
function add(n,title,pictures,paragraphs,questions,key,original=''){
  const id='BF-MATCH-20261108-'+n;
  const sentences=[], evidence=[];
  paragraphs.forEach(([heading,en,zh],i)=>{
    evidence[i]=[sentences.length];
    sentences.push({text:'['+labels[i]+'] '+en,translation:zh});
  });
  const items=questions.map(([stem,translation],i)=>{
    const at=labels.indexOf(key[i]);
    const heading=paragraphs[at][0];
    return {id:id+'-'+(16+i),no:16+i,type:'matching',stem,translation,options:[...labels].map(x=>'Paragraph '+x),optionTranslations:[...labels].map(x=>x+' 段'),answer:key[i],evidence:evidence[at],analysis:'定位 '+key[i]+' 段（'+heading+'）。原文关键词：“'+clues[n-1][i]+'”。题干用同义表达复述这一信息。其余各段分别围绕'+paragraphs.filter((_,j)=>j!==at).map(p=>p[0]).join('、')+'。'};
  });
  const answers=Object.fromEntries(items.flatMap((q,i)=>labels.includes(original[i]||'?')?[[q.id,original[i]]]:[]));
  const passage={id,title,label:'Exercise '+n+' · Task 4 · 段落匹配',source:'蓝色森林 · 快班专项练习 · 阅读理解',sourceNote:'第 16–20 题按原文核对参考答案，纸面可辨认的作答单独保存。',sentences,questions:items,sourceLinks:pictures.map(x=>({label:'原题照片 '+x,href:'reading/matching-20261108/'+x+'.jpg'}))};
  if(Object.keys(answers).length)passage.sourceAttempt={id:id+'-paper',answers};
  if(!root.READING_DATA.some(p=>p.id===id))root.READING_DATA.push(passage);
}
add(1,'科技与日常生活',[2044,2045],[
['智能家居','Smart home technology has completely changed people’s daily living environments. With intelligent sensors, voice control systems and connected household devices, people can remotely control lights, air conditioners and kitchen equipment through mobile phones. This intelligent management saves time and energy, making family life more convenient and efficient, and it has gradually become a mainstream lifestyle in modern urban families.','智能家居技术彻底改变了人们的日常居住环境。借助智能传感器、语音控制系统和联网家电，人们可以通过手机远程控制灯光、空调和厨房设备。这种智能管理节省时间和能源，让家庭生活更便捷高效，并逐渐成为现代城市家庭的主流生活方式。'],
['数字旅游','Digital tourism has brought new vitality to the travel industry. Many scenic spots launch online virtual tour systems, allowing tourists to enjoy landscape views and cultural exhibitions at home. Meanwhile, intelligent travel apps can provide personalized route planning, ticket booking and travel guide services, solving many troubles in traditional travel and attracting more young travelers.','数字旅游给旅游行业带来了新活力。许多景点推出线上虚拟游览系统，让游客足不出户欣赏风景与文化展览。智能旅行应用还能提供个性化路线规划、订票和导览，解决传统旅行中的不少麻烦，吸引更多年轻游客。'],
['金融科技','Financial technology simplifies people’s daily payment and wealth management. Mobile payment has replaced traditional cash and card transactions, realizing fast and safe consumption transfers. In addition, intelligent wealth management platforms can analyze users’ income and consumption habits, recommending low-risk and suitable financial products for ordinary people to manage their spare money reasonably.','金融科技简化了日常支付和理财。移动支付取代了传统的现金和刷卡交易，让消费转账更快更安全。智能理财平台还可分析用户的收入与消费习惯，推荐合适的低风险产品，帮助普通人合理管理闲钱。'],
['智能交通','Intelligent transportation systems ease urban traffic pressure. Real-time traffic monitoring devices collect road condition data, helping traffic management departments adjust signal lights and divert traffic flows in time. Navigation software with big data analysis can also avoid congested roads for drivers, greatly improving urban traffic efficiency and reducing travel time.','智能交通系统缓解城市交通压力。实时交通监测设备收集路况数据，帮助交通管理部门及时调整信号灯、分流车流。利用大数据分析的导航软件也能帮助司机避开拥堵道路，提高通行效率并缩短出行时间。'],
['智能运动','Smart sports equipment promotes national fitness. Intelligent running watches can record heart rate, calorie consumption and exercise steps in real time. Professional sports apps also provide standardized fitness courses and motion correction guidance. These technological products help ordinary people exercise scientifically and develop long-term fitness habits.','智能运动设备推动全民健身。智能跑步手表可实时记录心率、热量消耗和步数。专业运动应用还提供标准化健身课程和动作纠正指导，帮助普通人科学运动并养成长期健身习惯。']
],[
['Technology helps people arrange their exercise scientifically and stick to fitness routines.','科技帮助人们科学安排运动并坚持锻炼。'],
['People can control home appliances remotely and enjoy a more effortless family life with smart home devices.','借助智能家居设备，人们可以远程控制家电，让家庭生活更轻松。'],
['Big data and intelligent systems effectively relieve urban road congestion and improve travel efficiency.','大数据和智能系统有效缓解城市道路拥堵并提高出行效率。'],
['Online travel services and virtual scenic tours make traveling more convenient and diverse.','在线旅行服务和虚拟景区游览让旅行更方便、更多样。'],
['Modern financial technology makes daily payments and personal money management simpler and safer.','现代金融科技让日常支付和个人理财更简单、更安全。']
],'EADBC','EADBC');
add(2,'青少年成长与生活习惯',[2046,2047],[
['经典阅读','Reading is one of the most valuable lifelong habits for teenagers. Regular reading can broaden students’ horizons, enrich their knowledge reserve and improve their language expression ability. Unlike fragmented online information, classic books can help teenagers form independent thinking ability and shape correct values, laying a solid foundation for their future study and life.','阅读是青少年最有价值的终身习惯之一。经常阅读能拓宽视野、丰富知识储备并提高语言表达能力。与碎片化网络信息不同，经典书籍有助于培养独立思考能力和正确价值观，为未来学习和生活打下扎实基础。'],
['体育运动','Proper physical exercise is essential for teenagers’ physical development. During adolescence, the body is in a critical growth period. Persistent moderate exercise such as running, swimming and ball games can strengthen physical fitness, improve immunity and relieve learning pressure, helping teenagers keep energetic in daily study.','适当运动对青少年的身体发育至关重要。青春期是身体成长的关键时期。坚持跑步、游泳、球类运动等适度锻炼，可以增强体质、提高免疫力、缓解学习压力，让青少年在日常学习中保持活力。'],
['时间管理','Time management ability determines teenagers’ learning efficiency. Many students fall into the trap of procrastination, wasting a lot of spare time. Making reasonable daily schedules, distinguishing primary and secondary tasks, and completing learning plans on time can help students make full use of time and achieve better learning results.','时间管理能力影响青少年的学习效率。许多学生陷入拖延，浪费大量空闲时间。制定合理的日程、分清任务主次并按时完成学习计划，能帮助学生充分利用时间并取得更好的学习成果。'],
['社交互动','Positive social interaction benefits teenagers’ mental health. Communicating sincerely with classmates and teachers, participating in group activities and volunteering can help teenagers build self-confidence, learn to cooperate and tolerate, and avoid loneliness and negative emotions in the growth process.','积极的社交互动有益于青少年的心理健康。与同学和老师真诚交流、参加集体活动和志愿服务，能帮助他们建立自信、学会合作与包容，并减少成长中的孤独和负面情绪。'],
['独立生活','Independent living skills are indispensable for adolescent growth. Learning to tidy personal items, arrange daily diet and manage personal expenses can cultivate teenagers’ sense of responsibility and self-reliance. These skills help them adapt to independent life faster when they leave their parents in the future.','独立生活技能对青少年的成长不可或缺。学会整理个人物品、安排日常饮食并管理个人开支，可以培养责任感与自立能力。这些技能能帮助他们将来离开父母后更快适应独立生活。']
],[
['Mastering the skill of arranging time well can effectively improve students’ learning efficiency.','掌握合理安排时间的技巧能有效提高学生的学习效率。'],
['Regular reading of classic books helps teenagers develop thinking ability and correct outlooks on life.','经常读经典书籍能帮助青少年培养思考能力和正确的人生观。'],
['Learning to take care of oneself cultivates teenagers’ sense of responsibility and independence.','学会照顾自己能培养青少年的责任感和独立性。'],
['Playing sports regularly can keep teenagers healthy and relieve their study stress.','经常运动能让青少年保持健康并缓解学习压力。'],
['Communicating and cooperating with others is good for teenagers’ psychological development.','与他人交流合作有益于青少年的心理发展。']
],'CAEBD','CAEBD');
add(3,'城市环境保护',[2048,2049],[
['垃圾分类','Waste classification is the basic measure of urban environmental protection. Classifying household waste into recyclable, kitchen, harmful and other waste can improve the efficiency of waste recycling and treatment. Recyclable materials can be reused after processing, while harmful waste is treated centrally to avoid polluting soil and water resources.','垃圾分类是城市环保的基本措施。把生活垃圾分为可回收垃圾、厨余垃圾、有害垃圾及其他垃圾，可以提高回收处理效率。可回收物经处理后可再利用，有害垃圾则集中处理，以免污染土壤和水资源。'],
['低碳出行','Low-carbon travel effectively reduces urban carbon emissions. Choosing walking, cycling and public transport instead of private cars can cut down fuel consumption and exhaust emissions. This simple travel mode not only protects the atmospheric environment, but also alleviates urban traffic congestion.','低碳出行能有效减少城市碳排放。步行、骑行和乘坐公共交通代替开私家车，可以减少燃料消耗和尾气排放。这种简单的出行方式既保护大气，也能缓解城市交通拥堵。'],
['绿色消费','Green consumption guides a sustainable lifestyle. Choosing energy-saving household appliances, reusable daily products and environmentally friendly packaging materials can reduce resource waste. Refusing excessive packaging and disposable products is a small but effective way for ordinary people to participate in environmental protection.','绿色消费引导人们采取可持续的生活方式。选择节能家电、可重复使用的日用品和环保包装材料可以减少资源浪费。拒绝过度包装和一次性用品，是普通人参与环保的一种小而有效的方式。'],
['城市绿化','Urban greening construction improves ecological environment quality. Planting trees, building community gardens and urban wetlands can absorb carbon dioxide, purify air and reduce urban heat island effect. Rich urban green vegetation also beautifies the city landscape and provides comfortable leisure spaces for citizens.','城市绿化建设改善生态环境质量。种树、建设社区花园和城市湿地能够吸收二氧化碳、净化空气并减轻热岛效应。丰富的城市绿植还能美化景观，为市民提供舒适的休闲空间。'],
['水资源保护','Water resource protection is crucial for ecological balance. Saving domestic water, avoiding random discharge of domestic sewage and protecting urban and rural water bodies can effectively relieve water resource shortage. Rational water use habits help maintain the stability of regional ecological environment.','保护水资源对生态平衡至关重要。节约生活用水、避免随意排放生活污水以及保护城乡水体，可以有效缓解水资源短缺。合理用水有助于维持区域生态环境稳定。']
],[
['Planting green plants and building urban green spaces improve city environment and air quality.','种植绿植和建设城市绿地能改善城市环境与空气质量。'],
['Sorting garbage scientifically helps realize resource reuse and reduce environmental pollution.','科学分类垃圾有助于实现资源再利用并减少环境污染。'],
['Saving water and protecting water resources play an important role in ecological protection.','节约用水和保护水资源在生态保护中发挥重要作用。'],
['Environmentally friendly consumption habits can reduce resource waste in daily life.','环保消费习惯可以减少日常生活中的资源浪费。'],
['Choosing public transport and walking helps reduce air pollution and traffic pressure.','选择公共交通和步行有助于减少空气污染和交通压力。']
],'DAECB','DAECB');
add(4,'中国传统节日与文化传承',[2050,2051],[
['春节','The Spring Festival is the most important traditional festival in China, representing family reunion and new beginnings. Families gather together to have a New Year’s Eve dinner, paste Spring Festival couplets and set off fireworks. These traditional customs carry people’s wishes for a peaceful and prosperous new year and maintain the bond of family affection.','春节是中国最重要的传统节日，代表团圆和新的开始。家人团聚吃年夜饭、贴春联、放烟花。这些习俗寄托了人们对新一年平安兴旺的愿望，也维系着家庭亲情。'],
['端午','The Dragon Boat Festival is celebrated in memory of the patriotic poet Qu Yuan. People hold dragon boat races and eat zongzi on this festival. The lively dragon boat races reflect the spirit of unity and struggle, while traditional food zongzi inherits ancient dietary culture and patriotic feelings.','端午节是为纪念爱国诗人屈原而庆祝的节日。人们赛龙舟、吃粽子。热闹的龙舟赛体现团结拼搏的精神，传统食品粽子则承载古老的饮食文化和爱国情感。'],
['中秋','The Mid-Autumn Festival symbolizes reunion and harmony. On the full moon night, families enjoy the moon and share mooncakes together. The festival conveys people’s longing for family reunion and beautiful expectations for life, and it is an important carrier of Chinese traditional emotional culture.','中秋节象征团圆与和谐。满月之夜，家人一起赏月、分享月饼。中秋节传递人们对团聚的向往和对生活的美好期待，也是中国传统情感文化的重要载体。'],
['清明','The Qingming Festival combines ancestor worship and spring outing. People sweep tombs to memorize their ancestors and show filial piety, and also go hiking in spring to enjoy the beauty of nature. It embodies the Chinese nation’s respect for ancestors and love for natural life.','清明节既有祭祖，也有春游。人们扫墓缅怀先人、表达孝心，也会踏青欣赏自然之美。清明节体现了中华民族对先人的敬意和对自然生活的热爱。'],
['节日传承','Traditional festival inheritance helps shape national cultural identity. In modern society, various festival activities enable young people to understand traditional culture. Inheriting festival customs can retain cultural roots and enhance the sense of national pride and cultural confidence.','传承传统节日有助于塑造民族文化认同。在现代社会，各种节庆活动让年轻人了解传统文化。传承习俗能够留住文化根脉，增强民族自豪感与文化自信。']
],[
['Celebrating traditional festivals helps young people inherit culture and build national cultural confidence.','庆祝传统节日有助于年轻人传承文化、建立民族文化自信。'],
['The Qingming Festival includes both the tradition of worshipping ancestors and the activity of spring outdoor trips.','清明节既包括祭祖传统，也包括春日户外踏青。'],
['The Spring Festival is a core traditional festival that strengthens family bonds and conveys good wishes.','春节是一个增进亲情、传递美好祝愿的核心传统节日。'],
['People celebrate the Dragon Boat Festival to honor a patriotic poet and carry forward the spirit of unity.','人们庆祝端午节是为了纪念一位爱国诗人并弘扬团结精神。'],
['The Mid-Autumn Festival is a typical festival that stands for family reunion and harmonious life.','中秋节是象征家庭团圆与生活和谐的典型节日。']
],'EDABC');
add(5,'课外阅读的价值',[2052,2053],[
['拓展课内知识','Extracurricular reading effectively supplements classroom learning. Textbook knowledge is limited and systematic, while extracurricular books cover diverse fields including history, science and literature. It broadens students’ knowledge scope and makes up for the limitations of single classroom teaching.','课外阅读能有效补充课堂学习。教材知识有限而系统，课外书则涵盖历史、科学和文学等多个领域。课外阅读拓宽学生的知识面，弥补仅靠课堂教学的局限。'],
['提升语言与写作','Wide reading improves students’ language and writing ability. By reading excellent articles, students can accumulate rich vocabulary, master diverse sentence structures and learn various writing skills. Long-term reading enables students to express ideas more accurately and write compositions more fluently.','广泛阅读能提高语言与写作能力。通过读优秀文章，学生可以积累词汇、掌握多样句式、学习各种写作技巧。长期阅读让学生表达更准确、行文更流畅。'],
['塑造品格与价值观','Extracurricular reading shapes students’ personality and values. Inspirational stories, historical figures’ experiences and philosophical essays can influence students’ inner world. Students can learn kindness, perseverance and bravery from books and form positive attitudes towards life.','课外阅读塑造学生的品格与价值观。励志故事、历史人物的经历和哲理文章能够影响学生的内心世界。学生可以从书中学到善良、坚持和勇敢，形成积极的人生态度。'],
['锻炼专注与思考','Reading helps cultivate students’ concentration and thinking ability. Unlike short and fragmented online information, book reading requires long-term focus. In the process of reading and understanding content, students can exercise logical thinking and independent analysis ability.','阅读有助于培养专注力和思考能力。不同于简短零散的网络信息，读书需要长时间集中注意力。学生在阅读和理解内容的过程中可以锻炼逻辑思维和独立分析能力。'],
['交流与合作','Group reading activities enhance students’ communication ability. Sharing reading feelings and discussing book contents with classmates allows students to exchange different ideas. It cultivates their cooperative awareness and expression skills in collective communication.','集体阅读活动能提升沟通能力。和同学分享读后感、讨论书的内容，让学生交流不同想法，并在集体交流中培养合作意识和表达能力。']
],[
['Reading various books can make up for the shortage of textbook knowledge and expand students’ horizons.','阅读各种书籍可以弥补教材知识的不足并开阔学生的视野。'],
['Discussing and sharing reading experiences with others improves students’ communication and cooperation skills.','与他人讨论、分享阅读体验能提高学生的沟通和合作能力。'],
['Persistent reading trains students’ focus and cultivates their independent thinking capacity.','坚持阅读能锻炼学生的专注力，培养独立思考能力。'],
['Excellent extracurricular books have a positive impact on students’ character building and value formation.','优秀的课外书对学生的品格塑造和价值观形成有积极影响。'],
['Long-term extracurricular reading helps students improve their vocabulary and writing competence.','长期课外阅读有助于学生积累词汇并提高写作能力。']
],'AEDCB');
add(6,'城市公共服务',[2054],[
['图书馆','Urban public library systems provide free learning resources for citizens. Modern libraries collect a large number of books, electronic resources and reading materials of all kinds. They set up special reading areas for teenagers and the elderly, meeting the diverse learning needs of people of different ages.','城市公共图书馆为市民提供免费学习资源。现代图书馆收藏大量图书、电子资源和各种阅读材料，并设有青少年和老年人专门阅读区，满足不同年龄人群的多样学习需求。'],
['社区医疗','Community medical services facilitate residents’ daily health care. Community clinics provide regular physical examinations, common disease diagnosis and health consultation services. They solve the problem of difficult medical treatment for residents and reduce the pressure on large public hospitals.','社区医疗服务让居民日常就医更方便。社区诊所提供定期体检、常见病诊断和健康咨询，帮助缓解居民看病难，也减轻大型公立医院的压力。'],
['公共体育设施','Urban public sports facilities promote national fitness. Parks, community sports grounds and outdoor fitness equipment are open to the public for free. These public resources allow citizens to exercise at any time, forming a good fitness atmosphere in the whole city.','城市公共体育设施促进全民健身。公园、社区运动场和户外健身器材免费对公众开放，让市民随时锻炼，在全市形成良好的健身氛围。'],
['公共交通','Public traffic optimization improves citizens’ travel experience. The government optimizes bus routes, increases subway operation time and sets up dedicated bicycle lanes. Convenient and cheap public transport reduces travel costs and improves urban operation efficiency.','优化公共交通可以改善市民的出行体验。政府优化公交线路、延长地铁运营时间，并设置自行车专用道。便利、低价的公共交通减少出行成本，提高城市运行效率。'],
['志愿服务','Urban public volunteer services warm the whole society. A large number of volunteers participate in community services, traffic guidance and public welfare activities. Their efforts help solve social trivial problems and spread positive social energy.','城市公共志愿服务给社会带来温暖。许多志愿者参与社区服务、交通引导和公益活动，帮助解决日常社会小问题，传播社会正能量。']
],[
['Free public sports equipment and venues create a convenient fitness environment for citizens.','免费的公共体育器材和场地为市民创造了便利的健身环境。'],
['Community medical institutions offer convenient daily medical services and ease hospital pressure.','社区医疗机构提供便利的日常医疗服务，并缓解医院压力。'],
['Public volunteer activities deliver positive energy and help solve social daily problems.','公共志愿活动传递正能量，帮助解决日常社会问题。'],
['Perfect public transport systems lower citizens’ travel costs and improve travel efficiency.','完善的公共交通系统降低市民的出行成本，提高出行效率。'],
['Urban public libraries provide diverse free reading resources for people of all ages.','城市公共图书馆为各年龄段的人提供多样的免费阅读资源。']
],'CBEDA');
add(7,'网络社交与人际关系',[2055,2056],[
['跨地域联系','Online social platforms have broken the limitation of spatial distance for interpersonal communication. Modern social software enables people to keep in touch with relatives and friends in different cities and countries at any time. Text messages, voice calls and short video sharing make long-distance communication convenient and frequent, maintaining intimate cross-regional social relationships.','网络社交平台突破了人际交往的空间限制。现代社交软件让人随时联系不同城市和国家的亲友。文字消息、语音通话和短视频分享让远距离交流更便利、更频繁，维系了跨地域的亲密关系。'],
['情感表达','Digital communication changes the way people express emotions. Different from face-to-face communication with facial expressions and body language, online interaction relies more on text, emojis and stickers. This indirect expression makes people more willing to share inner emotions, but sometimes leads to insufficient emotional transmission and misunderstanding between each other.','数字交流改变了人们表达情感的方式。面对面交流有面部表情和肢体语言，线上互动则更依赖文字、表情符号和贴纸。这种间接表达让人更愿意分享内心情绪，但有时会因情感传达不足而造成误解。'],
['拓展社交圈','Social media expands people’s social circles efficiently. People can meet peers with the same hobbies through online communities, interest groups and topic discussions. This cross-age and cross-industry social mode enriches people’s life experience and helps them acquire new knowledge and different perspectives.','社交媒体能有效拓展社交圈。人们可通过网络社区、兴趣小组和话题讨论结识志趣相投的人。这种跨年龄、跨行业的社交方式丰富生活体验，也让人获得新知识和不同视角。'],
['现实关系疏远','Excessive online socialization causes alienation in real-life relationships. Many people indulge in virtual social interaction and spend a lot of time on mobile phones, ignoring face-to-face communication with family members and friends. This phenomenon reduces the depth of real emotional communication and makes intimate relationships increasingly superficial.','过度网络社交会让现实关系疏远。许多人沉迷虚拟互动，在手机上花费大量时间，忽视与亲友面对面交流。这会削弱现实情感交流的深度，让亲密关系日渐流于表面。'],
['网络礼仪','Online social etiquette becomes a new required social skill. Different from traditional offline social norms, online communication has unique rules, such as timely reply, polite wording and reasonable sharing of information. Mastering these virtual social norms helps people maintain harmonious interpersonal relationships in the digital era.','网络社交礼仪成为一项新的必备技能。不同于传统线下社交规范，线上交流有自己的规则，比如及时回复、礼貌用语和合理分享信息。掌握这些规范有助于在数字时代维持和谐的人际关系。']
],[
['Making friends with like-minded people online greatly enriches people’s social experience.','在网上结识志同道合的朋友，大大丰富了人们的社交体验。'],
['Online communication removes geographical barriers for people to keep in touch with each other.','线上交流打破地域障碍，让人们彼此保持联系。'],
['The lack of face-to-face interaction caused by overusing social media weakens real emotional bonds.','过度使用社交媒体导致面对面互动减少，削弱了现实中的情感纽带。'],
['Online emotional expression is more indirect, which may easily cause communication misunderstanding.','线上情感表达更间接，容易造成沟通误解。'],
['Appropriate online social norms are essential for good virtual interpersonal communication.','恰当的网络社交规范对良好的线上人际交流至关重要。']
],'CADBE');
add(8,'婚后姓氏的选择',[2057,2058],[
['婚前筹备与选择压力','Getting married involves various complicated preparations and often brings great pressure to newlyweds. Apart from planning wedding ceremonies and rearranging two families’ daily lives, couples also need to complete official procedures such as applying for a marriage certificate. Besides these trivial tasks, they have to face a key decision about whether to keep their original surname or change it after marriage, which troubles many people.','结婚涉及许多复杂的准备工作，常给新人带来很大压力。除了筹办婚礼、重新安排两个家庭的日常生活，伴侣还得办理申请结婚证等正式手续。在这些琐事之外，他们还要作出一个令许多人苦恼的决定，即婚后保留原姓还是改姓。'],
['婚后姓氏观念的变化','People’s attitudes towards women’s surnames after marriage have changed greatly over time. In traditional society, brides were required to take their husbands’ surnames, and keeping one’s maiden name was viewed as inappropriate and unconventional. However, modern women have more independent ideas, and an increasing number of them choose to retain their original surnames after getting married.','人们对女性婚后姓氏的态度随时间发生了很大变化。在传统社会，新娘被要求随夫姓，保留原姓被视为不妥、违背惯例。而现代女性的想法更加独立，越来越多的人选择在婚后保留原姓。'],
['连字符姓氏这一折中办法','There are practical compromise ways for couples to solve the surname choice problem. Creating a completely new shared surname is one choice for both partners. Nevertheless, the most popular and practical method is to combine the two surnames with a hyphen. This approach enables women to keep their original family name while legally using their husband’s surname, satisfying the needs of both sides.','伴侣可以用实用的折中办法解决姓氏选择问题。创造一个双方共用的全新姓氏是一种选择。不过，最受欢迎且实用的方式是用连字符把两个姓氏连起来。这让女性保留原姓的同时合法使用丈夫的姓氏，兼顾双方需求。'],
['个人身份与职业成果','A hyphenated surname brings many practical benefits for married women. It helps women preserve their unique personal identity formed over their whole life. More importantly, it maintains their connection with personal achievements, including academic degrees, professional certifications and public works gained under their maiden name. In this way, women can balance their personal identity and professional reputation well.','带连字符的姓氏能给已婚女性带来不少实际好处。它让女性保留一生逐渐形成的独特身份，更重要的是，也让她们保持与自己以原姓取得的学位、职业资格及公开作品等成果的联系，从而兼顾个人身份与职业声誉。'],
['婚姻的核心','Although choosing a post-marriage surname is a meaningful decision, it is not the core of a marriage. Couples have multiple choices, including keeping separate surnames, creating a new surname or using a hyphenated surname. Regardless of the choice, sincere love and mutual companionship between husband and wife are the most precious and essential part of a lifelong marriage.','选择婚后姓氏是一个有意义的决定，但婚姻的核心在别处。伴侣可以各自保留原姓、另取一个姓或用连字符合并姓氏。无论如何选择，夫妻之间真挚的爱和相互陪伴才是长久婚姻中最珍贵、最重要的部分。']
],[
['Modern women have more freedom to keep their original surnames compared with traditional female counterparts.','相比传统社会中的女性，现代女性有更多保留原姓的自由。'],
['Combining two surnames with a hyphen is the most popular compromise solution for couples’ surname problems.','用连字符合并两个姓氏，是伴侣解决姓氏问题最受欢迎的折中办法。'],
['Various marriage preparations and surname decisions bring much pressure to people preparing for marriage.','各项结婚准备和姓氏决定给准备结婚的人带来很大压力。'],
['Keeping a hyphenated surname helps women preserve their personal identity and professional achievements.','使用连字符姓氏有助于女性保留个人身份与职业成果。'],
['True love between couples is far more important than the choice of surnames after marriage.','伴侣之间的真爱远比婚后如何选择姓氏更重要。']
],'BCADE','BCADE');
add(9,'网络别墅预订诈骗',[2059,2060],[
['受骗与经济损失','Many British people book seaside villas for holiday breaks. However, a rising number of holidaymakers suffer from online booking fraud. They pay much money in advance for villas, only to find the houses do not exist and the booking websites disappear. This turns their expected pleasant holidays into bad experiences, and such fraud causes heavy financial losses every year.','很多英国人预订海滨别墅度假，但越来越多的度假者遭遇网络预订诈骗。他们提前付了大笔房费，却发现房子根本不存在，预订网站也消失了。原本期待的愉快假期变成了糟糕经历，此类诈骗每年还造成严重经济损失。'],
['仿冒正规网站','Online villa fraud has become more professional in the past ten years. Fraudsters build fake websites with realistic names. They steal real villa information from legal websites and create false company details to cheat visitors. These fake sites look so real that ordinary people can hardly tell them apart from official ones.','过去十年，网上别墅诈骗变得更专业。骗子搭建名称逼真的假网站，从合法网站窃取真实的别墅信息，并编造企业资料骗人。这些假网站看起来太逼真，普通人很难与正规网站区分开来。'],
['合理标价与搜索广告','Fraudsters use special tricks to attract tourists. They mainly target popular coastal holiday places and set villa prices at a reasonable level to keep people from feeling doubtful. Besides, they buy search advertising so their fake websites appear at the top of search results easily.','骗子用特别的手法吸引游客。他们主要瞄准热门海滨度假地，把别墅价格定在合理水平，以免引起怀疑。他们还购买搜索广告，让假网站容易排到搜索结果前面。'],
['核查网站与安全付款','Online safety experts offer useful ways for consumers to check website reliability. Tourists can check whether villas exist on map tools and talk with service providers through fixed-line phones. Friends not joining the trip may also spot hidden risks. Experts also advise people not to pay by bank transfer and choose safer payment methods.','网络安全专家提供了核查网站可靠性的实用方法。游客可以借助地图工具确认别墅是否存在，用固定电话与服务方沟通，也可让不同行的朋友帮忙识别潜在风险。专家还建议避开银行转账，选择更安全的付款方式。'],
['消费者自己保持警惕','It is hard to find and punish these online fraudsters. They often change bank accounts to avoid being found. Although related organizations release warnings, the most effective protection comes from consumers themselves. Holidaymakers must stay careful when booking villas online to avoid being cheated.','这些网络骗子难以追查和惩处。他们常更换银行账户来躲避追查。尽管有关机构会发布警告，最有效的保护仍来自消费者自己。在线预订别墅时，度假者必须保持警惕，以免被骗。']
],[
['Fraudsters set reasonable prices for fake villas so that customers will not feel suspicious.','骗子为虚假的别墅定出合理价格，好让顾客不起疑。'],
['More British holidaymakers meet online villa booking fraud and lose their holiday money.','更多英国度假者遭遇网上别墅预订诈骗，损失了度假资金。'],
['People can use several practical methods to check if a villa booking website is trustworthy.','人们可以用几种实用的方法核查别墅预订网站是否可信。'],
['Scammers create realistic fake websites by taking information from legal villa booking sites.','骗子从合法的别墅预订网站获取信息，制作看起来很真的假网站。'],
['Consumers’ own carefulness is the most important way to prevent online villa booking fraud.','消费者自己保持警惕是防止网上别墅预订诈骗的最重要办法。']
],'CADBE','CA?BE');
add(10,'职业早期挫折与长期表现',[2061,2062],[
['研究结论不一致','People have long debated whether early career failures bring benefits or harms. Failure may help people learn and overcome fears, yet serious setbacks can hurt confidence and slow progress. Social scientists have studied how small career setbacks influence long-term career growth, and their research has produced conflicting results.','人们长期争论职业早期的失败究竟有益还是有害。失败可能帮人学习并克服恐惧，但严重挫折会打击信心、拖慢进步。社会科学家研究了轻微职业挫折如何影响长期职业成长，结果并不一致。'],
['早期研究与马太效应','Many early studies show the Matthew effect in academic circles. Researchers who narrowly win research funding usually get more resources and chances later. They are more likely to receive extra money and professional titles, while those who narrowly miss the grant may suffer lasting harm to their career development.','许多早期研究发现，学术界存在马太效应。险胜获得研究经费的研究人员，之后通常会得到更多资源和机会，更可能获得额外资助与专业头衔。相比之下，与资助擦肩而过的人，职业发展可能长期受影响。'],
['坚持者后续表现','New research offers opposite conclusions. One study followed scientists who barely failed to get research grants. Among those who kept doing research, these close losers achieved better academic results than narrow winners. Near failure may create strong mental motivation and push people to make greater efforts.','新研究得出了相反的结论。一项研究追踪了那些差一点就拿到研究经费的科学家。在坚持科研的人当中，这些惜败者取得的学术成果优于险胜者。与成功擦肩而过，可能激发强烈动力，促使人更加努力。'],
['经费分配建议','Researchers have analyzed the practical value of these new findings. They argue that continuously giving research funds to past winners is not wise. Persistent researchers who narrowly lost can perform as well or even better. They suggest a more equal way of fund distribution to raise the overall efficiency of scientific research.','研究者分析了新发现的实际价值，认为持续把科研经费给过去的获胜者并不明智。险些获胜且坚持科研的人同样可以表现出色，甚至表现更好。研究者建议更公平地分配经费，从而提高整体科研效率。'],
['小挫折可能带来长期收益','Recent studies change our traditional ideas about failure. People often see failure as proof of poor ability, but uncontrollable early rejections are not the end of a career. Early career setbacks are not always fatal. For determined people, small failures can improve work ability and bring better long-term career gains.','近期研究改变了我们对失败的传统看法。人们往往把失败视为能力不足的证明，但职业早期无法控制的拒绝并不意味着职业生涯结束。早期挫折并非总是致命的，对意志坚定的人而言，小失败可以提升工作能力，带来更好的长期职业回报。']
],[
['Studies on career setbacks have not reached a unified and consistent conclusion.','职业挫折研究尚未得出统一、一致的结论。'],
['Some researchers advise distributing research funds more equally to improve efficiency.','一些研究者建议更公平地分配科研经费以提高效率。'],
['Narrow winners in academic selection can gain more professional advantages in their future career.','在学术评选中险胜的人，未来可能获得更多职业优势。'],
['Keeping working after minor failures may help people achieve better professional results.','在小失败后继续努力，可能帮助人取得更好的职业成果。'],
['Early small setbacks are not always deadly and may improve people’s work performance.','早期的小挫折未必是致命的，还可能改善工作表现。']
],'ADBCE','EDBCA');
const studyNotes=[
[
['remotely control|远程控制','save time and energy~saves time and energy|节省时间和精力','先写智能家居改变生活，再讲手机远程控制，最后归纳省时省力。','making 引出结果，说明智能管理让家庭生活更便捷。'],
['bring new vitality to~brought new vitality to|给……注入新活力','virtual tour systems|虚拟游览系统','先说数字旅游的作用，再分别看线上游览和旅行应用。','allowing 引出结果，说明虚拟系统让游客能在家游览。'],
['wealth management|财富管理','mobile payment|移动支付','先总说金融科技，再分清移动支付和智能理财两个例子。','has replaced 是现在完成时，强调支付方式的变化及其现在的影响。'],
['real-time traffic monitoring|实时交通监测','avoid congested roads|避开拥堵路段','先看缓解交通压力的总述，再看路况监测和导航如何发挥作用。','with big data analysis 修饰 navigation software，补充软件使用的技术。'],
['record heart rate|记录心率','long-term fitness habits|长期健身习惯','先看智能设备记录什么，再看运动应用如何帮助坚持锻炼。','help ordinary people exercise 中 exercise 是省略 to 的不定式。']
],
[
['lifelong habits|终身习惯','broaden students’ horizons|拓宽学生的视野','先交代阅读的价值，再说明它对眼界、知识和表达的作用。','one of the most + 形容词 + 复数名词，表示最……的……之一。'],
['physical exercise|体育锻炼','improve immunity|提高免疫力','先看青少年所处的成长阶段，再看适量运动带来的好处。','such as 引出运动实例。'],
['time management|时间管理','make full use of|充分利用','先说效率问题，再看怎样制定计划、区分任务并按时完成。','多个动名词短语并列，合起来作主语。'],
['social interaction|社交互动','build self-confidence|建立自信','先说社交对心理健康的作用，再看沟通与集体活动的例子。','help 后接宾语和动词原形，说明活动能帮助青少年做什么。'],
['independent living skills|独立生活技能','sense of responsibility|责任感','先说独立技能的重要性，再列举日常事务及其长远作用。','Learning to… 是动名词短语，在句中作主语。']
],
[
['waste classification|垃圾分类','recyclable materials|可回收材料','先看分类原则，再看不同垃圾分别如何处理。','can be reused 是情态动词的被动结构。'],
['low-carbon travel|低碳出行','traffic congestion|交通拥堵','先看出行方式的选择，再看减排和缓解拥堵两个结果。','not only…but also… 连接两个并列谓语。'],
['green consumption|绿色消费','energy-saving|节能的','先说绿色消费，再看节能用品和拒绝过度包装的例子。','Choosing 和 Refusing 分别引出动名词主语。'],
['urban greening|城市绿化','urban heat island effect|城市热岛效应','先写绿化措施，再写净化空气、降低热岛效应和改善空间。','Planting 和 building 引出的动作共同作主语。'],
['ecological balance|生态平衡','domestic sewage|生活污水','先看保护水资源的目的，再理清节水、治污和保护水体的关系。','Saving、avoiding 和 protecting 引出三个并列措施。']
],
[
['family reunion|家庭团聚','set off fireworks|燃放烟花','先说春节象征什么，再看具体习俗与寄托。','representing 引出的现在分词短语补充说明节日意义。'],
['in memory of|为了纪念','dragon boat races|龙舟比赛','先交代纪念对象，再看赛龙舟和吃粽子分别承载什么。','while 对照两项习俗体现的不同内涵。'],
['reunion and harmony|团圆与和谐','full moon|满月','先说中秋的寓意，再看赏月和分月饼怎样体现团圆。','On the full moon night 在句首交代时间。'],
['ancestor worship|祭祖','sweep tombs|扫墓','先说清明的两类活动，再看对祖先与自然的情感。','to memorize their ancestors and show filial piety 说明扫墓的目的。'],
['cultural identity|文化认同','cultural confidence|文化自信','先说节日传承的意义，再说明年轻人怎样了解并继承文化。','enable + 宾语 + to do 表示使某人能够做某事。']
],
[
['extracurricular reading|课外阅读','make up for~makes up for|弥补','先说课外阅读补充课堂，再对比课本的范围和课外书的广度。','while 在这里表示对照。'],
['accumulate rich vocabulary|积累丰富的词汇','sentence structures|句型结构','先说写作能力的提升，再拆成词汇、句型和技巧三项。','By reading 引出方式，表示通过阅读。'],
['personality and values|个性和价值观','positive attitudes|积极的态度','先说课外书塑造价值观，再看故事和人物怎样产生影响。','learn…from… 表示从某个来源学到东西。'],
['long-term focus|长时间专注','logical thinking|逻辑思维','先看碎片化信息与读书的对比，再看读书训练的能力。','Unlike 引出对比对象，提示后面讲读书的不同。'],
['group reading activities|集体阅读活动','exchange different ideas|交流不同观点','先说集体阅读提升沟通，再看分享、讨论和合作的关系。','allow + 宾语 + to do 表示让某人能够做某事。']
],
[
['public library systems|公共图书馆体系','set up|设立','先看图书馆提供什么资源，再看不同年龄读者的阅读需要。','meeting 引出结果，说明专设阅读区如何满足需求。'],
['community medical services|社区医疗服务','physical examinations|体检','先看社区诊所服务，再看怎样缓解大医院压力。','solve 和 reduce 是并列谓语，列出两种结果。'],
['sports facilities|体育设施','be open to the public~open to the public|向公众开放','先列举免费运动场地，再看开放后的便利与影响。','allow citizens to exercise 表示让市民可以锻炼。'],
['bus routes|公交线路','dedicated bicycle lanes|自行车专用道','先看公共交通调整措施，再看出行成本和运行效率的变化。','optimizes、increases 和 sets up 是三个并列谓语。'],
['participate in|参与','public welfare activities|公益活动','先说志愿服务的作用，再列举参与领域及带来的影响。','help 后的 solve 和 spread 并列。']
],
[
['keep in touch with|与……保持联系','long-distance communication|远距离交流','先讲距离限制，再列举维持异地关系的沟通方式。','enable + 宾语 + to do 表示使某人能够做某事。'],
['face-to-face communication|面对面交流','facial expressions|面部表情','先对比线上和当面交流，再看间接表达的便利与局限。','Different from 在句首引出比较对象。'],
['social circles|社交圈','peers with the same hobbies|有相同爱好的同伴','先说社交圈扩大，再说明如何结识同好并获取新视角。','with the same hobbies 后置修饰 peers。'],
['indulge in|沉迷于','real-life relationships|现实中的人际关系','先说过度社交导致疏离，再顺着使用手机、忽视当面沟通的因果链理解。','ignoring 补充说明沉迷虚拟社交时被忽略的行为。'],
['social etiquette|社交礼仪','interpersonal relationships|人际关系','先说线上礼仪的重要性，再从回复、措辞和分享三个方面理解。','such as 引出网络交往规则的实例。']
],
[
['bring pressure to~brings great pressure to|给……带来压力','marriage certificate|结婚证','先写婚前准备，再看为何姓氏选择成为额外压力。','Apart from 引出已有事项，主句继续补充新的事项。'],
['maiden name|婚前姓氏','retain their original surnames|保留原姓','先对比传统要求与现代选择，再把握态度转变。','were required to do 是被动结构，表示被要求做某事。'],
['shared surname|共同姓氏','combine the two surnames with a hyphen|用连字符连接两个姓氏','先说可选方案，再看连字符如何兼顾双方。','while legally using… 是省略主语的时间状语结构。'],
['personal identity|个人身份','professional certifications|职业资格认证','先看个人身份，再看婚前姓氏与已有职业成就的联系。','gained under their maiden name 后置修饰前面的个人成就。'],
['regardless of|不管；不论','mutual companionship|相互陪伴','先说姓氏选择的意义，再落到婚姻中更重要的感情与陪伴。','Although 引导让步状语从句，主句指出重点。']
],
[
['in advance|提前','online booking fraud|线上预订诈骗','先看订房背景，再看预付款后发现骗局的意外结果。','only to find 表示出乎意料的结果。'],
['fake websites|虚假网站','tell them apart|把它们区分开','先写欺骗手法，再说明为什么普通人很难分辨。','so…that… 表示程度导致的结果。'],
['at a reasonable level|处在合理水平','keep people from feeling doubtful|让人不起疑心','先看目标地点，再看价格和搜索广告如何降低警觉。','keep + 宾语 + from doing 表示阻止某种行为发生。'],
['check website reliability|核查网站可信度','bank transfer|银行转账','先整理核验方法，再看专家建议的付款方式。','advise people not to pay 使用 advise + 宾语 + not to do。'],
['avoid being found|避免被发现','release warnings|发布警告','先说明为何难追查，再看官方提醒和个人防范的关系。','avoid 后接动名词，being found 同时表达被动。']
],
[
['career setbacks|职业挫折','conflicting results|相互矛盾的结果','先提出争议，再分辨失败可能带来的正反影响。','whether 引导宾语从句，提出两种可能。'],
['research funding|科研经费','professional titles|专业头衔','先看获得资助者的后续优势，再对比未获资助者。','who 引导定语从句，限定是哪一类研究者。'],
['research grants|科研资助','narrow winners|险胜者','先说明新研究的样本，再比较两组人后来的成果。','Among those who… 先限定比较所涉及的人群。'],
['fund distribution|经费分配','practical value|实际价值','先交代研究发现的应用意义，再理解更均衡的分配建议。','giving research funds… 是动名词短语，在 that 从句中作主语。'],
['proof of poor ability|能力不足的证据','long-term career gains|长期职业收益','先说传统看法，再看小挫折可能怎样带来长期收益。','not always 表示部分否定，意为并非总是。']
]];
for(let i=0;i<studyNotes.length;i++){
 const passage=root.READING_DATA.find(d=>d.id==='BF-MATCH-20261108-'+(i+1));
 studyNotes[i].forEach(([first,second,order,grammar],index)=>{
  const sentence=passage.sentences[index];
  const phrases=[first,second].map(row=>{
   const [expression,meaning]=row.split('|');
   const [term,surface=term]=expression.split('~');
   return {term,surface,meaning,usage:'可作为固定表达积累，结合上方原段理解。'};
  });
  root.READING_SENTENCE_DATA[passage.id+':'+index]={
   phrases,chunks:[{role:'原段对照',en:sentence.text,zh:sentence.translation}],
   order:[order],grammar:[{name:'本段重点结构',explanation:grammar}]
  };
 });
}

})(window);
