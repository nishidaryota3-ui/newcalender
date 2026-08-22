// draw.js (SVG描画モジュール) - 軽量・最適化版

window.getTideRadius = function(tide, rMin, rMax) {
    return rMin + ((tide - (-1.5)) / (7.5 - (-1.5))) * (rMax - rMin);
};

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    const rad = (angleInDegrees - 90) * RAD;
    return { x: centerX + (radius * Math.cos(rad)), y: centerY + (radius * Math.sin(rad)) };
}

function computeMonthDays(startDate) {
    window.currentMonthDays = 30; 
    for (let i = 15; i < 30; i++) { 
        const dbRow = koyomiDatabase[formatDateStr(new Date(startDate.getTime() + i * 86400000))];
        if (dbRow && dbRow[1] && dbRow[1].match(/旧暦.*?月(.+?)日/) && dbRow[1].match(/旧暦.*?月(.+?)日/)[1] === "一") {
            window.currentMonthDays = i; break;
        }
    }
}

function drawAstronomicalPins(cycleStartTime) {
    const layer = clearLayer("layer-astronomical-pins");
    const st = window.layerSettings.astroPins;
    if(!layer || !st || st.opacity === 0 || concentricRings.length < 30) return;

    const rMin = concentricRings[0] + (st.radiusOffset || 0);
    const startAngle = currentStartSegment * 3;
    const frag = document.createDocumentFragment();
    let prevDiff = null;
    
    for (let i = 0; i <= window.currentMonthDays * 24; i++) {
        const timeMs = cycleStartTime + i * 3600000;
        let diff = (getLunarLongitude(timeMs) - getSolarLongitude(timeMs) + 360) % 360;
        
        if (prevDiff !== null) {
            [{val:0, key:'new'}, {val:90, key:'first'}, {val:180, key:'full'}, {val:270, key:'last'}].forEach(t => {
                let cross = false, fraction = 0;
                if (t.val === 0) { if (prevDiff > 300 && diff < 60) { cross = true; fraction = (360 - prevDiff) / ((360 - prevDiff) + diff); } } 
                else { if (prevDiff <= t.val && diff >= t.val) { cross = true; fraction = (t.val - prevDiff) / (diff - prevDiff); } }
                
                if (cross) {
                    const angle = startAngle + (i - 1 + fraction) * 0.5;
                    const pt = polarToCartesian(cx, cy, rMin, angle);
                    const R = 3.5 * (st.scale || 1); 
                    
                    const g = createSVG("g", { transform: `translate(${pt.x}, ${pt.y}) rotate(${angle})`, opacity: st.opacity }, frag);
                    const circle = createSVG("circle", { cx: 0, cy: 0, r: R, fill: t.key === 'new' ? st.fill : "none", stroke: st.stroke, "stroke-width": st.strokeWidth }, g);
                    
                    if (t.key === 'first') createSVG("path", { d: `M 0,-${R} A ${R},${R} 0 0,1 0,${R} Z`, fill: st.fill }, g);
                    else if (t.key === 'last') createSVG("path", { d: `M 0,-${R} A ${R},${R} 0 0,0 0,${R} Z`, fill: st.fill }, g);
                }
            });
        }
        prevDiff = diff;
    }
    layer.appendChild(frag);
}

