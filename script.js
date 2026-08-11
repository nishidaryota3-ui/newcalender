// script.js (ホイール回転機能・絶対放射状ラベル・雨量レイヤー最適化版)

const container = document.getElementById('container');
const statusBar = document.getElementById('status-bar');

let svg, masterGroup, dataLayer, shadowLayer, linesLayer, rainfallLayer, tideLayer, outerSeasonLayer, textPathDefs;
let viewBox = { x: 0, y: 0, w: 1841.3719, h: 2382.9518 };
const cx = 920.6859;
const cy = 1191.4759;
let activeBrush = "#38bdf8"; 
let globalRotation = 0; // 全体の回転角度

let calendarData = JSON.parse(localStorage.getItem('polarCalendarDataV5')) || {};
let concentricRings = []; 

const baseDate = new Date(2026, 7, 13);
const synodicMonth = 29.530589;
let currentCycle = 0; 
let currentStartSegment = 0; 

const sekkiNames = "立春,雨水,啓蟄,春分,清明,穀雨,立夏,小満,芒種,夏至,小暑,大暑,立秋,処暑,白露,秋分,寒露,霜降,立冬,小雪,大雪,冬至,小寒,大寒".split(',');
const kouNames = "東風解凍,黄鶯睍睆,魚上氷,土脉潤起,霞始靆,草木萠動,蟄虫啓戸,桃始笑,菜虫化蝶,雀始巣,桜始開,雷乃発声,玄鳥至,雁音北,虹始見,葭始生,霜止出苗,牡丹華,蛙始鳴,蚯蚓出,竹笋生,蚕起食桑,紅花栄,麦秋至,螳螂生,鵙乃鳴,梅子黄,乃東枯,菖蒲華,半夏生,温風至,蓮始開,鷹乃学習,桐始結花,土潤溽暑,大雨時行,涼風至,寒蝉鳴,蒙霧升降,綿柎開,天地始粛,禾乃登,草露白,鶺鴒鳴,玄鳥去,雷乃収声,蟄虫坏戸,水始涸,鴻雁来,菊花開,蟋蟀在戸,霜始降,霎時施,楓蔦黄,山茶始開,地始凍,金盞香,虹蔵不見,朔風払葉,橘始黄,閉塞成冬,熊蟄穴,鱖魚群,乃東生,麋角解,雪下出麦,芹乃栄,水泉動,雉始雊,款冬華,水沢腹堅,鶏始乳".split(',');

const wafuNames = ["睦月", "如月", "弥生", "卯月", "皐月", "水無月", "文月", "葉月", "長月", "神無月", "霜月", "師走"];

let generatedSeasons = []; 

const realTideData = [
  { day: 1, time: "04:12", tide: 6.2 }, { day: 1, time: "10:30", tide: -0.1 },
  { day: 1, time: "16:45", tide: 6.5 }, { day: 1, time: "23:05", tide: 0.2 },
  { day: 2, time: "05:05", tide: 6.0 }, { day: 2, time: "11:20", tide: 0.0 },
  { day: 2, time: "17:35", tide: 6.4 }, { day: 2, time: "23:55", tide: 0.4 },
  { day: 3, time: "06:00", tide: 5.8 }, { day: 3, time: "12:15", tide: 0.2 },
  { day: 3, time: "18:30", tide: 6.2 }, { day: 4, time: "00:50", tide: 0.6 },
  { day: 4, time: "06:55", tide: 5.5 }, { day: 4, time: "13:10", tide: 0.5 },
  { day: 4, time: "19:25", tide: 6.0 }
];
const tidePoints = realTideData.map(d => {
  const [hh, mm] = d.time.split(':').map(Number);
  const hours = (d.day - 1) * 24 + hh + (mm / 60);
  return { t: hours, h: d.tide };
});

// --- UI コントロール ---
const navDiv = document.createElement('div');
navDiv.style = "position:fixed; top:30px; right:30px; background:rgba(25,30,40,0.85); padding:15px; border-radius:12px; color:#d4af37; z-index:100; display:flex; gap:15px; align-items:center; border: 1px solid rgba(212,175,55,0.3); backdrop-filter: blur(10px); box-shadow: 0 10px 30px rgba(0,0,0,0.2);";
navDiv.innerHTML = `
  <button id="prevBtn" style="background:transparent; border:1px solid #d4af37; color:#d4af37; padding:5px 10px; cursor:pointer; border-radius:4px;">◀ 過去の輪へ</button>
  <div id="cycleDisplay" style="font-weight:bold; font-size:14px; text-align:center; min-width:140px;">--</div>
  <button id="nextBtn" style="background:#d4af37; border:none; color:#000; padding:5px 10px; cursor:pointer; border-radius:4px; font-weight:bold;">次の輪へ ▶</button>
`;
document.body.appendChild(navDiv);

