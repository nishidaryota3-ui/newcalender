// main.js (司令塔・初期化モジュール) - リファクタリング・高速起動版

// ▼▼ 1. 初期設定とデータベース ▼▼
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
    
    // ▼▼ 修正箇所：月名テキストをゴシック体、かつ半分のサイズに設定 ▼▼
    wafuText: { fontFamily: "'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif", fontSize: 35, fill: "#d4af37", fontWeight: "bold", stroke: "#ffffff", strokeWidth: 0, opacity: 1, offsetRadius: 0 },
    gregorianText: { fontFamily: "'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif", fontSize: 20, fill: "#b0b0b0", fontWeight: "normal", stroke: "#ffffff", strokeWidth: 0, opacity: 1, offsetRadius: 0 },
    
    holiday: { fontFamily: "'Shippori Mincho', serif", fontSize: 6.5, fill: "#d25b4e", fontWeight: "bold", stroke: "#ffffff", strokeWidth: 0, opacity: 1, offsetRadius: 0 },
    zassetsu: { fontFamily: "'Shippori Mincho', serif", fontSize: 6, fill: "#727171", fontWeight: "normal", stroke: "#ffffff", strokeWidth: 0, opacity: 1, offsetRadius: 0 },
    important: { fontFamily: "'Shippori Mincho', serif", fontSize: 6, fill: "#2c3e50", fontWeight: "bold", stroke: "#ffffff", strokeWidth: 0, opacity: 1, offsetRadius: 0 },
    eventShinto: { fontFamily: "'Shippori Mincho', serif", fontSize: 6.5, fill: "#1e3a8a", fontWeight: "normal", stroke: "#ffffff", strokeWidth: 0, opacity: 1, offsetRadius: 0 },
    eventBuddhism: { fontFamily: "'Shippori Mincho', serif", fontSize: 6.5, fill: "#3f3d56", fontWeight: "normal", stroke: "#ffffff", strokeWidth: 0, opacity: 1, offsetRadius: 0 },
    eventChurch: { fontFamily: "'Shippori Mincho', serif", fontSize: 6.5, fill: "#6b5b4e", fontWeight: "normal", stroke: "#ffffff", strokeWidth: 0, opacity: 1, offsetRadius: 0 },
    eventSonota: { fontFamily: "'Shippori Mincho', serif", fontSize: 6.5, fill: "#555555", fontWeight: "normal", stroke: "#ffffff", strokeWidth: 0, opacity: 1, offsetRadius: 0 },
    haikuText: { fontFamily: "'Shippori Mincho', serif", fontSize: 8, fill: "#2c3e50", fontWeight: "normal", stroke: "#ffffff", strokeWidth: 0, opacity: 1, offsetRadius: 40 },
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

window.haikuDatabase = {}; 

function isObject(item) { return (item && typeof item === 'object' && !Array.isArray(item)); }
function mergeDeep(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();
    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                mergeDeep(target[key], source[key]);
            } else Object.assign(target, { [key]: source[key] });
        }
    }
    return mergeDeep(target, ...sources);
}

function parseCSVRow(str) {
    const result = [];
    let current = '', inQuotes = false;
    for (let i = 0; i < str.length; i++) {
        const c = str[i];
        if (c === '"') {
            if (inQuotes && str[i+1] === '"') { current += '"'; i++; }
            else inQuotes = !inQuotes;
        } else if (c === ',' && !inQuotes) { result.push(current); current = ''; } 
        else current += c;
    }
    result.push(current);
    return result.map(s => s.trim());
}