function drawLunarMansions(cycleStartTimeMs) {
    const layer = clearLayer("layer-lunar-mansion");
    const st = window.layerSettings.lunarMansion;
    if(!layer || concentricRings.length === 0) return;

    const rBase = concentricRings[concentricRings.length - 1] + 60, rMax = rBase + 30, startAngle = currentStartSegment * 3;
    const frag = document.createDocumentFragment();

    createSVG("circle", { cx, cy, r: rBase + 15, fill: "none", stroke: st.bgRingColor || "#ffffff", opacity: st.bgRingOpacity || 0.05, "stroke-width": "30" }, frag);

    let curIdx = -1, startAng = 0;
    const getColor = (idx) => idx < 7 ? st.colorEast : idx < 14 ? st.colorNorth : idx < 21 ? st.colorWest : st.colorSouth;

    for (let i = 0; i <= 1440; i++) {
        const t = i / 2;
        const index = Math.floor(getLunarLongitude(cycleStartTimeMs + t * 3600000) / (360 / 27));
        const angle = startAngle + (t * 0.5);

        if (index !== curIdx) {
            if (curIdx !== -1) drawConstellationMark(frag, startAng, angle, curIdx, rBase + 15, st, getColor(curIdx));
            const p1 = polarToCartesian(cx, cy, rBase, angle), p2 = polarToCartesian(cx, cy, rMax, angle);
            createSVG("line", { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, stroke: getColor(index), "stroke-width": st.strokeWidth, opacity: st.opacity }, frag);
            curIdx = index; startAng = angle;
        }
    }
    drawConstellationMark(frag, startAng, startAngle + 360, curIdx, rBase + 15, st, getColor(curIdx));
    layer.appendChild(frag);
}

function drawConstellationMark(frag, startAng, endAng, index, rCenter, st, color) {
    if(endAng < startAng) endAng += 360;
    const midAngle = startAng + (endAng - startAng) / 2;
    const g = createSVG("g", {}, frag), pt = polarToCartesian(cx, cy, rCenter + 22, midAngle);
    
    createSVG("text", { x: pt.x, y: pt.y, "text-anchor": "middle", "dominant-baseline": "central", fill: color, "font-size": st.fontSize+"px", "font-family": st.fontFamily, opacity: st.opacity, transform: `rotate(${midAngle}, ${pt.x}, ${pt.y})`, textContent: mansions[index].name }, g);

    let seed = index * 12345;
    const rand = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    const sSize = st.starSize || 1.5, stars = [];

    for(let i=0; i<Math.floor(rand()*3)+3; i++) {
        const sPt = polarToCartesian(cx, cy, rCenter + (rand() - 0.5) * 15, midAngle + (rand() - 0.5) * 8);
        stars.push(sPt);
        createSVG("circle", { cx: sPt.x, cy: sPt.y, r: rand() > 0.8 ? sSize : sSize*0.6, fill: color, opacity: st.opacity }, g);
    }
    for(let i=0; i<stars.length - 1; i++) {
        createSVG("line", { x1: stars[i].x, y1: stars[i].y, x2: stars[i+1].x, y2: stars[i+1].y, stroke: color, "stroke-width": (st.strokeWidth || 0.5)*0.6, opacity: st.opacity }, g);
    }
}

function drawDailyRainStats(startDate) {
    const bgLayer = clearLayer("layer-daily-rain-bg"), textLayer = clearLayer("layer-daily-rain-text");
    if(!bgLayer || !textLayer) return;

    const fragBg = document.createDocumentFragment(), fragText = document.createDocumentFragment();
    const stBg = window.layerSettings.dailyRainBg, stText = window.layerSettings.dailyRainText;
    const rMin = concentricRings[16], rMax = concentricRings[22], rMid = (concentricRings[22] + concentricRings[23]) / 2;

    for (let i = 0; i < window.currentMonthDays; i++) {
        const loopDate = new Date(startDate.getTime() + i * 86400000);
        const rain = localRainData[formatDateStr(loopDate)];
        if (rain > 0) {
            const angle = (currentStartSegment + i * 4) * 3;
            const p1 = polarToCartesian(cx, cy, rMax, angle+12), p2 = polarToCartesian(cx, cy, rMax, angle), p3 = polarToCartesian(cx, cy, rMin, angle), p4 = polarToCartesian(cx, cy, rMin, angle+12);
            
            createSVG("path", { d: `M ${p1.x} ${p1.y} A ${rMax} ${rMax} 0 0 0 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${rMin} ${rMin} 0 0 1 ${p4.x} ${p4.y} Z`, fill: stBg.fill, opacity: Math.min(rain/150, 1) * (stBg.density || 0.35) + 0.05 }, fragBg);

            const ptText = polarToCartesian(cx, cy, rMid + stText.offsetRadius, angle + 6);
            const gText = createSVG("g", { transform: `rotate(${angle + 186}, ${ptText.x}, ${ptText.y})` }, fragText);
            createSVG("g", { transform: `translate(${ptText.x - 14}, ${ptText.y - 4})`, fill: stText.fill, innerHTML: iconDrop }, gText);
            
            const t = createSVG("text", { x: ptText.x - 2, y: ptText.y, "text-anchor": "start", "dominant-baseline": "central", textContent: rain.toFixed(1) + "mm" }, gText);
            applyTextStyle(t, stText);
        }
    }
    bgLayer.appendChild(fragBg); textLayer.appendChild(fragText);
}

