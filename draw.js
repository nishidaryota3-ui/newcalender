// ==========================================
// draw.js (SVG描画モジュール) - 軽量・最適化版
// ==========================================

function computeMonthDays(startDate) {
    window.currentMonthDays = 30; 
    for (let i = 15; i < 30; i++) { 
        const dateStr = formatDateStr(new Date(startDate.getTime() + i * 86400000));
        const dbRow = koyomiDatabase[dateStr];
        if (dbRow && dbRow[1] && dbRow[1].match(/旧暦.*?月(.+?)日/) && dbRow[1].match(/旧暦.*?月(.+?)日/)[1] === "一") {
            window.currentMonthDays = i; 
            break;
        }
    }
}

function drawAstronomicalPins(cycleStartTime) {
    const layer = clearLayer("layer-astronomical-pins");
    const st = window.layerSettings.astroPins;
    if(!layer || concentricRings.length < 30 || !st || st.opacity === 0) return;

    const rMin = concentricRings[0] + (st.radiusOffset || 0);
    const startAngle = currentStartSegment * 3;
    const R = 3.5 * (st.scale || 1);
    const frag = document.createDocumentFragment();
    let prevDiff = null;
    
    for (let i = 0; i <= window.currentMonthDays * 24; i++) {
        const timeMs = cycleStartTime + i * 3600000;
        let diff = (getLunarLongitude(timeMs) - getSolarLongitude(timeMs) + 360) % 360;
        
        if (prevDiff !== null) {
            [{val: 0, key: 'new'}, {val: 90, key: 'first'}, {val: 180, key: 'full'}, {val: 270, key: 'last'}].forEach(t => {
                let cross = false, frac = 0;
                if (t.val === 0 && prevDiff > 300 && diff < 60) { cross = true; frac = (360 - prevDiff) / ((360 - prevDiff) + diff); }
                else if (t.val !== 0 && prevDiff <= t.val && diff >= t.val) { cross = true; frac = (t.val - prevDiff) / (diff - prevDiff); }
                
                if (cross) {
                    const angle = startAngle + (i - 1 + frac) * 0.5;
                    const pt = polarToCartesian(cx, cy, rMin, angle);
                    const g = createSVG("g", { transform: `translate(${pt.x}, ${pt.y}) rotate(${angle})`, opacity: st.opacity }, frag);
                    
                    if (t.key === 'first' || t.key === 'last') {
                        createSVG("path", { d: `M 0,-${R} A ${R},${R} 0 0,${t.key==='first'?1:0} 0,${R} Z`, fill: st.fill }, g);
                    }
                    createSVG("circle", { cx: 0, cy: 0, r: R, fill: t.key === 'new' ? st.fill : "none", stroke: st.stroke, "stroke-width": st.strokeWidth }, g);
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

    const frag = document.createDocumentFragment();
    const rBase = concentricRings[concentricRings.length - 1] + 60, rMax = rBase + 30, startAngle = currentStartSegment * 3;

    createSVG("circle", { cx, cy, r: rBase + 15, fill: "none", stroke: st.bgRingColor || "#ffffff", opacity: st.bgRingOpacity || 0.05, "stroke-width": "30" }, frag);

    let curIdx = -1, sAng = 0;
    const getCol = idx => idx < 7 ? st.colorEast : idx < 14 ? st.colorNorth : idx < 21 ? st.colorWest : st.colorSouth;

    for (let i = 0; i <= 1440; i++) {
        const timeMs = cycleStartTimeMs + (i / 2) * 3600000;
        const index = Math.floor(getLunarLongitude(timeMs) / (360 / 27));
        const angle = startAngle + (i / 2) * 0.5;

        if (index !== curIdx) {
            if (curIdx !== -1) drawConstellationMark(frag, sAng, angle, curIdx, rBase + 15, st, getCol(curIdx));
            const p1 = polarToCartesian(cx, cy, rBase, angle), p2 = polarToCartesian(cx, cy, rMax, angle);
            createSVG("line", { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, stroke: getCol(index), "stroke-width": st.strokeWidth, opacity: st.opacity }, frag);
            curIdx = index; sAng = angle;
        }
    }
    drawConstellationMark(frag, sAng, startAngle + 360, curIdx, rBase + 15, st, getCol(curIdx));
    layer.appendChild(frag);
}

function drawConstellationMark(frag, sAng, eAng, index, rCenter, st, color) {
    if(eAng < sAng) eAng += 360;
    const midA = sAng + (eAng - sAng) / 2;
    const g = createSVG("g", {}, frag), pt = polarToCartesian(cx, cy, rCenter + 22, midA);
    
    const text = createSVG("text", { x: pt.x, y: pt.y, "text-anchor": "middle", "dominant-baseline": "central", transform: `rotate(${midA}, ${pt.x}, ${pt.y})`, textContent: mansions[index].name }, g);
    applyTextStyle(text, { ...st, fill: color });

    let seed = index * 12345;
    const rand = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    const stars = [], sSize = st.starSize || 1.5;

    for(let i=0; i<Math.floor(rand()*3)+3; i++) {
        const sPt = polarToCartesian(cx, cy, rCenter + (rand() - 0.5) * 15, midA + (rand() - 0.5) * 8);
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
        const rain = localRainData[formatDateStr(new Date(startDate.getTime() + i * 86400000))];
        if (rain > 0) {
            const sAng = (currentStartSegment + i * 4) * 3, eAng = sAng + 12;
            const p1 = polarToCartesian(cx, cy, rMax, eAng), p2 = polarToCartesian(cx, cy, rMax, sAng), p3 = polarToCartesian(cx, cy, rMin, sAng), p4 = polarToCartesian(cx, cy, rMin, eAng);
            
            createSVG("path", { d: `M ${p1.x} ${p1.y} A ${rMax} ${rMax} 0 0 0 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${rMin} ${rMin} 0 0 1 ${p4.x} ${p4.y} Z`, fill: stBg.fill, opacity: Math.min(rain/150, 1) * (stBg.density || 0.35) + 0.05 }, fragBg);

            const pt = polarToCartesian(cx, cy, rMid + stText.offsetRadius, sAng + 6);
            const gText = createSVG("g", { transform: `rotate(${sAng + 186}, ${pt.x}, ${pt.y})` }, fragText);
            createSVG("g", { transform: `translate(${pt.x - 14}, ${pt.y - 4})`, fill: stText.fill, innerHTML: iconDrop }, gText);
            
            const t = createSVG("text", { x: pt.x - 2, y: pt.y, "text-anchor": "start", "dominant-baseline": "central", textContent: rain.toFixed(1) + "mm" }, gText);
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
        let d = "";
        pts.forEach((pt, i) => {
            let a = ((currentStartSegment + (pt.time - cycleStartTimeMs) / 3600000 * (4/24)) % 120) * 3;
            const c = polarToCartesian(cx, cy, getTideRadius(pt.tide, rMin, rMax), a);
            if (i === 0) d += `M ${c.x},${c.y} `;
            else {
                const prev = pts[i-1];
                let aP = ((currentStartSegment + (prev.time - cycleStartTimeMs) / 3600000 * (4/24)) % 120) * 3;
                if(a < aP) a += 360;
                const c1 = polarToCartesian(cx, cy, getTideRadius(prev.tide, rMin, rMax), aP + (a - aP) * 0.4);
                const c2 = polarToCartesian(cx, cy, getTideRadius(pt.tide, rMin, rMax), aP + (a - aP) * 0.6);
                d += `C ${c1.x},${c1.y} ${c2.x},${c2.y} ${c.x},${c.y} `;
            }
        });
        createSVG("path", { d, fill: "none", stroke: stG.stroke, "stroke-width": stG.strokeWidth, opacity: stG.opacity }, waveLayer);
    }

    const fragG = document.createDocumentFragment();
    [-1.5, 0, 1.5, 3.0, 4.5, 6.0, 7.5].forEach(ft => {
        const r = getTideRadius(ft, rMin, rMax);
        createSVG("circle", { class: "layer-guide-tide-line", cx, cy, r, fill: "none", stroke: stL.stroke, "stroke-width": stL.strokeWidth, "stroke-dasharray": "4,4", opacity: stL.opacity }, fragG);
        for(let i=0; i<6; i++) {
            const a = currentStartSegment * 3 + (i * 60), pt = polarToCartesian(cx, cy, r + stT.offsetRadius, a);
            const t = createSVG("text", { class: "layer-guide-tide-text", x: pt.x, y: pt.y, "text-anchor": "middle", "dominant-baseline": "central", transform: `rotate(${a}, ${pt.x}, ${pt.y})`, textContent: ft + "ft" }, fragG);
            applyTextStyle(t, stT);
        }
    });
    guideLayer.appendChild(fragG);
}

function drawRainfallGraph() {
    const rainLayer = clearLayer("layer-rain-graph"), guideLayer = clearLayer("layer-guide-rain");
    if(!rainLayer || concentricRings.length < 23) return;

    const stG = window.layerSettings.rainGraph, stL = window.layerSettings.guideRainLine || window.layerSettings.guideRain, stT = window.layerSettings.guideRainText || window.layerSettings.guideRain;
    const rMin = concentricRings[16], rMax = concentricRings[22], maxR = 30, sAng = currentStartSegment * 3;
    const fR = document.createDocumentFragment(), fG = document.createDocumentFragment();

    createSVG("circle", { class: "layer-guide-rain-line", cx, cy, r: rMax, fill: "none", stroke: stL.stroke, "stroke-width": stL.strokeWidth, opacity: stL.opacity }, fG);

    for (let h = 0; h < window.currentMonthDays * 24; h++) {
        if(apiRainData[h] > 0) {
            const r = rMax - (rMax - rMin) * (apiRainData[h] / maxR), a = sAng + h*0.5 + 0.25;
            const p1 = polarToCartesian(cx, cy, rMax, a), p2 = polarToCartesian(cx, cy, r, a);
            createSVG("line", { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, stroke: stG.stroke, "stroke-width": stG.strokeWidth, "stroke-linecap": "round", opacity: stG.opacity }, fR);
        }
    }

    [96, 288].forEach(angOff => {
        [5, 10, 15, 20, 25, 30].forEach(val => {
            const r = rMax - (rMax - rMin) * (val / maxR), a = sAng + angOff;
            const p1 = polarToCartesian(cx, cy, r - 3, a), p2 = polarToCartesian(cx, cy, r + 3, a);
            createSVG("line", { class: "layer-guide-rain-line", x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, stroke: stL.stroke, "stroke-width": stL.strokeWidth, opacity: stL.opacity }, fG);
            
            const pt = polarToCartesian(cx, cy, r + stT.offsetRadius, a);
            const t = createSVG("text", { class: "layer-guide-rain-text", x: pt.x, y: pt.y, "text-anchor": "middle", "dominant-baseline": "central", transform: `rotate(${a + 180}, ${pt.x}, ${pt.y})`, textContent: val + "mm" }, fG);
            applyTextStyle(t, stT);
        });
    });
    rainLayer.appendChild(fR); guideLayer.appendChild(fG);
}

function drawTimeLabels() {
    const timeLayer = clearLayer("layer-guide-time");
    if(!timeLayer || concentricRings.length < 20) return;
    
    const st = window.layerSettings.guideTime, frag = document.createDocumentFragment();
    const rMid = (concentricRings[19] + concentricRings[20]) / 2 + st.offsetRadius;
    
    for (let i = 0; i < 120; i++) { 
        const a = ((currentStartSegment + i) % 120) * 3, pt = polarToCartesian(cx, cy, rMid, a);
        const t = createSVG("text", { x: pt.x, y: pt.y, "text-anchor": "middle", "dominant-baseline": "central", transform: `rotate(${a}, ${pt.x}, ${pt.y})`, textContent: ["0", "6", "12", "18"][i % 4] }, frag);
        applyTextStyle(t, st);
    }
    timeLayer.appendChild(frag);
}

function drawLunarShadow(cycleStartTime) {
    const shadowLayer = clearLayer("layer-shadow");
    if(!shadowLayer || concentricRings.length < 30) return;

    const st = window.layerSettings.lunarShadow, rMin = concentricRings[0], maxA = (concentricRings[concentricRings.length - 2] ** 2) - (rMin * rMin), sAng = currentStartSegment * 3;
    let d = "";
    
    for (let i = 0; i <= 1440; i++) {
        const diff = (getLunarLongitude(cycleStartTime + (i / 2) * 3600000) - getSolarLongitude(cycleStartTime + (i / 2) * 3600000) + 360) % 360;
        const pt = polarToCartesian(cx, cy, Math.sqrt(rMin * rMin + (1.0 - 0.5 * (1 - Math.cos(diff * RAD))) * maxA), sAng + (i / 2) * 0.5);
        d += (i === 0 ? "M " : "L ") + `${pt.x},${pt.y} `;
    }
    const pE = polarToCartesian(cx, cy, rMin, sAng + 360), pS = polarToCartesian(cx, cy, rMin, sAng);
    createSVG("path", { d: d + `L ${pE.x},${pE.y} A ${rMin} ${rMin} 0 0 0 ${pS.x} ${pS.y} Z`, fill: st.fill, opacity: st.opacity }, shadowLayer);
}

function drawDynamicLines() {
    const linesLayer = clearLayer("layer-lines");
    if(!linesLayer || concentricRings.length === 0) return;

    const st = window.layerSettings.dateLines, rMin = concentricRings[0], rMax = concentricRings[concentricRings.length - 1], frag = document.createDocumentFragment();
    createSVG("circle", { cx, cy, r: concentricRings[concentricRings.length - 2], fill: "none", stroke: st.stroke, "stroke-width": st.strokeWidth, opacity: st.opacity }, frag);
    
    for (let i = 0; i < 30; i++) { 
        const a = ((currentStartSegment + i * 4) % 120) * 3, pIn = polarToCartesian(cx, cy, rMin, a), pOut = polarToCartesian(cx, cy, rMax, a);
        createSVG("line", { x1: pIn.x, y1: pIn.y, x2: pOut.x, y2: pOut.y, stroke: st.stroke, "stroke-width": st.strokeWidth, opacity: st.opacity }, frag);
    }
    linesLayer.appendChild(frag);
}

function renderSavedData() {
    const dataLayer = clearLayer("layer-data");
    if(!dataLayer) return;
    const frag = document.createDocumentFragment();
    for (const key in calendarData) {
        if (key.startsWith(`c${currentCycle}_`)) {
            const d = calendarData[key], sA = d.absSegment * 3, eA = (d.absSegment + 1) * 3;
            const p1 = polarToCartesian(cx, cy, d.rIn, eA), p2 = polarToCartesian(cx, cy, d.rIn, sA), p3 = polarToCartesian(cx, cy, d.rOut, eA), p4 = polarToCartesian(cx, cy, d.rOut, sA);
            const flag = eA - sA <= 180 ? "0" : "1";
            createSVG("path", { d: `M ${p3.x} ${p3.y} A ${d.rOut} ${d.rOut} 0 ${flag} 0 ${p4.x} ${p4.y} L ${p2.x} ${p2.y} A ${d.rIn} ${d.rIn} 0 ${flag} 1 ${p1.x} ${p1.y} Z`, fill: d.color, opacity: "0.6" }, frag);
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

    const dL = clearLayer("layer-solar-dates"), oL = clearLayer("layer-outer-season"), defs = clearLayer("text-path-defs");
    if(!dL || concentricRings.length < 30) return;

    const fragD = document.createDocumentFragment(), fragDefs = document.createDocumentFragment();
    const grps = {
        gre: createSVG("g", {class: "layer-date-gregorian"}, fragD), wk: createSVG("g", {class: "layer-date-weekday"}, fragD),
        lun: createSVG("g", {class: "layer-date-lunar"}, fragD), zas: createSVG("g", {class: "layer-zassetsu"}, fragD),
        hol: createSVG("g", {class: "layer-holiday"}, fragD), imp: createSVG("g", {class: "layer-event-important"}, fragD), mix: createSVG("g", {}, fragD)
    };

    const R = concentricRings, st = window.layerSettings;
    const rL = [24,25,26,27,28,29].map(i => (R[i-1] + R[i]) / 2).reverse();
    const r30 = { in: R[28], out: R[29], U: R[28]+(R[29]-R[28])*0.82, M: R[28]+(R[29]-R[28])*0.5, L: R[28]+(R[29]-R[28])*0.18, ptU: R[28]+(R[29]-R[28])*0.75, ptL: R[28]+(R[29]-R[28])*0.25 };
    const daysStr = st.weekday.lang === 'ja' ? ["日", "月", "火", "水", "木", "金", "土"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    let sWafu = "", sMon = startDate.getMonth() + 1, eMon = new Date(startDate.getTime() + (window.currentMonthDays - 1) * 86400000).getMonth() + 1;
    const shows = [ "toggle-event-shinto", "toggle-event-buddhism", "toggle-event-church", "toggle-event-sonota" ].map(id => document.getElementById(id)?.checked !== false);

    for (let i = 0; i < window.currentMonthDays; i++) {
        const date = new Date(startDate.getTime() + i * 86400000), dbRow = koyomiDatabase[formatDateStr(date)] || [];
        const bAng = ((currentStartSegment + i * 4) % 120) * 3, sA = bAng + 0.5, eA = bAng + 11.5, arcId = `arc_${currentCycle}_${i}`;

        const addArc = (id, r) => {
            const p1 = polarToCartesian(cx, cy, r, sA), p2 = polarToCartesian(cx, cy, r, eA);
            createSVG("path", { id, d: `M ${p1.x} ${p1.y} A ${r} ${r} 0 0 1 ${p2.x} ${p2.y}` }, fragDefs);
        };
        rL.forEach((rad, idx) => addArc(`${arcId}_${idx}`, rad));
        addArc(`${arcId}_U`, r30.U + st.holiday.offsetRadius); addArc(`${arcId}_M`, r30.M + st.zassetsu.offsetRadius); addArc(`${arcId}_L`, r30.L + st.important.offsetRadius);

        const drawTP = (id, txt, cfg, grp) => {
            if (!txt) return;
            const t = createSVG("text", {}, grp); applyTextStyle(t, cfg);
            createSVG("textPath", { href: `#${id}`, startOffset: "50%", "text-anchor": "middle", textContent: txt }, t);
        };

        drawTP(`${arcId}_U`, [dbRow[8], dbRow[14]].filter(Boolean).join(' ／ '), st.holiday, grps.hol);
        drawTP(`${arcId}_M`, dbRow[7], st.zassetsu, grps.zas);
        drawTP(`${arcId}_L`, dbRow[9], st.important, grps.imp);

        let evs = [];
        [10,11,12,13].forEach((col, j) => { if (shows[j] && dbRow[col]) dbRow[col].split('・').forEach(s => { if(s.trim()) evs.push({txt: s.trim(), st: window.layerSettings[['eventShinto','eventBuddhism','eventChurch','eventSonota'][j]]}); }); });

        let tracks = [[], [], [], [], [], []];
        evs.forEach((ev, idx) => tracks[evs.length <= 6 ? idx : idx % 6].push(ev));

        tracks.forEach((tEvents, tIdx) => {
            if (!tEvents.length) return;
            const tEl = createSVG("text", { dy: "1.5" }, grps.mix);
            const tp = createSVG("textPath", { href: `#${arcId}_${tIdx}`, startOffset: "50%", "text-anchor": "middle" }, tEl);
            tEvents.forEach((ev, eIdx) => {
                const tspan = createSVG("tspan", { textContent: (eIdx > 0 ? " \u00A0・\u00A0 " : "") + ev.txt }, tp);
                applyTextStyle(tspan, ev.st);
            });
        });

        const dPt = polarToCartesian(cx, cy, r30.ptU + st.gregorian.offsetRadius, bAng + 1.5);
        const dT = createSVG("text", { class: "layer-date-gregorian", x: dPt.x, y: dPt.y, "text-anchor": "middle", "dominant-baseline": "central", transform: `rotate(${bAng + 1.5}, ${dPt.x}, ${dPt.y})`, textContent: `${date.getMonth() + 1}/${date.getDate()}` }, grps.gre);
        applyTextStyle(dT, st.gregorian);

        const wPt = polarToCartesian(cx, cy, r30.ptL + st.weekday.offsetRadius, bAng + 1.5);
        const wT = createSVG("text", { class: "layer-date-weekday", x: wPt.x, y: wPt.y, "text-anchor": "middle", "dominant-baseline": "central", transform: `rotate(${bAng + 1.5}, ${wPt.x}, ${wPt.y})`, textContent: daysStr[date.getDay()] }, grps.wk);
        applyTextStyle(wT, st.weekday);

        if (dbRow[1]) {
            const m = dbRow[1].match(/旧暦.*?月(.+?)日/);
            if(m) {
                const lD = m[1].replace("三十", "丗").replace("二十", "廿");
                const pk = lD === "一" ? "newMoon" : lD === "八" ? "firstQuarter" : lD === "十五" ? "fullMoon" : lD === "二十三" ? "lastQuarter" : "normal";
                const pst = st.lunar.phases[pk], lPt = polarToCartesian(cx, cy, r30.M + st.lunar.offsetRadius, bAng + 10.5), rL = (r30.out - r30.in) * 0.4 * (pst.scale || 1);

                if (pst.shape !== "none") {
                    const sg = createSVG("g", { class: "layer-date-lunar", transform: `rotate(${bAng + 10.5}, ${lPt.x}, ${lPt.y})` }, grps.lun);
                    let sel = null;
                    if (pst.shape === "circle") sel = createSVG("circle", { cx: lPt.x, cy: lPt.y, r: rL }, sg);
                    else if (pst.shape === "rect") sel = createSVG("rect", { x: lPt.x - rL*0.9, y: lPt.y - rL*0.9, width: rL*1.8, height: rL*1.8, rx: 2 }, sg);
                    else if (pst.shape === "triangle" || pst.shape === "star") {
                        const count = pst.shape === "triangle" ? 3 : 10;
                        let pts = Array.from({length: count}, (_, k) => `${polarToCartesian(lPt.x, lPt.y, pst.shape==="triangle"?rL*1.1 : (k%2===0?rL*1.2:rL*0.5), k * (360/count)).x},${polarToCartesian(lPt.x, lPt.y, pst.shape==="triangle"?rL*1.1 : (k%2===0?rL*1.2:rL*0.5), k * (360/count)).y}`).join(' ');
                        sel = createSVG("polygon", { points: pts }, sg);
                    }
                    if(sel) {
                        sel.setAttribute("fill", pst.bgFill); sel.setAttribute("opacity", st.lunar.opacity);
                        if(pst.shapeStrokeWidth > 0) { sel.setAttribute("stroke", pst.shapeStroke); sel.setAttribute("stroke-width", pst.shapeStrokeWidth); }
                    }
                }
                const lT = createSVG("text", { class: "layer-date-lunar", x: lPt.x, y: lPt.y, "text-anchor": "middle", "dominant-baseline": "central", transform: `rotate(${bAng + 10.5}, ${lPt.x}, ${lPt.y})`, textContent: lD }, grps.lun);
                applyTextStyle(lT, pst); if (lD.length > 1) lT.setAttribute("font-size", (st.lunar.fontSize * 0.7) + "px");
            }
            if (i === 0) sWafu = (dbRow[1].match(/（(.+?)）/) || [])[1] || "";
        }

        [2,3].forEach((col, j) => {
            if (dbRow[col]) {
                const ang = bAng + (col===3 && dbRow[2] ? 1.5 : 0), isSekki = j===0, cls = isSekki ? "layer-sekki" : "layer-kou", sCfg = isSekki ? st.sekki : st.kou;
                const p1 = polarToCartesian(cx, cy, r30.out, ang), p2 = polarToCartesian(cx, cy, r30.out + (isSekki ? 12 : 8), ang);
                createSVG("line", { class: cls, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, stroke: "#2c3e50", "stroke-width": isSekki ? "1.5" : "0.5" }, oL);
                
                const pT = polarToCartesian(cx, cy, r30.out + (isSekki ? 45 : 20) + sCfg.offsetRadius, ang);
                const ot = createSVG("text", { class: cls, x: pT.x, y: pT.y, "text-anchor": "start", "dominant-baseline": "middle", transform: `rotate(${ang}, ${pT.x}, ${pT.y})`, textContent: dbRow[col] }, oL);
                applyTextStyle(ot, sCfg);
            }
        });
    }

    textPathDefs.appendChild(fragDefs); dL.appendChild(fragD);

    const wL = clearLayer("layer-wafu-text");
    if(wL) {
        const wfT = createSVG("text", { class: "layer-wafu-text", x: cx + 860, y: cy - 850 + st.wafuText.offsetRadius, "text-anchor": "end", transform: `rotate(${-globalRotation}, ${cx}, ${cy})`, textContent: sWafu ? `${sWafu}（旧暦）` : "旧暦取得中" }, wL);
        applyTextStyle(wfT, st.wafuText);
        
        const wfs = ['睦月','如月','弥生','卯月','皐月','水無月','文月','葉月','長月','神無月','霜月','師走'];
        const grT = createSVG("text", { class: "layer-gregorian-text", x: cx + 860, y: cy - 850 + (st.wafuText.fontSize * 0.9) + st.gregorianText.offsetRadius, "text-anchor": "end", transform: `rotate(${-globalRotation}, ${cx}, ${cy})`, textContent: `${sMon === eMon ? wfs[sMon-1] : `${wfs[sMon-1]} ／ ${wfs[eMon-1]}`}（新暦）` }, wL);
        applyTextStyle(grT, st.gregorianText);
    }
}

function drawHaikus(startDate) {
    const layer = clearLayer("layer-haiku");
    const st = window.layerSettings.haikuText;
    if (!layer || concentricRings.length === 0 || !st || st.opacity === 0) return;

    const frag = document.createDocumentFragment();
    const rBase = concentricRings[concentricRings.length - 1] + 90 + (st.offsetRadius || 0);
    
    for (let i = 0; i < window.currentMonthDays; i++) {
        const dStr = formatDateStr(new Date(startDate.getTime() + i * 86400000));
        const haikus = window.haikuDatabase[dStr] || [];
        
        if (haikus.length > 0) {
            const bAng = ((currentStartSegment + i * 4) % 120) * 3;
            const c = Math.min(haikus.length, 3);
            const angles = c === 1 ? [6] : c === 2 ? [4, 8] : [2.5, 6, 9.5];
            
            for(let j=0; j < c; j++) {
                const a = bAng + angles[j], pt = polarToCartesian(cx, cy, rBase, a);
                const t = createSVG("text", { x: pt.x, y: pt.y, style: "writing-mode: vertical-rl; cursor: pointer;", transform: `rotate(${a + 180}, ${pt.x}, ${pt.y})`, textContent: haikus[j] }, frag);
                applyTextStyle(t, st);
                t.onclick = () => window.openHaikuModal(dStr, haikus);
            }
            
            if (haikus.length > 3) {
                const a = bAng + 11.5, pt = polarToCartesian(cx, cy, rBase + 10, a);
                const moreText = createSVG("text", { x: pt.x, y: pt.y, fill: "#d25b4e", "font-size": (st.fontSize * 0.8) + "px", "font-family": st.fontFamily, "text-anchor": "middle", "dominant-baseline": "middle", style: "cursor: pointer;", transform: `rotate(${a}, ${pt.x}, ${pt.y})`, textContent: `＋${haikus.length - 3}` }, frag);
                moreText.onclick = () => window.openHaikuModal(dStr, haikus);
            }
        }
    }
    layer.appendChild(frag);
}
