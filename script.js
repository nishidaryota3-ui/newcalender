// script.js (V27: 極座標カレンダー - 二十七宿軌道 ＆ 印刷機能搭載 完全版)

const container = document.getElementById('container');
const statusBar = document.getElementById('status-bar');

// 印刷用スタイルの注入
const style = document.createElement('style');
style.innerHTML = `
@media print {
    .panel-ui, #status-bar { display: none !important; }
    body { margin: 0; padding: 0; background: #fff !important; }
    svg { width: 100vw; height: 100vh; }
    @page { size: A3; margin: 0; }
}
`;
document.head.appendChild(style);

let svg, masterGroup, bgGroup, dataLayer, shadowLayer, linesLayer, rainfallLayer, tideLayer, lunarMansionLayer, outerSeasonLayer, textPathDefs;
let viewBox = { x: 0, y: 0, w: 1841.3719, h: 2382.9518 };
const cx = 920.6859;
const cy = 1191.4759;
const svgNS = "http://www.w3.org/2000/svg";

let currentTool = 'pointer'; 
let interactionMode = 'pan'; 
let activeBrush = "#38bdf8"; 
let globalRotation = 0; 
let calendarData = JSON.parse(localStorage.getItem('polarCalendarDataV27')) || {};
let concentricRings = []; 

const PALAU_LAT = 7.34;
const PALAU_LON = 134.48;

const baseDate = new Date(2026, 7, 13);
const synodicMonth = 29.530589;
let currentCycle = 0; 
let currentStartSegment = 0; 

const sekkiNames = "立春,雨水,啓蟄,春分,清明,穀雨,立夏,小満,芒種,夏至,小暑,大暑,立秋,処暑,白露,秋分,寒露,霜降,立冬,小雪,大雪,冬至,小寒,大寒".split(',');
const kouNames = "東風解凍,黄鶯睍睆,魚上氷,土脉潤起,霞始靆,草木萠動,蟄虫啓戸,桃始笑,菜虫化蝶,雀始巣,桜始開,雷乃発声,玄鳥至,雁音北,虹始見,葭始生,霜止出苗,牡丹華,蛙始鳴,蚯蚓出,竹笋生,蚕起食桑,紅花栄,麦秋至,螳螂生,鵙乃鳴,梅子黄,乃東枯,菖蒲華,半夏生,温風至,蓮始開,鷹乃学習,桐始結花,土潤溽暑,大雨時行,涼風至,寒蝉鳴,蒙霧升降,綿柎開,天地始粛,禾乃登,草露白,鶺鴒鳴,玄鳥去,雷乃収声,蟄虫坏戸,水始涸,鴻雁来,菊花開,蟋蟀在戸,霜始降,霎時施,楓蔦黄,山茶始開,地始凍,金盞香,虹蔵不見,朔風払葉,橘始黄,閉塞成冬,熊蟄穴,鱖魚群,乃東生,麋角解,雪下出麦,芹乃栄,水泉動,雉始雊,款冬華,水沢腹堅,鶏始乳".split(',');
const wafuNames = ["睦月", "如月", "弥生", "卯月", "皐月", "水無月", "文月", "葉月", "長月", "神無月", "霜月", "師走"];

// 二十七宿のデータ
const mansions = [
    { name: "婁", color: "#b0b0b0" }, { name: "胃", color: "#b0b0b0" }, { name: "昴", color: "#b0b0b0" },
    { name: "畢", color: "#b0b0b0" }, { name: "觜", color: "#b0b0b0" }, { name: "参", color: "#b0b0b0" }, { name: "井", color: "#b0b0b0" },
    { name: "鬼", color: "#fb7185" }, { name: "柳", color: "#fb7185" }, { name: "星", color: "#fb7185" },
    { name: "張", color: "#fb7185" }, { name: "翼", color: "#fb7185" }, { name: "軫", color: "#fb7185" }, { name: "角", color: "#fb7185" },
    { name: "亢", color: "#38bdf8" }, { name: "氐", color: "#38bdf8" }, { name: "房", color: "#38bdf8" },
    { name: "心", color: "#38bdf8" }, { name: "尾", color: "#38bdf8" }, { name: "箕", color: "#38bdf8" }, { name: "斗", color: "#38bdf8" },
    { name: "女", color: "#c084fc" }, { name: "虚", color: "#c084fc" }, { name: "危", color: "#c084fc" },
    { name: "室", color: "#c084fc" }, { name: "壁", color: "#c084fc" }, { name: "奎", color: "#c084fc" }
];

let generatedSeasons = []; 

const loader = document.createElement('div');
loader.style = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(15,17,26,0.8); z-index:999; display:flex; justify-content:center; align-items:center; color:#d4af37; font-size:24px; font-weight:bold; backdrop-filter:blur(5px); display:none;";
loader.innerHTML = "☁️ 観測データを統合中...";
document.body.appendChild(loader);

const iconPan = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="M13 13l6 6"/></svg>`;
const iconRotate = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`;
const iconPaint = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>`;
const iconErase = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20H7L3 16C2.5 15.5 2.5 14.5 3 14L13 4C13.5 3.5 14.5 3.5 15 4L20 9C20.5 9.5 20.5 10.5 20 11L11 20H20V20Z"/><line x1="6" y1="11" x2="15" y2="20"/></svg>`;
const iconTrash = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
const iconHome = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`;
const iconPrint = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>`;
const iconDrop = `<svg viewBox="0 0 24 24" width="10" height="10" fill="#0ea5e9"><path d="M12 2c0 0-8 8.4-8 13.5a8 8 0 1 0 16 0c0-5.1-8-13.5-8-13.5z"/></svg>`;

