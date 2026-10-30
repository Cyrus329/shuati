// v70 B210 2026-09-29：专注复习改用独立 reviewProgress，不再读取普通主存档到期词。
// v70 B187 2026-09-22：关闭旧 B168 强制防回退；正常自动保存与滚动双快照继续保留。
// v70 B186 2026-09-20：专用独立档案可清除旧快照后精确替换，防止被旧进度保护弹回。
// v70 B185 2026-09-20：固定搭配拼写只核对英文单词与顺序，格式符号全部忽略。
// v70 B184 2026-09-20：固定搭配拼写保持词和符号一一对应，忽略无意义格式差异。
// v70 B183 2026-09-20：拼写答错立即重置周期；支持用户主动精确恢复快速复盘分类。
// v70 B182 2026-09-20：彻底移除个人黄金存档自动注入；增加覆盖前快照恢复页；每10词小复盘默认关闭并提供真实开关。
// v70 B181 2026-09-19：快速复盘增加 IndexedDB 双重存档与自动合并恢复。
// v70 B180 2026-09-19：同一英文答案跨词库/专项共享拼写记录，旧ID记录自动合并。
// v70 B178 2026-09-19：固定搭配专项与拼写入口缓存更新。
// v70 B177 2026-09-18：导入 Unit 10 Lesson 3/4 与四级翻译政治/经济；缓存版本同步升级。
// v70 B176 2026-09-18：修复“学习进度异常回退”误报；辅助历史暂少不再阻断真实进度保存，核心已学习数/累计时长仍硬保护。
// v70 B171 2026-09-16：复习冷却锁 + Unit10政治法律主学习分组补齐。
// v70 B170 2026-09-16：修复拼写训练中文释义显示为 [object Object]；按分组优先显示对应中文释义。
// v70 B169 2026-09-16：快速存档改为黄金基线后的轻量增量；完整进度继续由 IndexedDB 保存，修复 localStorage 配额警告。
// v70 B168 2026-09-16：黄金基线自动恢复 + 进度安全快照 + 灾难性回退拦截。
// B145: 常规印刷字体与发音失败恢复；词库、存档键保持不变。
// v70 B144 2026-09-08：主单词改为书本印刷体；保留B143界面与B142词库、学习进度。
// v70 B131 2026-08-31：新增四级核心Unit8-10、Unit8 Lesson2与蓝色森林58；保留B130听力4、快速30词与Peppa。
// v70 B129 2026-08-30：新增四级翻译5《中国结》词库/资料夹缓存；保留B128快速30词与Peppa。
// v70 B128 2026-08-30：快速30词词性标签 + Unit7/今日词导入；保留B127 Peppa。
// v70 B127 2026-08-30：Peppa 句子测试效应、S1E02 与逐句知识点离线资源。
// v70 B126 2026-08-30：刷新安全去重与30词快速复盘资源；Peppa与主学习进度不变。
// v70 B122 2026-08-29：刷新词典式 IPA 显示样式缓存；词库与学习进度不变。
// v70 B121 2026-08-29：刷新第一集完整台词、默写与裸听训练资源。
// v70 B120 2026-08-28：刷新小猪佩奇英音发音检测与学习内容迁移资源。
// v70 B119 2026-08-28：新增小猪佩奇英语专区离线资源。
// v70 B118 2026-08-28：刷新四级听力3词库/资料夹缓存；保持B117去重迁移。
// v70 B117 2026-08-28：刷新全词库去重归并、旧ID别名迁移与运行时安全去重资源缓存。
// v70 B116 2026-08-28：刷新四级翻译 3「冬至」词库/资料夹资源缓存。
// v70 B113 2026-08-27：刷新四级听力2词库/分组/排序资源缓存。
// v70 B112 2026-08-27：刷新全量缺失音标补齐资源缓存。
// v70 B109 2026-08-27：仅刷新词库资源缓存版本；训练逻辑不变。
const CACHE_NAME = "word-memory-phrases220-b225-shell-pages-aef4fcdcfab02a58e8b4";
const SCENE_ASSETS_101_180 = [];
const SCENE_ASSETS_181_260 = [];
const SCENE_ASSETS_261_280 = [];
const APP_ASSETS = [
  "./sense-learning.js?v=b226p220",
  "./guided-learning.js?v=b226p220", "./guided-learning.css?v=b226p220",
  "./phonetic-local-data.js?v=70b162",
  "./pronunciation-support.js?v=70b162",
  "./speed-review-merge.js?v=164",
  "./storage-codec.js?v=163",
  "./styles.css?v=70b211",
  "./learning-policy.js?v=b226p220",
  "./spelling-answers.js?v=b226p220",
  "./timer-recovery.js?v=b226p220",
  "./speed-review-merge.js",
  "./storage-codec.js", "./storage-rescue.js",
  "./restore-previous-progress.html?v=70b183",
  "./phonetic-local-data.js",
  "./pronunciation-support.js",
  "./startup.js?v=b226p220",
  "./spelling-hub.js?v=70b226p220",
  "./spelling-hub.css?v=70b210",
  "./reset-local.js?v=70b151",
  "./mobile-polish.css?v=70b150",
  "./",
  "./index.html", "./restore-b223.css?v=b226p220", "./restore-b223.js?v=b226p220",
  "./review-ledger-bridge.html",
  "./word-data.js?v=70b226p220",
  "./cet4-topic5-verb-phrases-b188.js?v=70b188",
  "./fixed-collocation-data.js?v=70b179",
  "./library-folder-data.js?v=70b226p220",
  "./context-engine.js?v=70b038vocabimport20260809",
  "./context-data.js?v=70b056statsvocab20260820",
  "./context-id-data.js?v=70b056statsvocab20260820",
  "./context-presenter.js?v=70b038vocabimport20260809",
  "./context-study-engine.js?v=70b038vocabimport20260809",
  "./mobile-focus.js?b226p220",
  "./image-memory.js?v=70b071images280checkpoint20260821",
  "./assets/pronunciation-primer.wav?v=70b060fullstart20260820",
  "./app.js?b226p220",
  "./peppa-content-b127.js?v=70b127peppatesting20260830",
  "./peppa-zone.js?v=70b151",
  "./memory-lab.js?v=70b182",
  "./speed-review.js?v=70b183",
  "./browse-quiz.js?v=70b151",
  "./folder-view.js?v=70b143",
  "./ui-refresh.css?v=70b145",
  "./ui-refresh.js?v=70b144",
  "./smart-vocab.js?v=70b106cet4listen20260826",
  "./styles.css?v=70b153quickcoach",
  "./supabase-word-memory-repair.sql",
  "./manifest.webmanifest",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
].concat(SCENE_ASSETS_101_180, SCENE_ASSETS_181_260, SCENE_ASSETS_261_280);

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key.startsWith("word-memory-phrases220-b225-shell-") && key !== CACHE_NAME).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      if (response.ok && new URL(event.request.url).origin === self.location.origin) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      }
      return response;
    }).catch(() => caches.match("./index.html")))
  );
});
