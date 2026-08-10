// script.js (二十四節気・七十二候 自動グラデーション＆指示棒エンジン搭載版)

const container = document.getElementById('container');
const statusBar = document.getElementById('status-bar');

let svg, dataLayer, linesLayer, tideLayer, seasonLayer, textPathDefs;
let viewBox = { x: 0, y: 0, w: 1841.3719, h: 2382.9518 };
const cx = 920.6859;
const cy = 1191.4759;
let activeBrush = "#38bdf8"; 

let calendarData = JSON.parse(localStorage.getItem('polarCalendarDataV5')) || {};
let concentricRings = []; 

const baseDate = new Date(2026, 7, 13);
const synodicMonth = 29.530589;
let currentCycle = 0; 
let currentStartSegment = 0; 

// ★二十四節気と七十二候のマスターデータ（数式用）
const sekkiNames = "立春,雨水,啓蟄,春分,清明,穀雨,立夏,小満,芒種,夏至,小暑,大暑,立秋,処暑,白露,秋分,寒露,霜降,立冬,小雪,大雪,冬至,小寒,大寒".split(',');
const kouNames = "東風解凍,黄鶯睍睆,魚上氷,土脉潤起,霞始靆,草木萠動,蟄虫啓戸,桃始笑,菜虫化蝶,雀始巣,桜始開,雷乃発声,玄鳥至,雁音北,虹始見,葭始生,霜止出苗,牡丹華,蛙始鳴,蚯蚓出,竹笋生,蚕起食桑,紅花栄,麦秋至,螳螂生,鵙乃鳴,梅子黄,乃東枯,菖蒲華,半夏生,温風至,蓮始開,鷹乃学習,桐始結花,土潤溽暑,大雨時行,涼風至,寒蝉鳴,蒙霧升降,綿柎開,天地始粛,禾乃登,草露白,鶺鴒鳴,玄鳥去,雷乃収声,蟄虫坏戸,水始涸,鴻雁来,菊花開,蟋蟀在戸,霜始降,霎時施,楓蔦黄,山茶始開,地始凍,金盞香,虹蔵不見,朔風払葉,橘始黄,閉塞成冬,熊蟄穴,鱖魚群,乃東生,麋角解,雪下出麦,芹乃栄,水泉動,雉始雊,款冬華,水沢腹堅,鶏始乳".split(',');

let generatedSeasons = []; // 3年分の季節データを格納する箱

// テスト用：パラオのリアルな満潮・干潮データ
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

const navDiv = document.createElement('div');
navDiv.style = "position:fixed; top:30px; right:30px; background:rgba(25,30,40,0.85); padding:15px; border-radius:12px; color:#d4af37; z-index:100; display:flex; gap:15px; align-items:center; border: 1px solid rgba(212,175,55,0.3); backdrop-filter: blur(10px); box-shadow: 0 10px 30px rgba(0,0,0,0.2);";
navDiv.innerHTML = `
  <button id="prevBtn" style="background:transparent; border:1px solid #d4af37; color:#d4af37; padding:5px 10px; cursor:pointer; border-radius:4px;">◀ 過去の輪へ</button>
  <div id="cycleDisplay" style="font-weight:bold; font-size:14px; text-align:center; min-width:140px;">--</div>
  <button id="nextBtn" style="background:#d4af37; border:none; color:#000; padding:5px 10px; cursor:pointer; border-radius:4px; font-weight:bold;">次の輪へ ▶</button>
`;
document.body.appendChild(navDiv);