function initUI() {
    const oldPalette = document.getElementById('palette');
    if (oldPalette) oldPalette.remove();
    document.querySelectorAll('.panel-ui').forEach(el => el.remove());

    const navDiv = document.createElement('div');
    navDiv.className = 'panel-ui';
    navDiv.style = "position:fixed; top:30px; right:30px; background:rgba(25,30,40,0.85); padding:10px 15px; border-radius:8px; color:#d4af37; z-index:100; display:flex; gap:15px; align-items:center; border: 1px solid rgba(212,175,55,0.3); backdrop-filter: blur(10px);";
    navDiv.innerHTML = `
      <button id="prevBtn" style="background:transparent; border:1px solid #d4af37; color:#d4af37; padding:4px 8px; cursor:pointer; border-radius:4px;">◀</button>
      <div id="cycleDisplay" title="クリックして年月を移動" style="font-weight:bold; font-size:14px; text-align:center; min-width:120px; cursor:pointer; padding:4px; border-radius:4px; transition:background 0.2s;">--</div>
      <button id="nextBtn" style="background:#d4af37; border:none; color:#000; padding:4px 8px; cursor:pointer; border-radius:4px; font-weight:bold;">▶</button>
    `;
    document.body.appendChild(navDiv);

    const jumpDiv = document.createElement('div');
    jumpDiv.className = 'panel-ui';
    jumpDiv.id = 'jumpMenu';
    jumpDiv.style = "position:fixed; top:80px; right:30px; background:rgba(25,30,40,0.9); padding:10px; border-radius:8px; border: 1px solid rgba(212,175,55,0.5); display:none; z-index:101; flex-direction:column; gap:8px;";
    jumpDiv.innerHTML = `
      <div style="font-size:12px; color:#fff;">移動先の年月 (例: 2021-10)</div>
      <div style="display:flex; gap:5px;">
        <input type="month" id="jumpInput" style="padding:4px; border-radius:4px; border:1px solid #555; background:#222; color:#fff;">
        <button id="jumpGoBtn" style="background:#d4af37; border:none; color:#000; padding:4px 8px; border-radius:4px; cursor:pointer; font-weight:bold;">GO</button>
      </div>
    `;
    document.body.appendChild(jumpDiv);

    const toolsDiv = document.createElement('div');
    toolsDiv.className = 'panel-ui';
    toolsDiv.style = "position:fixed; top:100px; left:20px; background:rgba(25,30,40,0.9); padding:8px; border-radius:8px; z-index:100; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 4px 20px rgba(0,0,0,0.5); display:flex; flex-direction:column; gap:8px; width:44px; box-sizing:border-box;";
    toolsDiv.innerHTML = `
      <button id="tool-pointer" title="移動/回転切替 (V)" style="width:26px; height:26px; border-radius:4px; cursor:pointer; background:rgba(212,175,55,0.85); border:1px solid #d4af37; color:#000; padding:0; display:flex; justify-content:center; align-items:center;">${iconPan}</button>
      <button id="tool-paint" title="塗る (B)" style="width:26px; height:26px; border-radius:4px; cursor:pointer; background:transparent; border:1px solid transparent; color:#fff; padding:0; display:flex; justify-content:center; align-items:center;">${iconPaint}</button>
      <button id="tool-erase" title="消す (E)" style="width:26px; height:26px; border-radius:4px; cursor:pointer; background:transparent; border:1px solid transparent; color:#fff; padding:0; display:flex; justify-content:center; align-items:center;">${iconErase}</button>
      <hr style="border-color:rgba(255,255,255,0.1); width:100%; margin:4px 0;">
      <button id="clearBtn" title="選択色を全消去" style="width:26px; height:26px; border-radius:4px; cursor:pointer; background:transparent; border:1px solid transparent; color:#fff; padding:0; display:flex; justify-content:center; align-items:center;">${iconTrash}</button>
      <button id="printBtn" title="印刷 (A3/Tabloid)" style="width:26px; height:26px; border-radius:4px; cursor:pointer; background:transparent; border:1px solid transparent; color:#38bdf8; padding:0; display:flex; justify-content:center; align-items:center;">${iconPrint}</button>
      <hr style="border-color:rgba(255,255,255,0.1); width:100%; margin:4px 0;">
      <button id="homeBtn" title="新月を真上にリセット" style="width:26px; height:26px; border-radius:4px; cursor:pointer; background:transparent; border:1px solid transparent; color:#38bdf8; padding:0; display:flex; justify-content:center; align-items:center;">${iconHome}</button>
    `;
    document.body.appendChild(toolsDiv);

    const paletteDiv = document.createElement('div');
    paletteDiv.className = 'panel-ui';
    paletteDiv.id = 'palette-container';
    paletteDiv.style = "position:fixed; top:134px; left:74px; background:rgba(25,30,40,0.9); padding:10px; border-radius:8px; z-index:99; border: 1px solid rgba(255,255,255,0.1); display:none; grid-template-columns:repeat(4, 1fr); gap:6px; width:120px; box-sizing:border-box;";
    document.body.appendChild(paletteDiv);

    document.getElementById('prevBtn').onclick = () => { currentCycle--; updateCalendarCycle(); };
    document.getElementById('nextBtn').onclick = () => { currentCycle++; updateCalendarCycle(); };
    
    // 印刷ボタン
    document.getElementById('printBtn').onclick = () => window.print();

    const cycleDisplay = document.getElementById('cycleDisplay');
    cycleDisplay.onmouseover = () => { cycleDisplay.style.background = "rgba(255,255,255,0.1)"; };
    cycleDisplay.onmouseout = () => { cycleDisplay.style.background = "transparent"; };
    cycleDisplay.onclick = () => {
        jumpDiv.style.display = jumpDiv.style.display === 'none' ? 'flex' : 'none';
    };

    document.getElementById('jumpGoBtn').onclick = () => {
        const val = document.getElementById('jumpInput').value;
        if(!val) return;
        const targetDate = new Date(val + "-15");
        const diffMs = targetDate.getTime() - baseDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        currentCycle = Math.round(diffDays / synodicMonth);
        jumpDiv.style.display = 'none';
        updateCalendarCycle();
    };

    const btnPointer = document.getElementById('tool-pointer');
    const btnPaint = document.getElementById('tool-paint');
    const btnErase = document.getElementById('tool-erase');

    const setTool = (tool, mode = null) => {
        currentTool = tool;
        if (tool === 'pointer' && mode) interactionMode = mode;

        [btnPointer, btnPaint, btnErase].forEach(b => {
            b.style.background = 'transparent'; b.style.borderColor = 'transparent'; b.style.color = '#fff';
        });
        paletteDiv.style.display = (tool === 'paint') ? 'grid' : 'none';

        const activeBtn = tool === 'pointer' ? btnPointer : tool === 'paint' ? btnPaint : btnErase;
        activeBtn.style.background = 'rgba(212,175,55,0.85)';
        activeBtn.style.borderColor = '#d4af37';
        activeBtn.style.color = '#000';

        if (currentTool === 'pointer') {
            if (interactionMode === 'pan') {
                btnPointer.innerHTML = iconPan;
                btnPointer.title = "移動 (V)";
            } else {
                btnPointer.innerHTML = iconRotate;
                btnPointer.title = "回転 (V)";
            }
        }

        if (tool === 'pointer') container.style.cursor = interactionMode === 'pan' ? 'grab' : 'ew-resize';
        else if (tool === 'paint') container.style.cursor = 'crosshair';
        else if (tool === 'erase') container.style.cursor = 'cell';
    };

    let previousTool = 'pointer';
    let isSpacePressed = false;

    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.code === 'Space') {
            e.preventDefault(); 
            if (!isSpacePressed) {
                isSpacePressed = true;
                previousTool = currentTool;
                setTool('pointer', 'pan');
            }
            return;
        }
        const key = e.key.toLowerCase();
        if (key === 'v') setTool('pointer', interactionMode === 'pan' ? 'rotate' : 'pan');
        if (key === 'b') setTool('paint');
        if (key === 'e') setTool('erase');
    });

    document.addEventListener('keyup', (e) => {
        if (e.code === 'Space') {
            isSpacePressed = false;
            setTool(previousTool);
        }
    });

    btnPointer.onclick = () => setTool('pointer', interactionMode === 'pan' ? 'rotate' : 'pan');
    btnPaint.onclick = () => setTool('paint');
    btnErase.onclick = () => setTool('erase');

    document.getElementById('homeBtn').onclick = () => {
        globalRotation = -currentStartSegment * 3;
        masterGroup.setAttribute('transform', `rotate(${globalRotation}, ${cx}, ${cy})`);
        viewBox = { x: 0, y: 0, w: 1841.3719, h: 2382.9518 };
        svg.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`);
    };

    const colors = ["#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e", "#fb7185", "#a8a29e", "#57534e"];
    colors.forEach(color => {
        const div = document.createElement('div');
        div.style = `width:100%; aspect-ratio:1; background-color:${color}; border-radius:4px; border:2px solid transparent; cursor:pointer; transition:0.1s; box-sizing:border-box;`;
        if(color === activeBrush) { div.style.borderColor = '#fff'; div.style.transform = 'scale(1.1)'; }
        div.onclick = () => {
            paletteDiv.querySelectorAll('div').forEach(el => { el.style.borderColor = 'transparent'; el.style.transform = 'scale(1)'; });
            div.style.borderColor = '#fff'; div.style.transform = 'scale(1.1)';
            activeBrush = color;
        };
        paletteDiv.appendChild(div);
    });

    document.getElementById('clearBtn').onclick = () => {
        if(currentTool !== 'paint') return alert("ペン(B)で消したい色を選択してください。");
        if(confirm(`現在の月（輪）から、選択中の色をすべて削除しますか？`)) {
            for (const key in calendarData) {
                if (key.startsWith(`c${currentCycle}_`) && calendarData[key].color === activeBrush) delete calendarData[key];
            }
            localStorage.setItem('polarCalendarDataV27', JSON.stringify(calendarData));
            renderSavedData();
        }
    };
    setTool('pointer', 'pan');
}

let localRainData = {};
let highLowTidePoints = []; 

async function loadLocalCSV() {
    try {
        const res = await fetch('palau_rain.csv');
        if (res.ok) {
            const text = await res.text();
            const lines = text.split('\n');
            for (let i = 1; i < lines.length; i++) {
                const parts = lines[i].split(',');
                if (parts.length >= 2) {
                    const date = parts[0].trim().replace(/\//g, '-');
                    const rain = parseFloat(parts[1].trim());
                    if (date && !isNaN(rain)) localRainData[date] = rain; 
                }
            }
        }
    } catch(e) {}

    try {
        const res = await fetch('palau_tide.csv');
        if (res.ok) {
            const text = await res.text();
            const lines = text.split('\n');
            for (let i = 1; i < lines.length; i++) {
                const parts = lines[i].split(',');
                if (parts.length >= 3) {
                    let dateStr = parts[0].trim().replace(/\//g, '-');
                    const dateParts = dateStr.split('-');
                    if(dateParts.length === 3) {
                        const y = dateParts[0];
                        const m = dateParts[1].padStart(2, '0');
                        const d = dateParts[2].padStart(2, '0');
                        dateStr = `${y}-${m}-${d}`;
                    }
                    let timeStrRaw = parts[1].trim();
                    if(timeStrRaw.length > 5) timeStrRaw = timeStrRaw.substring(0, 5);
                    const timeParts = timeStrRaw.split(':');
                    if(timeParts.length < 2) continue; 
                    const h = timeParts[0].padStart(2, '0');
                    const min = timeParts[1].padStart(2, '0');
                    const timeMs = new Date(`${dateStr}T${h}:${min}:00`).getTime();
                    const tide = parseFloat(parts[2].trim());
                    if (!isNaN(timeMs) && !isNaN(tide)) highLowTidePoints.push({ time: timeMs, tide: tide });
                }
            }
            highLowTidePoints.sort((a, b) => a.time - b.time);
        }
    } catch(e) {}
}

initUI();

loadLocalCSV().then(() => {
    fetch('calendar.svg')
      .then(response => response.text())
      .then(svgCode => {
        container.innerHTML = svgCode;
        svg = container.querySelector('svg');
        svg.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`);
        svg.querySelectorAll('*[fill="#fff"]').forEach(el => el.setAttribute('fill', 'none'));
        svg.querySelectorAll('text, rect').forEach(el => el.remove());

        const radii = [];
        svg.querySelectorAll('circle').forEach(c => {
          const r = parseFloat(c.getAttribute('r'));
          const cx_val = parseFloat(c.getAttribute('cx'));
          const cy_val = parseFloat(c.getAttribute('cy'));
          if (r && Math.abs(cx_val - cx) < 1 && Math.abs(cy_val - cy) < 1) radii.push(r);
        });
        concentricRings = [...new Set(radii)].sort((a, b) => a - b);

        masterGroup = document.createElementNS(svgNS, "g");
        masterGroup.setAttribute("id", "master-group");
        bgGroup = document.createElementNS(svgNS, "g");
        bgGroup.setAttribute("id", "bg-group");
        bgGroup.setAttribute("opacity", "0.8");
        while (svg.firstChild) bgGroup.appendChild(svg.firstChild);
        
        masterGroup.appendChild(bgGroup);
        svg.appendChild(masterGroup);

        textPathDefs = document.createElementNS(svgNS, "defs");
        dataLayer = document.createElementNS(svgNS, "g");       
        shadowLayer = document.createElementNS(svgNS, "g");     
        linesLayer = document.createElementNS(svgNS, "g");      
        tideLayer = document.createElementNS(svgNS, "g");       
        rainfallLayer = document.createElementNS(svgNS, "g");   
        
        lunarMansionLayer = document.createElementNS(svgNS, "g");
        lunarMansionLayer.setAttribute("id", "lunar-mansion-layer");
        outerSeasonLayer = document.createElementNS(svgNS, "g");

        masterGroup.appendChild(textPathDefs);
        masterGroup.appendChild(dataLayer);
        masterGroup.appendChild(shadowLayer);
        masterGroup.appendChild(linesLayer);
        masterGroup.appendChild(tideLayer);
        masterGroup.appendChild(rainfallLayer);
        masterGroup.appendChild(lunarMansionLayer);
        masterGroup.appendChild(outerSeasonLayer);

        generateAstronomicalData();
        updateCalendarCycle();
        initInteractions();
      })
      .catch(err => console.error("SVG読み込みエラー:", err));
});

