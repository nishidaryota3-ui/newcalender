// globals.js (全体のデータと状態の管理)

const container = document.getElementById('container');
const statusBar = document.getElementById('status-bar');

const loader = document.createElement('div');
loader.style = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(15,17,26,0.8); z-index:999; display:flex; justify-content:center; align-items:center; color:#d4af37; font-size:24px; font-weight:bold; backdrop-filter:blur(5px); display:none;";
loader.innerHTML = "☁️ 観測データを統合中...";
document.body.appendChild(loader);

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
// ▼▼ globals.js の変数宣言エリアに追加 ▼▼
// ユーザーのカスタマイズ設定（ローカルストレージに保存）
let userSettings = JSON.parse(localStorage.getItem('polarCalendarSettings')) || {
    bgOpacity: 0.8,       // 背景の透明度
    linesOpacity: 1.0,    // 日付区切り線の透明度
    tideColor: "#3b82f6", // 潮汐グラフの色
    tideWidth: 1.5,       // 潮汐グラフの太さ
    layers: {             // 各レイヤーの表示状態（true=表示, false=非表示）
        layerShinji: true,
        layerButsuji: true,
        layerKyoukai: true,
        layerIslam: true,
        layerSonota: true,
        layerHoliday: true,
        layerZassetsu: true,
        layerLunar: true
    }
};

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
let localRainData = {};
let highLowTidePoints = []; 
let apiRainData = [];

const iconPan = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="M13 13l6 6"/></svg>`;
const iconRotate = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`;
const iconPaint = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>`;
const iconErase = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20H7L3 16C2.5 15.5 2.5 14.5 3 14L13 4C13.5 3.5 14.5 3.5 15 4L20 9C20.5 9.5 20.5 10.5 20 11L11 20H20V20Z"/><line x1="6" y1="11" x2="15" y2="20"/></svg>`;
const iconTrash = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
const iconHome = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`;
const iconPrint = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>`;
const iconDrop = `<svg viewBox="0 0 24 24" width="10" height="10" fill="#0ea5e9"><path d="M12 2c0 0-8 8.4-8 13.5a8 8 0 1 0 16 0c0-5.1-8-13.5-8-13.5z"/></svg>`;
