// main.js (司令塔・初期化モジュール)

const svgNS = "http://www.w3.org/2000/svg";
const container = document.getElementById('calendar-container') || document.body;
const loader = document.getElementById('loader') || { style: {} };
let svg, masterGroup, bgGroup;

const viewBox = { x: -841.89 / 2, y: -841.89 / 2, w: 841.89, h: 841.89 };
const cx = 0, cy = 0;

const PALAU_LAT = 7.3397;
const PALAU_LON = 134.4733;

const synodicMonth = 29.530588853; 
const baseDate = new Date('2025-12-20T00:00:00+09:00'); 

let currentCycle = 0;
let currentStartSegment = 0;
let globalRotation = 0;
let concentricRings = [];

let apiRainData = new Array(720).fill(null);
let localRainData = {};
let highLowTidePoints = [];
let calendarData = {};
window.haikuDatabase = {}; // ★俳句データ用

const iconDrop = `<path d="M12 2c0 0-4.5 6.4-4.5 9.5a4.5 4.5 0 0 0 9 0C16.5 8.4 12 2 12 2z"/>`;

window.defaultLayerSettings = {
    canvasBg: { fill: "#f5f5f0" },
    baseSvg: { stroke: "", opacity: 0.8 },
    lunarShadow: { fill: "#000000", opacity: 0.03 },
    astroPins: { fill: "#d4af37", stroke: "#d4af37", strokeWidth: 1.2, opacity: 1, scale: 1, radiusOffset: 0 },
    dateLines: { stroke: "#555555", strokeWidth: 1.5, opacity: 1 },
    lunarMansion: {
        strokeWidth: 0.5, opacity: 0.5, fontFamily: "'Shippori Mincho', 'YuMincho', serif", fontSize: 9,
        colorEast: "#888888", colorSouth: "#888888", colorWest: "#888888", colorNorth: "#888888",
        starSize: 1.5, bgRingColor: "#ffffff", bgRingOpacity: 0.05
    },
    tideGraph: { stroke: "#3b82f6", strokeWidth: 1.5, opacity: 1 },
    rainGraph: { stroke: "rgba(14, 165, 233, 0.8)", strokeWidth: 1.5, opacity: 1 },
    dailyRainBg: { fill: "rgba(14, 165, 233, 1)", opacity: 1, density: 0.35 },
    dailyRainText: { fontFamily: "'Arial', sans-serif", fontSize: 8, fill: "rgba(14, 165, 233, 1)", fontWeight: "bold", stroke: "#ffffff", strokeWidth: 0, opacity: 1, offsetRadius: 0 },
    guideTime: { fontFamily: "'Shippori Mincho', 'YuMincho', 'Hiragino Mincho ProN', serif", fontSize: 7, fill: "#2c3e50", fontWeight: "bold", stroke: "rgba(255, 255, 255, 0.5)", strokeWidth: 3, opacity: 1, offsetRadius: 0 },
    guideTideLine: { stroke: "rgba(114, 113, 113, 0.4)", strokeWidth: 0.5, opacity: 1 },
    guideTideText: { fontFamily: "'Shippori Mincho', 'YuMincho', 'Hiragino Mincho ProN', serif", fontSize: 7, fill: "#3b82f6", fontWeight: "bold", stroke: "rgba(255, 255, 255, 0.5)", strokeWidth: 3, opacity: 1, offsetRadius: 0 },
    guideRainLine: { stroke: "rgba(14, 165, 233, 0.3)", strokeWidth: 1, opacity: 1 },
    guideRainText: { fontFamily: "'Shippori Mincho', 'YuMincho', 'Hiragino Mincho ProN', serif", fontSize: 7, fill: "rgba(14, 165, 233, 1)", fontWeight: "bold", stroke: "rgba(255, 255, 255, 0.5)", strokeWidth: 2.5, opacity: 1, offsetRadius: 0 },
    gregorian: { fontFamily: "'Shippori Mincho', serif", fontSize: 9, fill: "#727171", fontWeight: "bold", stroke: "#ffffff", strokeWidth: 0, opacity: 1, offsetRadius: 0 },
    weekday: { fontFamily: "'Shippori Mincho', serif", fontSize: 6, fill: "#b0b0b0", fontWeight: "normal", stroke: "#ffffff", strokeWidth: 0, opacity: 1, offsetRadius: 0, lang: "en" },
    sekki: { fontFamily: "'Shippori Mincho', serif", fontSize: 19, fill: "#2c3e50", fontWeight: "bold", stroke: "#ffffff", strokeWidth: 0, opacity: 1, offsetRadius: 0 },
    kou: { fontFamily: "'Shippori Mincho', serif", fontSize: 14, fill: "#2c3e50", fontWeight: "normal", stroke: "#ffffff", strokeWidth: 0, opacity: 1, offsetRadius: 0 },
    wafuText: { fontFamily: "'Shippori Mincho', serif", fontSize: 70, fill: "#d4af37", fontWeight: "bold", stroke: "#ffffff", strokeWidth: 0, opacity: 1, offsetRadius: 0 },
    gregorianText: { fontFamily: "'Shippori Mincho', serif", fontSize: 40, fill: "#b0b0b0", fontWeight: "normal", stroke: "#ffffff", strokeWidth: 0, opacity: 1, offsetRadius: 0 },
    holiday: { fontFamily: "'Shippori Mincho', serif", fontSize: 6.5, fill: "#d25b4e", fontWeight: "bold", stroke: "#ffffff", strokeWidth: 0, opacity: 1, offsetRadius: 0 },
    zassetsu: { fontFamily: "'Shippori Mincho', serif", fontSize: 6, fill: "#727171", fontWeight: "normal", stroke: "#ffffff", strokeWidth: 0, opacity: 1, offsetRadius: 0 },
    important: { fontFamily: "'Shippori Mincho', serif", fontSize: 6, fill: "#2c3e50", fontWeight: "bold", stroke: "#ffffff", strokeWidth: 0, opacity: 1, offsetRadius: 0 },
    eventShinto: { fontFamily: "'Shippori Mincho', serif", fontSize: 6.5, fill: "#1e3a8a", fontWeight: "normal", stroke: "#ffffff", strokeWidth: 0, opacity: 1, offsetRadius: 0 },
    eventBuddhism: { fontFamily: "'Shippori Mincho', serif", fontSize: 6.5, fill: "#3f3d56", fontWeight: "normal", stroke: "#ffffff", strokeWidth: 0, opacity: 1, offsetRadius: 0 },
    eventChurch: { fontFamily: "'Shippori Mincho', serif", fontSize: 6.5, fill: "#6b5b4e", fontWeight: "normal", stroke: "#ffffff", strokeWidth: 0, opacity: 1, offsetRadius: 0 },
    eventSonota: { fontFamily: "'Shippori Mincho', serif", fontSize: 6.5, fill: "#555555", fontWeight: "normal", stroke: "#ffffff", strokeWidth: 0, opacity: 1, offsetRadius: 0 },
    // ★ 俳句用の初期設定
    haikuText: { fontFamily: "'Shippori Mincho', serif", fontSize: 7.5, fill: "#2c3e50", fontWeight: "normal", stroke: "#ffffff", strokeWidth: 0, opacity: 1, offsetRadius: 35 },
    lunar: {
        fontFamily: "'Shippori Mincho', serif", fontSize: 11, fontWeight: "normal", opacity: 1, offsetRadius: 0,
        phases: {
            normal:       { shape: "none", fill: "#2c3e50", bgFill: "transparent", shapeStroke: "#555555", shapeStrokeWidth: 0, scale: 1 },
            newMoon:      { shape: "circle", fill: "#d4af37", bgFill: "transparent", shapeStroke: "#d4af37", shapeStrokeWidth: 1.2, scale: 1 },
            firstQuarter: { shape: "none", fill: "#2c3e50", bgFill: "transparent", shapeStroke: "#555555", shapeStrokeWidth: 0, scale: 1 },
            fullMoon:     { shape: "none", fill: "#2c3e50", bgFill: "transparent", shapeStroke: "#555555", shapeStrokeWidth: 0, scale: 1 },
            lastQuarter:  { shape: "none", fill: "#2c3e50", bgFill: "transparent", shapeStroke: "#555555", shapeStrokeWidth: 0, scale: 1 }
        }
    }
};