let apiRainData = [];

function formatDateStr(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

async function fetchMeteoData(startDateMs) {
    loader.style.display = 'flex';
    const dStart = new Date(startDateMs);
    const dEnd = new Date(startDateMs + 30 * 86400000); 
    const startStr = formatDateStr(dStart);
    const endStr = formatDateStr(dEnd);
    
    apiRainData = new Array(720).fill(null);
    const isHistorical = dEnd.getTime() < Date.now() - (5 * 86400000);
    const rainApiUrl = isHistorical 
        ? `https://archive-api.open-meteo.com/v1/archive?latitude=${PALAU_LAT}&longitude=${PALAU_LON}&hourly=precipitation&start_date=${startStr}&end_date=${endStr}&timezone=Asia%2FTokyo`
        : `https://api.open-meteo.com/v1/forecast?latitude=${PALAU_LAT}&longitude=${PALAU_LON}&hourly=precipitation&start_date=${startStr}&end_date=${endStr}&timezone=Asia%2FTokyo`;

    try {
        const rainRes = await fetch(rainApiUrl);
        if (rainRes.ok) {
            const rainJson = await rainRes.json();
            if(rainJson.hourly && rainJson.hourly.precipitation) {
                for(let i=0; i<720; i++) apiRainData[i] = rainJson.hourly.precipitation[i] || 0;
            }
        }
    } catch(e) {}
    loader.style.display = 'none';
}

function getSimulatedTideValue(timeMs) {
    const MSL = 3.2; 
    const diff = (getLunarLongitude(timeMs) - getSolarLongitude(timeMs) + 360) % 360;
    const phaseFactor = 0.7 + 0.3 * Math.cos(diff * 2 * Math.PI / 180); 
    const t_hours = timeMs / 3600000;
    const M2 = { a: 2.2 * phaseFactor, speed: 28.984, phase: 210 }; 
    const K1 = { a: 1.2, speed: 15.041, phase: 50 }; 
    return MSL + M2.a * Math.cos((M2.speed * t_hours - M2.phase) * Math.PI / 180) 
               + K1.a * Math.cos((K1.speed * t_hours - K1.phase) * Math.PI / 180);
}

function getInterpolatedTide(timeMs) {
    if (highLowTidePoints.length === 0) return getSimulatedTideValue(timeMs);
    let p1 = null; let p2 = null;
    for (let i = 0; i < highLowTidePoints.length - 1; i++) {
        if (timeMs >= highLowTidePoints[i].time && timeMs <= highLowTidePoints[i+1].time) {
            p1 = highLowTidePoints[i]; p2 = highLowTidePoints[i+1]; break;
        }
    }
    if (p1 && p2) {
        const timeRange = p2.time - p1.time;
        if (timeRange === 0) return p1.tide; 
        const ratio = (timeMs - p1.time) / timeRange; 
        const smoothRatio = (1 - Math.cos(Math.PI * ratio)) / 2;
        return p1.tide + (p2.tide - p1.tide) * smoothRatio;
    }
    return getSimulatedTideValue(timeMs);
}

function getTideRadius(tide, rMin, rMax) {
    const totalWidth = rMax - rMin;
    let ratio = 0;
    if (tide <= 0) {
        let clamped = Math.max(-1.5, tide);
        ratio = 0.25 * ((clamped + 1.5) / 1.5);
    } else if (tide <= 6.0) {
        ratio = 0.25 + 0.5 * (tide / 6.0);
    } else {
        let clamped = Math.min(7.5, tide);
        ratio = 0.75 + 0.25 * ((clamped - 6.0) / 1.5);
    }
    return rMin + totalWidth * ratio;
}

async function updateCalendarCycle() {
  const totalElapsedDays = currentCycle * synodicMonth;
  const cycleStartTimeMs = baseDate.getTime() + totalElapsedDays * 24 * 60 * 60 * 1000;
  const startDate = new Date(cycleStartTimeMs);
  currentStartSegment = Math.round((totalElapsedDays % 30) / 0.25);
  
  const y = startDate.getFullYear();
  const m = startDate.getMonth() + 1;
  const d = startDate.getDate();
  document.getElementById('cycleDisplay').innerHTML = `${y}年 ${m}月 <span style="font-size:10px;">▼</span><br><span style="font-size:11px; color:#8b949e;">新月: ${m}月${d}日〜</span>`;

  await fetchMeteoData(cycleStartTimeMs);

  drawLunarShadow(cycleStartTimeMs);  
  drawDynamicLines(); 
  drawTideGraph(cycleStartTimeMs);    
  drawRainfallGraph(cycleStartTimeMs); 
  drawDailyRainStats(startDate);
  drawLunarMansions(cycleStartTimeMs);
  renderSavedData();
  drawOuterSeasons(cycleStartTimeMs); 
  drawTimeLabels(); 
  drawSolarDates(startDate); 

  globalRotation = -currentStartSegment * 3;
  masterGroup.setAttribute('transform', `rotate(${globalRotation}, ${cx}, ${cy})`);
}

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return { x: centerX + (radius * Math.cos(angleInRadians)), y: centerY + (radius * Math.sin(angleInRadians)) };
}

