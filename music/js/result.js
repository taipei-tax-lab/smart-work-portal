window.TMResult={show(state,song,difficulty){const total=state.perfect+state.great+state.good+state.miss;const weighted=state.perfect+state.great*.8+state.good*.5;const accuracy=total?weighted/total*100:0;let rank='D';if(accuracy>=99.5)rank='SSS';else if(accuracy>=97)rank='SS';else if(accuracy>=93)rank='S';else if(accuracy>=86)rank='A';else if(accuracy>=75)rank='B';else if(accuracy>=60)rank='C';const result={score:state.score,accuracy:Number(accuracy.toFixed(2)),maxCombo:state.maxCombo,rank,perfect:state.perfect,great:state.great,good:state.good,miss:state.miss,cleared:state.life>0,fullCombo:state.miss===0};TMStorage.saveScore(song.id,difficulty,result);TMStorage.unlockAchievement('first-play');if(state.perfect>0)TMStorage.unlockAchievement('first-perfect');if(rank==='SSS')TMStorage.unlockAchievement('first-sss');if(result.fullCombo)TMStorage.unlockAchievement('first-full-combo');document.getElementById('rankBadge').textContent=rank;
const resultTiger = document.getElementById('resultTiger');
const resultRankText = document.getElementById('resultRankText');

let tigerImage = 'assets/tiger/result-fail.png';

if (rank === 'SSS' || rank === 'SS') {
    tigerImage = 'assets/tiger/result-sss.png';
} else if (rank === 'S' || rank === 'A') {
    tigerImage = 'assets/tiger/result-a.png';
} else if (rank === 'B') {
    tigerImage = 'assets/tiger/result-b.png';
} else {
    tigerImage = 'assets/tiger/result-fail.png';
}

if (resultTiger) {
    resultTiger.src = tigerImage;
}

if (resultRankText) {
    resultRankText.textContent = rank;
}
document.getElementById('finalScore').textContent=state.score.toLocaleString();document.getElementById('rPerfect').textContent=state.perfect;document.getElementById('rGreat').textContent=state.great;document.getElementById('rGood').textContent=state.good;document.getElementById('rMiss').textContent=state.miss;document.getElementById('rCombo').textContent=state.maxCombo;document.getElementById('rAccuracy').textContent=`${result.accuracy}%`;return result}};
