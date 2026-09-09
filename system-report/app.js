const STORAGE_KEY="status_center_integrated_redesign_v1";
const API_BASE="https://tax-status-api.ddy88000000.workers.dev";

let db={incidents:[]};
let selectedIssue=ISSUES[0];
let quickAction={mode:null,id:null};
let pendingCloseId=null;
let adminFilter="active";
let isSyncing=false;

// ===== API / Email =====
const NOTIFICATION_API=`${API_BASE}/send-notification`;
const RECOVERY_NOTIFICATION_API=`${API_BASE}/send-recovery`;
const INCIDENTS_API=`${API_BASE}/api/incidents`;
const RECIPIENTS_API=`${API_BASE}/api/recipients`;
let recipientSettings=[];

// localStorage 在這一版只當「暫時備份」，D1 才是正式共用資料來源。
function saveLocalBackup(){
  localStorage.setItem(STORAGE_KEY,JSON.stringify(db));
}

function readLocalBackup(){
  try{
    return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{"incidents":[]}');
  }catch{
    return {incidents:[]};
  }
}

async function sendInitialIncidentNotification({branch,systemName,issueType,note}){
  const response=await fetch(NOTIFICATION_API,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({branch,systemName,issueType,note})
  });

  const text=await response.text();
  if(!response.ok){
    throw new Error(text || `HTTP ${response.status}`);
  }
  return text;
}

async function sendRecoveryNotification({systemName,affectedBranches}){
  const response=await fetch(RECOVERY_NOTIFICATION_API,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({systemName,affectedBranches})
  });

  const text=await response.text();
  if(!response.ok){
    throw new Error(text || `HTTP ${response.status}`);
  }
  return text;
}

