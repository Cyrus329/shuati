(() => {
  const status = document.querySelector('#restoreTimerStatus');
  document.querySelector('#restoreLegacyTimer').onclick = () => {
    try {
      const old = loadStudyTime(); const before = state.studyTime.totalSeconds;
      restoreStudyTimeFromArchive(old);
      status.textContent = state.studyTime.totalSeconds > before ? '已恢复：累计 ' + formatStudyTime(state.studyTime.totalSeconds) : '当前累计 ' + formatStudyTime(state.studyTime.totalSeconds) + '。未找到更长的旧记录；请从旧版完整备份恢复。';
    } catch(e) { status.textContent = e.message; }
  };
  document.querySelector('#restoreTimerArchive').onchange = async event => {
    const file = event.target.files?.[0]; if(!file)return;
    try { restoreStudyTimeFromArchive(JSON.parse(await file.text())); status.textContent = '已恢复：累计 ' + formatStudyTime(state.studyTime.totalSeconds); }
    catch(e){status.textContent = e.message === '存档没有学习时长记录' ? '这份存档不含时长。旧版专注存档没有保存时长，请使用首页导出的完整备份。' : '恢复失败：' + e.message;}
    finally {event.target.value='';}
  };
  document.querySelector('#restartStudyTimer').onclick = async () => {
    const button = document.querySelector('#restartStudyTimer');
    button.disabled = true;
    try {
      const fresh = {totalSeconds:0,todaySeconds:0,today:todayKey(),updatedAt:new Date().toISOString()};
      await mobileDbWriteChain;
      const db = await openMobileDatabase();
      await new Promise((resolve,reject) => {
        const tx=db.transaction(MOBILE_DB_STORE,'readwrite'), store=tx.objectStore(MOBILE_DB_STORE);
        const req=store.getAll();
        req.onsuccess=()=>{for(const row of req.result||[]){
          if(row.key==='study-time-primary'){row.studyTime=fresh;store.put(row);}
          else if([MOBILE_DB_PRIMARY_KEY,MOBILE_DB_PREVIOUS_KEY].includes(row.key)&&row.payload){row.payload.studyTime=fresh;store.put(row);}
        }};
        tx.oncomplete=resolve;tx.onerror=tx.onabort=()=>reject(tx.error||Error('时长重置未保存'));
      });
      const keys=new Set([STUDY_TIME_KEY,STUDY_TIME_KEY+':last-good','word-memory-phrases220-b225:study-time:v1']);
      for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(/^word-memory-phrases220-b225.*study[-:]time/i.test(k||''))keys.add(k);}
      for(const key of keys)localStorage.setItem(key,JSON.stringify(fresh));
      state.studyTime=fresh;studyTimeTracker.lastTickAt=Date.now();studyTimeTracker.dirtySeconds=0;
      saveStudyTime();await saveWordsDurably({skipCloud:true});renderStudyTime();
      status.textContent='已从零重新计时；单词、背诵进度和学习记录保留。';
    } catch(e){status.textContent='未完成重置：'+e.message;}finally{button.disabled=false;}
  };
  document.querySelector('#exportTimerArchive').onclick = () => {
    tickStudyTime(true);
    const url=URL.createObjectURL(new Blob([JSON.stringify({app:'学习时长备份',version:1,studyTime:normalizeStudyTime(state.studyTime)},null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='学习时长备份-'+todayKey()+'.json';a.click();URL.revokeObjectURL(url);
  };
})();