const clearBtn = document.createElement('button');
clearBtn.innerHTML = "🧹 選択中の色をクリア";
clearBtn.style = "position:fixed; bottom:30px; right:30px; background:rgba(25,30,40,0.85); color:#fff; border:1px solid rgba(255,255,255,0.2); padding:10px 15px; border-radius:8px; cursor:pointer; font-weight:bold; backdrop-filter:blur(10px); z-index:100; box-shadow: 0 4px 10px rgba(0,0,0,0.3); transition:0.2s;";
document.body.appendChild(clearBtn);

// ★新規追加：回転・パン切り替えボタン
let interactionMode = 'pan'; 
const modeBtn = document.createElement('button');
modeBtn.innerHTML = "🖐️ 移動モード (クリックで回転)";
modeBtn.style = "position:fixed; top:90px; right:30px; background:rgba(25,30,40,0.85); color:#fff; border:1px solid #d4af37; padding:10px 15px; border-radius:8px; cursor:pointer; font-weight:bold; backdrop-filter:blur(10px); z-index:100; box-shadow: 0 4px 10px rgba(0,0,0,0.3); transition:0.2s;";
document.body.appendChild(modeBtn);

modeBtn.onclick = () => {
    if(interactionMode === 'pan') {
        interactionMode = 'rotate';
        modeBtn.innerHTML = "🔄 回転モード (クリックで移動)";
        modeBtn.style.background = "rgba(212,175,55,0.85)";
        modeBtn.style.color = "#000";
    } else {
        interactionMode = 'pan';
        modeBtn.innerHTML = "🖐️ 移動モード (クリックで回転)";
        modeBtn.style.background = "rgba(25,30,40,0.85)";
        modeBtn.style.color = "#fff";
    }
};

document.getElementById('prevBtn').addEventListener('click', () => { currentCycle--; updateCalendarCycle(); });
document.getElementById('nextBtn').addEventListener('click', () => { currentCycle++; updateCalendarCycle(); });
clearBtn.addEventListener('click', () => {
  if (activeBrush === "erase") return alert("クリアしたい色を選択してください。");
  if (confirm(`選択中の色をすべて削除しますか？`)) {
    for (const key in calendarData) {
      if (key.startsWith(`c${currentCycle}_`) && calendarData[key].color === activeBrush) delete calendarData[key];
    }
    localStorage.setItem('polarCalendarDataV5', JSON.stringify(calendarData));
    renderSavedData();
  }
});