function drawLunarMansions(cycleStartTimeMs) {
    lunarMansionLayer.innerHTML = "";
    if (concentricRings.length === 0) return;
    
    const rBase = concentricRings[concentricRings.length - 1] + 60; 
    const rMax = rBase + 30; 
    const resolution = 20; 
    const totalHours = 720;
    const startAngle = currentStartSegment * 3;
    
    const trackBg = document.createElementNS(svgNS, "circle");
    trackBg.setAttribute("cx", cx); trackBg.setAttribute("cy", cy); trackBg.setAttribute("r", rBase + 15);
    trackBg.setAttribute("fill", "none"); 
    trackBg.setAttribute("stroke", "rgba(255, 255, 255, 0.05)"); 
    trackBg.setAttribute("stroke-width", "30"); 
    lunarMansionLayer.appendChild(trackBg);

    let currentMansionIndex = -1;
    let mansionStartAngle = 0;
    
    for (let i = 0; i <= totalHours * resolution; i++) {
        const t = i / resolution; 
        const timeMs = cycleStartTimeMs + t * 3600000;
        
        const lunarLon = getLunarLongitude(timeMs);
        const index = Math.floor(lunarLon / (360 / 27));
        const angle = startAngle + (t * 0.5);

        if (index !== currentMansionIndex) {
            if (currentMansionIndex !== -1) {
                drawConstellationMark(mansionStartAngle, angle, currentMansionIndex, rBase + 15);
            }
            
            const p1 = polarToCartesian(cx, cy, rBase, angle);
            const p2 = polarToCartesian(cx, cy, rMax, angle);
            const line = document.createElementNS(svgNS, "line");
            line.setAttribute("x1", p1.x); line.setAttribute("y1", p1.y);
            line.setAttribute("x2", p2.x); line.setAttribute("y2", p2.y);
            line.setAttribute("stroke", mansions[index].color);
            line.setAttribute("stroke-width", "0.5");
            line.setAttribute("opacity", "0.5");
            lunarMansionLayer.appendChild(line);

            currentMansionIndex = index;
            mansionStartAngle = angle;
        }
    }
    const finalAngle = startAngle + 360;
    drawConstellationMark(mansionStartAngle, finalAngle, currentMansionIndex, rBase + 15);
}

