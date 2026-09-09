let bank=[];let currentQuery='';let currentCategory='全部';
/* =========================
   學習中心備用資料
   直接雙擊 index.html 時使用
========================= */

const FALLBACK_LEARNING_BANK = {
  featured: {
    id: "L001",
    title: "災損有補助　減免有方法",
    date: "115/07/13",
    category: "稅務管理及其他",
    summary: "房屋或車輛因災害受損時，可依規定申請房屋稅及使用牌照稅減免。災後請先拍照存證、備妥相關文件，並於規定期限內提出申請，以維護自身權益、減輕稅務負擔。",
    content: [
      "重點一：災後先保留證據\r\n災害造成房屋或車輛受損時，應先拍照存證，並保留相關證明文件，作為申請減免依據。",
      "重點二：把握申請期限\r\n房屋稅及使用牌照稅皆有申請期限，應於規定期間內提出申請，以免影響減免權益。",
      "重點三：符合條件可申請減免\r\n房屋毀損、淹水或車輛因災害受損無法使用，符合規定者可申請房屋稅或使用牌照稅減免，減輕災後負擔。"
    ],
    image: "assets/01.png",
    imageAlt: "本圖片是由AI產出。",
    imageCaption: "本圖片是由AI產出。"
  },

  news: [
    {
      id: "L002",
      title: "房屋稅2.0新制重點",
      date: "115/08/01",
      category: "房屋稅",
      summary: "房屋稅依實際使用情形、持有戶數及是否符合自住條件適用不同稅率。",
      content: [
        "自住房屋須無出租或營業，並供本人、配偶或直系親屬實際居住及完成戶籍登記。",
        "本人、配偶及未成年子女全國合計3戶內，可按一般自住稅率1.2%課徵。",
        "全國單一自住且房屋現值在一定金額以下者，可適用1%優惠稅率。"
      ]
    },
    {
      id: "L003",
      title: "娛樂稅修法重點",
      date: "115/07/28",
      category: "娛樂稅",
      summary: "快速掌握娛樂稅修法後的課稅範圍、免徵項目及生效日期。",
      content: [
        "先確認活動性質、是否收費，以及是否屬娛樂稅課徵範圍。",
        "部分藝文活動或特定活動依修法規定可免徵娛樂稅。",
        "答詢時應留意修法生效日，並以活動舉辦日期判斷適用規定。"
      ]
    },
    {
      id: "L004",
      title: "稅籍異動即時通",
      date: "115/07/20",
      category: "稅務管理及其他",
      summary: "名下不動產申報土地增值稅或契稅時，系統會即時發送通知，協助掌握移轉資訊。",
      content: [
        "服務開放全國民眾免費申請，即使目前名下沒有不動產也可先申請。",
        "可選擇簡訊、電子郵件或LINE接收通知。",
        "若申請全國通知，日後在其他縣市取得不動產，原則上不需重新申請。"
      ]
    }
  ]
};
const icons = {"房屋稅": "⌂","地價稅": "▱","契稅": "▤","土地增值稅": "△","使用牌照稅": "▰","娛樂稅": "♪","印花稅": "▧","納保及行政救濟": "♢","繳稅方式、電子繳款書及繳納證明": "＄","延分期相關": "◷","稅務管理及其他": "＋"};
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];