function formatDateStr(dateObj) {
    const y = dateObj.getFullYear(), m = String(dateObj.getMonth() + 1).padStart(2, '0'), d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

const standardizeDateKey = (rawStr) => rawStr.replace(/\//g, '-').split('-').map(p => p.length === 1 ? '0'+p : p).join('-');

// ▼▼ 2. 設定データ管理 ▼▼
window.appSettings = JSON.parse(localStorage.getItem('polarCalendarSettingsV5')) || { global: JSON.parse(JSON.stringify(window.defaultLayerSettings)), months: {} };
window.layerSettings = {}; 

window.loadSettingsForCycle = function(cycleIdx) {
    let base = mergeDeep(JSON.parse(JSON.stringify(window.defaultLayerSettings)), JSON.parse(JSON.stringify(window.appSettings.global)));
    let monthData = window.appSettings.months[`cycle_${cycleIdx}`];
    window.layerSettings = monthData ? mergeDeep(base, monthData) : base;
};

window.saveLayerSettings = () => {
    window.appSettings.months[`cycle_${currentCycle}`] = JSON.parse(JSON.stringify(window.layerSettings));
    localStorage.setItem('polarCalendarSettingsV5', JSON.stringify(window.appSettings));
};

window.applyGlobalSettings = () => {
    window.appSettings.global = JSON.parse(JSON.stringify(window.layerSettings));
    window.appSettings.months = {}; 
    localStorage.setItem('polarCalendarSettingsV5', JSON.stringify(window.appSettings));
    alert("現在の色や設定を、すべての月の基本デザインとして適用しました！");
};

// ▼▼ 3. データ取得 (並列処理化) ▼▼
let koyomiDatabase = {};
const KOYOMI_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRqoX31YV0YAO3Mq4WatmLhjP7uUSF6dPMy3D2H3ktEFDFg1X1gJmoIXkul9JpS4aLgK9Ze3SSbV9BZ/pub?gid=0&single=true&output=csv';
const HAIKU_CSV_URL = 'https://docs.google.com/spreadsheets/d/1m0y8AOJNx1Ad4I44poPheQAQNki1-QQIwi9wSw8jaBg/export?format=csv&gid=126185184';

async function fetchMeteoData(startDateMs) {
    if (typeof loader !== 'undefined') loader.style.display = 'flex';
    const dStart = new Date(startDateMs);
    const dEnd = new Date(startDateMs + 30 * 86400000);
    apiRainData = new Array(720).fill(null);
    
    const isHistorical = dEnd.getTime() < Date.now() - (5 * 86400000);
    const baseUrl = isHistorical ? 'https://archive-api.open-meteo.com/v1/archive' : 'https://api.open-meteo.com/v1/forecast';
    const rainApiUrl = `${baseUrl}?latitude=${PALAU_LAT}&longitude=${PALAU_LON}&hourly=precipitation&start_date=${formatDateStr(dStart)}&end_date=${formatDateStr(dEnd)}&timezone=Asia%2FTokyo`;

    try {
        const res = await fetch(rainApiUrl);
        if (res.ok) {
            const json = await res.json();
            if(json.hourly && json.hourly.precipitation) {
                for(let i=0; i<720; i++) apiRainData[i] = json.hourly.precipitation[i] || 0;
            }
        }
    } catch(e) { console.error("Open-Meteo Error:", e); }
    if (typeof loader !== 'undefined') loader.style.display = 'none';
}

async function loadAllData() {
    const fetchCSV = async (url) => {
        try {
            const res = await fetch(url);
            return res.ok ? await res.text() : null;
        } catch(e) { return null; }
    };

    const [koyomiTxt, haikuTxt, rainTxt, tideTxt] = await Promise.all([
        fetchCSV(KOYOMI_CSV_URL), fetchCSV(HAIKU_CSV_URL),
        fetchCSV('palau_rain.csv'), fetchCSV('palau_tide.csv')
    ]);

    if (koyomiTxt) {
        const lines = koyomiTxt.split('\n');
        for (let i = 1; i < lines.length; i++) {
            const row = parseCSVRow(lines[i]);
            if (row[0]) koyomiDatabase[standardizeDateKey(row[0])] = row;
        }
    }

    if (haikuTxt) {
        const lines = haikuTxt.split('\n');
        for (let i = 1; i < lines.length; i++) {
            const row = parseCSVRow(lines[i]);
            if (row.length > 11 && row[1] === "西田上酢" && row[10] === "完成句" && row[11]) {
                const dateKey = standardizeDateKey(row[11]);
                if (!window.haikuDatabase[dateKey]) window.haikuDatabase[dateKey] = [];
                window.haikuDatabase[dateKey].push(row[0]);
            }
        }
    }

    if (rainTxt) {
        const lines = rainTxt.split('\n');
        for (let i = 1; i < lines.length; i++) {
            const parts = lines[i].split(',');
            if (parts.length >= 2 && parts[0].trim() && !isNaN(parseFloat(parts[1]))) {
                localRainData[standardizeDateKey(parts[0])] = parseFloat(parts[1].trim());
            }
        }
    }

    if (tideTxt) {
        const lines = tideTxt.split('\n');
        for (let i = 1; i < lines.length; i++) {
            const parts = lines[i].split(',');
            if (parts.length >= 3) {
                const dateStr = standardizeDateKey(parts[0]);
                const timeStr = parts[1].trim().substring(0, 5);
                const timeParts = timeStr.split(':');
                if(timeParts.length < 2) continue;
                
                const timeMs = new Date(`${dateStr}T${timeParts[0].padStart(2, '0')}:${timeParts[1].padStart(2, '0')}:00`).getTime();
                const tide = parseFloat(parts[2].trim());
                if (!isNaN(timeMs) && !isNaN(tide)) highLowTidePoints.push({ time: timeMs, tide: tide });
            }
        }
        highLowTidePoints.sort((a, b) => a.time - b.time);
    }
}

// ▼▼ 4. コアレンダリング (サイクル更新) ▼▼
async function updateCalendarCycle() {
    window.loadSettingsForCycle(currentCycle);
    document.body.style.backgroundColor = window.layerSettings.canvasBg.fill;

    const estimatedStartTimeMs = baseDate.getTime() + (currentCycle * synodicMonth) * 86400000;
    let startDate = new Date(estimatedStartTimeMs);

    for (let offset = -3; offset <= 3; offset++) {
        const checkDate = new Date(estimatedStartTimeMs + offset * 86400000);
        const dbRow = koyomiDatabase[formatDateStr(checkDate)];
        if (dbRow && dbRow[1] && dbRow[1].includes("月一日")) {
            startDate = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
            break;
        }
    }

    const cycleStartTimeMs = startDate.getTime();
    currentStartSegment = Math.round(((cycleStartTimeMs - baseDate.getTime()) / 86400000 % 30) / 0.25) % 120;
    if (currentStartSegment < 0) currentStartSegment += 120;
    globalRotation = -currentStartSegment * 3;

    const cycleDisplay = document.getElementById('cycleDisplay');
    if (cycleDisplay) cycleDisplay.innerHTML = `${startDate.getFullYear()}年 ${startDate.getMonth() + 1}月 <span style="font-size:10px;">▼</span><br><span style="font-size:11px; color:#8b949e;">新月: ${startDate.getMonth() + 1}月${startDate.getDate()}日〜</span>`;

    computeMonthDays(startDate);
    drawLunarShadow(cycleStartTimeMs);
    drawAstronomicalPins(cycleStartTimeMs);
    drawDynamicLines();
    drawTideGraph(cycleStartTimeMs);
    drawDailyRainStats(startDate);
    drawLunarMansions(cycleStartTimeMs);
    renderSavedData();
    drawTimeLabels();
    drawKoyomiEvents(startDate);
    drawHaikus(startDate);

    if (masterGroup) masterGroup.setAttribute('transform', `rotate(${globalRotation}, ${cx}, ${cy})`);

    if (bgGroup) {
        const stBase = window.layerSettings.baseSvg;
        bgGroup.style.opacity = stBase.opacity;
        Array.from(bgGroup.querySelectorAll('*')).forEach(el => {
            if (stBase.stroke) el.setAttribute('stroke', stBase.stroke);
            else {
                const orig = el.getAttribute('data-orig-stroke');
                if (orig) el.setAttribute('stroke', orig);
                else el.removeAttribute('stroke');
            }
        });
    }

    await fetchMeteoData(cycleStartTimeMs);
    drawRainfallGraph(cycleStartTimeMs);
}

// ▼▼ 5. アプリケーションの立ち上げ ▼▼
async function initApp() {
    initUI();
    await loadAllData();

    try {
        const svgResponse = await fetch('calendar.svg');
        const svgCode = await svgResponse.text();
        
        if (container) container.innerHTML = svgCode;
        svg = container.querySelector('svg');
        if (!svg) return;
        
        svg.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`);
        svg.querySelectorAll('*[fill="#fff"]').forEach(el => el.setAttribute('fill', 'none'));
        svg.querySelectorAll('text, rect').forEach(el => el.remove());
        
        concentricRings = [];
        svg.querySelectorAll('circle').forEach(c => {
            const r = parseFloat(c.getAttribute('r'));
            if (r && Math.abs(parseFloat(c.getAttribute('cx')) - cx) < 1 && Math.abs(parseFloat(c.getAttribute('cy')) - cy) < 1) concentricRings.push(r);
        });
        concentricRings = [...new Set(concentricRings)].sort((a, b) => a - b);
        
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

        const defs = document.createElementNS(svgNS, "defs");
        defs.setAttribute("id", "text-path-defs");
        masterGroup.appendChild(defs);
        
        const layerIds = ["layer-shadow", "layer-astronomical-pins", "layer-lines", "layer-data", "layer-tide-wave", "layer-rain-graph", "layer-daily-rain-bg", "layer-lunar-mansion", "layer-solar-dates", "layer-outer-season", "layer-guide-tide", "layer-guide-rain", "layer-daily-rain-text", "layer-guide-time", "layer-wafu-text", "layer-haiku"];
        layerIds.forEach(id => {
            const g = document.createElementNS(svgNS, "g");
            g.setAttribute("id", id);
            masterGroup.appendChild(g);
        });
        
        await updateCalendarCycle();
        initInteractions();
        
    } catch(err) {
        console.error("SVG Init Error:", err);
    }
}

// 起動
initApp();