function drawConstellationMark(startAng, endAng, index, rCenter) {
    if(endAng < startAng) endAng += 360;
    const midAngle = startAng + (endAng - startAng) / 2;
    const mansion = mansions[index];
    
    const g = document.createElementNS(svgNS, "g");
    
    const ptText = polarToCartesian(cx, cy, rCenter + 22, midAngle);
    const text = document.createElementNS(svgNS, "text");
    text.setAttribute("x", ptText.x); text.setAttribute("y", ptText.y);
    text.setAttribute("text-anchor", "middle"); text.setAttribute("dominant-baseline", "central");
    text.setAttribute("fill", mansion.color); 
    text.setAttribute("font-size", "9px");
    text.setAttribute("font-family", "'Shippori Mincho', 'YuMincho', serif");
    text.setAttribute("transform", `rotate(${midAngle}, ${ptText.x}, ${ptText.y})`);
    text.textContent = mansion.name;
    g.appendChild(text);

    let seed = index * 12345;
    const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    
    const starCount = Math.floor(rand() * 3) + 3;
    const stars = [];
    
    for(let i=0; i<starCount; i++) {
        const sAngle = midAngle + (rand() - 0.5) * 8; 
        const sR = rCenter + (rand() - 0.5) * 15;
        const pt = polarToCartesian(cx, cy, sR, sAngle);
        stars.push(pt);
        
        const circle = document.createElementNS(svgNS, "circle");
        circle.setAttribute("cx", pt.x); circle.setAttribute("cy", pt.y);
        circle.setAttribute("r", rand() > 0.8 ? "1.5" : "0.8");
        circle.setAttribute("fill", mansion.color);
        g.appendChild(circle);
    }
    
    for(let i=0; i<stars.length - 1; i++) {
        const line = document.createElementNS(svgNS, "line");
        line.setAttribute("x1", stars[i].x); line.setAttribute("y1", stars[i].y);
        line.setAttribute("x2", stars[i+1].x); line.setAttribute("y2", stars[i+1].y);
        line.setAttribute("stroke", mansion.color);
        line.setAttribute("stroke-width", "0.3");
        line.setAttribute("opacity", "0.7");
        g.appendChild(line);
    }
    lunarMansionLayer.appendChild(g);
}

function drawDailyRainStats(startDate) {
  let dailyRainLayer = document.getElementById("daily-rain-layer");
  if(dailyRainLayer) { dailyRainLayer.innerHTML = ""; } 
  else {
    dailyRainLayer = document.createElementNS(svgNS, "g");
    dailyRainLayer.setAttribute("id", "daily-rain-layer");
    masterGroup.insertBefore(dailyRainLayer, tideLayer); 
  }
  
  const rMin = concentricRings[16]; 
  const rMax = concentricRings[22]; 
  const layer23CenterR = (concentricRings[22] + concentricRings[23]) / 2;

  for (let i = 0; i < 30; i++) {
    const loopDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = formatDateStr(loopDate);
    
    if (localRainData[dateStr] !== undefined && localRainData[dateStr] > 0) {
      const rain = localRainData[dateStr];
      const startAngle = (currentStartSegment + i * 4) * 3;
      const endAngle = startAngle + 12; 
      
      let opacity = Math.min(rain / 150, 1) * 0.3 + 0.05; 
      
      const startIn = polarToCartesian(cx, cy, rMin, endAngle);
      const endIn = polarToCartesian(cx, cy, rMin, startAngle);
      const startOut = polarToCartesian(cx, cy, rMax, endAngle);
      const endOut = polarToCartesian(cx, cy, rMax, startAngle);
      
      const d = ["M", startOut.x, startOut.y, "A", rMax, rMax, 0, 0, 0, endOut.x, endOut.y, "L", endIn.x, endIn.y, "A", rMin, rMin, 0, 0, 1, startIn.x, startIn.y, "Z"].join(" ");
      const path = document.createElementNS(svgNS, "path");
      path.setAttribute("d", d); 
      path.setAttribute("fill", "rgba(14, 165, 233, " + opacity + ")"); 
      dailyRainLayer.appendChild(path);

      const angleMid = startAngle + 6; 
      const ptText = polarToCartesian(cx, cy, layer23CenterR, angleMid);
      
      const textGroup = document.createElementNS(svgNS, "g");
      textGroup.setAttribute("transform", `rotate(${angleMid + 180}, ${ptText.x}, ${ptText.y})`);

      const iconColor = "rgba(14, 165, 233, 1)"; 
      
      const iconGroup = document.createElementNS(svgNS, "g");
      iconGroup.setAttribute("transform", `translate(${ptText.x - 14}, ${ptText.y - 4})`);
      iconGroup.innerHTML = iconDrop;
      textGroup.appendChild(iconGroup);

      const text = document.createElementNS(svgNS, "text");
      text.setAttribute("x", ptText.x - 2); 
      text.setAttribute("y", ptText.y);
      text.setAttribute("text-anchor", "start"); 
      text.setAttribute("dominant-baseline", "central");
      text.setAttribute("fill", iconColor); 
      text.setAttribute("font-size", "8px"); 
      text.setAttribute("font-weight", "bold");
      text.setAttribute("font-family", "'Arial', sans-serif"); 
      text.textContent = rain.toFixed(1) + "mm";
      textGroup.appendChild(text);

      dailyRainLayer.appendChild(textGroup);
    }
  }
}