// --- 初期化 ---
fetch('calendar.svg')
  .then(response => response.text())
  .then(svgCode => {
    container.innerHTML = svgCode;
    svg = container.querySelector('svg');
    svg.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`);
    svg.querySelectorAll('*[fill="#fff"]').forEach(el => el.setAttribute('fill', 'none'));

    const radii = [];
    svg.querySelectorAll('circle').forEach(c => {
      const r = parseFloat(c.getAttribute('r'));
      const cx_val = parseFloat(c.getAttribute('cx'));
      const cy_val = parseFloat(c.getAttribute('cy'));
      if (r && Math.abs(cx_val - cx) < 1 && Math.abs(cy_val - cy) < 1) radii.push(r);
    });
    concentricRings = [...new Set(radii)].sort((a, b) => a - b);

    // ★すべてのレイヤーを内包する「マスターグループ（回転用）」を作成
    masterGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    masterGroup.setAttribute("id", "master-group");
    svg.appendChild(masterGroup);

    textPathDefs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    textPathDefs.setAttribute("id", "text-path-defs");
    svg.appendChild(textPathDefs);

    // 全てのレイヤーを masterGroup に追加
    dataLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    masterGroup.appendChild(dataLayer);

    shadowLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    masterGroup.appendChild(shadowLayer);

    linesLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    masterGroup.appendChild(linesLayer);

    rainfallLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    masterGroup.appendChild(rainfallLayer);

    tideLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    masterGroup.appendChild(tideLayer);

    outerSeasonLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    masterGroup.appendChild(outerSeasonLayer);

    generateAstronomicalData();
    updateCalendarCycle();
    initInteractions();
  })
  .catch(err => console.error("SVG読み込みエラー:", err));

// --- 天文計算エンジン ---
function getSolarLongitude(timeMs) {
  let jd = timeMs / 86400000 + 2440587.5;
  let t = (jd - 2451545.0) / 36525;
  let l0 = 280.46646 + 36000.76983 * t + 0.0003032 * t * t;
  let m = 357.52911 + 35999.05029 * t - 0.0001537 * t * t;
  let rad = Math.PI / 180;
  let c = (1.914602 - 0.004817 * t - 0.000014 * t * t) * Math.sin(m * rad)
        + (0.019993 - 0.000101 * t) * Math.sin(2 * m * rad)
        + 0.000289 * Math.sin(3 * m * rad);
  let trueLon = l0 + c;
  let omega = 125.04 - 1934.136 * t;
  let apparentLon = trueLon - 0.00569 - 0.00478 * Math.sin(omega * rad);
  let lon = apparentLon % 360;
  if (lon < 0) lon += 360;
  return lon;
}

function getLunarLongitude(timeMs) {
  let jd = timeMs / 86400000 + 2440587.5;
  let T = (jd - 2451545.0) / 36525;
  let Lp = 218.3164477 + 481267.88123421 * T;
  let M = 357.5291092 + 35999.0502909 * T;
  let Mp = 134.9633964 + 477198.8675055 * T;
  let D = 297.8501921 + 445267.1114034 * T;
  let F = 93.2720950 + 483202.0175233 * T;
  let rad = Math.PI / 180;
  let lon = Lp 
    + 6.289 * Math.sin(Mp * rad)
    - 1.274 * Math.sin((2*D - Mp) * rad)
    + 0.658 * Math.sin(2*D * rad)
    + 0.214 * Math.sin(2*Mp * rad)
    - 0.186 * Math.sin(M * rad)
    - 0.114 * Math.sin(2*F * rad);
  let res = lon % 360;
  if (res < 0) res += 360;
  return res;
}

function getLunarPhaseEvent(timeMsStart, timeMsEnd) {
  let diffStart = (getLunarLongitude(timeMsStart) - getSolarLongitude(timeMsStart) + 360) % 360;
  let diffEnd = (getLunarLongitude(timeMsEnd) - getSolarLongitude(timeMsEnd) + 360) % 360;
  
  if (diffStart > 300 && diffEnd < 60) return "新月";
  if (diffStart <= 90 && diffEnd > 90) return "上弦";
  if (diffStart <= 180 && diffEnd > 180) return "満月";
  if (diffStart <= 270 && diffEnd > 270) return "下弦";
  return null;
}

function findTimeForLongitude(targetLon, left, right) {
  while (right - left > 60000) { 
    let mid = (left + right) / 2;
    let midLon = getSolarLongitude(mid);
    let diff = midLon - targetLon;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    if (diff > 0) right = mid;
    else left = mid;
  }
  return left;
}

function generateAstronomicalData() {
  generatedSeasons = [];
  let startTime = new Date(2025, 0, 1).getTime(); 
  let endTime = new Date(2028, 0, 1).getTime(); 
  let kouPoints = [];
  let currentTime = startTime;
  let prevLon = getSolarLongitude(currentTime);
  
  while (currentTime < endTime) {
    let nextTime = currentTime + 86400000; 
    let nextLon = getSolarLongitude(nextTime);
    let floorPrev = Math.floor(prevLon / 5) * 5;
    let floorNext = Math.floor(nextLon / 5) * 5;
    if (floorPrev !== floorNext) {
      let targetLon = (floorPrev === 355 && floorNext === 0) ? 0 : floorNext;
      if (targetLon === 360) targetLon = 0;
      let exactTime = findTimeForLongitude(targetLon, currentTime, nextTime);
      kouPoints.push({ time: exactTime, lon: targetLon });
    }
    currentTime = nextTime;
    prevLon = nextLon;
  }

  for (let i = 0; i < kouPoints.length - 1; i++) {
    let p1 = kouPoints[i];
    let deg = p1.lon;
    let kouIndex = Math.floor(((deg - 315 + 360) % 360) / 5);
    let isSekkiStart = (deg % 15 === 0);
    generatedSeasons.push({ type: 'kou', name: kouNames[kouIndex], start: p1.time });
    if (isSekkiStart) {
      let sekkiIndex = Math.floor(((deg - 315 + 360) % 360) / 15);
      generatedSeasons.push({ type: 'sekki', name: sekkiNames[sekkiIndex], start: p1.time });
    }
  }
}

function getLunarDayKanji(dayInt) {
  const kanji = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
  if (dayInt <= 10) return kanji[dayInt] || "十";
  if (dayInt > 10 && dayInt < 20) return "十" + kanji[dayInt % 10];
  if (dayInt === 20) return "廿";
  if (dayInt > 20 && dayInt < 30) return "廿" + kanji[dayInt % 10];
  if (dayInt === 30) return "丗";
  return dayInt.toString();
}

function getTideValue(t_hours) {
  let p1 = null, p2 = null;
  for (let j = 0; j < tidePoints.length - 1; j++) {
    if (t_hours >= tidePoints[j].t && t_hours <= tidePoints[j + 1].t) {
      p1 = tidePoints[j]; p2 = tidePoints[j+1]; break;
    }
  }
  if (p1 && p2) return (p1.h + p2.h)/2 + (p1.h - p2.h)/2 * Math.cos( Math.PI * (t_hours - p1.t)/(p2.t - p1.t) );
  return 3.0 + 3.5 * Math.sin(t_hours * 2 * Math.PI / 12.42) + 1.0 * Math.cos(t_hours * 2 * Math.PI / 24.84);
}

// --- メイン描画 ---
function updateCalendarCycle() {
  const totalElapsedDays = currentCycle * synodicMonth;
  const startDate = new Date(baseDate.getTime() + totalElapsedDays * 24 * 60 * 60 * 1000);
  currentStartSegment = Math.round((totalElapsedDays % 30) / 0.25);
  
  const y = startDate.getFullYear();
  const m = startDate.getMonth() + 1;
  const d = startDate.getDate();
  document.getElementById('cycleDisplay').innerHTML = `${y}年 ${m}月<br><span style="font-size:11px; color:#8b949e;">新月: ${m}月${d}日〜</span>`;

  drawSolarDates(startDate); 
  drawTimeLabels(); 
  drawOuterSeasons(startDate.getTime()); 
  drawLunarShadow(startDate.getTime());  
  drawDynamicLines(); 
  drawRainfallGraph(); 
  drawTideGraph();    
  renderSavedData();
}

function drawLunarShadow(cycleStartTime) {
  shadowLayer.innerHTML = "";
  if (concentricRings.length < 30) return;
  const rMin = concentricRings[0];
  const rMax = concentricRings[concentricRings.length - 2]; 
  const maxArea = rMax * rMax - rMin * rMin; 
  const resolution = 10;
  const totalHours = 720; 
  const startAngle = currentStartSegment * 3;

  let pathD = "";
  for (let i = 0; i <= totalHours * resolution; i++) {
    const timeMs = cycleStartTime + (i / resolution) * 3600000;
    let diff = (getLunarLongitude(timeMs) - getSolarLongitude(timeMs) + 360) % 360;
    const illumination = 0.5 * (1 - Math.cos(diff * Math.PI / 180));
    const shadow = 1.0 - illumination;
    const r = Math.sqrt(rMin * rMin + shadow * maxArea);
    const angle = startAngle + (i / resolution) * 0.5;
    const pt = polarToCartesian(cx, cy, r, angle);
    if (i === 0) pathD += `M ${pt.x},${pt.y} `;
    else pathD += `L ${pt.x},${pt.y} `;
  }

  const endAngle = startAngle + 360;
  const pEndMin = polarToCartesian(cx, cy, rMin, endAngle);
  const pStartMin = polarToCartesian(cx, cy, rMin, startAngle);
  pathD += ` L ${pEndMin.x},${pEndMin.y} A ${rMin} ${rMin} 0 1 0 ${pStartMin.x} ${pStartMin.y} Z`;

  const shadowPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  shadowPath.setAttribute("d", pathD);
  shadowPath.setAttribute("fill", "rgba(0, 0, 0, 0.05)"); 
  shadowLayer.appendChild(shadowPath);
}

// ★修正：雨量グラフを階層17〜18の間に配置
function drawRainfallGraph() {
  rainfallLayer.innerHTML = "";
  if (concentricRings.length < 19) return;
  
  // ★階層17(インデックス16)〜階層18(インデックス18)のエリアを使用
  const rMin = concentricRings[16]; 
  const rMax = concentricRings[18]; 
  const maxRain = 100; 
  
  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("cx", cx); circle.setAttribute("cy", cy); circle.setAttribute("r", rMin);
  circle.setAttribute("fill", "none"); 
  circle.setAttribute("stroke", "rgba(14, 165, 233, 0.3)"); 
  circle.setAttribute("stroke-width", "1"); 
  rainfallLayer.appendChild(circle);

  let rainData = new Array(721).fill(0);
  let prevSlope = getTideValue(0.1) - getTideValue(0);
  
  for (let h = 1; h <= 720; h++) {
    let currentTide = getTideValue(h);
    let nextTide = getTideValue(h + 0.1);
    let currentSlope = nextTide - currentTide;
    
    // 潮が反転した瞬間に架空のスコールを発生
    if (prevSlope * currentSlope <= 0 && Math.abs(currentSlope) < 0.5) {
        let intensity = 40 + ((Math.sin(h * 7.89) * 0.5 + 0.5) * 60); 
        rainData[h] = intensity;
        if (h + 1 <= 720) rainData[h+1] = intensity * 0.5; 
        if (h + 2 <= 720) rainData[h+2] = intensity * 0.1; 
    }
    prevSlope = currentSlope;
  }

  const startAngle = currentStartSegment * 3;
  for (let h = 0; h <= 720; h++) {
    if (rainData[h] > 0) {
      const r = rMin + (rMax - rMin) * (rainData[h] / maxRain);
      const angle = startAngle + h * 0.5;
      
      const p1 = polarToCartesian(cx, cy, rMin, angle);
      const p2 = polarToCartesian(cx, cy, r, angle);
      
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", p1.x); line.setAttribute("y1", p1.y);
      line.setAttribute("x2", p2.x); line.setAttribute("y2", p2.y);
      line.setAttribute("stroke", "rgba(14, 165, 233, 0.7)"); 
      line.setAttribute("stroke-width", "1.5");
      line.setAttribute("stroke-linecap", "round");
      rainfallLayer.appendChild(line);
    }
  }
}

function drawSolarDates(startDate) {
  let dateLayer = document.getElementById("solar-dates-layer");
  if(dateLayer) { dateLayer.innerHTML = ""; } 
  else {
    dateLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    dateLayer.setAttribute("id", "solar-dates-layer");
    masterGroup.appendChild(dateLayer); // ★マスターグループに追加
  }
  const rIn = concentricRings[concentricRings.length - 2];
  const rOut = concentricRings[concentricRings.length - 1];
  
  const rMidDate = rIn + (rOut - rIn) * 0.65; 
  const rMidDay  = rIn + (rOut - rIn) * 0.25; 
  const rMidLunar = (rIn + rOut) / 2;
  const lunarRadius = (rOut - rIn) * 0.4; 
  const daysStr = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  for (let i = 0; i < 30; i++) {
    const loopDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const timeMsStart = loopDate.getTime();
    const timeMsEnd = timeMsStart + 86400000;

    const absoluteSegment = (currentStartSegment + i * 4) % 120;
    const baseAngle = absoluteSegment * 3;
    const angleLeft = baseAngle + 1.5; 
    
    const ptDate = polarToCartesian(cx, cy, rMidDate, angleLeft);
    const textDate = document.createElementNS("http://www.w3.org/2000/svg", "text");
    textDate.setAttribute("x", ptDate.x); textDate.setAttribute("y", ptDate.y);
    textDate.setAttribute("text-anchor", "middle"); textDate.setAttribute("dominant-baseline", "central");
    textDate.setAttribute("fill", "#727171"); textDate.setAttribute("font-size", "10px");
    textDate.setAttribute("font-weight", "bold");
    textDate.setAttribute("transform", `rotate(${angleLeft}, ${ptDate.x}, ${ptDate.y})`);
    textDate.textContent = `${loopDate.getMonth() + 1}/${loopDate.getDate()}`;
    dateLayer.appendChild(textDate);

    const ptDay = polarToCartesian(cx, cy, rMidDay, angleLeft);
    const textDay = document.createElementNS("http://www.w3.org/2000/svg", "text");
    textDay.setAttribute("x", ptDay.x); textDay.setAttribute("y", ptDay.y);
    textDay.setAttribute("text-anchor", "middle"); textDay.setAttribute("dominant-baseline", "central");
    textDay.setAttribute("fill", "#b0b0b0"); textDay.setAttribute("font-size", "7px");
    textDay.setAttribute("transform", `rotate(${angleLeft}, ${ptDay.x}, ${ptDay.y})`);
    textDay.textContent = daysStr[loopDate.getDay()];
    dateLayer.appendChild(textDay);

    const angleRight = baseAngle + 10.5;
    const ptLunar = polarToCartesian(cx, cy, rMidLunar, angleRight);
    
    const event = (i === 0) ? "新月" : getLunarPhaseEvent(timeMsStart, timeMsEnd);
    const lunarLabel = event ? event : getLunarDayKanji(i + 1);
    
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", ptLunar.x); circle.setAttribute("cy", ptLunar.y);
    circle.setAttribute("r", lunarRadius);
    circle.setAttribute("fill", "none");
    circle.setAttribute("stroke", event ? "#d4af37" : "#555555"); 
    circle.setAttribute("stroke-width", event ? "1.2" : "0.8");
    dateLayer.appendChild(circle);

    const textLunar = document.createElementNS("http://www.w3.org/2000/svg", "text");
    textLunar.setAttribute("x", ptLunar.x); textLunar.setAttribute("y", ptLunar.y);
    textLunar.setAttribute("text-anchor", "middle"); textLunar.setAttribute("dominant-baseline", "central");
    textLunar.setAttribute("fill", event ? "#d4af37" : "#2c3e50"); 
    
    const fontSize = lunarLabel.length > 1 ? "8px" : "11px";
    textLunar.setAttribute("font-size", fontSize);
    if(event) textLunar.setAttribute("font-weight", "bold");
    textLunar.setAttribute("font-family", "'Shippori Mincho', serif");
    textLunar.setAttribute("transform", `rotate(${angleRight}, ${ptLunar.x}, ${ptLunar.y})`);
    textLunar.textContent = lunarLabel;
    dateLayer.appendChild(textLunar);
  }
}

function drawOuterSeasons(cycleStartTime) {
  outerSeasonLayer.innerHTML = ""; 
  if (concentricRings.length === 0) return;
  const cycleLengthMs = 30 * 86400000;
  const cycleEndTime = cycleStartTime + cycleLengthMs;
  const rMax = concentricRings[concentricRings.length - 1]; 

  let wafuIndex = (6 + currentCycle) % 12; 
  if (wafuIndex < 0) wafuIndex += 12;
  const currentWafu = wafuNames[wafuIndex];

  // 和風月名（回転させず常に右上に固定するため SVG直下に配置）
  let wafuText = document.getElementById("wafu-text-layer");
  if(wafuText) { wafuText.innerHTML = ""; }
  else {
    wafuText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    wafuText.setAttribute("id", "wafu-text-layer");
    svg.appendChild(wafuText);
  }
  wafuText.setAttribute("x", viewBox.w - 180); 
  wafuText.setAttribute("y", 180);
  wafuText.setAttribute("fill", "#d4af37"); 
  wafuText.setAttribute("font-size", "48px");
  wafuText.setAttribute("font-family", "'Shippori Mincho', serif");
  wafuText.setAttribute("font-weight", "bold");
  wafuText.setAttribute("text-anchor", "end");
  wafuText.textContent = currentWafu;

  generatedSeasons.forEach((season) => {
    if (season.start >= cycleStartTime && season.start < cycleEndTime) {
      const startDay = (season.start - cycleStartTime) / 86400000;
      const angle = currentStartSegment * 3 + startDay * 12;
      const isSekki = season.type === 'sekki';

      const p1 = polarToCartesian(cx, cy, rMax, angle);
      const p2 = polarToCartesian(cx, cy, rMax + (isSekki ? 12 : 8), angle);
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", p1.x); line.setAttribute("y1", p1.y);
      line.setAttribute("x2", p2.x); line.setAttribute("y2", p2.y);
      line.setAttribute("stroke", isSekki ? "#2c3e50" : "#888888");
      line.setAttribute("stroke-width", isSekki ? "1.5" : "0.5");
      outerSeasonLayer.appendChild(line);

      const rText = rMax + (isSekki ? 32 : 16); 
      const ptText = polarToCartesian(cx, cy, rText, angle);
      
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("fill", isSekki ? "#2c3e50" : "#666666"); 
      text.setAttribute("font-size", isSekki ? "14px" : "11px");
      if (isSekki) text.setAttribute("font-weight", "bold");
      text.setAttribute("font-family", "'Shippori Mincho', serif");
      text.setAttribute("dominant-baseline", "middle");
      text.setAttribute("text-anchor", "start");
      text.setAttribute("transform", `rotate(${angle}, ${ptText.x}, ${ptText.y})`);
      text.setAttribute("x", ptText.x);
      text.setAttribute("y", ptText.y);
      text.textContent = season.name;
      
      outerSeasonLayer.appendChild(text);
    }
  });
}

// ★修正：反転なし（常に底辺が中心を向く絶対放射状配置）＋白フチ
function drawTimeLabels() {
  let timeLayer = document.getElementById("time-labels-layer");
  if(timeLayer) { timeLayer.innerHTML = ""; } 
  else {
    timeLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    timeLayer.setAttribute("id", "time-labels-layer");
    masterGroup.appendChild(timeLayer);
  }
  if (concentricRings.length < 20) return;
  const rMidTime = (concentricRings[19] + concentricRings[20]) / 2;
  const timeStr = ["0", "6", "12", "18"];

  for (let i = 0; i < 120; i++) {
    const angle = ((currentStartSegment + i) % 120) * 3;
    const ptTime = polarToCartesian(cx, cy, rMidTime, angle);
    const textTime = document.createElementNS("http://www.w3.org/2000/svg", "text");
    textTime.setAttribute("x", ptTime.x); textTime.setAttribute("y", ptTime.y);
    textTime.setAttribute("text-anchor", "middle"); textTime.setAttribute("dominant-baseline", "central");
    textTime.setAttribute("fill", "#666666"); textTime.setAttribute("font-size", "7px");
    textTime.setAttribute("font-family", "'Shippori Mincho', serif");
    
    // シンプルに角度のまま回転させることで、常に底辺が中心を向く
    textTime.setAttribute("transform", `rotate(${angle}, ${ptTime.x}, ${ptTime.y})`);
    textTime.textContent = timeStr[i % 4];

    const haloTime = textTime.cloneNode(true);
    haloTime.setAttribute("stroke", "rgba(255, 255, 255, 0.95)");
    haloTime.setAttribute("stroke-width", "3");
    haloTime.setAttribute("stroke-linejoin", "round");
    haloTime.setAttribute("fill", "none");

    timeLayer.appendChild(haloTime); 
    timeLayer.appendChild(textTime); 
  }
}

// ★修正：潮汐目盛りも反転なしの絶対放射状配置＋白フチ
function drawTideGraph() {
  tideLayer.innerHTML = ""; 
  if (concentricRings.length < 23) return; 
  const rMin = concentricRings[16]; const rMax = concentricRings[22]; 
  const minTide = -1.5; const maxTide = 7.5; const range = maxTide - minTide;

  const guideTides = [-1.5, 0, 1.5, 3.0, 4.5, 6.0, 7.5];
  
  guideTides.forEach(ft => {
    const r = rMin + (rMax - rMin) * ((ft - minTide) / range);
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", cx); circle.setAttribute("cy", cy); circle.setAttribute("r", r);
    circle.setAttribute("fill", "none"); circle.setAttribute("stroke", "rgba(114, 113, 113, 0.4)"); 
    circle.setAttribute("stroke-width", "0.5"); circle.setAttribute("stroke-dasharray", "4,4"); 
    tideLayer.appendChild(circle);
    
    for(let i = 0; i < 6; i++) {
      const labelAngle = currentStartSegment * 3 + (i * 60); 
      const labelPt = polarToCartesian(cx, cy, r, labelAngle); 
      
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", labelPt.x); text.setAttribute("y", labelPt.y);
      text.setAttribute("text-anchor", "middle"); text.setAttribute("dominant-baseline", "central");
      text.setAttribute("fill", "rgba(114, 113, 113, 1)"); 
      text.setAttribute("font-size", "7px");
      text.setAttribute("font-family", "'Shippori Mincho', serif");
      
      // シンプルな回転（底辺が中心を向く）
      text.setAttribute("transform", `rotate(${labelAngle}, ${labelPt.x}, ${labelPt.y})`);
      text.textContent = ft + "ft";

      const halo = text.cloneNode(true);
      halo.setAttribute("stroke", "rgba(255, 255, 255, 0.95)");
      halo.setAttribute("stroke-width", "3");
      halo.setAttribute("stroke-linejoin", "round");
      halo.setAttribute("fill", "none");

      tideLayer.appendChild(halo);
      tideLayer.appendChild(text);
    }
  });

  let pathD = "";
  const resolution = 10; 
  const totalHours = 720;
  const startAngle = currentStartSegment * 3;

  for (let i = 0; i <= totalHours * resolution; i++) {
    const t = i / resolution; 
    let tide = getTideValue(t);
    const r = rMin + (rMax - rMin) * ((tide - minTide) / range);
    const angle = startAngle + (t * 0.5);
    const pt = polarToCartesian(cx, cy, r, angle);
    if (i === 0) pathD += `M ${pt.x},${pt.y} `; 
    else pathD += `L ${pt.x},${pt.y} `;
  }

  const baseR = rMin + (rMax - rMin) * ((0 - minTide) / range); 
  const pEndBase = polarToCartesian(cx, cy, baseR, startAngle + 360);
  const fillD = pathD + ` L ${pEndBase.x},${pEndBase.y} Z`;

  const fillArea = document.createElementNS("http://www.w3.org/2000/svg", "path");
  fillArea.setAttribute("d", fillD);
  fillArea.setAttribute("fill", "rgba(59, 130, 246, 0.15)"); 
  tideLayer.appendChild(fillArea);

  const wavePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  wavePath.setAttribute("d", pathD); 
  wavePath.setAttribute("fill", "none"); 
  wavePath.setAttribute("stroke", "#3b82f6"); 
  wavePath.setAttribute("stroke-width", "1.5");
  tideLayer.appendChild(wavePath);
}

function drawDynamicLines() {
  linesLayer.innerHTML = ""; 
  const rMin = concentricRings[0]; 
  const rMax = concentricRings[concentricRings.length - 1];
  
  const ringDateInner = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  ringDateInner.setAttribute("cx", cx); ringDateInner.setAttribute("cy", cy);
  ringDateInner.setAttribute("r", concentricRings[concentricRings.length - 2]);
  ringDateInner.setAttribute("fill", "none");
  ringDateInner.setAttribute("stroke", "#555555");
  ringDateInner.setAttribute("stroke-width", "1.5");
  linesLayer.appendChild(ringDateInner);

  for (let i = 0; i < 30; i++) {
    const angle = ((currentStartSegment + i * 4) % 120) * 3;
    const ptInner = polarToCartesian(cx, cy, rMin, angle);
    const ptOuter = polarToCartesian(cx, cy, rMax, angle);
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", ptInner.x); line.setAttribute("y1", ptInner.y);
    line.setAttribute("x2", ptOuter.x); line.setAttribute("y2", ptOuter.y);
    line.setAttribute("stroke", "#555555"); line.setAttribute("stroke-width", "1.5"); 
    linesLayer.appendChild(line);
  }
}

function renderSavedData() {
  dataLayer.innerHTML = "";
  const cyclePrefix = `c${currentCycle}_`;
  for (const key in calendarData) {
    if (key.startsWith(cyclePrefix)) {
      const data = calendarData[key];
      const startAngle = data.absSegment * 3;
      const endAngle = (data.absSegment + 1) * 3;
      drawCell(data.rIn, data.rOut, startAngle, endAngle, data.color);
    }
  }
}

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return { x: centerX + (radius * Math.cos(angleInRadians)), y: centerY + (radius * Math.sin(angleInRadians)) };
}

function drawCell(rIn, rOut, startAngle, endAngle, color) {
  const startIn = polarToCartesian(cx, cy, rIn, endAngle);
  const endIn = polarToCartesian(cx, cy, rIn, startAngle);
  const startOut = polarToCartesian(cx, cy, rOut, endAngle);
  const endOut = polarToCartesian(cx, cy, rOut, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  const d = ["M", startOut.x, startOut.y, "A", rOut, rOut, 0, largeArcFlag, 0, endOut.x, endOut.y, "L", endIn.x, endIn.y, "A", rIn, rIn, 0, largeArcFlag, 1, startIn.x, startIn.y, "Z"].join(" ");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", d); path.setAttribute("fill", color); path.setAttribute("opacity", "0.6");
  dataLayer.appendChild(path);
}

function getRingInfo(distance) {
  if (concentricRings.length === 0) return null;
  for (let i = 0; i < concentricRings.length - 1; i++) {
    if (distance > concentricRings[i] && distance <= concentricRings[i+1]) {
      return { layerId: `layer_${i}`, name: `階層 ${i+1}`, rIn: concentricRings[i], rOut: concentricRings[i+1] };
    }
  }
  return null;
}

document.querySelectorAll('.color-tag').forEach(tag => {
  tag.addEventListener('click', (e) => {
    document.querySelectorAll('.color-tag').forEach(t => t.classList.remove('selected'));
    e.target.classList.add('selected');
    activeBrush = e.target.getAttribute('data-color');
  });
});

// ★新規追加：ホイール回転（ドラッグ操作）の統合管理
function initInteractions() {
  container.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 1.05 : 0.95;
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
    viewBox.w *= zoomFactor; viewBox.h *= zoomFactor;
    viewBox.x = svgP.x - (svgP.x - viewBox.x) * zoomFactor; viewBox.y = svgP.y - (svgP.y - viewBox.y) * zoomFactor;
    svg.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`);
  }, { passive: false });

  let isPanning = false, isRotating = false;
  let startPos = { x: 0, y: 0 }, dragDistance = 0;
  let startGlobalRotation = 0, startAngleOffset = 0;

  container.addEventListener('mousedown', (e) => {
    dragDistance = 0;
    if (interactionMode === 'rotate') {
      isRotating = true;
      const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      const svgP = pt.matrixTransform(svg.getScreenCTM().inverse()); 
      startAngleOffset = Math.atan2(svgP.y - cy, svgP.x - cx) * 180 / Math.PI;
      startGlobalRotation = globalRotation;
      container.classList.add('is-rotating');
    } else {
      isPanning = true;
      startPos = { x: e.clientX, y: e.clientY };
      container.classList.add('is-dragging');
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (isPanning) {
      const dxScreen = startPos.x - e.clientX, dyScreen = startPos.y - e.clientY;
      dragDistance += Math.abs(dxScreen) + Math.abs(dyScreen);
      viewBox.x += dxScreen * (viewBox.w / container.clientWidth); viewBox.y += dyScreen * (viewBox.h / container.clientHeight);
      svg.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`);
      startPos = { x: e.clientX, y: e.clientY };
    } else if (isRotating) {
      const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
      const currentAngleOffset = Math.atan2(svgP.y - cy, svgP.x - cx) * 180 / Math.PI;
      let delta = currentAngleOffset - startAngleOffset;
      
      // 360度境界またぎの滑らかな処理
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      
      globalRotation = startGlobalRotation + delta;
      masterGroup.setAttribute('transform', `rotate(${globalRotation}, ${cx}, ${cy})`);
      dragDistance += Math.abs(delta) * 5; 
      
      startGlobalRotation = globalRotation; 
      startAngleOffset = currentAngleOffset; 
    }

    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    // ★マスタグループ（回転後）のローカル座標を取得してセルを計算
    const svgP = pt.matrixTransform(masterGroup.getScreenCTM().inverse());
    const dx = svgP.x - cx, dy = svgP.y - cy;
    const distance = Math.sqrt(dx * dx + dy * dy);
    let angle = Math.atan2(dy, dx) * (180 / Math.PI); angle = (angle + 90 + 360) % 360;

    const absSegment = Math.floor(angle / 3);
    const ringInfo = getRingInfo(distance);
    
    if (ringInfo) {
      const relSegment = (absSegment - currentStartSegment + 120) % 120;
      const day = Math.floor(relSegment / 4) + 1;
      const timeSlot = relSegment % 4;
      const timeLabels = ["0:00〜6:00", "6:00〜12:00", "12:00〜18:00", "18:00〜24:00"];
      statusBar.innerText = `第 ${day} 日目 ｜ ${timeLabels[timeSlot]} ｜ ${ringInfo.name}`;
      statusBar.style.color = "#fff";
    } else {
      statusBar.innerText = `キャンバス外`; statusBar.style.color = "#8b949e";
    }
  });

  window.addEventListener('mouseup', () => { 
    isPanning = false; isRotating = false;
    container.classList.remove('is-dragging'); container.classList.remove('is-rotating');
  });

  svg.addEventListener('click', (e) => {
    if (dragDistance > 5) return;
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    // ★マスタグループ（回転後）のローカル座標を取得して色塗り
    const svgP = pt.matrixTransform(masterGroup.getScreenCTM().inverse());
    const dx = svgP.x - cx, dy = svgP.y - cy;
    const distance = Math.sqrt(dx * dx + dy * dy);
    let angle = Math.atan2(dy, dx) * (180 / Math.PI); angle = (angle + 90 + 360) % 360;

    const absSegment = Math.floor(angle / 3);
    const ringInfo = getRingInfo(distance);
    if (!ringInfo) return;

    const cellKey = `c${currentCycle}_abs${absSegment}_${ringInfo.layerId}`;
    if (activeBrush === "erase") delete calendarData[cellKey];
    else {
      calendarData[cellKey] = { color: activeBrush, absSegment: absSegment, rIn: ringInfo.rIn, rOut: ringInfo.rOut };
    }
    
    localStorage.setItem('polarCalendarDataV5', JSON.stringify(calendarData));
    renderSavedData();
  });
}
