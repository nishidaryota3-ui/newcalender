// script.js (潮汐グラフ テスト描画版)

const container = document.getElementById('container');
const statusBar = document.getElementById('status-bar');

let svg, dataLayer, linesLayer, tideLayer;
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

// UI
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

// SVGロード
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

    dataLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    dataLayer.setAttribute("id", "data-layer");
    svg.insertBefore(dataLayer, svg.firstChild);

    // 潮汐グラフ用レイヤー
    tideLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    tideLayer.setAttribute("id", "tide-layer");
    svg.appendChild(tideLayer);

    // 太線用レイヤー
    linesLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    linesLayer.setAttribute("id", "dynamic-lines-layer");
    svg.appendChild(linesLayer);

    updateCalendarCycle();
    initInteractions();
  })
  .catch(err => console.error("SVG読み込みエラー:", err));

// サイクル更新
function updateCalendarCycle() {
  const totalElapsedDays = currentCycle * synodicMonth;
  const startDate = new Date(baseDate.getTime() + totalElapsedDays * 24 * 60 * 60 * 1000);
  
  currentStartSegment = Math.round((totalElapsedDays % 30) / 0.25);
  
  const y = startDate.getFullYear();
  const m = startDate.getMonth() + 1;
  const d = startDate.getDate();
  document.getElementById('cycleDisplay').innerHTML = `${y}年 ${m}月<br><span style="font-size:11px; color:#8b949e;">新月: ${m}月${d}日〜</span>`;

  drawSolarDates(startDate);
  drawTideGraph();    // ★潮汐グラフを描画
  drawDynamicLines(); // 太線を描画
  renderSavedData();
}

// ★潮汐波の自動描画エンジン
function drawTideGraph() {
  tideLayer.innerHTML = ""; 
  
  // 階層17（インデックス16）から、階層22の外側（インデックス22）までを使用
  if (concentricRings.length < 23) return; 
  const rMin = concentricRings[16]; 
  const rMax = concentricRings[22]; 
  
  const minTide = -1.5;
  const maxTide = 7.5;
  const range = maxTide - minTide;

  // 1. ガイドライン（点線）の描画
  const guideTides = [0, 3, 6];
  guideTides.forEach(ft => {
    const r = rMin + (rMax - rMin) * ((ft - minTide) / range);
    
    // 点線の円
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", cx); circle.setAttribute("cy", cy); circle.setAttribute("r", r);
    circle.setAttribute("fill", "none");
    circle.setAttribute("stroke", "rgba(114, 113, 113, 0.5)"); // 半透明のグレー
    circle.setAttribute("stroke-width", "0.5");
    circle.setAttribute("stroke-dasharray", "4,4"); // 点線
    tideLayer.appendChild(circle);
    
    // 「0ft」などの文字ラベル（スタート位置に配置）
    const labelAngle = currentStartSegment * 3 - 2;
    const labelPt = polarToCartesian(cx, cy, r, labelAngle); 
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", labelPt.x); text.setAttribute("y", labelPt.y);
    text.setAttribute("fill", "rgba(114, 113, 113, 0.8)");
    text.setAttribute("font-size", "7px");
    text.setAttribute("text-anchor", "end");
    text.setAttribute("dominant-baseline", "bottom");
    text.setAttribute("transform", `rotate(${labelAngle}, ${labelPt.x}, ${labelPt.y})`);
    text.textContent = ft + "ft";
    tideLayer.appendChild(text);
  });

  // 2. 波（テスト用サインカーブ）の描画
  let pathD = "";
  // 30日 × 24時間 = 720時間分（1時間ごとに点を打つ）
  for (let h = 0; h <= 720; h++) {
    // 架空の潮位計算（12.42時間周期と24.84時間周期を混ぜた自然な波）
    const t = h; 
    const tide = 3.0 + 3.5 * Math.sin(t * 2 * Math.PI / 12.42) + 1.0 * Math.cos(t * 2 * Math.PI / 24.84);
    
    // 潮位を半径にマッピング
    const r = rMin + (rMax - rMin) * ((tide - minTide) / range);
    
    // 角度の計算（1時間 = 0.5度）。スタート位置から足していく
    const angle = (currentStartSegment * 3) + (h * 0.5);
    const pt = polarToCartesian(cx, cy, r, angle);
    
    if (h === 0) {
      pathD += `M ${pt.x},${pt.y} `;
    } else {
      pathD += `L ${pt.x},${pt.y} `;
    }
  }

  const wavePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  wavePath.setAttribute("d", pathD);
  wavePath.setAttribute("fill", "none");
  wavePath.setAttribute("stroke", "#3b82f6"); // 海のような美しいブルー
  wavePath.setAttribute("stroke-width", "1.5");
  tideLayer.appendChild(wavePath);
}

// 動的太線
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

// 日付と曜日
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

// 色塗り関連
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

// パレット＆インタラクション
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