document.getElementById('prevBtn').addEventListener('click', () => { currentCycle--; updateCalendarCycle(); });
document.getElementById('nextBtn').addEventListener('click', () => { currentCycle++; updateCalendarCycle(); });

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

    // ★カーブ文字の定義用レイヤー（透明）
    textPathDefs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    textPathDefs.setAttribute("id", "text-path-defs");
    svg.insertBefore(textPathDefs, svg.firstChild);

    // ★二十四節気・七十二候レイヤー（グリッド線の下に潜り込ませる）
    seasonLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    seasonLayer.setAttribute("id", "season-layer");
    svg.insertBefore(seasonLayer, svg.firstChild.nextSibling);

    dataLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    dataLayer.setAttribute("id", "data-layer");
    svg.insertBefore(dataLayer, seasonLayer.nextSibling);

    tideLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    tideLayer.setAttribute("id", "tide-layer");
    svg.appendChild(tideLayer);

    linesLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    linesLayer.setAttribute("id", "dynamic-lines-layer");
    svg.appendChild(linesLayer);

    generateAstronomicalData(); // 季節データの生成
    updateCalendarCycle();
    initInteractions();
  })
  .catch(err => console.error("SVG読み込みエラー:", err));

// ★太陽の動きから季節データを3年分生成するエンジン
function generateAstronomicalData() {
  const yearDays = 365.242;
  const dayMs = 86400000;
  
  for (let year = 2025; year <= 2027; year++) {
    const risshunTime = new Date(year, 1, 4).getTime(); // 立春基準
    
    // 24節気（約15日ごと）
    sekkiNames.forEach((name, i) => {
      const start = risshunTime + i * (yearDays / 24) * dayMs;
      const end = risshunTime + (i + 1) * (yearDays / 24) * dayMs;
      const hue = (80 + (i / 24) * 360) % 360; // 春(80)を起点に1年で色が1周
      generatedSeasons.push({ type: 'sekki', name, start, end, color: `hsla(${hue}, 65%, 65%, 0.7)` });
    });

    // 72候（約5日ごと）
    kouNames.forEach((name, i) => {
      const start = risshunTime + i * (yearDays / 72) * dayMs;
      const end = risshunTime + (i + 1) * (yearDays / 72) * dayMs;
      const hue = (80 + (Math.floor(i / 3) / 24) * 360) % 360; 
      generatedSeasons.push({ type: 'kou', name, start, end, color: `hsla(${hue}, 50%, 80%, 0.7)` });
    });
  }
}

function updateCalendarCycle() {
  const totalElapsedDays = currentCycle * synodicMonth;
  const startDate = new Date(baseDate.getTime() + totalElapsedDays * 24 * 60 * 60 * 1000);
  currentStartSegment = Math.round((totalElapsedDays % 30) / 0.25);
  
  const y = startDate.getFullYear();
  const m = startDate.getMonth() + 1;
  const d = startDate.getDate();
  document.getElementById('cycleDisplay').innerHTML = `${y}年 ${m}月<br><span style="font-size:11px; color:#8b949e;">新月: ${m}月${d}日〜</span>`;

  drawSolarDates(startDate);
  drawSeasonsBlocks(startDate.getTime()); // ★季節ブロックの描画
  drawTideGraph();    
  drawDynamicLines(); 
  renderSavedData();
}