function drawTideGraph(cycleStartTimeMs) {
    const waveLayer = clearLayer("layer-tide-wave"), guideLayer = clearLayer("layer-guide-tide");
    if(!waveLayer || concentricRings.length < 23) return;

    const stG = window.layerSettings.tideGraph, stL = window.layerSettings.guideTideLine || window.layerSettings.guideTide, stT = window.layerSettings.guideTideText || window.layerSettings.guideTide;
    const rMin = concentricRings[16], rMax = concentricRings[22], cycleEndMs = cycleStartTimeMs + window.currentMonthDays * 86400000;
    const pts = highLowTidePoints.filter(p => p.time >= cycleStartTimeMs && p.time <= cycleEndMs);

    if (pts.length > 1) {
        let pathD = "";
        pts.forEach((pt, i) => {
            let angle = ((currentStartSegment + (pt.time - cycleStartTimeMs) / 3600000 * (4/24)) % 120) * 3;
            const c = polarToCartesian(cx, cy, window.getTideRadius(pt.tide, rMin, rMax), angle);
            
            if (i === 0) pathD += `M ${c.x},${c.y} `;
            else {
                const prev = pts[i-1];
                let angleP = ((currentStartSegment + (prev.time - cycleStartTimeMs) / 3600000 * (4/24)) % 120) * 3;
                if(angle < angleP) angle += 360;
                const cp1 = polarToCartesian(cx, cy, window.getTideRadius(prev.tide, rMin, rMax), angleP + (angle - angleP) * 0.4);
                const cp2 = polarToCartesian(cx, cy, window.getTideRadius(pt.tide, rMin, rMax), angleP + (angle - angleP) * 0.6);
                pathD += `C ${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${c.x},${c.y} `;
            }
        });
        createSVG("path", { d: pathD, fill: "none", stroke: stG.stroke, "stroke-width": stG.strokeWidth, opacity: stG.opacity }, waveLayer);
    }

    const fragGuide = document.createDocumentFragment();
    [-1.5, 0, 1.5, 3.0, 4.5, 6.0, 7.5].forEach(ft => {
        const r = window.getTideRadius(ft, rMin, rMax);
        createSVG("circle", { class: "layer-guide-tide-line", cx, cy, r, fill: "none", stroke: stL.stroke, "stroke-width": stL.strokeWidth, "stroke-dasharray": "4,4", opacity: stL.opacity }, fragGuide);
        
        for(let i = 0; i < 6; i++) {
            const angle = currentStartSegment * 3 + (i * 60);
            const pt = polarToCartesian(cx, cy, r + stT.offsetRadius, angle);
            const t = createSVG("text", { class: "layer-guide-tide-text", x: pt.x, y: pt.y, "text-anchor": "middle", "dominant-baseline": "central", transform: `rotate(${angle}, ${pt.x}, ${pt.y})`, textContent: ft + "ft" }, fragGuide);
            applyTextStyle(t, stT);
        }
    });
    guideLayer.appendChild(fragGuide);
}

