// script.js (システムの脳みそ・計算ロジック)

const container = document.getElementById('container');
const statusBar = document.getElementById('status-bar');

let svg, dataLayer;
let viewBox = { x: 0, y: 0, w: 1841.3719, h: 2382.9518 };
const cx = 920.6859;
const cy = 1191.4759;

let activeBrush = "#38bdf8"; 
let calendarData = JSON.parse(localStorage.getItem('polarCalendarDataV3')) || {};

// 1. SVGの読み込み
fetch('calendar.svg')
  .then(response => response.text())
  .then(svgCode => {
    container.innerHTML = svgCode;
    svg = container.querySelector('svg');
    svg.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`);
    
    svg.querySelectorAll('*[fill="#fff"]').forEach(el => el.setAttribute('fill', 'none'));

    dataLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    dataLayer.setAttribute("id", "data-layer");
    svg.insertBefore(dataLayer, svg.firstChild);

    renderSavedData();
    initInteractions();
  })
  .catch(err => console.error("SVG読み込みエラー:", err));

// --- 色の描画 ---
function renderSavedData() {
  dataLayer.innerHTML = "";
  for (const key in calendarData) {
    const data = calendarData[key];
    drawCell(data.rIn, data.rOut, data.startAngle, data.endAngle, data.color);
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
  
  const d = [
    "M", startOut.x, startOut.y,
    "A", rOut, rOut, 0, largeArcFlag, 0, endOut.x, endOut.y,
    "L", endIn.x, endIn.y,
    "A", rIn, rIn, 0, largeArcFlag, 1, startIn.x, startIn.y,
    "Z"
  ].join(" ");
  
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", d);
  path.setAttribute("fill", color);
  path.setAttribute("opacity", "0.6");
  dataLayer.appendChild(path);
}

// --- 同心円の「年輪1本1本」を判定するロジック ---
function getRingInfo(distance) {
  // Illustratorの精密な半径データ（内側から外側へ5段階）
  const waterRings = [141.73, 155.90, 170.07, 184.25, 198.42, 212.59];
  const plantsRings = [226.77, 240.94, 255.11, 269.29, 283.46, 297.63];
  const tideRings = [368.50, 411.02, 453.54, 496.06, 538.58, 581.10];

  for (let i = 0; i < 5; i++) {
    if (distance > waterRings[i] && distance <= waterRings[i+1]) return { layer: `water_${i+1}`, name: `海(層${i+1})`, rIn: waterRings[i], rOut: waterRings[i+1] };
    if (distance > plantsRings[i] && distance <= plantsRings[i+1]) return { layer: `plants_${i+1}`, name: `植物(層${i+1})`, rIn: plantsRings[i], rOut: plantsRings[i+1] };
    if (distance > tideRings[i] && distance <= tideRings[i+1]) return { layer: `tide_${i+1}`, name: `潮汐(層${i+1})`, rIn: tideRings[i], rOut: tideRings[i+1] };
  }
  
  // メモ用リング（分割なしの1層）
  if (distance > 297.63 && distance <= 340.15) return { layer: "comment", name: "メモ", rIn: 297.63, rOut: 340.15 };
  
  return null;
}

// --- パレット選択 ---
document.querySelectorAll('.color-tag').forEach(tag => {
  tag.addEventListener('click', (e) => {
    document.querySelectorAll('.color-tag').forEach(t => t.classList.remove('selected'));
    e.target.classList.add('selected');
    activeBrush = e.target.getAttribute('data-color');
  });
});

// --- インタラクション（ズーム・移動・ペイント） ---
function initInteractions() {
  // ズーム
  container.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 1.05 : 0.95;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
    
    viewBox.w *= zoomFactor; viewBox.h *= zoomFactor;
    viewBox.x = svgP.x - (svgP.x - viewBox.x) * zoomFactor;
    viewBox.y = svgP.y - (svgP.y - viewBox.y) * zoomFactor;
    svg.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`);
  }, { passive: false });

  // ドラッグ移動
  let isPanning = false, startPos = { x: 0, y: 0 }, dragDistance = 0;
  container.addEventListener('mousedown', (e) => {
    isPanning = true; dragDistance = 0;
    startPos = { x: e.clientX, y: e.clientY };
    container.classList.add('is-dragging'); // カーソルを「掴む」にする
  });
  
  window.addEventListener('mousemove', (e) => {
    if (isPanning) {
      const dxScreen = startPos.x - e.clientX, dyScreen = startPos.y - e.clientY;
      dragDistance += Math.abs(dxScreen) + Math.abs(dyScreen);
      viewBox.x += dxScreen * (viewBox.w / container.clientWidth);
      viewBox.y += dyScreen * (viewBox.h / container.clientHeight);
      svg.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`);
      startPos = { x: e.clientX, y: e.clientY };
    }

    // ホバー中の空間認識（ステータスバー）
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
    const dx = svgP.x - cx, dy = svgP.y - cy;
    const distance = Math.sqrt(dx * dx + dy * dy);
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    angle = (angle + 90 + 360) % 360;

    const segmentIndex = Math.floor(angle / 3);
    const day = Math.floor(segmentIndex / 4) + 1;
    const timeSlot = segmentIndex % 4;
    const timeLabels = ["0:00〜6:00", "6:00〜12:00", "12:00〜18:00", "18:00〜24:00"];
    const ringInfo = getRingInfo(distance);
    
    if (ringInfo) {
      statusBar.innerText = `第 ${day} 日目 ｜ ${timeLabels[timeSlot]} ｜ ${ringInfo.name}`;
      statusBar.style.color = "#fff";
    } else {
      statusBar.innerText = `キャンバス外`;
      statusBar.style.color = "#8b949e";
    }
  });
  window.addEventListener('mouseup', () => {
    isPanning = false;
    container.classList.remove('is-dragging'); // 十字カーソルに戻す
  });

  // ペイント（クリック時）
  svg.addEventListener('click', (e) => {
    if (dragDistance > 5) return;

    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());

    const dx = svgP.x - cx, dy = svgP.y - cy;
    const distance = Math.sqrt(dx * dx + dy * dy);
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    angle = (angle + 90 + 360) % 360;

    const segmentIndex = Math.floor(angle / 3);
    const startAngle = segmentIndex * 3;
    const endAngle = (segmentIndex + 1) * 3;
    
    const ringInfo = getRingInfo(distance);
    if (!ringInfo) return;

    const day = Math.floor(segmentIndex / 4) + 1;
    const timeSlot = segmentIndex % 4;
    const cellKey = `day${day}_slot${timeSlot}_${ringInfo.layer}`;

    if (activeBrush === "erase") {
      delete calendarData[cellKey];
    } else {
      calendarData[cellKey] = {
        color: activeBrush,
        rIn: ringInfo.rIn, rOut: ringInfo.rOut, 
        startAngle: startAngle, endAngle: endAngle
      };
    }
    
    localStorage.setItem('polarCalendarDataV3', JSON.stringify(calendarData));
    renderSavedData();
  });
}