// ★二十四節気・七十二候のブロック＆文字描画エンジン
function drawSeasonsBlocks(cycleStartTime) {
  seasonLayer.innerHTML = ""; 
  textPathDefs.innerHTML = ""; 

  if (concentricRings.length < 3) return;
  
  const cycleLengthMs = 30 * 86400000;
  const cycleEndTime = cycleStartTime + cycleLengthMs;

  generatedSeasons.forEach((season, index) => {
    // 今の月（輪）の期間と重なっているかチェック
    if (season.end > cycleStartTime && season.start < cycleEndTime) {
      
      // 今の輪の中での相対的な日数を計算
      const startRelMs = Math.max(0, season.start - cycleStartTime);
      const endRelMs = Math.min(cycleLengthMs, season.end - cycleStartTime);
      
      const startDay = startRelMs / 86400000;
      const endDay = endRelMs / 86400000;
      const spanDays = endDay - startDay; // この月での表示日数
      
      const startAngle = currentStartSegment * 3 + startDay * 12;
      const endAngle = currentStartSegment * 3 + endDay * 12;
      
      // 階層の設定（1:節気, 2:候）
      const isSekki = season.type === 'sekki';
      const rIn = isSekki ? concentricRings[0] : concentricRings[1];
      const rOut = isSekki ? concentricRings[1] : concentricRings[2];
      const rMid = (rIn + rOut) / 2;

      // 1. 背景色のブロックを描画（グラデーション対応）
      drawSeasonArc(rIn, rOut, startAngle, endAngle, season.color);

      // 2. 文字の配置処理（指示棒かカーブ文字か）
      const midAngle = startAngle + (endAngle - startAngle) / 2;
      
      if (spanDays >= 2.0) { 
        // 2日分以上（スペースあり）なら、ブロックに沿って美しくカーブさせる
        const pathId = `path_${season.type}_${index}`;
        const textPathArc = document.createElementNS("http://www.w3.org/2000/svg", "path");
        textPathArc.setAttribute("id", pathId);
        
        // テキスト用の弧を生成
        const pStart = polarToCartesian(cx, cy, rMid, startAngle);
        const pEnd = polarToCartesian(cx, cy, rMid, endAngle);
        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
        const d = `M ${pStart.x} ${pStart.y} A ${rMid} ${rMid} 0 ${largeArcFlag} 1 ${pEnd.x} ${pEnd.y}`;
        textPathArc.setAttribute("d", d);
        textPathDefs.appendChild(textPathArc);

        const textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
        textEl.setAttribute("font-size", isSekki ? "12px" : "8px");
        textEl.setAttribute("fill", "#2c3e50"); // 墨色
        textEl.setAttribute("font-family", "'Shippori Mincho', serif");

        const textPathEl = document.createElementNS("http://www.w3.org/2000/svg", "textPath");
        textPathEl.setAttribute("href", "#" + pathId);
        textPathEl.setAttribute("startOffset", "50%");
        textPathEl.setAttribute("text-anchor", "middle");
        textPathEl.setAttribute("dominant-baseline", "central");
        textPathEl.textContent = season.name;
        
        textEl.appendChild(textPathEl);
        seasonLayer.appendChild(textEl);
        
      } else {
        // ★スペース不足（月またぎ等）：内側へ向かう上品な「指示棒」を出す
        const pStart = polarToCartesian(cx, cy, rMid, midAngle);
        // 指示棒は内側の円（星図の邪魔にならない程度）へ引き出す
        const pullDistance = isSekki ? 30 : 15;
        const rEnd = rIn - pullDistance; 
        const pEnd = polarToCartesian(cx, cy, rEnd, midAngle);
        
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", pStart.x); line.setAttribute("y1", pStart.y);
        line.setAttribute("x2", pEnd.x); line.setAttribute("y2", pEnd.y);
        line.setAttribute("stroke", "#727171"); 
        line.setAttribute("stroke-width", "0.5");
        seasonLayer.appendChild(line);
        
        const textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
        // テキスト位置は線の終点のさらに少し内側
        const pText = polarToCartesian(cx, cy, rEnd - 5, midAngle);
        textEl.setAttribute("x", pText.x); textEl.setAttribute("y", pText.y);
        textEl.setAttribute("font-size", isSekki ? "10px" : "7px");
        textEl.setAttribute("fill", "#2c3e50");
        textEl.setAttribute("font-family", "'Shippori Mincho', serif");
        
        // 角度によって左右のアンカーを調整
        const relAngle = midAngle % 360;
        textEl.setAttribute("text-anchor", (relAngle > 180) ? "end" : "start");
        textEl.setAttribute("dominant-baseline", "middle");
        textEl.textContent = season.name;
        seasonLayer.appendChild(textEl);
      }
    }
  });
}