function drawRainfallGraph() {
    const rainLayer = clearLayer("layer-rain-graph"), guideLayer = clearLayer("layer-guide-rain");
    if(!rainLayer || concentricRings.length < 23) return;

    const stG = window.layerSettings.rainGraph, stL = window.layerSettings.guideRainLine || window.layerSettings.guideRain, stT = window.layerSettings.guideRainText || window.layerSettings.guideRain;
    const rMin = concentricRings[16], rMax = concentricRings[22], maxRain = 30;
    const startAngle = currentStartSegment * 3;
    const fragRain = document.createDocumentFragment(), fragGuide = document.createDocumentFragment();

    createSVG("circle", { class: "layer-guide-rain-line", cx, cy, r: rMax, fill: "none", stroke: stL.stroke, "stroke-width": stL.strokeWidth, opacity: stL.opacity }, fragGuide);

    for (let h = 0; h < window.currentMonthDays * 24; h++) {
        if(apiRainData[h] > 0) {
            const angle = startAngle + h * 0.5 + 0.25;
            const p1 = polarToCartesian(cx, cy, rMax, angle), p2 = polarToCartesian(cx, cy, rMax - (rMax - rMin) * (apiRainData[h] / maxRain), angle);
            createSVG("line", { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, stroke: stG.stroke, "stroke-width": stG.strokeWidth, "stroke-linecap": "round", opacity: stG.opacity }, fragRain);
        }
    }

    [96, 288].forEach(target => {
        const labelAngle = startAngle + target;
        [5, 10, 15, 20, 25, 30].forEach(val => {
            const r = rMax - (rMax - rMin) * (val / maxRain);
            const p1 = polarToCartesian(cx, cy, r - 3, labelAngle), p2 = polarToCartesian(cx, cy, r + 3, labelAngle);
            createSVG("line", { class: "layer-guide-rain-line", x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, stroke: stL.stroke, "stroke-width": stL.strokeWidth, opacity: stL.opacity }, fragGuide);
            
            const ptLabel = polarToCartesian(cx, cy, r + stT.offsetRadius, labelAngle);
            const t = createSVG("text", { class: "layer-guide-rain-text", x: ptLabel.x, y: ptLabel.y, "text-anchor": "middle", "dominant-baseline": "central", transform: `rotate(${labelAngle + 180}, ${ptLabel.x}, ${ptLabel.y})`, textContent: val + "mm" }, fragGuide);
            applyTextStyle(t, stT);
        });
    });
    rainLayer.appendChild(fragRain); guideLayer.appendChild(fragGuide);
}

function drawTimeLabels() {
    const timeLayer = clearLayer("layer-guide-time");
    if(!timeLayer || concentricRings.length < 20) return;
    const frag = document.createDocumentFragment();
    const st = window.layerSettings.guideTime, timeStr = ["0", "6", "12", "18"];
    const rMid = (concentricRings[19] + concentricRings[20]) / 2 + st.offsetRadius;
    
    for (let i = 0; i < 120; i++) { 
        const angle = ((currentStartSegment + i) % 120) * 3;
        const pt = polarToCartesian(cx, cy, rMid, angle);
        const t = createSVG("text", { x: pt.x, y: pt.y, "text-anchor": "middle", "dominant-baseline": "central", transform: `rotate(${angle}, ${pt.x}, ${pt.y})`, textContent: timeStr[i % 4] }, frag);
        applyTextStyle(t, st);
    }
    timeLayer.appendChild(frag);
}

function drawLunarShadow(cycleStartTime) {
    const shadowLayer = clearLayer("layer-shadow");
    if(!shadowLayer || concentricRings.length < 30) return;

    const st = window.layerSettings.lunarShadow; 
    const rMin = concentricRings[0], maxArea = concentricRings[concentricRings.length - 2] ** 2 - rMin * rMin;
    const startAngle = currentStartSegment * 3;

    let pathD = "";
    for (let i = 0; i <= 720 * 2; i++) {
        const timeMs = cycleStartTime + (i / 2) * 3600000;
        const diff = (getLunarLongitude(timeMs) - getSolarLongitude(timeMs) + 360) % 360;
        const r = Math.sqrt(rMin * rMin + (1.0 - (0.5 * (1 - Math.cos(diff * RAD)))) * maxArea);
        const pt = polarToCartesian(cx, cy, r, startAngle + (i / 2) * 0.5);
        pathD += (i === 0 ? "M " : "L ") + `${pt.x},${pt.y} `;
    }
    const pEnd = polarToCartesian(cx, cy, rMin, startAngle + 360), pStart = polarToCartesian(cx, cy, rMin, startAngle);
    pathD += `L ${pEnd.x},${pEnd.y} A ${rMin} ${rMin} 0 0 0 ${pStart.x} ${pStart.y} Z`;

    createSVG("path", { d: pathD, fill: st.fill, opacity: st.opacity }, shadowLayer);
}