function isObject(item) { return (item && typeof item === 'object' && !Array.isArray(item)); }
function mergeDeep(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();
    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                mergeDeep(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }
    return mergeDeep(target, ...sources);
}

window.appSettings = JSON.parse(localStorage.getItem('polarCalendarSettingsV5')) || {
    global: JSON.parse(JSON.stringify(window.defaultLayerSettings)),
    months: {}
};
window.layerSettings = {}; 

window.loadSettingsForCycle = function(cycleIdx) {
    let base = JSON.parse(JSON.stringify(window.appSettings.global));
    base = mergeDeep(JSON.parse(JSON.stringify(window.defaultLayerSettings)), base);
    
    let monthData = window.appSettings.months[`cycle_${cycleIdx}`];
    if (monthData) {
        window.layerSettings = mergeDeep(base, monthData);
    } else {
        window.layerSettings = base;
    }
};

window.saveLayerSettings = () => {
    const cycleKey = `cycle_${currentCycle}`;
    window.appSettings.months[cycleKey] = JSON.parse(JSON.stringify(window.layerSettings));
    localStorage.setItem('polarCalendarSettingsV5', JSON.stringify(window.appSettings));
};

window.applyGlobalSettings = () => {
    window.appSettings.global = JSON.parse(JSON.stringify(window.layerSettings));
    window.appSettings.months = {}; 
    localStorage.setItem('polarCalendarSettingsV5', JSON.stringify(window.appSettings));
    alert("現在の色や設定を、すべての月の基本デザインとして適用しました！");
};