function drawTideGraph(cycleStartTimeMs) {
  tideLayer.innerHTML = ""; 
  if (concentricRings.length < 23) return; 
  const rMin = concentricRings[16]; const rMax = concentricRings[22]; 

  let pathD = "";
  const resolution = 20; 
  const totalHours = 720;
  const startAngle = currentStartSegment * 3;

  for (let i = 0; i <= totalHours * resolution; i++) {
    const t = i / resolution; 
    const timeMs = cycleStartTimeMs + t * 3600000;
    
    let tide = getInterpolatedTide(timeMs);
    const r = getTideRadius(tide, rMin, rMax);
    
    const angle = startAngle + (t * 0.5);
    const pt = polarToCartesian(cx, cy, r, angle);
    if (i === 0) pathD += `M ${pt.x},${pt.y} `; 
    else pathD += `L ${pt.x},${pt.y} `;
  }

  const wavePath = document.createElementNS(svgNS, "path");
  wavePath.setAttribute("d", pathD); 
  wavePath.setAttribute("fill", "none"); 
  wavePath.setAttribute("stroke", "#3b82f6"); 
  wavePath.setAttribute("stroke-width", "1.5");
  tideLayer.appendChild(wavePath);

  const guideTides = [-1.5, 0, 1.5, 3.0, 4.5, 6.0, 7.5];
  guideTides.forEach(ft => {
    const r = getTideRadius(ft, rMin, rMax);
    
    const circle = document.createElementNS(svgNS, "circle");
    circle.setAttribute("cx", cx); circle.setAttribute("cy", cy); circle.setAttribute("r", r);
    circle.setAttribute("fill", "none"); circle.setAttribute("stroke", "rgba(114, 113, 113, 0.4)"); 
    circle.setAttribute("stroke-width", "0.5"); circle.setAttribute("stroke-dasharray", "4,4"); 
    tideLayer.appendChild(circle);
    
    for(let i = 0; i < 6; i++) {
      const labelAngle = currentStartSegment * 3 + (i * 60); 
      const labelPt = polarToCartesian(cx, cy, r, labelAngle); 
      const text = document.createElementNS(svgNS, "text");
      text.setAttribute("x", labelPt.x); text.setAttribute("y", labelPt.y);
      text.setAttribute("text-anchor", "middle"); text.setAttribute("dominant-baseline", "central");
      text.setAttribute("fill", "#3b82f6"); 
      text.setAttribute("font-size", "7px");
      text.setAttribute("font-family", "'Shippori Mincho', 'YuMincho', 'Hiragino Mincho ProN', serif");
      text.setAttribute("font-weight", "bold");
      text.setAttribute("transform", `rotate(${labelAngle}, ${labelPt.x}, ${labelPt.y})`);
      text.textContent = ft + "ft";

      const halo = text.cloneNode(true);
      halo.setAttribute("stroke", "rgba(255, 255, 255, 0.5)"); 
      halo.setAttribute("stroke-width", "3");
      halo.setAttribute("stroke-linejoin", "round");
      halo.setAttribute("fill", "none");

      tideLayer.appendChild(halo);
      tideLayer.appendChild(text);
    }
  });
}

function drawRainfallGraph(cycleStartTimeMs) {
  rainfallLayer.innerHTML = "";
  if (concentricRings.length < 23) return;
  
  const rMin = concentricRings[16]; 
  const rMax = concentricRings[22]; 
  const maxRain = 30; 
  
  const circle = document.createElementNS(svgNS, "circle");
  circle.setAttribute("cx", cx); circle.setAttribute("cy", cy); circle.setAttribute("r", rMax);
  circle.setAttribute("fill", "none"); 
  circle.setAttribute("stroke", "rgba(14, 165, 233, 0.3)"); 
  circle.setAttribute("stroke-width", "1"); 
  rainfallLayer.appendChild(circle);

  const startAngle = currentStartSegment * 3;
  for (let h = 0; h < 720; h++) {
    let rain = apiRainData[h];
    if(rain === null || isNaN(rain)) {
        let currentTide = getSimulatedTideValue(cycleStartTimeMs + h * 3600000);
        let nextTide = getSimulatedTideValue(cycleStartTimeMs + (h+0.1) * 3600000);
        if(nextTide - currentTide < -0.1 && Math.random() > 0.9) rain = Math.random() * 15 + 2; 
        else rain = 0;
    }

    if (rain > 0) {
      const displayRain = rain; 
      const r = rMax - (rMax - rMin) * (displayRain / maxRain);
      const angle = startAngle + h * 0.5 + 0.25; 
      const p1 = polarToCartesian(cx, cy, rMax, angle);
      const p2 = polarToCartesian(cx, cy, r, angle);
      const line = document.createElementNS(svgNS, "line");
      line.setAttribute("x1", p1.x); line.setAttribute("y1", p1.y);
      line.setAttribute("x2", p2.x); line.setAttribute("y2", p2.y);
      line.setAttribute("stroke", "rgba(14, 165, 233, 0.8)"); 
      line.setAttribute("stroke-width", "1.5");
      line.setAttribute("stroke-linecap", "round");
      rainfallLayer.appendChild(line);
    }
  }

  const labelsToDraw = [
      { relAngle: 96, isRightSide: false },   
      { relAngle: 288, isRightSide: true }    
  ];

  labelsToDraw.forEach(target => {
      const labelAngle = startAngle + target.relAngle;
      
      [5, 10, 15, 20, 25, 30].forEach(val => {
          const r = rMax - (rMax - rMin) * (val / maxRain);
          const p1 = polarToCartesian(cx, cy, r - 3, labelAngle);
          const p2 = polarToCartesian(cx, cy, r + 3, labelAngle);
          const tick = document.createElementNS(svgNS, "line");
          tick.setAttribute("x1", p1.x); tick.setAttribute("y1", p1.y);
          tick.setAttribute("x2", p2.x); tick.setAttribute("y2", p2.y);
          tick.setAttribute("stroke", "rgba(14, 165, 233, 0.8)");
          tick.setAttribute("stroke-width", "1");
          rainfallLayer.appendChild(tick);

          const ptLabel = polarToCartesian(cx, cy, r, labelAngle);
          const text = document.createElementNS(svgNS, "text");
          text.setAttribute("x", ptLabel.x); text.setAttribute("y", ptLabel.y);
          text.setAttribute("text-anchor", "middle"); 
          text.setAttribute("dominant-baseline", "central");
          text.setAttribute("fill", "rgba(14, 165, 233, 1)"); 
          text.setAttribute("font-size", "7px");
          text.setAttribute("font-family", "'Shippori Mincho', 'YuMincho', 'Hiragino Mincho ProN', serif");
          text.setAttribute("font-weight", "bold");
          
          let textRot = labelAngle + 180;
          if (target.isRightSide) { textRot = labelAngle; } 
          
          text.setAttribute("transform", `rotate(${textRot}, ${ptLabel.x}, ${ptLabel.y})`);
          text.textContent = val + "mm";

          const halo = text.cloneNode(true);
          halo.setAttribute("stroke", "rgba(255, 255, 255, 0.5)"); 
          halo.setAttribute("stroke-width", "2.5");
          halo.setAttribute("stroke-linejoin", "round");
          halo.setAttribute("fill", "none");

          rainfallLayer.appendChild(halo);
          rainfallLayer.appendChild(text);
      });
  });
}