// 將新版 questionBank.js 的欄位正規化成 app.js 既有介面使用的格式。
// 保留原始欄位（包含 aliases / intent），避免影響新版 search.js。
function normalizeQuestion(item,index=0){
  const rawId=item?.id ?? item?.['編號'] ?? (index+1);
  const numericId=Number(rawId);
  const id=Number.isFinite(numericId)?numericId:String(rawId).trim();

  const parseList=value=>{
    if(Array.isArray(value))return value.map(x=>String(x).trim()).filter(Boolean);
    return String(value||'').split(/[、,，;；\n|]+/).map(x=>x.trim()).filter(Boolean);
  };
  const parseRelated=value=>{
    const list=Array.isArray(value)?value:String(value||'').split(/[、,，;；\s]+/);
    return list.map(v=>{
      const n=Number(v);
      return Number.isFinite(n)?n:String(v).trim();
    }).filter(v=>v!=='' && v!==null && v!==undefined);
  };

  const answer=String(item?.answer ?? item?.['完整答案'] ?? item?.['答案'] ?? '').trim();
  const popularRaw=item?.popular ?? item?.['熱門問題'];
  const popularText=String(popularRaw ?? '').trim().toLowerCase();

  return {
    ...item,
    id,
    category:String(item?.category ?? item?.['分類'] ?? '其他').trim()||'其他',
    question:String(item?.question ?? item?.['問題'] ?? '').trim(),
    summary:String(item?.summary ?? item?.['重點摘要'] ?? item?.['AI摘要'] ?? '').trim()||answer.slice(0,120),
    answer,
    legalBasis:String(item?.legalBasis ?? item?.['法規依據'] ?? item?.['法令依據'] ?? '').trim(),
    keywords:parseList(item?.keywords ?? item?.['關鍵字']),
    aliases:parseList(item?.aliases),
    intent:parseList(item?.intent),
    popular:popularRaw===true || ['是','true','1','yes','y'].includes(popularText),
    popularTitle:String(item?.popularTitle ?? item?.['熱門顯示名稱'] ?? item?.['常用查詢名稱'] ?? item?.['首頁顯示名稱'] ?? item?.['短標題'] ?? '').trim(),
    relatedIds:parseRelated(item?.relatedIds ?? item?.['相關題號']),
    version:String(item?.version ?? item?.['版本'] ?? '').trim()
  };
}
function normalizeBank(items){
  return Array.isArray(items)?items.map((item,index)=>normalizeQuestion(item,index)).filter(item=>item.question||item.answer):[];
}
function sameId(a,b){return String(a)===String(b)}