let koyomiDatabase = {};
const KOYOMI_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRqoX31YV0YAO3Mq4WatmLhjP7uUSF6dPMy3D2H3ktEFDFg1X1gJmoIXkul9JpS4aLgK9Ze3SSbV9BZ/pub?gid=0&single=true&output=csv';
const HAIKU_CSV_URL = 'https://docs.google.com/spreadsheets/d/1m0y8AOJNx1Ad4I44poPheQAQNki1-QQIwi9wSw8jaBg/export?format=csv&gid=126185184';

function formatDateStr(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

async function fetchMeteoData(startDateMs) {
    if(loader && loader.style) loader.style.display = 'flex';
    const dStart = new Date(startDateMs);
    const dEnd = new Date(startDateMs + 30 * 86400000);
    const startStr = formatDateStr(dStart);
    const endStr = formatDateStr(dEnd);
    apiRainData = new Array(720).fill(null);
    const isHistorical = dEnd.getTime() < Date.now() - (5 * 86400000);
    const rainApiUrl = isHistorical ? `https://archive-api.open-meteo.com/v1/archive?latitude=${PALAU_LAT}&longitude=${PALAU_LON}&hourly=precipitation&start_date=${startStr}&end_date=${endStr}&timezone=Asia%2FTokyo`
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
    if(loader && loader.style) loader.style.display = 'none';
}

async function loadLocalCSV() {
    try {
        const res = await fetch(KOYOMI_CSV_URL);
        if (res.ok) {
            const text = await res.text();
            const lines = text.split('\n');
            for (let i = 1; i < lines.length; i++) {
                const row = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(s => s.replace(/^"|"$/g, '').trim());
                if (row[0]) {
                    let dateKey = row[0].replace(/\//g, '-');
                    const parts = dateKey.split('-');
                    if(parts.length === 3) dateKey = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
                    koyomiDatabase[dateKey] = row;
                }
            }
        }
    } catch(e) { console.error("暦データの読み込みに失敗:", e); }

    // ★ 俳句データの直接リアルタイム取得
    try {
        const res = await fetch(HAIKU_CSV_URL);
        if (res.ok) {
            const text = await res.text();
            const lines = text.split('\n');
            for (let i = 1; i < lines.length; i++) {
                const row = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(s => s.replace(/^"|"$/g, '').trim());
                if (row.length > 11) {
                    const haiku = row[0];
                    const author = row[1];
                    const status = row[10];
                    const dateStrRaw = row[11];
                    // B列が西田上酢、かつ K列が完成句のデータのみ抽出
                    if (author === "西田上酢" && status === "完成句" && dateStrRaw) {
                        let dateKey = dateStrRaw.replace(/\//g, '-');
                        const parts = dateKey.split('-');
                        if(parts.length === 3) dateKey = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
                        
                        if (!window.haikuDatabase[dateKey]) window.haikuDatabase[dateKey] = [];
                        window.haikuDatabase[dateKey].push(haiku);
                    }
                }
            }
        }
    } catch(e) { console.error("俳句データベースの読み込みに失敗:", e); }

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
                        dateStr = `${dateParts[0]}-${dateParts[1].padStart(2, '0')}-${dateParts[2].padStart(2, '0')}`;
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

async function updateCalendarCycle() {
    if (typeof window.loadSettingsForCycle === 'function') {
        window.loadSettingsForCycle(currentCycle);
    }

    document.body.style.backgroundColor = window.layerSettings.canvasBg.fill;

    const totalElapsedDays = currentCycle * synodicMonth;
    const estimatedStartTimeMs = baseDate.getTime() + totalElapsedDays * 24 * 60 * 60 * 1000;
    let startDate = new Date(estimatedStartTimeMs);

    for (let offset = -3; offset <= 3; offset++) {
        const checkDate = new Date(estimatedStartTimeMs + offset * 86400000);
        const dateStr = formatDateStr(checkDate);
        const dbRow = koyomiDatabase[dateStr];
        if (dbRow && dbRow[1]) {
            const lunarMatch = dbRow[1].match(/旧暦.*?月(.+?)日/);
            if (lunarMatch && lunarMatch[1] === "一") {
                startDate = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
                break;
            }
        }
    }

    const cycleStartTimeMs = startDate.getTime();
    const diffDaysExact = (cycleStartTimeMs - baseDate.getTime()) / 86400000;
    currentStartSegment = Math.round((diffDaysExact % 30) / 0.25) % 120;
    if (currentStartSegment < 0) currentStartSegment += 120;

    globalRotation = -currentStartSegment * 3;

    const y = startDate.getFullYear();
    const m = startDate.getMonth() + 1;
    const d = startDate.getDate();
    const cycleDisplay = document.getElementById('cycleDisplay');
    if (cycleDisplay) {
        cycleDisplay.innerHTML = `${y}年 ${m}月 <span style="font-size:10px;">▼</span><br><span style="font-size:11px; color:#8b949e;">新月: ${m}月${d}日〜</span>`;
    }

    if (typeof computeMonthDays === 'function') computeMonthDays(startDate);

    if (typeof drawLunarShadow === 'function') drawLunarShadow(cycleStartTimeMs);
    if (typeof drawAstronomicalPins === 'function') drawAstronomicalPins(cycleStartTimeMs);
    if (typeof drawDynamicLines === 'function') drawDynamicLines();
    if (typeof drawTideGraph === 'function') drawTideGraph(cycleStartTimeMs);
    if (typeof drawDailyRainStats === 'function') drawDailyRainStats(startDate);
    if (typeof drawLunarMansions === 'function') drawLunarMansions(cycleStartTimeMs);
    if (typeof renderSavedData === 'function') renderSavedData();
    if (typeof drawTimeLabels === 'function') drawTimeLabels();
    if (typeof drawKoyomiEvents === 'function') drawKoyomiEvents(startDate);
    
    // ★ 俳句の描画呼び出し
    if (typeof drawHaikus === 'function') drawHaikus(startDate);

    if (masterGroup) masterGroup.setAttribute('transform', `rotate(${globalRotation}, ${cx}, ${cy})`);

    const stBase = window.layerSettings.baseSvg;
    if (bgGroup) {
        bgGroup.style.opacity = stBase.opacity;
        Array.from(bgGroup.querySelectorAll('*')).forEach(el => {
            if (stBase.stroke !== "") {
                el.setAttribute('stroke', stBase.stroke);
            } else {
                const orig = el.getAttribute('data-orig-stroke');
                if (orig) el.setAttribute('stroke', orig);
                else el.removeAttribute('stroke');
            }
        });
    }

    fetchMeteoData(cycleStartTimeMs).then(() => {
        if (typeof drawRainfallGraph === 'function') drawRainfallGraph(cycleStartTimeMs);
    });
}

if (typeof initUI === 'function') initUI();

loadLocalCSV().then(() => {
    fetch('calendar.svg')
        .then(response => response.text())
        .then(svgCode => {
            if (container) container.innerHTML = svgCode;
            svg = container ? container.querySelector('svg') : document.querySelector('svg');
            if (!svg) return;
            
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
            
            while (svg.firstChild) {
                const child = svg.firstChild;
                if (child.nodeType === 1) { 
                    if (child.getAttribute('stroke')) child.setAttribute('data-orig-stroke', child.getAttribute('stroke'));
                    child.querySelectorAll('*').forEach(el => {
                        if (el.getAttribute('stroke')) el.setAttribute('data-orig-stroke', el.getAttribute('stroke'));
                    });
                }
                bgGroup.appendChild(child);
            }
            masterGroup.appendChild(bgGroup);
            svg.appendChild(masterGroup);

            const layerIds = [
                "layer-shadow",               
                "layer-astronomical-pins",    
                "layer-lines",                
                "layer-data",                 
                "layer-tide-wave",            
                "layer-rain-graph",           
                "layer-daily-rain-bg",        
                "layer-lunar-mansion",        
                "layer-solar-dates",          
                "layer-outer-season",         
                "layer-guide-tide",           
                "layer-guide-rain",           
                "layer-daily-rain-text",      
                "layer-guide-time",           
                "layer-wafu-text",
                "layer-haiku" // ★ 俳句用のレイヤーを追加
            ];

            const defs = document.createElementNS(svgNS, "defs");
            defs.setAttribute("id", "text-path-defs");
            masterGroup.appendChild(defs);
            
            layerIds.forEach(id => {
                const g = document.createElementNS(svgNS, "g");
                g.setAttribute("id", id);
                masterGroup.appendChild(g);
            });
            
            updateCalendarCycle();
            if (typeof initInteractions === 'function') initInteractions();
        })
        .catch(err => console.error("SVG読み込みエラー:", err));
});
