// script.js (V27: 印刷機能・A3/タブロイド対応版)

const container = document.getElementById('container');
const statusBar = document.getElementById('status-bar');

// 印刷用スタイルの注入
const style = document.createElement('style');
style.innerHTML = `
@media print {
    .panel-ui, #status-bar { display: none !important; }
    body { margin: 0; padding: 0; }
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

// 二十七宿の定義
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

const iconPrint = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>`;
// ... (その他のアイコンは既存の通り)

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

    // ★印刷機能の実行
    document.getElementById('printBtn').onclick = () => window.print();

    // ... (以下の機能は以前と同じ)
    const paletteDiv = document.createElement('div');
    paletteDiv.className = 'panel-ui';
    paletteDiv.id = 'palette-container';
    paletteDiv.style = "position:fixed; top:134px; left:74px; background:rgba(25,30,40,0.9); padding:10px; border-radius:8px; z-index:99; border: 1px solid rgba(255,255,255,0.1); display:none; grid-template-columns:repeat(4, 1fr); gap:6px; width:120px; box-sizing:border-box;";
    document.body.appendChild(paletteDiv);

    // ... (initUI内のその他のイベントリスナー等は省略しますが、以前のものを保持してください)
    // ※実際には前述のV26のinitUIのコードをそのままコピーし、printBtnのイベントリスナーだけ追加してください。
}
// ... (以降のコードはすべてV26と同じです)