// ===== D1 共用資料 =====
async function loadIncidentsFromD1({silent=false}={}){
  if(isSyncing)return;
  try{
    const response=await fetch(INCIDENTS_API,{cache:"no-store"});
    const data=await response.json();

    if(!response.ok || !data.success){
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    db={incidents:Array.isArray(data.incidents)?data.incidents:[]};
    saveLocalBackup();

    // 舊資料若已全部恢復，補做自動結案後同步回 D1。
    const changed=[];
    db.incidents.forEach(i=>{
      if(i.status!=="closed" && autoCloseIfAllRecovered(i)) changed.push(i);
    });

    renderAll();

    for(const incident of changed){
      await persistIncidentToD1(incident);
    }
  }catch(error){
    console.error("讀取 D1 失敗",error);
    const backup=readLocalBackup();
    if(Array.isArray(backup.incidents)){
      db=backup;
      renderAll();
    }
    if(!silent){
      toast("共用資料暫時無法讀取，目前顯示本機備份。");
    }
  }
}

async function persistIncidentToD1(incident,{create=false}={}){
  if(!incident)throw new Error("缺少案件資料");

  const url=create
    ? INCIDENTS_API
    : `${INCIDENTS_API}/${encodeURIComponent(incident.id)}`;

  const response=await fetch(url,{
    method:create?"POST":"PUT",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({incident})
  });

  const data=await response.json().catch(()=>({}));
  if(!response.ok || !data.success){
    throw new Error(data.error || `HTTP ${response.status}`);
  }
  return data;
}

async function saveIncident(incident,{create=false}={}){
  if(!incident)return;

  // 每次更新都先重新判斷是否符合自動結案。
  autoCloseIfAllRecovered(incident);
  saveLocalBackup();
  renderAll();

  isSyncing=true;
  try{
    await persistIncidentToD1(incident,{create});
  }finally{
    isSyncing=false;
  }
}

async function deleteIncidentFromD1(id){
  const response=await fetch(`${INCIDENTS_API}/${encodeURIComponent(id)}`,{
    method:"DELETE"
  });

  const data=await response.json().catch(()=>({}));
  if(!response.ok || !data.success){
    throw new Error(data.error || `HTTP ${response.status}`);
  }
  return data;
}

const NOTIFICATION_UNITS=["企劃服務科","資訊室",...BRANCHES];

async function loadRecipientSettings(){
  const response=await fetch(RECIPIENTS_API,{cache:"no-store"});
  const data=await response.json();
  if(!response.ok || !data.success) throw new Error(data.error || `HTTP ${response.status}`);
  const current=new Map((data.recipients||[]).map(item=>[item.unit_name,{unit_name:item.unit_name,email:item.email||"",is_active:Number(item.is_active)===0?0:1}]));
  recipientSettings=NOTIFICATION_UNITS.map(unitName=>current.get(unitName)||{unit_name:unitName,email:"",is_active:1});
}

function escapeAttribute(value){
  return String(value??"").replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}

function renderRecipientSettings(){
  const box=document.getElementById("recipientSettingsList");
  if(!box)return;
  box.innerHTML=recipientSettings.map((item,index)=>`
    <div class="recipient-setting-row">
      <div class="recipient-unit"><span class="recipient-unit-type">${item.unit_name.endsWith("分處")?"分處":"處理端"}</span><strong>${item.unit_name}</strong></div>
      <input class="recipient-email-input" type="email" data-recipient-index="${index}" value="${escapeAttribute(item.email||"")}" placeholder="請輸入通知 Email" autocomplete="off">
      <label class="recipient-active-toggle"><input type="checkbox" data-recipient-active-index="${index}" ${item.is_active===0?"":"checked"}><span>啟用</span></label>
    </div>`).join("");
}

async function openNotificationSettings(){
  const status=document.getElementById("recipientSaveStatus"); if(status)status.textContent="";
  openModal("notificationSettingsModal");
  const box=document.getElementById("recipientSettingsList"); if(box)box.innerHTML='<div class="recipient-loading">正在讀取最新通知設定…</div>';
  try{await loadRecipientSettings();renderRecipientSettings();}
  catch(error){console.error("讀取通知設定失敗",error);if(box)box.innerHTML='<div class="recipient-loading error">通知設定讀取失敗，請稍後再試。</div>';}
}

async function saveNotificationSettings(){
  const status=document.getElementById("recipientSaveStatus"),saveBtn=document.getElementById("saveNotificationSettings");
  document.querySelectorAll("[data-recipient-index]").forEach(input=>{const i=Number(input.dataset.recipientIndex);if(recipientSettings[i])recipientSettings[i].email=input.value.trim();});
  document.querySelectorAll("[data-recipient-active-index]").forEach(input=>{const i=Number(input.dataset.recipientActiveIndex);if(recipientSettings[i])recipientSettings[i].is_active=input.checked?1:0;});
  const invalid=recipientSettings.find(item=>item.is_active===1&&item.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.email));
  if(invalid){if(status)status.textContent=`${invalid.unit_name} 的 Email 格式看起來不正確`;return;}
  try{
    if(saveBtn)saveBtn.disabled=true;if(status)status.textContent="儲存中…";
    const response=await fetch(RECIPIENTS_API,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({recipients:recipientSettings})});
    const data=await response.json();if(!response.ok||!data.success)throw new Error(data.error||`HTTP ${response.status}`);
    if(status)status.textContent="已儲存";toast(`通知設定已更新，共 ${data.updated||recipientSettings.length} 個單位。`);await loadRecipientSettings();renderRecipientSettings();
  }catch(error){console.error("通知設定儲存失敗",error);if(status)status.textContent="儲存失敗，請稍後再試";toast("通知設定儲存失敗。");}
  finally{if(saveBtn)saveBtn.disabled=false;}
}

function autoCloseIfAllRecovered(i){
  if(!i || i.status==="closed") return false;

  const states=stateMap(i);
  const branches=Object.keys(states);

  // 必須至少曾有一個分處回報過此案件
  if(branches.length===0) return false;

  // 目前只要還有任何一個分處為異常，就不能自動結案
  const hasBad=branches.some(branch=>states[branch]==="bad");
  if(hasBad) return false;

  // 所有曾回報的分處目前都必須是「已恢復」
  const allRecovered=branches.every(branch=>states[branch]==="good");
  if(!allRecovered) return false;

  i.status="closed";

  // 避免重複寫入自動結案紀錄
  const alreadyLogged=i.events.some(e=>
    e.type==="closed" &&
    e.auto===true &&
    e.text==="所有受影響分處皆已恢復正常，系統自動結案"
  );

  if(!alreadyLogged){
    i.events.push({
      type:"closed",
      auto:true,
      time:nowText(),
      text:"所有受影響分處皆已恢復正常，系統自動結案"
    });
  }
  return true;
}

function reconcileAutoClose(){
  let changed=false;
  db.incidents.forEach(i=>{
    if(i.status!=="closed" && autoCloseIfAllRecovered(i)) changed=true;
  });
  return changed;
}