function drawDynamicLines() {
    const linesLayer = clearLayer("layer-lines");
    if(!linesLayer) return;
    const st = window.layerSettings.dateLines, rMin = concentricRings[0], rMax = concentricRings[concentricRings.length - 1];
    const frag = document.createDocumentFragment();

    createSVG("circle", { cx, cy, r: concentricRings[concentricRings.length - 2], fill: "none", stroke: st.stroke, "stroke-width": st.strokeWidth, opacity: st.opacity }, frag);
    for (let i = 0; i < 30; i++) { 
        const angle = ((currentStartSegment + i * 4) % 120) * 3;
        const ptIn = polarToCartesian(cx, cy, rMin, angle), ptOut = polarToCartesian(cx, cy, rMax, angle);
        createSVG("line", { x1: ptIn.x, y1: ptIn.y, x2: ptOut.x, y2: ptOut.y, stroke: st.stroke, "stroke-width": st.strokeWidth, opacity: st.opacity }, frag);
    }
    linesLayer.appendChild(frag);
}

function drawCell(rIn, rOut, startAngle, endAngle, color, parent) {
    const sIn = polarToCartesian(cx, cy, rIn, endAngle), eIn = polarToCartesian(cx, cy, rIn, startAngle);
    const sOut = polarToCartesian(cx, cy, rOut, endAngle), eOut = polarToCartesian(cx, cy, rOut, startAngle);
    const flag = endAngle - startAngle <= 180 ? "0" : "1";
    createSVG("path", { d: `M ${sOut.x} ${sOut.y} A ${rOut} ${rOut} 0 ${flag} 0 ${eOut.x} ${eOut.y} L ${eIn.x} ${eIn.y} A ${rIn} ${rIn} 0 ${flag} 1 ${sIn.x} ${sIn.y} Z`, fill: color, opacity: "0.6" }, parent);
}

function renderSavedData() {
    const dataLayer = clearLayer("layer-data");
    if(!dataLayer) return;
    const frag = document.createDocumentFragment();
    for (const key in calendarData) {
        if (key.startsWith(`c${currentCycle}_`)) {
            const d = calendarData[key];
            drawCell(d.rIn, d.rOut, d.absSegment * 3, (d.absSegment + 1) * 3, d.color, frag);
        }
    }
    dataLayer.appendChild(frag);
}

function getRingInfo(distance) {
    if (concentricRings.length === 0) return null;
    for (let i = 0; i < concentricRings.length - 1; i++) {
        if (distance > concentricRings[i] && distance <= concentricRings[i+1]) return { layerId: `layer_${i}`, name: `階層 ${i+1}`, rIn: concentricRings[i], rOut: concentricRings[i+1] };
    }
    return null;
}