function drawSeasonArc(rIn, rOut, startAngle, endAngle, color) {
  const startIn = polarToCartesian(cx, cy, rIn, endAngle);
  const endIn = polarToCartesian(cx, cy, rIn, startAngle);
  const startOut = polarToCartesian(cx, cy, rOut, endAngle);
  const endOut = polarToCartesian(cx, cy, rOut, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  const d = ["M", startOut.x, startOut.y, "A", rOut, rOut, 0, largeArcFlag, 0, endOut.x, endOut.y, "L", endIn.x, endIn.y, "A", rIn, rIn, 0, largeArcFlag, 1, startIn.x, startIn.y, "Z"].join(" ");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", d); path.setAttribute("fill", color);
  seasonLayer.appendChild(path);
}

// 潮汐・太線・日付・塗り等の既存機能（変更なし）
function drawTideGraph() {
  tideLayer.innerHTML = ""; 
  if (concentricRings.length < 23) return; 
  const rMin = concentricRings[16]; const rMax = concentricRings[22]; 
  const minTide = -1.5; const maxTide = 7.5; const range = maxTide - minTide;

  const guideTides = [0, 1.5, 3.0, 4.5, 6.0];
  guideTides.forEach(ft => {
    const r = rMin + (rMax - rMin) * ((ft - minTide) / range);
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", cx); circle.setAttribute("cy", cy); circle.setAttribute("r", r);
    circle.setAttribute("fill", "none"); circle.setAttribute("stroke", "rgba(114, 113, 113, 0.4)"); 
    circle.setAttribute("stroke-width", "0.5"); circle.setAttribute("stroke-dasharray", "4,4"); 
    tideLayer.appendChild(circle);
    
    const labelAngle = currentStartSegment * 3 - 2;
    const labelPt = polarToCartesian(cx, cy, r, labelAngle); 
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", labelPt.x); text.setAttribute("y", labelPt.y);
    text.setAttribute("fill", "rgba(114, 113, 113, 0.8)"); text.setAttribute("font-size", "7px");
    text.setAttribute("text-anchor", "end"); text.setAttribute("dominant-baseline", "bottom");
    text.setAttribute("transform", `rotate(${labelAngle}, ${labelPt.x}, ${labelPt.y})`);
    text.textContent = ft + "ft";
    tideLayer.appendChild(text);
  });

  let pathD = "";
  const resolution = 10; const totalHours = 720;
  for (let i = 0; i <= totalHours * resolution; i++) {
    const t = i / resolution; 
    let tide = 0;
    let p1 = null, p2 = null;
    for (let j = 0; j < tidePoints.length - 1; j++) {
      if (t >= tidePoints[j].t && t <= tidePoints[j + 1].t) {
        p1 = tidePoints[j]; p2 = tidePoints[j+1]; break;
      }
    }
    if (p1 && p2) tide = (p1.h + p2.h)/2 + (p1.h - p2.h)/2 * Math.cos( Math.PI * (t - p1.t)/(p2.t - p1.t) );
    else tide = 3.0 + 3.5 * Math.sin(t * 2 * Math.PI / 12.42) + 1.0 * Math.cos(t * 2 * Math.PI / 24.84);
    
    const r = rMin + (rMax - rMin) * ((tide - minTide) / range);
    const angle = (currentStartSegment * 3) + (t * 0.5);
    const pt = polarToCartesian(cx, cy, r, angle);
    if (i === 0) pathD += `M ${pt.x},${pt.y} `; else pathD += `L ${pt.x},${pt.y} `;
  }
  const wavePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  wavePath.setAttribute("d", pathD); wavePath.setAttribute("fill", "none");
  wavePath.setAttribute("stroke", "#3b82f6"); wavePath.setAttribute("stroke-width", "1.5");
  tideLayer.appendChild(wavePath);
}

function drawDynamicLines() {
  linesLayer.innerHTML = ""; 
  const rMin = concentricRings[0]; const rMax = concentricRings[concentricRings.length - 1];
  for (let i = 0; i < 30; i++) {
    const absoluteSegment = (currentStartSegment + i * 4) % 120;
    const angle = absoluteSegment * 3;
    const ptInner = polarToCartesian(cx, cy, rMin, angle);
    const ptOuter = polarToCartesian(cx, cy, rMax, angle);
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", ptInner.x); line.setAttribute("y1", ptInner.y); line.setAttribute("x2", ptOuter.x); line.setAttribute("y2", ptOuter.y);
    line.setAttribute("stroke", "#555555"); line.setAttribute("stroke-width", "1.5"); 
    linesLayer.appendChild(line);
  }
}

function drawSolarDates(startDate) {
  let dateLayer = document.getElementById("solar-dates-layer");
  if(dateLayer) { dateLayer.innerHTML = ""; } 
  else {
    dateLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    dateLayer.setAttribute("id", "solar-dates-layer");
    svg.appendChild(dateLayer);
  }
  const rIn = concentricRings[concentricRings.length - 2];
  const rOut = concentricRings[concentricRings.length - 1];
  const rMidDate = rIn + (rOut - rIn) * 0.7; 
  const rMidDay = rIn + (rOut - rIn) * 0.25; 
  const daysStr = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  for (let i = 0; i < 30; i++) {
    const loopDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const absoluteSegment = (currentStartSegment + i * 4) % 120;
    const angle = absoluteSegment * 3 + 1.5;
    
    const ptDate = polarToCartesian(cx, cy, rMidDate, angle);
    const textDate = document.createElementNS("http://www.w3.org/2000/svg", "text");
    textDate.setAttribute("x", ptDate.x); textDate.setAttribute("y", ptDate.y);
    textDate.setAttribute("text-anchor", "middle"); textDate.setAttribute("dominant-baseline", "central");
    textDate.setAttribute("fill", "#727171"); textDate.setAttribute("font-size", "14px");
    textDate.setAttribute("transform", `rotate(${angle}, ${ptDate.x}, ${ptDate.y})`);
    textDate.textContent = loopDate.getDate();
    dateLayer.appendChild(textDate);

    const ptDay = polarToCartesian(cx, cy, rMidDay, angle);
    const textDay = document.createElementNS("http://www.w3.org/2000/svg", "text");
    textDay.setAttribute("x", ptDay.x); textDay.setAttribute("y", ptDay.y);
    textDay.setAttribute("text-anchor", "middle"); textDay.setAttribute("dominant-baseline", "central");
    textDay.setAttribute("fill", "#b0b0b0"); textDay.setAttribute("font-size", "8px");
    textDay.setAttribute("transform", `rotate(${angle}, ${ptDay.x}, ${ptDay.y})`);
    textDay.textContent = daysStr[loopDate.getDay()];
    dateLayer.appendChild(textDay);
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

  let isPanning = false, startPos = { x: 0, y: 0 }, dragDistance = 0;
  container.addEventListener('mousedown', (e) => {
    isPanning = true; dragDistance = 0; startPos = { x: e.clientX, y: e.clientY };
    container.classList.add('is-dragging');
  });
  window.addEventListener('mousemove', (e) => {
    if (isPanning) {
      const dxScreen = startPos.x - e.clientX, dyScreen = startPos.y - e.clientY;
      dragDistance += Math.abs(dxScreen) + Math.abs(dyScreen);
      viewBox.x += dxScreen * (viewBox.w / container.clientWidth); viewBox.y += dyScreen * (viewBox.h / container.clientHeight);
      svg.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`);
      startPos = { x: e.clientX, y: e.clientY };
    }

    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
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
  window.addEventListener('mouseup', () => { isPanning = false; container.classList.remove('is-dragging'); });

  svg.addEventListener('click', (e) => {
    if (dragDistance > 5) return;
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
    const dx = svgP.x - cx, dy = svgP.y - cy;
    const distance = Math.sqrt(dx * dx + dy * dy);
    let angle = Math.atan2(dy, dx) * (180 / Math.PI); angle = (angle + 90 + 360) % 360;

    const absSegment = Math.floor(angle / 3);
    const ringInfo = getRingInfo(distance);
    if (!ringInfo) return;

    const cellKey = `c${currentCycle}_abs${absSegment}_${ringInfo.layerId}`;

    if (activeBrush === "erase") {
      delete calendarData[cellKey];
    } else {
      calendarData[cellKey] = {
        color: activeBrush, absSegment: absSegment,
        rIn: ringInfo.rIn, rOut: ringInfo.rOut
      };
    }
    
    localStorage.setItem('polarCalendarDataV5', JSON.stringify(calendarData));
    renderSavedData();
  });
}