function drawTimeLabels() {
  let timeLayer = document.getElementById("time-labels-layer");
  if(timeLayer) { timeLayer.innerHTML = ""; } 
  else {
    timeLayer = document.createElementNS(svgNS, "g");
    timeLayer.setAttribute("id", "time-labels-layer");
    masterGroup.appendChild(timeLayer);
  }
  if (concentricRings.length < 20) return;
  const rMidTime = (concentricRings[19] + concentricRings[20]) / 2;
  const timeStr = ["0", "6", "12", "18"];

  for (let i = 0; i < 120; i++) {
    const angle = ((currentStartSegment + i) % 120) * 3;
    const ptTime = polarToCartesian(cx, cy, rMidTime, angle);
    const textTime = document.createElementNS(svgNS, "text");
    textTime.setAttribute("x", ptTime.x); textTime.setAttribute("y", ptTime.y);
    textTime.setAttribute("text-anchor", "middle"); textTime.setAttribute("dominant-baseline", "central");
    textTime.setAttribute("fill", "#2c3e50"); 
    textTime.setAttribute("font-size", "7px");
    textTime.setAttribute("font-weight", "bold");
    textTime.setAttribute("font-family", "'Shippori Mincho', 'YuMincho', 'Hiragino Mincho ProN', serif");
    textTime.setAttribute("transform", `rotate(${angle}, ${ptTime.x}, ${ptTime.y})`);
    textTime.textContent = timeStr[i % 4];

    const haloTime = textTime.cloneNode(true);
    haloTime.setAttribute("stroke", "rgba(255, 255, 255, 0.5)"); 
    haloTime.setAttribute("stroke-width", "3");
    haloTime.setAttribute("stroke-linejoin", "round");
    haloTime.setAttribute("fill", "none");

    timeLayer.appendChild(haloTime); 
    timeLayer.appendChild(textTime); 
  }
}

function drawSolarDates(startDate) {
  let dateLayer = document.getElementById("solar-dates-layer");
  if(dateLayer) { dateLayer.innerHTML = ""; } 
  else {
    dateLayer = document.createElementNS(svgNS, "g");
    dateLayer.setAttribute("id", "solar-dates-layer");
    masterGroup.appendChild(dateLayer); 
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
    const textDate = document.createElementNS(svgNS, "text");
    textDate.setAttribute("x", ptDate.x); textDate.setAttribute("y", ptDate.y);
    textDate.setAttribute("text-anchor", "middle"); textDate.setAttribute("dominant-baseline", "central");
    textDate.setAttribute("fill", "#727171"); textDate.setAttribute("font-size", "10px");
    textDate.setAttribute("font-weight", "bold");
    textDate.setAttribute("transform", `rotate(${angleLeft}, ${ptDate.x}, ${ptDate.y})`);
    textDate.textContent = `${loopDate.getMonth() + 1}/${loopDate.getDate()}`;
    dateLayer.appendChild(textDate);

    const ptDay = polarToCartesian(cx, cy, rMidDay, angleLeft);
    const textDay = document.createElementNS(svgNS, "text");
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
    
    const circle = document.createElementNS(svgNS, "circle");
    circle.setAttribute("cx", ptLunar.x); circle.setAttribute("cy", ptLunar.y);
    circle.setAttribute("r", lunarRadius);
    circle.setAttribute("fill", "none");
    circle.setAttribute("stroke", event ? "#d4af37" : "#555555"); 
    circle.setAttribute("stroke-width", event ? "1.2" : "0.8");
    dateLayer.appendChild(circle);

    const textLunar = document.createElementNS(svgNS, "text");
    textLunar.setAttribute("x", ptLunar.x); textLunar.setAttribute("y", ptLunar.y);
    textLunar.setAttribute("text-anchor", "middle"); textLunar.setAttribute("dominant-baseline", "central");
    textLunar.setAttribute("fill", event ? "#d4af37" : "#2c3e50"); 
    
    const fontSize = lunarLabel.length > 1 ? "8px" : "11px";
    textLunar.setAttribute("font-size", fontSize);
    if(event) textLunar.setAttribute("font-weight", "bold");
    textLunar.setAttribute("font-family", "'Shippori Mincho', 'YuMincho', 'Hiragino Mincho ProN', serif");
    textLunar.setAttribute("transform", `rotate(${angleRight}, ${ptLunar.x}, ${ptLunar.y})`);
    textLunar.textContent = lunarLabel;
    dateLayer.appendChild(textLunar);
  }
}