function drawKoyomiEvents(startDate) {
    window.lastKoyomiStartDate = startDate;
    window.lastCycleStartTimeMs = startDate.getTime();

    const dateLayer = clearLayer("layer-solar-dates"), outerSeasonLayer = clearLayer("layer-outer-season"), textPathDefs = clearLayer("text-path-defs");
    if(!dateLayer || concentricRings.length < 30) return;

    const fragDate = document.createDocumentFragment(), fragDefs = document.createDocumentFragment();
    const gGre = createSVG("g", {class: "layer-date-gregorian"}, fragDate), gWk = createSVG("g", {class: "layer-date-weekday"}, fragDate);
    const gLun = createSVG("g", {class: "layer-date-lunar"}, fragDate), gZas = createSVG("g", {class: "layer-zassetsu"}, fragDate);
    const gHol = createSVG("g", {class: "layer-holiday"}, fragDate), gImp = createSVG("g", {class: "layer-event-important"}, fragDate), gMix = createSVG("g", {}, fragDate);

    const R = concentricRings, stG = window.layerSettings.gregorian, stW = window.layerSettings.weekday, stL = window.layerSettings.lunar, stZ = window.layerSettings.zassetsu, stH = window.layerSettings.holiday, stI = window.layerSettings.important;
    const daysStr = stW.lang === 'ja' ? ["日", "月", "火", "水", "木", "金", "土"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    const rLayers = [24,25,26,27,28,29].map(i => (R[i-1] + R[i]) / 2);
    const r30In = R[R.length - 2], r30Out = R[R.length - 1];
    let startWafu = "", startMonth = startDate.getMonth() + 1, endMonth = new Date(startDate.getTime() + (window.currentMonthDays - 1) * 86400000).getMonth() + 1;

    const shows = [ "toggle-event-shinto", "toggle-event-buddhism", "toggle-event-church", "toggle-event-sonota" ].map(id => document.getElementById(id)?.checked !== false);

    for (let i = 0; i < window.currentMonthDays; i++) {
        const loopDate = new Date(startDate.getTime() + i * 86400000);
        const dbRow = koyomiDatabase[formatDateStr(loopDate)] || [];
        const baseAngle = ((currentStartSegment + i * 4) % 120) * 3;
        const angStart = baseAngle + 0.5, angEnd = baseAngle + 11.5;

        const makeArc = (id, r) => {
            const p1 = polarToCartesian(cx, cy, r, angStart), p2 = polarToCartesian(cx, cy, r, angEnd);
            createSVG("path", { id, d: `M ${p1.x} ${p1.y} A ${r} ${r} 0 0 1 ${p2.x} ${p2.y}` }, fragDefs);
        };
        const idB = `arc_${currentCycle}_${i}`;
        rLayers.forEach((r, idx) => makeArc(`${idB}_${24+idx}`, r));
        makeArc(`${idB}_30U`, r30In + (r30Out - r30In)*0.82 + stH.offsetRadius);
        makeArc(`${idB}_30M`, r30In + (r30Out - r30In)*0.50 + stZ.offsetRadius);
        makeArc(`${idB}_30L`, r30In + (r30Out - r30In)*0.18 + stI.offsetRadius);

        const drawTextPath = (pathId, txt, st, group) => {
            if (!txt) return;
            const textEl = createSVG("text", {}, group); applyTextStyle(textEl, st);
            createSVG("textPath", { href: `#${pathId}`, startOffset: "50%", "text-anchor": "middle", textContent: txt }, textEl);
        };

        drawTextPath(`${idB}_30U`, [dbRow[8], dbRow[14]].filter(Boolean).join(' ／ '), stH, gHol);
        drawTextPath(`${idB}_30M`, dbRow[7], stZ, gZas);
        drawTextPath(`${idB}_30L`, dbRow[9], stI, gImp);

        let evs = [];
        [10,11,12,13].forEach((col, j) => { if(shows[j] && dbRow[col]) dbRow[col].split('・').forEach(s => { if(s.trim()) evs.push({txt: s.trim(), st: window.layerSettings[['eventShinto','eventBuddhism','eventChurch','eventSonota'][j]]}); }); });

        let tracks = [[], [], [], [], [], []];
        evs.forEach((ev, idx) => tracks[evs.length <= 6 ? idx : idx % 6].push(ev));

        tracks.forEach((tEvents, tIdx) => {
            if (tEvents.length === 0) return;
            const textEl = createSVG("text", { dy: "1.5" }, gMix);
            const tp = createSVG("textPath", { href: `#${idB}_${29 - tIdx}`, startOffset: "50%", "text-anchor": "middle" }, textEl);
            tEvents.forEach((ev, eIdx) => {
                const ts = createSVG("tspan", { textContent: (eIdx > 0 ? " \u00A0・\u00A0 " : "") + ev.txt }, tp);
                applyTextStyle(ts, ev.st);
            });
        });

        const ptDate = polarToCartesian(cx, cy, r30In + (r30Out - r30In)*0.75 + stG.offsetRadius, baseAngle + 1.5);
        const tDate = createSVG("text", { class: "layer-date-gregorian", x: ptDate.x, y: ptDate.y, "text-anchor": "middle", "dominant-baseline": "central", transform: `rotate(${baseAngle + 1.5}, ${ptDate.x}, ${ptDate.y})`, textContent: `${loopDate.getMonth() + 1}/${loopDate.getDate()}` }, gGre);
        applyTextStyle(tDate, stG);

        const ptDay = polarToCartesian(cx, cy, r30In + (r30Out - r30In)*0.25 + stW.offsetRadius, baseAngle + 1.5);
        const tDay = createSVG("text", { class: "layer-date-weekday", x: ptDay.x, y: ptDay.y, "text-anchor": "middle", "dominant-baseline": "central", transform: `rotate(${baseAngle + 1.5}, ${ptDay.x}, ${ptDay.y})`, textContent: daysStr[loopDate.getDay()] }, gWk);
        applyTextStyle(tDay, stW);

        if (dbRow[1]) {
            const rawLunar = (dbRow[1].match(/旧暦.*?月(.+?)日/) || [])[1] || "";
            const phaseKey = rawLunar === "一" ? "newMoon" : rawLunar === "八" ? "firstQuarter" : rawLunar === "十五" ? "fullMoon" : rawLunar === "二十三" ? "lastQuarter" : "normal";
            const pst = stL.phases[phaseKey], ptLunar = polarToCartesian(cx, cy, (r30In + r30Out)/2 + stL.offsetRadius, baseAngle + 10.5), rL = (r30Out - r30In) * 0.4 * (pst.scale || 1);

            if (pst.shape !== "none") {
                const shapeG = createSVG("g", {class: "layer-date-lunar", transform: `rotate(${baseAngle + 10.5}, ${ptLunar.x}, ${ptLunar.y})`}, gLun);
                let shpAttr = { fill: pst.bgFill, opacity: stL.opacity };
                if (pst.shapeStrokeWidth > 0) Object.assign(shpAttr, { stroke: pst.shapeStroke, "stroke-width": pst.shapeStrokeWidth });

                if (pst.shape === "circle") createSVG("circle", { ...shpAttr, cx: ptLunar.x, cy: ptLunar.y, r: rL }, shapeG);
                else if (pst.shape === "rect") createSVG("rect", { ...shpAttr, x: ptLunar.x - rL*0.9, y: ptLunar.y - rL*0.9, width: rL*1.8, height: rL*1.8, rx: 2 }, shapeG);
                else if (pst.shape === "triangle" || pst.shape === "star") {
                    let pts = "";
                    const count = pst.shape === "triangle" ? 3 : 10;
                    for(let k=0; k<count; k++) {
                        const p = polarToCartesian(ptLunar.x, ptLunar.y, pst.shape==="triangle"?rL*1.1 : (k%2===0?rL*1.2:rL*0.5), k * (360/count));
                        pts += `${p.x},${p.y} `;
                    }
                    createSVG("polygon", { ...shpAttr, points: pts.trim() }, shapeG);
                }
            }

            const tL = createSVG("text", { class: "layer-date-lunar", x: ptLunar.x, y: ptLunar.y, "text-anchor": "middle", "dominant-baseline": "central", transform: `rotate(${baseAngle + 10.5}, ${ptLunar.x}, ${ptLunar.y})`, textContent: rawLunar.replace("三十", "丗").replace("二十", "廿") }, gLun);
            applyTextStyle(tL, pst);
            if (rawLunar.length>1) tL.setAttribute("font-size", (stL.fontSize*0.7) + "px");
            if (i === 0) startWafu = (dbRow[1].match(/（(.+?)）/) || [])[1] || "";
        }

        const drawOut = (txt, isSekki, cls, stO, offset) => {
            if (!txt) return;
            const ang = baseAngle + offset;
            const p1 = polarToCartesian(cx, cy, r30Out, ang), p2 = polarToCartesian(cx, cy, r30Out + (isSekki ? 12 : 8), ang);
            createSVG("line", { class: cls, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, stroke: "#2c3e50", "stroke-width": isSekki?"1.5":"0.5" }, outerSeasonLayer);
            
            const ptT = polarToCartesian(cx, cy, r30Out + (isSekki?45:20) + stO.offsetRadius, ang);
            const t = createSVG("text", { class: cls, x: ptT.x, y: ptT.y, "text-anchor": "start", "dominant-baseline": "middle", transform: `rotate(${ang}, ${ptT.x}, ${ptT.y})`, textContent: txt }, outerSeasonLayer);
            applyTextStyle(t, stO);
        };
        drawOut(dbRow[2], true, "layer-sekki", window.layerSettings.sekki, 0);
        drawOut(dbRow[3], false, "layer-kou", window.layerSettings.kou, dbRow[2] ? 1.5 : 0);
    }
    textPathDefs.appendChild(fragDefs);
    dateLayer.appendChild(fragDate);

    const wafuLayer = clearLayer("layer-wafu-text");
    if(wafuLayer) {
        const stWf = window.layerSettings.wafuText, stGt = window.layerSettings.gregorianText;
        const w1 = createSVG("text", { class: "layer-wafu-text", x: cx + 860, y: cy - 850 + stWf.offsetRadius, "text-anchor": "end", transform: `rotate(${-globalRotation}, ${cx}, ${cy})`, textContent: startWafu ? `${startWafu}（旧暦）` : "旧暦取得中" }, wafuLayer);
        applyTextStyle(w1, stWf);
        
        const newWafuStr = startMonth === endMonth ? wafuNames[startMonth-1] : `${wafuNames[startMonth-1]} ／ ${wafuNames[endMonth-1]}`;
        const w2 = createSVG("text", { class: "layer-gregorian-text", x: cx + 860, y: cy - 850 + (stWf.fontSize * 0.9) + stGt.offsetRadius, "text-anchor": "end", transform: `rotate(${-globalRotation}, ${cx}, ${cy})`, textContent: `${newWafuStr}（新暦）` }, wafuLayer);
        applyTextStyle(w2, stGt);
    }
}

function drawHaikus(startDate) {
    const layer = clearLayer("layer-haiku");
    const st = window.layerSettings.haikuText;
    if (!layer || concentricRings.length === 0 || !st || st.opacity === 0) return;

    const frag = document.createDocumentFragment();
    const rBase = concentricRings[concentricRings.length - 1] + 90 + st.offsetRadius;
    
    for (let i = 0; i < window.currentMonthDays; i++) {
        const dateStr = formatDateStr(new Date(startDate.getTime() + i * 86400000));
        const haikus = window.haikuDatabase[dateStr] || [];
        
        if (haikus.length > 0) {
            const baseAngle = ((currentStartSegment + i * 4) % 120) * 3;
            const displayCount = Math.min(haikus.length, 3);
            const angles = displayCount === 1 ? [6] : displayCount === 2 ? [4, 8] : [2.5, 6, 9.5];
            
            for(let j=0; j < displayCount; j++) {
                const angle = baseAngle + angles[j], pt = polarToCartesian(cx, cy, rBase, angle);
                const t = createSVG("text", { x: pt.x, y: pt.y, style: "writing-mode: vertical-rl; cursor: pointer;", transform: `rotate(${angle + 180}, ${pt.x}, ${pt.y})`, textContent: haikus[j] }, frag);
                applyTextStyle(t, st);
                t.onclick = () => window.openHaikuModal(dateStr, haikus);
            }
            
            if (haikus.length > 3) {
                const pt = polarToCartesian(cx, cy, rBase + 10, baseAngle + 11.5);
                const moreText = createSVG("text", { x: pt.x, y: pt.y, fill: "#d25b4e", "font-size": (st.fontSize * 0.8) + "px", "font-family": st.fontFamily, "text-anchor": "middle", "dominant-baseline": "middle", style: "cursor: pointer;", transform: `rotate(${baseAngle + 11.5}, ${pt.x}, ${pt.y})`, textContent: `＋${haikus.length - 3}` }, frag);
                moreText.onclick = () => window.openHaikuModal(dateStr, haikus);
            }
        }
    }
    layer.appendChild(frag);
}