function nowText(){
  const d=new Date();
  return `${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}
function uid(){return "INC-"+Date.now().toString().slice(-8)}
function toast(msg){
  const el=document.createElement("div");el.className="toast";el.textContent=msg;
  document.getElementById("toastArea").appendChild(el);setTimeout(()=>el.remove(),2400)
}
function openModal(id){document.getElementById(id).classList.add("open")}
function closeModal(id){document.getElementById(id).classList.remove("open")}
function getIncident(id){return db.incidents.find(x=>x.id===id)}
function activeIncidents(){return db.incidents.filter(i=>i.status!=="closed")}
function latestTime(i){return i.events.length?i.events[i.events.length-1].time:i.createdAt}

function stateMap(i){
  const map={};
  i.events.forEach(e=>{
    if(!e.branch)return;
    if(["initial","also","issue_update","still_bad"].includes(e.type)) map[e.branch]="bad";
    if(e.type==="restored") map[e.branch]="good";
  });
  return map;
}
function badBranches(i){const m=stateMap(i);return Object.keys(m).filter(b=>m[b]==="bad")}
function goodBranches(i){const m=stateMap(i);return Object.keys(m).filter(b=>m[b]==="good")}
function allBranches(i){return Object.keys(stateMap(i))}
function untouchedBranches(i){const used=new Set(allBranches(i));return BRANCHES.filter(b=>!used.has(b))}
function issueTypes(i){
  const arr=[];
  i.events.forEach(e=>{
    if(e.issueType && !arr.includes(e.issueType)) arr.push(e.issueType)
  });
  if(!arr.length && i.issueType) arr.push(i.issueType);
  return arr;
}
function statusMeta(i){
  if(i.status==="reported") return {label:"疑似異常",cls:"warning",summary:"尚待確認異常情形及後續處理"};
  if(i.status==="forwarded") return {label:"處理中",cls:"processing",summary:"已進入後續處理階段"};
  if(i.status==="restore_wait") return {label:"待確認恢復",cls:"restore",summary:"系統已接獲恢復通知，等待分處實際確認"};
  return {label:"已結案",cls:"success",summary:"事件已完成結案"};
}

async function init(){
  const opts=BRANCHES.map(b=>`<option>${b}</option>`).join("");
  document.getElementById("reportBranch").innerHTML=opts;
  document.getElementById("quickBranch").innerHTML=opts;
  document.getElementById("reportSystem").innerHTML=SYSTEMS.map(s=>`<option>${s}</option>`).join("");
const reportSystem = document.getElementById("reportSystem");
const otherSystemWrap = document.getElementById("otherSystemWrap");
const otherSystemName = document.getElementById("otherSystemName");

reportSystem.addEventListener("change", () => {
  const isOther =
    reportSystem.value === "其他系統" ||
    reportSystem.value === "其他";

  otherSystemWrap.classList.toggle("hidden", !isOther);

  if (!isOther) {
    otherSystemName.value = "";
  }
});

  const issueBox=document.getElementById("issueOptions");
  issueBox.innerHTML=ISSUES.map((x,i)=>`<button class="issue-option ${i===0?"active":""}" data-issue="${x}">${x}</button>`).join("");
issueBox.querySelectorAll(".issue-option").forEach(btn=>{
  btn.onclick=()=>{
    issueBox.querySelectorAll(".issue-option").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");
    selectedIssue=btn.dataset.issue;

    const otherIssueWrap=document.getElementById("otherIssueWrap");
    const otherIssueText=document.getElementById("otherIssueText");

    const isOther=selectedIssue==="其他";

    otherIssueWrap.classList.toggle("hidden",!isOther);

    if(!isOther){
      otherIssueText.value="";
    }
  }
});
  document.getElementById("openReportBtn").onclick=()=>openModal("reportModal");
  document.getElementById("submitReport").onclick=submitReport;
  document.getElementById("quickConfirm").onclick=confirmQuick;
  document.getElementById("confirmCloseBtn").onclick=confirmClose;
  const notificationSettingsBtn=document.getElementById("openNotificationSettings");
  if(notificationSettingsBtn)notificationSettingsBtn.onclick=openNotificationSettings;
  const saveNotificationSettingsBtn=document.getElementById("saveNotificationSettings");
  if(saveNotificationSettingsBtn)saveNotificationSettingsBtn.onclick=saveNotificationSettings;
  const adminPasswordSubmit=document.getElementById("adminPasswordSubmit");
  const adminPasswordInput=document.getElementById("adminPasswordInput");
  if(adminPasswordSubmit) adminPasswordSubmit.onclick=submitAdminPassword;
  if(adminPasswordInput){
    adminPasswordInput.addEventListener("keydown",e=>{
      if(e.key==="Enter") submitAdminPassword();
    });
  }
  document.querySelectorAll(".admin-tab").forEach(btn=>{
    btn.onclick=()=>{
      adminFilter=btn.dataset.filter;
      document.querySelectorAll(".admin-tab").forEach(x=>x.classList.toggle("active",x===btn));
      renderAdmin();
    };
  });
  const adminToggle=document.getElementById("adminToggle");
  if(adminToggle){
    adminToggle.onclick=()=>openAdminPassword();
  }
  document.getElementById("backToUser").onclick=()=>{
    document.getElementById("adminView").classList.add("hidden");
    document.getElementById("userView").classList.remove("hidden");
    window.scrollTo({top:0,behavior:"smooth"});
  };

  document.querySelectorAll("[data-close]").forEach(btn=>btn.onclick=()=>closeModal(btn.dataset.close));
  document.querySelectorAll(".modal").forEach(m=>m.onclick=e=>{if(e.target===m)closeModal(m.id)});

  // 先顯示本機備份，隨即以 D1 共用資料覆蓋。
  const backup=readLocalBackup();
  if(Array.isArray(backup.incidents)) db=backup;
  renderAll();

  await loadIncidentsFromD1();

  // 共用狀態定期更新：
  // 即使此頁不是目前焦點，也持續向 D1 檢查最新案件。
  setInterval(()=>{
    loadIncidentsFromD1({silent:true});
  },5000);

  // 使用者切回這個分頁時，再立即同步一次。
  document.addEventListener("visibilitychange",()=>{
    if(!document.hidden){
      loadIncidentsFromD1({silent:true});
    }
  });

  // 視窗重新取得焦點時也立即同步。
  window.addEventListener("focus",()=>{
    loadIncidentsFromD1({silent:true});
  });
}

async function submitReport(){
  const branch=document.getElementById("reportBranch").value;const selectedSystem=document.getElementById("reportSystem").value;

const systemName=
  selectedSystem==="其他" || selectedSystem==="其他系統"
    ? document.getElementById("otherSystemName").value.trim()
    : selectedSystem;
if(!systemName){
  toast("請輸入系統名稱");
  return;
}
  const note=document.getElementById("reportNote").value.trim();

  // 送出前先抓一次共用資料，降低兩台電腦同時建立相同系統事件的機率。
  await loadIncidentsFromD1({silent:true});

  // 同一系統 = 同一筆進行中事件
  const existing=activeIncidents().find(i=>i.systemName===systemName);

  if(existing){
    const currentState=stateMap(existing)[branch];
    let type="also";
    let text=`${branch} 回報系統異常：${selectedIssue}${note?`（${note}）`:""}`;

    if(currentState==="bad"){
      type="issue_update";
      text=`${branch} 補充異常情形：${selectedIssue}${note?`（${note}）`:""}`;
    }else if(currentState==="good"){
      type="still_bad";
      text=`${branch} 再次回報異常：${selectedIssue}${note?`（${note}）`:""}`;
    }

    existing.events.push({
      type,branch,issueType:selectedIssue,note,time:nowText(),text
    });

    document.getElementById("reportNote").value="";
    closeModal("reportModal");

    try{
      await saveIncident(existing);
      toast(`已併入「${systemName}」既有事件，並同步全處。`);
    }catch(error){
      console.error("案件同步失敗",error);
      toast("回報已暫存，但共用資料同步失敗，請稍後再試。");
    }
    return;
  }

  const t=nowText();
  const incident={
    id:uid(),
    createdAt:t,
    systemName,
    status:"reported",
    events:[{
      type:"initial",
      branch,
      issueType:selectedIssue,
      note,
      time:t,
      text:`${branch} 首次回報：${selectedIssue}${note?`（${note}）`:""}`
    }]
  };

  db.incidents.unshift(incident);
  document.getElementById("reportNote").value="";
  closeModal("reportModal");
  saveLocalBackup();
  renderAll();

  // 先確定案件已寫進共用 D1，再寄首次通知。
  try{
    toast("正在建立共用異常事件…");
    await saveIncident(incident,{create:true});
  }catch(error){
    console.error("D1 建立案件失敗",error);
    db.incidents=db.incidents.filter(x=>x.id!==incident.id);
    saveLocalBackup();
    renderAll();
    toast("共用案件建立失敗，請稍後再試。");
    return;
  }

  try{
    toast("異常事件已同步，正在寄送通知…");
    await sendInitialIncidentNotification({
      branch,
      systemName,
      issueType:selectedIssue,
      note
    });
    toast("異常事件已同步全處，通知信已自動寄出。");
  }catch(error){
    console.error("通知信寄送失敗",error);
    toast("案件已同步全處，但通知信寄送失敗，請稍後再確認。");
  }
}

function renderAll(){
  renderSummary();
  renderIncidents();
  renderRecent();
  renderAdmin();
}

function renderSummary(){
  const active=activeIncidents();
  const bar=document.getElementById("summaryBar");
  const symbol=document.getElementById("summarySymbol");
  const label=document.getElementById("summaryLabel");
  const title=document.getElementById("summaryTitle");
  const desc=document.getElementById("summaryDesc");

  bar.className="brand-status";
  symbol.textContent="✓";
  label.textContent="目前正常";
  title.textContent="目前無系統異常通報案件";
  desc.textContent="發現異常即可回報，後續進度同步掌握。";

  if(!active.length)return;

  const processing=active.filter(i=>i.status==="forwarded").length;
  bar.classList.add(processing?"processing":"warning");
  symbol.textContent=processing?"!":"?";
  label.textContent=processing?"目前有事件處理中":"目前有異常回報";
  title.textContent=`目前共有 ${active.length} 件系統異常事件`;
  desc.textContent=processing?`其中 ${processing} 件已進入後續處理階段。`:"各事件完整狀況已直接呈現在下方。";
}

function guidanceFor(i){
  if(i.status==="reported"){
    return {
      title:"現在需要做什麼？",
      text:"如有相同異常可直接追加，恢復後也可即時更新狀態。",
      buttons:`
        <button class="btn primary" onclick="openQuick('also','${i.id}')">我也遇到</button>
        <button class="btn success" onclick="openQuick('restored','${i.id}')">已恢復正常</button>`
    };
  }

  if(i.status==="forwarded"){
    return {
      title:"目前正在處理",
      text:"異常事件已進入後續處理階段。若分處實際操作已恢復，可直接回報恢復；不需重複回報相同異常。",
      buttons:`<button class="btn success" onclick="openQuick('restored','${i.id}')">我這邊已恢復正常</button>`
    };
  }

  return {
    title:"請實際操作後確認",
    text:"系統已接獲恢復通知。請依實際情況回報「已恢復正常」或「仍有異常」。",
    buttons:`
      <button class="btn success" onclick="openQuick('restored','${i.id}')">已恢復正常</button>
      <button class="btn danger" onclick="openQuick('still_bad','${i.id}')">仍有異常</button>`
  };
}

function renderIncidents(){
  const active=activeIncidents();
  document.getElementById("activeCount").textContent=`${active.length} 件`;
  const list=document.getElementById("incidentList");

  if(!active.length){
    list.innerHTML=`<div class="recent-list"><div class="recent-row"><div class="recent-check">✓</div><div class="recent-name">目前沒有進行中的異常事件</div><div></div><div></div></div></div>`;
    return;
  }

  list.innerHTML=active.map(i=>{
    const s=statusMeta(i);
    const bad=badBranches(i),good=goodBranches(i);
    const issues=issueTypes(i);
    const guide=guidanceFor(i);
    const history=[...i.events].reverse().slice(0,3);

    return `
      <article class="incident-panel ${s.cls}">
        <div class="incident-topline"></div>

        <div class="incident-main">
          <div>
            <div class="incident-title-row">
              <div class="incident-system">${i.systemName}</div>
              <span class="status-pill ${s.cls}">${s.label}</span>
            </div>

            <div class="issue-line">
              <strong>目前回報情形：</strong>${issues.length?issues.join("、"):"尚無"}
            </div>

            <div class="branch-summary">
              <span class="bad">異常中 ${bad.length} 個分處${bad.length?`：${bad.join("、")}`:""}</span>
              <span class="good">已恢復 ${good.length} 個分處${good.length?`：${good.join("、")}`:""}</span>
            </div>
          </div>

          <div class="incident-status-box">
            <div class="incident-status-label">目前處理狀態</div>
            <div class="incident-status-text">${s.summary}</div>
            <div class="incident-update">最近更新 ${latestTime(i)}</div>
          </div>
        </div>

        <div class="recent-events">
          <div class="recent-events-title">最近更新</div>
          ${history.map(e=>`
            <div class="event-line">
              <time>${e.time}</time>
              <span>${e.text}</span>
            </div>`).join("")}
        </div>

        <div class="guidance">
          <div class="guidance-label">${guide.title}</div>
          <h3>${i.status==="reported"?"依實際狀況直接回報":i.status==="forwarded"?"不用重複回報異常": "請確認目前是否真的恢復"}</h3>
          <p>${guide.text}</p>
          <div class="guidance-actions">${guide.buttons}</div>
        </div>
      </article>`;
  }).join("");
}

function renderRecent(){
  const closed=db.incidents.filter(i=>i.status==="closed").slice(0,6);
  const box=document.getElementById("recentList");

  if(!closed.length){
    box.innerHTML=`<div class="recent-row"><div class="recent-check">✓</div><div class="recent-name">尚無近期已結案事件</div><div></div><div></div></div>`;
    return;
  }

  box.innerHTML=closed.map(i=>`
    <div class="recent-row">
      <div class="recent-check">✓</div>
      <div class="recent-name">${i.systemName}</div>
      <div class="recent-time">${i.createdAt} ～ ${latestTime(i)}</div>
      <div class="recent-impact">曾影響 ${allBranches(i).length} 分處</div>
    </div>`).join("");
}

function eligibleBranches(mode,i){
  if(mode==="also") return untouchedBranches(i);
  if(mode==="restored") return badBranches(i);
  if(mode==="still_bad") return goodBranches(i);
  return [];
}

function openQuick(mode,id){
  quickAction={mode,id};
  const i=getIncident(id);
  const options=eligibleBranches(mode,i);

  const title=document.getElementById("quickTitle");
  const desc=document.getElementById("quickDesc");
  const select=document.getElementById("quickBranch");
  const empty=document.getElementById("quickEmpty");
  const confirm=document.getElementById("quickConfirm");

  empty.classList.add("hidden");
  select.classList.remove("hidden");
  confirm.disabled=false;

  if(mode==="also"){
    title.textContent="哪個分處也遇到這個系統異常？";
    desc.textContent="只顯示尚未回報這筆事件的分處。";
    confirm.textContent="確認加入";
    confirm.className="btn primary";
  }else if(mode==="restored"){
    title.textContent="哪個分處已恢復正常？";
    desc.textContent="只顯示目前仍被記錄為異常的分處。";
    confirm.textContent="確認恢復";
    confirm.className="btn success";
  }else{
    title.textContent="哪個分處仍有異常？";
    desc.textContent="只顯示先前已回報恢復的分處，避免重複回報。";
    confirm.textContent="回報仍有異常";
    confirm.className="btn danger";
  }

  if(!options.length){
    select.classList.add("hidden");
    empty.classList.remove("hidden");
    empty.textContent=mode==="also"
      ?"目前所有分處都已經有這筆事件的狀態紀錄。"
      :mode==="restored"
        ?"目前沒有仍處於異常狀態的分處需要回報恢復。"
        :"目前沒有已恢復的分處可重新回報異常。";
    confirm.disabled=true;
  }else{
    select.innerHTML=options.map(b=>`<option>${b}</option>`).join("");
  }

  openModal("quickModal");
}

async function confirmQuick(){
  const i=getIncident(quickAction.id);
  if(!i)return;

  const branch=document.getElementById("quickBranch").value;

  if(quickAction.mode==="also"){
    i.events.push({
      type:"also",branch,
      time:nowText(),text:`${branch} 回報同一系統也有異常`
    });
  }else if(quickAction.mode==="restored"){
    i.events.push({
      type:"restored",branch,time:nowText(),
      text:`${branch} 主動回報已恢復正常`
    });
  }else{
    i.status="forwarded";
    i.events.push({
      type:"still_bad",branch,time:nowText(),
      text:`${branch} 回報仍有異常`
    });
  }

  closeModal("quickModal");

  try{
    await saveIncident(i);
    toast("已完成回報，並同步全處。");
  }catch(error){
    console.error("共用資料同步失敗",error);
    toast("回報已暫存，但共用資料同步失敗。");
  }
}




const ADMIN_PASSWORD="11";

function openAdminPassword(){
  const input=document.getElementById("adminPasswordInput");
  const error=document.getElementById("adminPasswordError");
  if(input) input.value="";
  if(error) error.classList.add("hidden");
  openModal("adminPasswordModal");
  setTimeout(()=>input?.focus(),80);
}

function submitAdminPassword(){
  const input=document.getElementById("adminPasswordInput");
  const error=document.getElementById("adminPasswordError");

  if(input && input.value===ADMIN_PASSWORD){
    if(error) error.classList.add("hidden");
    closeModal("adminPasswordModal");
    document.getElementById("userView").classList.add("hidden");
    document.getElementById("adminView").classList.remove("hidden");
    renderAdmin();
    window.scrollTo({top:0,behavior:"smooth"});
    return;
  }

  if(error) error.classList.remove("hidden");
  if(input){
    input.select();
    input.focus();
  }
}

function renderAdmin(){
  const active=activeIncidents();
  const closed=db.incidents.filter(i=>i.status==="closed");

  document.getElementById("statActive").textContent=active.length;
  document.getElementById("statClosed").textContent=closed.length;
  document.getElementById("statTotal").textContent=db.incidents.length;

  const box=document.getElementById("adminList");

  let items=db.incidents;
  if(adminFilter==="active") items=active;
  if(adminFilter==="closed") items=closed;

  if(!items.length){
    box.innerHTML=`<div class="admin-event"><div class="admin-event-main">目前沒有符合此分類的事件。</div></div>`;
    return;
  }

  box.innerHTML=items.map(i=>{
    const bad=badBranches(i);
    const good=goodBranches(i);
    const all=allBranches(i);
    const status=statusMeta(i);
    const issues=issueTypes(i);
    const firstEvent=i.events.find(e=>e.type==="initial") || i.events[0];
    const firstBranch=firstEvent?.branch || "—";
    const firstTime=firstEvent?.time || i.createdAt;

    const multiReportEvent=i.events.find(e=>{
      if(!e.branch)return false;
      const idx=i.events.indexOf(e);
      const before=i.events.slice(0,idx+1).filter(x=>x.branch);
      return new Set(before.map(x=>x.branch)).size>=2;
    });
    const forwardedEvent=i.events.find(e=>e.type==="forwarded");
    const restoreNoticeEvent=i.events.find(e=>e.type==="restore_notice");
    const closedEvent=i.events.find(e=>e.type==="closed");

    let stageActions="";
    if(i.status==="reported"){
      stageActions+=`<button class="btn primary" onclick="adminForward('${i.id}')">已進行後續處理</button>`;
    }
    if(i.status==="forwarded"){
      stageActions+=`<button class="btn success" onclick="adminRestoreNotice('${i.id}')">收到恢復通知</button>`;
    }
    if(i.status==="restore_wait"){
      stageActions+=`<button class="btn primary" onclick="adminForward('${i.id}')">重新標示處理中</button>`;
    }
    if(i.status!=="closed"){
      stageActions+=`<button class="btn danger" onclick="requestClose('${i.id}')">直接結案</button>`;
    }
    stageActions+=`<button class="btn secondary" onclick="toggleRawHistory('${i.id}')">展開原始紀錄</button>`;
    stageActions+=`<button class="btn danger delete-btn" onclick="deleteIncident('${i.id}')">刪除案件</button>`;

    const milestone = (done, current, num, title, text) => `
      <div class="milestone ${done?"done":""} ${current?"current":""}">
        <div class="milestone-dot">${done?"✓":num}</div>
        <div class="milestone-copy">
          <strong>${title}</strong>
          <span>${text}</span>
        </div>
      </div>`;

    const milestones = `
      ${milestone(true, i.status==="reported" && all.length===1, 1, "首次回報", `${firstTime}｜${firstBranch}`)}
      ${milestone(all.length>=2, i.status==="reported" && all.length>=2, 2, "多分處回報", all.length>=2 ? `${all.length} 個分處曾回報異常` : "尚未有其他分處追加")}
      ${milestone(!!forwardedEvent, i.status==="forwarded", 3, "已進行後續處理", forwardedEvent ? forwardedEvent.time : "尚未進入處理")}
      ${milestone(!!restoreNoticeEvent, i.status==="restore_wait", 4, "收到恢復通知", restoreNoticeEvent ? restoreNoticeEvent.time : "尚未收到恢復通知")}
      ${milestone(!!closedEvent, i.status==="closed", 5, "案件結案", closedEvent ? closedEvent.time : "尚未結案")}
    `;

    const rawHistory=[...i.events].reverse().map(e=>`
      <div class="raw-log-row">
        <div class="raw-log-time">${e.time}</div>
        <div class="raw-log-dot"></div>
        <div class="raw-log-text">${e.text}</div>
      </div>`).join("");

    const remainingText = bad.length
      ? `目前仍有 ${bad.length} 個分處維持異常狀態`
      : good.length
        ? "目前沒有分處維持異常，可評估是否結案"
        : "目前尚無分處恢復紀錄";

    return `
      <article class="case-panel ${i.status==="closed"?"closed":""}">
        <div class="case-header">
          <div>
            <div class="case-title-row">
              <h3>${i.systemName}</h3>
              <span class="status-pill ${status.cls}">${status.label}</span>
            </div>
            <div class="case-subtitle">
              問題類型：${issues.join("、")||"—"}
            </div>
          </div>
          <div class="case-actions">${stageActions}</div>
        </div>

        <div class="case-summary-grid">
          <div class="summary-metric">
            <span>首次回報</span>
            <strong>${firstTime}</strong>
            <small>${firstBranch}</small>
          </div>
          <div class="summary-metric">
            <span>曾回報分處</span>
            <strong>${all.length}</strong>
            <small>${all.length?all.join("、"):"—"}</small>
          </div>
          <div class="summary-metric bad">
            <span>目前異常</span>
            <strong>${bad.length}</strong>
            <small>${bad.length?bad.join("、"):"無"}</small>
          </div>
          <div class="summary-metric good">
            <span>已恢復</span>
            <strong>${good.length}</strong>
            <small>${good.length?good.join("、"):"無"}</small>
          </div>
        </div>

        <div class="case-insight">
          <span class="case-insight-label">目前重點</span>
          <strong>${remainingText}</strong>
          <small>最近更新 ${latestTime(i)}</small>
        </div>

        <div class="milestone-section">
          <div class="section-mini-title">處理里程碑</div>
          <div class="milestone-track">${milestones}</div>
        </div>

        <div class="raw-history hidden" id="raw-${i.id}">
          <div class="raw-history-head">
            <div>
              <strong>完整原始紀錄</strong>
              <span>保留每一筆分處回報與狀態變更</span>
            </div>
            <button class="raw-close-btn" onclick="toggleRawHistory('${i.id}')">收合</button>
          </div>
          <div class="raw-log">${rawHistory || "<div class='raw-empty'>尚無原始紀錄</div>"}</div>
        </div>
      </article>`;
  }).join("");
}

function toggleRawHistory(id){
  const el=document.getElementById(`raw-${id}`);
  if(!el)return;
  el.classList.toggle("hidden");
}


async function deleteIncident(id){
  const i=getIncident(id);
  if(!i)return;

  const ok=confirm(`確定要刪除「${i.systemName}」這筆案件嗎？\n\n刪除後將無法復原。`);
  if(!ok)return;

  try{
    await deleteIncidentFromD1(id);
    db.incidents=db.incidents.filter(x=>x.id!==id);
    saveLocalBackup();
    renderAll();
    toast("已從共用資料庫刪除案件。");
  }catch(error){
    console.error("刪除案件失敗",error);
    toast("案件刪除失敗，請稍後再試。");
  }
}

async function adminForward(id){
  const i=getIncident(id);
  if(!i)return;

  i.status="forwarded";
  i.events.push({
    type:"forwarded",
    time:nowText(),
    text:"管理端更新：已進行後續處理"
  });

  try{
    await saveIncident(i);
    toast("已更新為處理中，並同步全處。");
  }catch(error){
    console.error("處理狀態同步失敗",error);
    toast("狀態已暫存，但共用資料同步失敗。");
  }
}

async function adminRestoreNotice(id){
  const i=getIncident(id);
  if(!i)return;

  // 收到恢復通知時，只抓目前仍屬異常的分處。
  const affectedBranches=badBranches(i);

  i.status="restore_wait";
  i.events.push({
    type:"restore_notice",
    time:nowText(),
    text:"管理端更新：收到系統恢復通知"
  });

  try{
    await saveIncident(i);
  }catch(error){
    console.error("恢復狀態同步失敗",error);
    toast("恢復狀態同步失敗，請稍後再試。");
    return;
  }

  try{
    toast("狀態已同步，正在寄送恢復確認通知…");
    await sendRecoveryNotification({
      systemName:i.systemName,
      affectedBranches
    });
    toast("已通知目前仍受影響分處進行恢復確認。");
  }catch(error){
    console.error("恢復確認通知寄送失敗",error);
    toast("狀態已同步，但恢復確認通知寄送失敗，請稍後再確認。");
  }
}

function requestClose(id){
  pendingCloseId=id;
  const i=getIncident(id);
  const bad=badBranches(i);
  const warning=document.getElementById("closeWarning");
  const text=document.getElementById("closeConfirmText");

  text.textContent=`「${i.systemName}」結案後將移至近期事件紀錄。`;
  warning.classList.add("hidden");

  if(bad.length){
    warning.classList.remove("hidden");
    warning.textContent=`目前仍有 ${bad.length} 個分處被記錄為異常：${bad.join("、")}。如仍要結案，請再次確認。`;
  }

  openModal("closeConfirmModal");
}

async function confirmClose(){
  const i=getIncident(pendingCloseId);
  if(!i)return;

  i.status="closed";
  i.events.push({
    type:"closed",
    time:nowText(),
    text:"管理端確認事件結案"
  });

  pendingCloseId=null;
  closeModal("closeConfirmModal");

  try{
    await saveIncident(i);
    toast("事件已結案，並同步全處。");
  }catch(error){
    console.error("結案同步失敗",error);
    toast("結案狀態已暫存，但共用資料同步失敗。");
  }
}

if(document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded",init);
}else{
  init();
}