function getSolarLongitude(timeMs) {
  let jd = timeMs / 86400000 + 2440587.5;
  let t = (jd - 2451545.0) / 36525;
  let m = 357.52911 + 35999.05029 * t - 0.0001537 * t * t;
  let rad = Math.PI / 180;
  let c = (1.914602 - 0.004817 * t - 0.000014 * t * t) * Math.sin(m * rad) + (0.019993 - 0.000101 * t) * Math.sin(2 * m * rad);
  let l0 = 280.46646 + 36000.76983 * t + 0.0003032 * t * t;
  let trueLon = l0 + c;
  let omega = 125.04 - 1934.136 * t;
  let lon = (trueLon - 0.00569 - 0.00478 * Math.sin(omega * rad)) % 360;
  return lon < 0 ? lon + 360 : lon;
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
  let lon = Lp + 6.289 * Math.sin(Mp * rad) - 1.274 * Math.sin((2*D - Mp) * rad) + 0.658 * Math.sin(2*D * rad) + 0.214 * Math.sin(2*Mp * rad) - 0.186 * Math.sin(M * rad) - 0.114 * Math.sin(2*F * rad);
  let res = lon % 360;
  return res < 0 ? res + 360 : res;
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
    if (diff > 0) right = mid; else left = mid;
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
    currentTime = nextTime; prevLon = nextLon;
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

function getWafuMonthName(cycleStartTime) {
    let lon1 = getSolarLongitude(cycleStartTime);
    let lon2 = getSolarLongitude(cycleStartTime + synodicMonth * 86400000);
    if (lon2 < lon1) lon2 += 360;
    let chukis = [];
    for (let deg = 0; deg < 360; deg += 30) {
        let checkLon = deg;
        if (checkLon < lon1 && (checkLon + 360) <= lon2) checkLon += 360;
        if (checkLon >= lon1 && checkLon <= lon2) chukis.push(deg);
    }
    if (chukis.length > 0) return wafuNames[(Math.floor(chukis[0] / 30) + 1) % 12];
    
    let prevLon1 = getSolarLongitude(cycleStartTime - synodicMonth * 86400000);
    let prevLon2 = lon1;
    if (prevLon2 < prevLon1) prevLon2 += 360;
    let prevChukis = [];
    for (let deg = 0; deg < 360; deg += 30) {
        let checkLon = deg;
        if (checkLon < prevLon1 && (checkLon + 360) <= prevLon2) checkLon += 360;
        if (checkLon >= prevLon1 && checkLon <= prevLon2) prevChukis.push(deg);
    }
    if (prevChukis.length > 0) return "閏" + wafuNames[(Math.floor(prevChukis[0] / 30) + 1) % 12];
    return "閏月";
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

  const shadowPath = document.createElementNS(svgNS, "path");
  shadowPath.setAttribute("d", pathD);
  shadowPath.setAttribute("fill", "rgba(0, 0, 0, 0.03)"); 
  shadowLayer.appendChild(shadowPath);
}

function drawOuterSeasons(cycleStartTime) {
  outerSeasonLayer.innerHTML = ""; 
  if (concentricRings.length === 0) return;
  const cycleLengthMs = 30 * 86400000;
  const cycleEndTime = cycleStartTime + cycleLengthMs;
  const rMax = concentricRings[concentricRings.length - 1]; 

  const currentWafu = getWafuMonthName(cycleStartTime);

  let wafuText = document.getElementById("wafu-text-layer");
  if(wafuText) { wafuText.innerHTML = ""; }
  else {
    wafuText = document.createElementNS(svgNS, "text");
    wafuText.setAttribute("id", "wafu-text-layer");
    svg.appendChild(wafuText);
  }
  wafuText.setAttribute("x", cx + 780); 
  wafuText.setAttribute("y", cy - 730); 
  wafuText.setAttribute("fill", "#d4af37"); 
  wafuText.setAttribute("font-size", "80px");
  wafuText.setAttribute("font-family", "'Shippori Mincho', 'YuMincho', 'Hiragino Mincho ProN', serif");
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
      const line = document.createElementNS(svgNS, "line");
      line.setAttribute("x1", p1.x); line.setAttribute("y1", p1.y);
      line.setAttribute("x2", p2.x); line.setAttribute("y2", p2.y);
      line.setAttribute("stroke", "#2c3e50");
      line.setAttribute("stroke-width", isSekki ? "1.5" : "0.5");
      outerSeasonLayer.appendChild(line);

      const rText = rMax + (isSekki ? 45 : 20); 
      const ptText = polarToCartesian(cx, cy, rText, angle);
      
      const text = document.createElementNS(svgNS, "text");
      text.setAttribute("fill", "#2c3e50"); 
      text.setAttribute("font-size", isSekki ? "19px" : "14px"); 
      if (isSekki) text.setAttribute("font-weight", "bold");
      text.setAttribute("font-family", "'Shippori Mincho', 'YuMincho', 'Hiragino Mincho ProN', serif");
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

function drawDynamicLines() {
  linesLayer.innerHTML = ""; 
  const rMin = concentricRings[0]; 
  const rMax = concentricRings[concentricRings.length - 1];
  
  const ringDateInner = document.createElementNS(svgNS, "circle");
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
    const line = document.createElementNS(svgNS, "line");
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

function drawCell(rIn, rOut, startAngle, endAngle, color) {
  const startIn = polarToCartesian(cx, cy, rIn, endAngle);
  const endIn = polarToCartesian(cx, cy, rIn, startAngle);
  const startOut = polarToCartesian(cx, cy, rOut, endAngle);
  const endOut = polarToCartesian(cx, cy, rOut, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  const d = ["M", startOut.x, startOut.y, "A", rOut, rOut, 0, largeArcFlag, 0, endOut.x, endOut.y, "L", endIn.x, endIn.y, "A", rIn, rIn, 0, largeArcFlag, 1, startIn.x, startIn.y, "Z"].join(" ");
  const path = document.createElementNS(svgNS, "path");
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

  let isInteractionActive = false;
  let startPos = { x: 0, y: 0 }, dragDistance = 0;
  let startGlobalRotation = 0, startAngleOffset = 0;
  let lastPaintedCell = null;

  container.addEventListener('mousedown', (e) => {
    dragDistance = 0;
    isInteractionActive = true;
    lastPaintedCell = null;

    if (currentTool === 'pointer') {
        container.style.cursor = interactionMode === 'pan' ? 'grabbing' : 'ew-resize'; 
        if (interactionMode === 'rotate') {
            const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
            const svgP = pt.matrixTransform(svg.getScreenCTM().inverse()); 
            startAngleOffset = Math.atan2(svgP.y - cy, svgP.x - cx) * 180 / Math.PI;
            startGlobalRotation = globalRotation;
        } else {
            startPos = { x: e.clientX, y: e.clientY };
        }
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (isInteractionActive && currentTool === 'pointer') {
        if (interactionMode === 'pan') {
            const dxScreen = startPos.x - e.clientX, dyScreen = startPos.y - e.clientY;
            dragDistance += Math.abs(dxScreen) + Math.abs(dyScreen);
            viewBox.x += dxScreen * (viewBox.w / container.clientWidth); viewBox.y += dyScreen * (viewBox.h / container.clientHeight);
            svg.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`);
            startPos = { x: e.clientX, y: e.clientY };
        } else if (interactionMode === 'rotate') {
            const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
            const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
            const currentAngleOffset = Math.atan2(svgP.y - cy, svgP.x - cx) * 180 / Math.PI;
            let delta = currentAngleOffset - startAngleOffset;
            if (delta > 180) delta -= 360;
            if (delta < -180) delta += 360;
            globalRotation = startGlobalRotation + delta;
            masterGroup.setAttribute('transform', `rotate(${globalRotation}, ${cx}, ${cy})`);
            dragDistance += Math.abs(delta) * 5; 
            startGlobalRotation = globalRotation; 
            startAngleOffset = currentAngleOffset; 
        }
    }

    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const ptM = pt.matrixTransform(masterGroup.getScreenCTM().inverse());
    const dx = ptM.x - cx, dy = ptM.y - cy;
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
      
      if (isInteractionActive && (currentTool === 'paint' || currentTool === 'erase')) {
        const cellKey = `c${currentCycle}_abs${absSegment}_${ringInfo.layerId}`;
        if (lastPaintedCell !== cellKey) { 
            if (currentTool === 'erase') delete calendarData[cellKey];
            else calendarData[cellKey] = { color: activeBrush, absSegment: absSegment, rIn: ringInfo.rIn, rOut: ringInfo.rOut };
            renderSavedData();
            lastPaintedCell = cellKey;
        }
      }
    } else {
      statusBar.innerText = `キャンバス外`; statusBar.style.color = "#8b949e";
    }
  });

  window.addEventListener('mouseup', () => { 
    isInteractionActive = false;
    if (currentTool === 'pointer') container.style.cursor = interactionMode === 'pan' ? 'grab' : 'ew-resize'; 
    localStorage.setItem('polarCalendarDataV27', JSON.stringify(calendarData));
  });

  svg.addEventListener('click', (e) => {
    if (dragDistance > 5 || currentTool === 'pointer') return;
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const ptM = pt.matrixTransform(masterGroup.getScreenCTM().inverse());
    const dx = ptM.x - cx, dy = ptM.y - cy;
    const distance = Math.sqrt(dx * dx + dy * dy);
    let angle = Math.atan2(dy, dx) * (180 / Math.PI); angle = (angle + 90 + 360) % 360;

    const absSegment = Math.floor(angle / 3);
    const ringInfo = getRingInfo(distance);
    if (!ringInfo) return;

    const cellKey = `c${currentCycle}_abs${absSegment}_${ringInfo.layerId}`;
    if (currentTool === 'erase') delete calendarData[cellKey];
    else if (currentTool === 'paint') {
      calendarData[cellKey] = { color: activeBrush, absSegment: absSegment, rIn: ringInfo.rIn, rOut: ringInfo.rOut };
    }
    
    localStorage.setItem('polarCalendarDataV27', JSON.stringify(calendarData));
    renderSavedData();
  });
}
