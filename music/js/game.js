window.TMGame={song:null,difficulty:'easy',notes:[],state:null,raf:0,paused:false,noteId:0,keyMap:{d:0,f:1,j:2,k:3},cfg:{easy:{density:.38,subdivision:1,travel:3.1},normal:{density:.5,subdivision:2,travel:2.7},hard:{density:.66,subdivision:2,travel:2.3},expert:{density:.78,subdivision:4,travel:2.0}},
init(){document.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();this.togglePause();return}if(e.repeat)return;const lane=this.keyMap[e.key.toLowerCase()];if(lane!==undefined){e.preventDefault();this.judge(lane)}});document.querySelectorAll('.key-btn').forEach(btn=>btn.addEventListener('pointerdown',e=>{
e.preventDefault();
if(navigator.vibrate)navigator.vibrate(12);
this.judge(Number(btn.dataset.lane))
}));document.getElementById('song').addEventListener('ended',()=>this.finish())},
seed(n){const x=Math.sin(n*913.17)*43758.5453;return x-Math.floor(x)},buildChart(duration){const c=this.cfg[this.difficulty];const bpm=this.song.bpm||129,step=(60/bpm)/c.subdivision,start=4.1,end=Math.max(start+10,duration-1);const chart=[];let last=-1;for(let t=start,i=0;t<end;t+=step,i++){if(this.seed(i+duration*.17)>c.density)continue;let lane=Math.floor(this.seed(i*1.89+7)*4);if(lane===last&&i%3===0)lane=(lane+1+i%2)%4;last=lane;const type=this.difficulty!=='easy'&&i%17===0?'hold':'tap';chart.push({id:this.noteId++,time:t,lane,type,judged:false,el:null})}return chart},
reset(){cancelAnimationFrame(this.raf);document.querySelectorAll('.note').forEach(n=>n.remove());this.notes=[];this.state={score:0,combo:0,maxCombo:0,perfect:0,great:0,good:0,miss:0,life:1000,started:false,ended:false};this.paused=false;this.updateHud();document.getElementById('progressBar').style.width='0';document.getElementById('judgeText').className='judge'},
async start(song,difficulty){
const loginBgm = document.getElementById("loginBgm");

if (loginBgm) {
  loginBgm.pause();
  loginBgm.currentTime = 0;
}
this.song=song;this.difficulty=difficulty;this.reset();TMAudio.load(song);
TMLyrics.load(song.id);
UI.show("game");

document.getElementById("gameSongTitle").textContent = song.title;

/* 第一次遊玩先顯示簡短教學，關閉後才開始倒數 */
await this.openGuide(false);

/* 按下歌曲 ▶ 後，立刻用靜音方式播放 */
const normalVolume = TMSettings.values.bgmVolume;

TMAudio.el.volume = 0;

try {
  await TMAudio.play();
} catch (error) {
  console.log("歌曲播放失敗", error);
  UI.toast("請再按一次歌曲播放鍵");
  UI.show("songs");
  return;
}

/* 倒數 */
const c = document.getElementById("countdown");
c.classList.remove("hidden");

for (const v of ["3", "2", "1", "START"]) {
  c.textContent = v;

  await new Promise(function (resolve) {
    setTimeout(resolve, v === "START" ? 500 : 650);
  });
}

c.classList.add("hidden");

/* 音樂沒有停止，只在倒數完成後回到開頭並打開音量 */
TMAudio.seek(0);
TMAudio.el.volume = normalVolume;this.notes=this.buildChart(TMAudio.duration());document.getElementById('durationTime').textContent=this.format(TMAudio.duration());this.state.started=true;this.loop()},
travel(){return this.cfg[this.difficulty].travel/TMSettings.values.noteSpeed},spawn(n){const el=document.createElement('div');el.className=`note lane${n.lane} ${n.type}`;document.querySelectorAll('.lane')[n.lane].appendChild(el);n.el=el},
judge(lane){
if(!this.state?.started||this.state.ended||this.paused)return;
if(window.TMSFX)TMSFX.tap(lane);const now=TMAudio.time(),w=TMSettings.values.judgeStrictness==='strict'?.18:TMSettings.values.judgeStrictness==='relaxed'?.3:.24;const n=this.notes.filter(x=>!x.judged&&x.lane===lane&&Math.abs(x.time-now)<=w).sort((a,b)=>Math.abs(a.time-now)-Math.abs(b.time-now))[0];this.pulse(lane);if(!n)return;const d=Math.abs(n.time-now);let result=d<=(w*.38)?'PERFECT':d<=(w*.68)?'GREAT':'GOOD';n.judged=true;n.el?.classList.add('hit');setTimeout(()=>n.el?.remove(),180);if(result==='PERFECT'){this.state.perfect++;this.state.score+=1000;this.state.life=Math.min(1000,this.state.life+8)}if(result==='GREAT'){this.state.great++;this.state.score+=700;this.state.life=Math.min(1000,this.state.life+4)}if(result==='GOOD'){this.state.good++;this.state.score+=400}this.state.combo++;this.state.maxCombo=Math.max(this.state.maxCombo,this.state.combo);if(window.TMSFX)TMSFX.judge(result);this.showJudge(result);this.updateHud()},
pulse(lane){const l=document.querySelectorAll('.lane')[lane],b=document.querySelectorAll('.key-btn')[lane];l.classList.add('active');b.classList.add('pressed');setTimeout(()=>{l.classList.remove('active');b.classList.remove('pressed')},100)},showJudge(text){const j=document.getElementById('judgeText');j.textContent=text;j.style.color=text==='PERFECT'?'#fff48c':text==='GREAT'?'#72f2ff':text==='GOOD'?'#ff91df':'#ff728d';j.className='judge';void j.offsetWidth;j.className='judge show'},miss(now){this.notes.forEach(n=>{if(!n.judged&&now-n.time>.26){n.judged=true;n.el?.remove();this.state.miss++;this.state.combo=0;this.state.life=Math.max(0,this.state.life-90);this.showJudge('MISS')}});if(this.state.life<=0)this.finish()},
loop(){if(!this.state.started||this.state.ended||this.paused)return;const now=TMAudio.time(),duration=TMAudio.duration(),travel=this.travel(),area=document.getElementById('laneArea'),hitY=area.clientHeight-60;for(const n of this.notes){const until=n.time-now;if(!n.el&&!n.judged&&until<=travel&&until>-.3)this.spawn(n);if(n.el&&!n.judged){const p=1-until/travel;n.el.style.transform=`translateY(${Math.max(-50,p*hitY)}px)`}}this.miss(now);TMLyrics.update(now);document.getElementById('progressBar').style.width=`${Math.min(100,now/duration*100)}%`;document.getElementById('currentTime').textContent=this.format(now);this.updateHud();this.raf=requestAnimationFrame(()=>this.loop())},
updateHud(){if(!this.state)return;document.getElementById('scoreValue').textContent=String(this.state.score).padStart(7,'0');document.getElementById('comboValue').textContent=this.state.combo;document.getElementById('lifeValue').textContent=this.state.life},togglePause(force){if(!this.state?.started||this.state.ended)return;const next=force??!this.paused;this.paused=next;if(next){TMAudio.pause();cancelAnimationFrame(this.raf);document.getElementById('pauseModal').classList.remove('hidden')}else{document.getElementById('pauseModal').classList.add('hidden');TMAudio.play().then(()=>this.loop()).catch(()=>UI.toast('請點擊繼續播放'))}},restart(){document.getElementById('pauseModal').classList.add('hidden');TMAudio.stop();this.start(this.song,this.difficulty)},leave(){document.getElementById('pauseModal').classList.add('hidden');document.getElementById('gameGuideModal')?.classList.add('hidden');TMAudio.stop();this.reset();UI.show('songs')},openGuide(force=false){const modal=document.getElementById('gameGuideModal');if(!modal)return Promise.resolve();if(!force&&localStorage.getItem('taxMelodyGuideViewed')==='true')return Promise.resolve();this.guideResumeAfterClose=Boolean(this.state?.started&&!this.state?.ended&&!this.paused);if(this.guideResumeAfterClose){TMAudio.pause();cancelAnimationFrame(this.raf)}modal.classList.remove('hidden');return new Promise(resolve=>{this.guideResolver=resolve})},closeGuide(){const modal=document.getElementById('gameGuideModal');modal?.classList.add('hidden');try{localStorage.setItem('taxMelodyGuideViewed','true')}catch(error){}const resolve=this.guideResolver;this.guideResolver=null;if(resolve)resolve();if(this.guideResumeAfterClose){this.guideResumeAfterClose=false;TMAudio.play().then(()=>this.loop()).catch(()=>UI.toast('請點擊畫面繼續播放'))}},finish(){if(!this.state||this.state.ended)return;this.state.ended=true;cancelAnimationFrame(this.raf);TMAudio.pause();TMResult.show(this.state,this.song,this.difficulty);UI.show('result')},format(s){if(!Number.isFinite(s))return'0:00';return`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`}}