async function loadBank(){
  // 先使用 questionBank.js，確保每次替換 JS 後立即更新。
  if(Array.isArray(window.questionBank) && window.questionBank.length){
    bank=normalizeBank(window.questionBank);
  }
  // 網站環境下若沒有 questionBank.js，才嘗試讀取 JSON。
  if(!bank.length && location.protocol!=='file:'){
    try{
      const r=await fetch('questionBank.json',{cache:'no-store'});
      if(r.ok)bank=normalizeBank(await r.json());
    }catch(e){console.warn('questionBank.json 載入失敗',e)}
  }
  if(!bank.length){
    console.error('題庫載入失敗：找不到 questionBank.js 或 questionBank.json');
    alert('題庫載入失敗，請確認 questionBank.js 與 index.html 放在同一個資料夾。');
    return;
  }
  init();
}
function init(){
  $('#bankCount').textContent=bank.length;
  renderPopular();
  renderCategories();
  fillCategorySelect();
  bind();
  bindExcelImport();
  renderBank();

  /* 載入學習中心 */
  loadLearningCenter();
}
function bind(){$$('.nav-item').forEach(b=>b.onclick=()=>go(b.dataset.view));$$('.search-form').forEach(f=>f.onsubmit=e=>{e.preventDefault();const q=f.querySelector('.search-input').value.trim();runSearch(q)});$$('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));$('#bankFilter').oninput=renderBank;$('#categorySelect').onchange=renderBank;$$('[data-close]').forEach(x=>x.onclick=closeDrawer);$('#menuBtn').onclick=()=>$('.sidebar').classList.toggle('open');document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer()})}
const titles={
  home:[
    '首頁',
    '快速找到正確、完整的電話答詢內容'
  ],

  search:[
    '智慧搜尋',
    '自然語言查詢與答詢重點整理'
  ],

  learning:[
    '學習中心',
    '掌握重要稅務新聞與最新政策重點'
  ],

  bank:[
    '題庫瀏覽',
    '依業務分類檢視電話測試題庫'
  ],

  favorites:[
    '我的收藏',
    '建立個人常用答詢清單'
  ]
};
function go(v){$$('.view').forEach(x=>x.classList.remove('active'));$('#'+v+'View').classList.add('active');$$('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.view===v));$('#pageTitle').textContent=titles[v][0];$('#pageSubtitle').textContent=titles[v][1];$('.sidebar').classList.remove('open');if(v==='favorites')renderFavorites();window.scrollTo({top:0})}
function renderPopular(){
  const box=$('#popularSearches');
  if(!box)return;

  const popularItems=bank
    .filter(item=>item.popular===true)
    .slice(0,8);

  if(!popularItems.length){
    box.innerHTML='<span style="color:#708090;font-size:13px;padding:7px 0">目前尚未設定熱門問題</span>';
    return;
  }

  box.innerHTML='<span style="color:#708090;font-size:13px;padding:7px 0">🔥 熱門問題</span>'+popularItems.map(item=>{
    const fullQuestion=String(item.question||'');
    const customLabel=String(item.popularTitle||item.popularLabel||item.shortTitle||'').trim();
    const displayLabel=customLabel || (fullQuestion.length>18?fullQuestion.slice(0,18)+'…':fullQuestion);
    return `<button class="chip" data-popular-id="${item.id}" title="${escapeHtml(fullQuestion)}">${escapeHtml(displayLabel)}</button>`;
  }).join('');

  $$('#popularSearches [data-popular-id]').forEach(button=>{
    button.onclick=()=>openDetail(button.dataset.popularId);
  });
}
function renderCategories(){const counts={};bank.forEach(x=>counts[x.category]=(counts[x.category]||0)+1);$('#categoryCards').innerHTML=Object.entries(counts).map(([c,n])=>`<article class="category-card" data-cat="${c}"><div class="category-icon">${icons[c]||'•'}</div><h4>${c}</h4><p>${n} 題答詢內容</p></article>`).join('');$$('.category-card').forEach(x=>x.onclick=()=>{currentCategory=x.dataset.cat;runSearch('',currentCategory)})}
function fillCategorySelect(){const cats=['全部',...new Set(bank.map(x=>x.category))];$('#categorySelect').innerHTML=cats.map(c=>`<option>${c}</option>`).join('')}
function runSearch(q,cat='全部'){currentQuery=q;currentCategory=cat;$$('.search-input').forEach(i=>i.value=q);go('search');const data=TaxSearch.search(bank,q,cat);$('#searchMeta').innerHTML=`<span>${q?`「${escapeHtml(q)}」的搜尋結果`:(cat==='全部'?'熱門題目':cat)}</span><b>共 ${data.length} 筆</b>`;renderResults(data)}
function renderResults(data){$('#searchResults').innerHTML=data.length?data.slice(0,50).map(item=>`<article class="result-card" data-id="${item.id}"><div class="result-top"><span class="cat-tag">${item.category}</span></div><h3>${escapeHtml(item.question)}</h3><p>${escapeHtml(item.summary)}</p><div class="result-actions"><button class="small-btn" data-open="${item.id}">查看完整答詢</button><button class="small-btn fav-btn" data-fav="${item.id}">${isFav(item.id)?'★ 已收藏':'☆ 收藏'}</button></div></article>`).join(''):'<div class="empty">找不到相符題目，請改用較簡短的關鍵字或選擇業務分類。</div>';bindCards('#searchResults')}
function bindCards(root){$$(root+' [data-open]').forEach(b=>b.onclick=e=>{e.stopPropagation();openDetail(b.dataset.open)});$$(root+' [data-fav]').forEach(b=>b.onclick=e=>{e.stopPropagation();toggleFav(b.dataset.fav);if($('#favoritesView').classList.contains('active'))renderFavorites();else runSearch(currentQuery,currentCategory)});$$(root+' .result-card').forEach(c=>c.onclick=()=>openDetail(c.dataset.id))}
function renderBank(){const q=$('#bankFilter').value.trim();const cat=$('#categorySelect').value||'全部';const data=TaxSearch.search(bank,q,cat);$('#bankList').innerHTML=data.map(x=>`<div class="bank-row" data-id="${x.id}"><span class="bank-id">${String(x.id).padStart(3,'0')}</span><span class="bank-cat">${x.category}</span><span class="bank-q">${escapeHtml(x.question)}</span><span class="bank-arrow">›</span></div>`).join('');$$('.bank-row').forEach(r=>r.onclick=()=>openDetail(r.dataset.id))}
function getFavs(){try{return JSON.parse(localStorage.getItem('taxAIFavorites')||'[]')}catch{return[]}}function isFav(id){return getFavs().some(x=>sameId(x,id))}
function toggleFav(id){let a=getFavs();const exists=a.some(x=>sameId(x,id));a=exists?a.filter(x=>!sameId(x,id)):[...a,id];localStorage.setItem('taxAIFavorites',JSON.stringify(a));toast(!exists?'已加入收藏':'已取消收藏')}
function renderFavorites(){const ids=getFavs();const data=bank.filter(x=>ids.some(id=>sameId(id,x.id)));$('#favoriteList').innerHTML=data.length?data.map(item=>`<article class="result-card" data-id="${item.id}"><div class="result-top"><span class="cat-tag">${item.category}</span><span class="score">收藏題目</span></div><h3>${escapeHtml(item.question)}</h3><p>${escapeHtml(item.summary)}</p><div class="result-actions"><button class="small-btn" data-open="${item.id}">查看完整答詢</button><button class="small-btn" data-fav="${item.id}">★ 取消收藏</button></div></article>`).join(''):'<div class="empty">目前還沒有收藏題目。搜尋後點選「收藏」，就會出現在這裡。</div>';bindCards('#favoriteList')}
function openDetail(id){const x=bank.find(i=>sameId(i.id,id));if(!x)return;const related=(x.relatedIds||[]).map(r=>bank.find(i=>sameId(i.id,r))).filter(Boolean);$('#drawerContent').innerHTML=`<div class="detail-head"><span class="cat-tag">${x.category}</span><h2>${escapeHtml(x.question)}</h2><div class="detail-actions"><button class="primary-btn" data-copy>複製完整答詢</button><button class="small-btn" data-dfav>${isFav(id)?'★ 已收藏':'☆ 加入收藏'}</button></div></div><section class="detail-card ai"><h4>✨ 整理重點</h4><p>${escapeHtml(x.summary)}</p></section><section class="detail-card"><h4>標準答詢</h4><p>${escapeHtml(x.answer)}</p></section><section class="detail-card"><h4>相關問題推薦</h4><div class="related-list">${related.map(r=>`<button class="related-btn" data-related="${r.id}">${escapeHtml(r.question)}</button>`).join('')}</div></section><p style="color:#81909d;font-size:12px">題庫版本：${x.version}｜實際答詢仍應以最新法令、函釋及核定資料為準。</p>`;$('.drawer').classList.add('open');$('.drawer').setAttribute('aria-hidden','false');$('[data-copy]').onclick=()=>copyItem(x);$('[data-dfav]').onclick=()=>{toggleFav(id);openDetail(id)};$$('[data-related]').forEach(b=>b.onclick=()=>openDetail(b.dataset.related))}
function closeDrawer(){$('.drawer').classList.remove('open');$('.drawer').setAttribute('aria-hidden','true')}
async function copyItem(x){const t=`【${x.category}】
${x.question}

整理重點：
${x.summary}

標準答詢：
${x.answer}
`;try{await navigator.clipboard.writeText(t)}catch{const ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove()}toast('已複製完整答詢')}
function toast(t){$('#toast').textContent=t;$('#toast').classList.add('show');setTimeout(()=>$('#toast').classList.remove('show'),1600)}
function escapeHtml(s){return String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}

function bindExcelImport(){
  const btn=$('#importExcelBtn');
  const input=$('#excelFileInput');
  if(!btn||!input)return;
  btn.onclick=()=>input.click();
  input.onchange=async e=>{
    const file=e.target.files&&e.target.files[0];
    if(!file)return;
    if(typeof XLSX==='undefined'){
      toast('Excel 元件載入失敗，請確認網路連線');
      input.value='';
      return;
    }
    try{
      const data=await file.arrayBuffer();
      const workbook=XLSX.read(data,{type:'array'});
      const sheetName=workbook.SheetNames.includes('題庫')?'題庫':workbook.SheetNames[0];
      const rows=XLSX.utils.sheet_to_json(workbook.Sheets[sheetName],{defval:''});
      const converted=rows.map((row,index)=>excelRowToQuestion(row,index)).filter(Boolean);
      if(!converted.length)throw new Error('Excel 裡找不到可匯入的題目');
      const ids=new Set();
      for(const item of converted){
        if(ids.has(item.id))throw new Error(`編號 ${item.id} 重複`);
        ids.add(item.id);
      }
      bank=normalizeBank(converted);
      localStorage.setItem('taxAIExcelBank',JSON.stringify(bank));
      $('#bankCount').textContent=bank.length;
      renderPopular();renderCategories();fillCategorySelect();renderBank();
      toast(`已成功匯入 ${bank.length} 題`);
      go('bank');
    }catch(err){
      console.error(err);
      alert(`匯入失敗：${err.message}\n\n請確認 Excel 欄位包含：編號、分類、問題、重點摘要、完整答案、關鍵字。`);
    }finally{
      input.value='';
    }
  };
}

function excelRowToQuestion(row,index){
  const question=String(row['問題']||'').trim();
  const answer=String(row['完整答案']||row['答案']||'').trim();
  if(!question&&!answer)return null;
  const id=Number(row['編號'])||index+1;
  const keywords=String(row['關鍵字']||'')
    .split(/[、,，;；\n]+/)
    .map(x=>x.trim())
    .filter(Boolean);
  const relatedIds=String(row['相關題號']||'')
    .split(/[、,，;；\s]+/)
    .map(Number)
    .filter(Number.isFinite);
  const popularText=String(row['熱門問題']||'').trim().toLowerCase();
  return {
    id,
    category:String(row['分類']||'其他').trim()||'其他',
    question,
    popularTitle:String(
      row['熱門顯示名稱']
      || row['常用查詢名稱']
      || row['首頁顯示名稱']
      || row['短標題']
      || ''
    ).trim(),
    summary:String(row['重點摘要']||row['AI摘要']||'').trim()||answer.slice(0,120),
    answer,
    legalBasis:'',
    keywords,
    popular:['是','true','1','yes','y'].includes(popularText),
    relatedIds,
    version:String(row['版本']||'V115.7.21').trim()||'V115.7.21'
  };
}

loadBank();
/* =========================
   Tax AI 學習中心
========================= */

async function loadLearningCenter() {
  /*
    learningBank.js 可直接由本機 index.html 載入，
    因此只要替換 learningBank.js 即可更新學習中心。
  */
  let learningData =
    window.LEARNING_BANK ||
    FALLBACK_LEARNING_BANK;

  /*
    在 GitHub Pages 或網站空間上，
    若沒有 learningBank.js，才嘗試讀取
    learningBank.json。
  */
  if (
    !window.LEARNING_BANK &&
    location.protocol !== "file:"
  ) {
    try {
      const response = await fetch(
        "learningBank.json",
        { cache: "no-store" }
      );

      if (response.ok) {
        learningData = await response.json();
      }
    } catch (error) {
      console.warn(
        "learningBank.json 載入失敗，改用備用資料",
        error
      );
    }
  }

  renderLearningCenter(learningData);
}

function renderLearningCenter(data) {
  const featuredContainer = document.querySelector("#featuredLearning");
  const newsContainer = document.querySelector("#learningNews");
  if (!featuredContainer || !newsContainer) return;

  const featured = data?.featured || {};
  const news = Array.isArray(data?.news) ? data.news : [];

  const featuredCover = featured.thumbnail || featured.image;
  const featuredImage = featuredCover ? `
    <div class="featured-learning-visual" data-learning-featured role="button" tabindex="0" aria-label="閱讀${escapeLearningHtml(featured.title || "今日推薦")}">
      <img src="${escapeLearningHtml(featuredCover)}" alt="${escapeLearningHtml(featured.imageAlt || featured.title || "學習主題圖解")}" loading="lazy">
      <span><b>AI</b> 視覺圖解</span>
      <div class="featured-image-hint">查看完整內容 →</div>
    </div>` : "";

  featuredContainer.innerHTML = `
    <div class="featured-learning-layout">
      <div class="featured-learning-content">
        <div class="featured-learning-label">✦ 今日推薦</div>
        <h3>${escapeLearningHtml(featured.title || "今日稅務新知")}</h3>
        <p class="featured-learning-summary">${escapeLearningHtml(featured.summary || "快速掌握重要稅務資訊。")}</p>
        <div class="featured-learning-meta">
          <span>${escapeLearningHtml(featured.category || "稅務新知")}</span>
          <span>更新日期：${escapeLearningHtml(featured.date || "")}</span>
        </div>
        <button class="learning-start-btn" type="button" data-learning-featured>
          立即閱讀 <span aria-hidden="true">→</span>
        </button>
      </div>
      ${featuredImage}
    </div>`;

  if (!news.length) {
    newsContainer.innerHTML = `<div class="learning-loading">目前尚無最新學習主題。</div>`;
  } else {
    newsContainer.innerHTML = `<div class="learning-topic-cards">${news.map((item, index) => `
      <article class="learning-news-item" data-learning-news="${index}" tabindex="0">
        ${(item.thumbnail || item.image) ? `<div class="learning-news-thumb"><img src="${escapeLearningHtml(item.thumbnail || item.image)}" alt="${escapeLearningHtml(item.title || "學習主題縮圖")}" loading="lazy"><span>主題縮圖</span></div>` : `<div class="learning-news-thumb learning-news-thumb-empty">TAX AI</div>`}
        <div class="learning-news-body">
          <div class="learning-news-topline">
            <span class="learning-news-category">${escapeLearningHtml(item.category || "新知")}</span>
            <span class="learning-news-date">${escapeLearningHtml(item.date || "")}</span>
          </div>
          <div class="learning-news-main">
            <strong>${escapeLearningHtml(item.title || "")}</strong>
            <small>${escapeLearningHtml(item.summary || "點擊查看本則稅務新知重點。")}</small>
          </div>
          <span class="learning-card-link">查看內容 →</span>
        </div>
      </article>`).join("")}</div>`;
  }

  featuredContainer.querySelectorAll("[data-learning-featured]").forEach(el => {
    const openFeatured = () => openLearningArticle(featured);
    el.addEventListener("click", openFeatured);
    el.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openFeatured(); }
    });
  });

  newsContainer.querySelectorAll("[data-learning-news]").forEach(itemElement => {
    const openItem = () => openLearningArticle(news[Number(itemElement.dataset.learningNews)]);
    itemElement.addEventListener("click", openItem);
    itemElement.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openItem(); }
    });
  });
}

function openLearningArticle(article) {
  if (!article) {
    return;
  }

  const content = Array.isArray(article.content)
    ? article.content
    : [];

  const contentHtml = content.length
    ? `<section class="detail-card learning-points-card">
        <div class="learning-card-heading">
          <span class="learning-section-icon">✓</span>
          <div><small>KEY POINTS</small><h4>學習重點</h4></div>
        </div>
        <div class="learning-article-points">
          ${content.map((item, index) => {
            const parts = String(item || "").split(/\r?\n/);
            const heading = parts.shift() || `重點 ${index + 1}`;
            const text = parts.join("\n");
            return `<article class="learning-point-item">
              <span class="learning-point-number">${String(index + 1).padStart(2, "0")}</span>
              <div><strong>${escapeLearningHtml(heading.replace(/^重點[一二三四五六七八九十\d]+[：:]?\s*/, ""))}</strong>${text ? `<p>${escapeLearningHtml(text)}</p>` : ""}</div>
            </article>`;
          }).join("")}
        </div>
      </section>`
    : `<section class="detail-card ai"><h4>✨ 重點整理</h4><p>${escapeLearningHtml(article.summary || "目前尚未提供詳細學習內容。")}</p></section>`;

  const visualHtml = article.image
    ? `
      <section class="detail-card learning-visual-card">
        <div class="learning-card-heading">
          <span class="learning-section-icon">AI</span>
          <div>
            <small>VISUAL LEARNING</small>
            <h4>AI 視覺圖解</h4>
          </div>
        </div>

        <figure class="learning-figure">
          <img
            class="learning-zoomable-image"
            src="${escapeLearningHtml(article.image)}"
            alt="${escapeLearningHtml(article.imageAlt || article.title || "AI 視覺圖解")}"
            loading="lazy"
          >
          <div class="learning-zoom-hint">點擊圖片放大查看</div>
          <figcaption>
            ${escapeLearningHtml(
              article.imageCaption ||
              "本圖為 AI 輔助製作的學習示意圖，請搭配內容摘要與最新規定閱讀。"
            )}
          </figcaption>
        </figure>
      </section>
    `
    : `
      <section class="detail-card learning-visual-empty">
        <span class="learning-section-icon">AI</span>
        <div>
          <h4>AI 視覺圖解</h4>
          <p>這個主題尚未加入圖解。日後只要在 Excel 填入 AI 圖片檔名、圖片說明及圖片圖說，重新產生 learningBank.js 後就會自動顯示。</p>
        </div>
      </section>
    `;

  const drawerContent =
    document.querySelector("#drawerContent");

  if (!drawerContent) {
    return;
  }

  drawerContent.innerHTML = `
    <div class="detail-head">
      <span class="cat-tag">
        ${escapeLearningHtml(
          article.category || "稅務新知"
        )}
      </span>

      <h2>
        ${escapeLearningHtml(
          article.title || "稅務新知"
        )}
      </h2>

      <p>
        更新日期：
        ${escapeLearningHtml(
          article.date || ""
        )}
      </p>
    </div>

    <section class="detail-card">
      <h4>內容摘要</h4>
      <p>
        ${escapeLearningHtml(
          article.summary || ""
        )}
      </p>
    </section>

    ${contentHtml}

    ${visualHtml}

    <p
      style="
        color:#81909d;
        font-size:12px;
        line-height:1.7;
      "
    >
      本內容為學習重點整理，實際答詢仍應以最新公告、
      法令及業務單位確認內容為準。
    </p>
  `;

  const zoomImage = drawerContent.querySelector(".learning-zoomable-image");
  if (zoomImage) zoomImage.addEventListener("click", () => openLearningImage(zoomImage.src, zoomImage.alt));

  const drawer = document.querySelector("#detailDrawer");
  drawer.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
}

function openLearningImage(src, alt) {
  let lightbox = document.querySelector("#learningImageLightbox");
  if (!lightbox) {
    lightbox = document.createElement("div");
    lightbox.id = "learningImageLightbox";
    lightbox.className = "learning-lightbox";
    lightbox.innerHTML = `<button type="button" aria-label="關閉圖片">×</button><img alt="">`;
    document.body.appendChild(lightbox);
    lightbox.addEventListener("click", event => { if (event.target === lightbox || event.target.tagName === "BUTTON") lightbox.classList.remove("open"); });
  }
  const image = lightbox.querySelector("img");
  image.src = src;
  image.alt = alt || "AI 視覺圖解";
  lightbox.classList.add("open");
}

function escapeLearningHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
