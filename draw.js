// draw.js (SVG描画モジュール) - 軽量・最適化版（共通関数化）

if (typeof window.mansions === 'undefined') {
    window.mansions = [
        { name: "角" }, { name: "亢" }, { name: "氐" }, { name: "房" }, { name: "心" }, { name: "尾" }, { name: "箕" },
        { name: "斗" }, { name: "女" }, { name: "虚" }, { name: "危" }, { name: "室" }, { name: "壁" },
        { name: "奎" }, { name: "婁" }, { name: "胃" }, { name: "昴" }, { name: "畢" }, { name: "觜" }, { name: "参" },
        { name: "井" }, { name: "鬼" }, { name: "柳" }, { name: "星" }, { name: "張" }, { name: "翼" }, { name: "軫" }
    ];
}

if (typeof window.getTideRadius === 'undefined') {
    window.getTideRadius = function(tide, rMin, rMax) {
        const minTide = -1.5;
        const maxTide = 7.5;
        let ratio = (tide - minTide) / (maxTide - minTide);
        return rMin + ratio * (rMax - rMin);
    };
}

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
}

function computeMonthDays(startDate) {
    window.currentMonthDays = 30; 
    for (let i = 15; i < 30; i++) { 
        const loopDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        const dateStr = formatDateStr(loopDate);
        const dbRow = koyomiDatabase[dateStr];
        if (dbRow && dbRow[1] && dbRow[1].match(/旧暦.*?月(.+?)日/)) {
            if (dbRow[1].match(/旧暦.*?月(.+?)日/)[1] === "一") {
                window.currentMonthDays = i; 
                break;
            }
        }
    }
}

function createSVGElem(tag, attrs = {}, text = null) {
    const el = document.createElementNS(svgNS, tag);
    for (const k in attrs) {
        if (attrs[k] !== undefined && attrs[k] !== null && attrs[k] !== false) {
            el.setAttribute(k, attrs[k]);
        }
    }
    if (text !== null) el.textContent = text;
    return el;
}

function getStyleAttrs(st) {
    if (!st) return {};
    const attrs = {
        fill: st.fill,
        "font-size": st.fontSize ? st.fontSize + "px" : null,
        "font-family": st.fontFamily,
        opacity: st.opacity
    };
    if (st.fontWeight === "bold") attrs["font-weight"] = "bold";
    if (st.strokeWidth > 0) {
        attrs.stroke = st.stroke;
        attrs["stroke-width"] = st.strokeWidth;
        attrs["stroke-linejoin"] = "round";
        attrs["paint-order"] = "stroke fill";
    }
    return attrs;
}

function createStyledText(st, attrs = {}, text = null) {
    return createSVGElem("text", { ...getStyleAttrs(st), ...attrs }, text);
}


function drawAstronomicalPins(cycleStartTime) {
    const layer = document.getElementById("layer-astronomical-pins");
    if(!layer) return;
    layer.innerHTML = "";
    if (concentricRings.length < 30) return;

    const st = window.layerSettings.astroPins;
    if(!st || st.opacity === 0) return;

    const rMin = concentricRings[0] + (st.radiusOffset || 0);
    const startAngle = currentStartSegment * 3;
    let prevDiff = null;
    
    for (let i = 0; i <= window.currentMonthDays * 24; i++) {
        const timeMs = cycleStartTime + i * 3600000;
        let diff = (getLunarLongitude(timeMs) - getSolarLongitude(timeMs) + 360) % 360;
        
        if (prevDiff !== null) {
            const targets = [
                {val: 0, key: 'new'}, {val: 90, key: 'first'}, 
                {val: 180, key: 'full'}, {val: 270, key: 'last'}
            ];
            
            for(let t of targets) {
                let cross = false;
                let fraction = 0;
                
                if (t.val === 0) {
                    if (prevDiff > 300 && diff < 60) {
                        cross = true;
                        fraction = (360 - prevDiff) / ((360 - prevDiff) + diff);
                    }
                } else {
                    if (prevDiff <= t.val && diff >= t.val) {
                        cross = true;
                        fraction = (t.val - prevDiff) / (diff - prevDiff);
                    }
                }
                
                if (cross) {
                    const exactI = i - 1 + fraction;
                    const angle = startAngle + exactI * 0.5;
                    const pt = polarToCartesian(cx, cy, rMin, angle);
                    
                    const g = createSVGElem("g", { transform: `translate(${pt.x}, ${pt.y}) rotate(${angle})`, opacity: st.opacity });
                    const R = 3.5 * (st.scale || 1); 
                    
                    const circle = createSVGElem("circle", { cx: 0, cy: 0, r: R, fill: "none", stroke: st.stroke, "stroke-width": st.strokeWidth });
                    
                    if (t.key === 'new') {
                        circle.setAttribute("fill", st.fill);
                        g.appendChild(circle);
                    } else if (t.key === 'full') {
                        g.appendChild(circle);
                    } else if (t.key === 'first') {
                        g.appendChild(createSVGElem("path", { d: `M 0,-${R} A ${R},${R} 0 0,1 0,${R} Z`, fill: st.fill }));
                        g.appendChild(circle);
                    } else if (t.key === 'last') {
                        g.appendChild(createSVGElem("path", { d: `M 0,-${R} A ${R},${R} 0 0,0 0,${R} Z`, fill: st.fill }));
                        g.appendChild(circle);
                    }
                    layer.appendChild(g);
                }
            }
        }
        prevDiff = diff;
    }
}

function drawLunarMansions(cycleStartTimeMs) {
    const layer = document.getElementById("layer-lunar-mansion");
    if(layer) layer.innerHTML = "";
    if (concentricRings.length === 0) return;

    const st = window.layerSettings.lunarMansion;
    const rBase = concentricRings[concentricRings.length - 1] + 60;
    const rMax = rBase + 30;
    const resolution = 2;
    const totalHours = 720; 
    const startAngle = currentStartSegment * 3;

    const trackBg = createSVGElem("circle", {
        cx: cx, cy: cy, r: rBase + 15, fill: "none",
        stroke: st.bgRingColor !== undefined ? st.bgRingColor : "#ffffff",
        opacity: st.bgRingOpacity !== undefined ? st.bgRingOpacity : 0.05,
        "stroke-width": "30"
    });
    if(layer) layer.appendChild(trackBg);

    let currentMansionIndex = -1;
    let mansionStartAngle = 0;

    const getMansionColor = (idx) => {
        if (idx < 7) return st.colorEast;
        if (idx < 14) return st.colorNorth;
        if (idx < 21) return st.colorWest;
        return st.colorSouth;
    };

    for (let i = 0; i <= totalHours * resolution; i++) {
        const t = i / resolution;
        const timeMs = cycleStartTimeMs + t * 3600000;
        const index = Math.floor(getLunarLongitude(timeMs) / (360 / 27));
        const angle = startAngle + (t * 0.5);

        if (index !== currentMansionIndex) {
            if (currentMansionIndex !== -1) {
                drawConstellationMark(mansionStartAngle, angle, currentMansionIndex, rBase + 15, st, getMansionColor(currentMansionIndex));
            }
            const p1 = polarToCartesian(cx, cy, rBase, angle);
            const p2 = polarToCartesian(cx, cy, rMax, angle);
            const line = createSVGElem("line", {
                x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y,
                stroke: getMansionColor(index), "stroke-width": st.strokeWidth, opacity: st.opacity
            });
            if(layer) layer.appendChild(line);

            currentMansionIndex = index;
            mansionStartAngle = angle;
        }
    }
    const finalAngle = startAngle + (totalHours * 0.5);
    drawConstellationMark(mansionStartAngle, finalAngle, currentMansionIndex, rBase + 15, st, getMansionColor(currentMansionIndex));
}

function drawConstellationMark(startAng, endAng, index, rCenter, st, color) {
    if(endAng < startAng) endAng += 360;
    const midAngle = startAng + (endAng - startAng) / 2;
    const mansion = window.mansions[index]; 
    const g = createSVGElem("g");
    
    const ptText = polarToCartesian(cx, cy, rCenter + 22, midAngle);
    const text = createStyledText(st, {
        x: ptText.x, y: ptText.y, "text-anchor": "middle", "dominant-baseline": "central",
        fill: color, transform: `rotate(${midAngle}, ${ptText.x}, ${ptText.y})`
    }, mansion.name);
    g.appendChild(text);

    let seed = index * 12345;
    const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    const starCount = Math.floor(rand() * 3) + 3;
    const stars = [];
    const starBaseSize = st.starSize !== undefined ? st.starSize : 1.5;

    for(let i=0; i<starCount; i++) {
        const sAngle = midAngle + (rand() - 0.5) * 8;
        const pt = polarToCartesian(cx, cy, rCenter + (rand() - 0.5) * 15, sAngle);
        stars.push(pt);
        g.appendChild(createSVGElem("circle", { cx: pt.x, cy: pt.y, r: rand() > 0.8 ? starBaseSize : starBaseSize * 0.6, fill: color, opacity: st.opacity }));
    }

    for(let i=0; i<stars.length - 1; i++) {
        g.appendChild(createSVGElem("line", {
            x1: stars[i].x, y1: stars[i].y, x2: stars[i+1].x, y2: stars[i+1].y,
            stroke: color, "stroke-width": st.strokeWidth !== undefined ? st.strokeWidth * 0.6 : 0.3, opacity: st.opacity
        }));
    }
    const layer = document.getElementById("layer-lunar-mansion");
    if(layer) layer.appendChild(g);
}

function drawDailyRainStats(startDate) {
    const bgLayer = document.getElementById("layer-daily-rain-bg");
    const textLayer = document.getElementById("layer-daily-rain-text");
    if(bgLayer) bgLayer.innerHTML = "";
    if(textLayer) textLayer.innerHTML = "";

    const stBg = window.layerSettings.dailyRainBg;
    const stText = window.layerSettings.dailyRainText;

    const rMin = concentricRings[16];
    const rMax = concentricRings[22];
    const layer23CenterR = (concentricRings[22] + concentricRings[23]) / 2;

    for (let i = 0; i < window.currentMonthDays; i++) {
        const loopDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        const dateStr = formatDateStr(loopDate);
        if (localRainData[dateStr] !== undefined && localRainData[dateStr] > 0) {
            const rain = localRainData[dateStr];
            const startAngle = (currentStartSegment + i * 4) * 3;
            const endAngle = startAngle + 12;
            let computedOpacity = Math.min(rain / 150, 1) * (stBg.density || 0.35) + 0.05;

            const startIn = polarToCartesian(cx, cy, rMin, endAngle);
            const endIn = polarToCartesian(cx, cy, rMin, startAngle);
            const startOut = polarToCartesian(cx, cy, rMax, endAngle);
            const endOut = polarToCartesian(cx, cy, rMax, startAngle);

            const d = ["M", startOut.x, startOut.y, "A", rMax, rMax, 0, 0, 0, endOut.x, endOut.y, "L", endIn.x, endIn.y, "A", rMin, rMin, 0, 0, 1, startIn.x, startIn.y, "Z"].join(" ");
            if(bgLayer) bgLayer.appendChild(createSVGElem("path", { d: d, fill: stBg.fill, opacity: computedOpacity }));

            const angleMid = startAngle + 6;
            const ptText = polarToCartesian(cx, cy, layer23CenterR + stText.offsetRadius, angleMid);
            
            const textGroup = createSVGElem("g", { transform: `rotate(${angleMid + 180}, ${ptText.x}, ${ptText.y})` });
            const iconGroup = createSVGElem("g", { transform: `translate(${ptText.x - 14}, ${ptText.y - 4})`, fill: stText.fill });
            iconGroup.innerHTML = iconDrop;
            textGroup.appendChild(iconGroup);

            const text = createStyledText(stText, { x: ptText.x - 2, y: ptText.y, "text-anchor": "start", "dominant-baseline": "central" }, rain.toFixed(1) + "mm");
            textGroup.appendChild(text);

            if(textLayer) textLayer.appendChild(textGroup);
        }
    }
}

function drawTideGraph(cycleStartTimeMs) {
    const waveLayer = document.getElementById("layer-tide-wave");
    const guideLayer = document.getElementById("layer-guide-tide");
    if(waveLayer) waveLayer.innerHTML = "";
    if(guideLayer) guideLayer.innerHTML = "";
    if (concentricRings.length < 23) return;

    const stGraph = window.layerSettings.tideGraph;
    const stLine = window.layerSettings.guideTideLine || window.layerSettings.guideTide;
    const stText = window.layerSettings.guideTideText || window.layerSettings.guideTide;

    const rMin = concentricRings[16];
    const rMax = concentricRings[22];
    const cycleEndMs = cycleStartTimeMs + window.currentMonthDays * 24 * 60 * 60 * 1000; 
    
    const cyclePoints = highLowTidePoints.filter(p => p.time >= cycleStartTimeMs && p.time <= cycleEndMs);

    if (cyclePoints.length > 1) {
        let pathD = "";
        for (let i = 0; i < cyclePoints.length; i++) {
            const pt = cyclePoints[i];
            const diffHours = (pt.time - cycleStartTimeMs) / 3600000;
            const segmentIndex = (currentStartSegment + diffHours * (4/24)) % 120;
            let angle = segmentIndex * 3;
            const r = window.getTideRadius(pt.tide, rMin, rMax); 
            const coords = polarToCartesian(cx, cy, r, angle);

            if(i === 0) {
                pathD += `M ${coords.x},${coords.y} `;
            } else {
                const prev = cyclePoints[i-1];
                const diffHPrev = (prev.time - cycleStartTimeMs) / 3600000;
                let anglePrev = ((currentStartSegment + diffHPrev * (4/24)) % 120) * 3;
                if(angle < anglePrev) angle += 360; 

                const cp1Angle = anglePrev + (angle - anglePrev) * 0.4;
                const cp2Angle = anglePrev + (angle - anglePrev) * 0.6;
                const rPrev = window.getTideRadius(prev.tide, rMin, rMax); 
                const cp1 = polarToCartesian(cx, cy, rPrev, cp1Angle);
                const cp2 = polarToCartesian(cx, cy, r, cp2Angle);
                pathD += `C ${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${coords.x},${coords.y} `;
            }
        }
        if(waveLayer) waveLayer.appendChild(createSVGElem("path", { d: pathD, fill: "none", stroke: stGraph.stroke, "stroke-width": stGraph.strokeWidth, opacity: stGraph.opacity }));
    }

    [-1.5, 0, 1.5, 3.0, 4.5, 6.0, 7.5].forEach(ft => {
        const r = window.getTideRadius(ft, rMin, rMax); 
        if(guideLayer) guideLayer.appendChild(createSVGElem("circle", { class: "layer-guide-tide-line", cx: cx, cy: cy, r: r, fill: "none", stroke: stLine.stroke, "stroke-width": stLine.strokeWidth, "stroke-dasharray": "4,4", opacity: stLine.opacity }));

        for(let i = 0; i < 6; i++) {
            const labelAngle = currentStartSegment * 3 + (i * 60);
            const labelPt = polarToCartesian(cx, cy, r + stText.offsetRadius, labelAngle);
            if(guideLayer) guideLayer.appendChild(createStyledText(stText, { class: "layer-guide-tide-text", x: labelPt.x, y: labelPt.y, "text-anchor": "middle", "dominant-baseline": "central", transform: `rotate(${labelAngle}, ${labelPt.x}, ${labelPt.y})` }, ft + "ft"));
        }
    });
}

function drawRainfallGraph(cycleStartTimeMs) {
    const rainLayer = document.getElementById("layer-rain-graph");
    const guideLayer = document.getElementById("layer-guide-rain");
    if(rainLayer) rainLayer.innerHTML = "";
    if(guideLayer) guideLayer.innerHTML = "";
    if (concentricRings.length < 23) return;

    const stGraph = window.layerSettings.rainGraph;
    const stLine = window.layerSettings.guideRainLine || window.layerSettings.guideRain;
    const stText = window.layerSettings.guideRainText || window.layerSettings.guideRain;

    const rMin = concentricRings[16];
    const rMax = concentricRings[22];
    const maxRain = 30;
    const rainGroup = createSVGElem("g");

    if(guideLayer) guideLayer.appendChild(createSVGElem("circle", { class: "layer-guide-rain-line", cx: cx, cy: cy, r: rMax, fill: "none", stroke: stLine.stroke, "stroke-width": stLine.strokeWidth, opacity: stLine.opacity }));

    const startAngle = currentStartSegment * 3;
    for (let h = 0; h < window.currentMonthDays * 24; h++) {
        let rain = apiRainData[h];
        if(rain === null || isNaN(rain) || rain <= 0) continue;
        const r = rMax - (rMax - rMin) * (rain / maxRain);
        const angle = startAngle + h * 0.5 + 0.25;
        const p1 = polarToCartesian(cx, cy, rMax, angle);
        const p2 = polarToCartesian(cx, cy, r, angle);
        rainGroup.appendChild(createSVGElem("line", { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, stroke: stGraph.stroke, "stroke-width": stGraph.strokeWidth, "stroke-linecap": "round", opacity: stGraph.opacity }));
    }

    [{ relAngle: 96 }, { relAngle: 288 }].forEach(target => {
        const labelAngle = startAngle + target.relAngle;
        [5, 10, 15, 20, 25, 30].forEach(val => {
            const r = rMax - (rMax - rMin) * (val / maxRain);
            const p1 = polarToCartesian(cx, cy, r - 3, labelAngle);
            const p2 = polarToCartesian(cx, cy, r + 3, labelAngle);
            if(guideLayer) guideLayer.appendChild(createSVGElem("line", { class: "layer-guide-rain-line", x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, stroke: stLine.stroke, "stroke-width": stLine.strokeWidth, opacity: stLine.opacity }));
            
            const ptLabel = polarToCartesian(cx, cy, r + stText.offsetRadius, labelAngle);
            if(guideLayer) guideLayer.appendChild(createStyledText(stText, { class: "layer-guide-rain-text", x: ptLabel.x, y: ptLabel.y, "text-anchor": "middle", "dominant-baseline": "central", transform: `rotate(${labelAngle + 180}, ${ptLabel.x}, ${ptLabel.y})` }, val + "mm"));
        });
    });

    if(rainLayer) rainLayer.appendChild(rainGroup);
}

function drawTimeLabels() {
    const timeLayer = document.getElementById("layer-guide-time");
    if(timeLayer) timeLayer.innerHTML = "";
    if (concentricRings.length < 20) return;
    const st = window.layerSettings.guideTime;
    const rMidTime = (concentricRings[19] + concentricRings[20]) / 2 + st.offsetRadius;
    const timeStr = ["0", "6", "12", "18"];
    
    for (let i = 0; i < 120; i++) { 
        const angle = ((currentStartSegment + i) % 120) * 3;
        const ptTime = polarToCartesian(cx, cy, rMidTime, angle);
        if(timeLayer) timeLayer.appendChild(createStyledText(st, { x: ptTime.x, y: ptTime.y, "text-anchor": "middle", "dominant-baseline": "central", transform: `rotate(${angle}, ${ptTime.x}, ${ptTime.y})` }, timeStr[i % 4]));
    }
}

function drawLunarShadow(cycleStartTime) {
    const shadowLayer = document.getElementById("layer-shadow");
    if(shadowLayer) shadowLayer.innerHTML = "";
    if (concentricRings.length < 30) return;

    const st = window.layerSettings.lunarShadow; 
    const rMin = concentricRings[0];
    const rMax = concentricRings[concentricRings.length - 2];
    const maxArea = rMax * rMax - rMin * rMin;
    const resolution = 2;
    const totalHours = 720; 
    const startAngle = currentStartSegment * 3;

    let pathD = "";
    for (let i = 0; i <= totalHours * resolution; i++) {
        const timeMs = cycleStartTime + (i / resolution) * 3600000;
        let diff = (getLunarLongitude(timeMs) - getSolarLongitude(timeMs) + 360) % 360;
        const shadow = 1.0 - (0.5 * (1 - Math.cos(diff * Math.PI / 180)));
        const r = Math.sqrt(rMin * rMin + shadow * maxArea);
        const angle = startAngle + (i / resolution) * 0.5;
        const pt = polarToCartesian(cx, cy, r, angle);

        if (i === 0) pathD += `M ${pt.x},${pt.y} `;
        else pathD += `L ${pt.x},${pt.y} `;
    }

    const endAngle = startAngle + (totalHours * 0.5);
    const pEndMin = polarToCartesian(cx, cy, rMin, endAngle);
    const pStartMin = polarToCartesian(cx, cy, rMin, startAngle);
    pathD += ` L ${pEndMin.x},${pEndMin.y} A ${rMin} ${rMin} 0 0 0 ${pStartMin.x} ${pStartMin.y} Z`;

    if(shadowLayer) shadowLayer.appendChild(createSVGElem("path", { d: pathD, fill: st.fill, opacity: st.opacity }));
}

function drawDynamicLines() {
    const linesLayer = document.getElementById("layer-lines");
    if(linesLayer) linesLayer.innerHTML = "";
    const st = window.layerSettings.dateLines;
    const rMin = concentricRings[0];
    const rMax = concentricRings[concentricRings.length - 1];

    if(linesLayer) linesLayer.appendChild(createSVGElem("circle", { cx: cx, cy: cy, r: concentricRings[concentricRings.length - 2], fill: "none", stroke: st.stroke, "stroke-width": st.strokeWidth, opacity: st.opacity }));

    for (let i = 0; i < 30; i++) { 
        const angle = ((currentStartSegment + i * 4) % 120) * 3;
        const ptInner = polarToCartesian(cx, cy, rMin, angle);
        const ptOuter = polarToCartesian(cx, cy, rMax, angle);
        if(linesLayer) linesLayer.appendChild(createSVGElem("line", { x1: ptInner.x, y1: ptInner.y, x2: ptOuter.x, y2: ptOuter.y, stroke: st.stroke, "stroke-width": st.strokeWidth, opacity: st.opacity }));
    }
}

function renderSavedData() {
    const dataLayer = document.getElementById("layer-data");
    if(dataLayer) dataLayer.innerHTML = "";
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

    const dataLayer = document.getElementById("layer-data");
    if(dataLayer) dataLayer.appendChild(createSVGElem("path", { d: d, fill: color, opacity: "0.6" }));
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

function drawKoyomiEvents(startDate) {
    window.lastKoyomiStartDate = startDate;
    window.lastCycleStartTimeMs = startDate.getTime();

    const dateLayer = document.getElementById("layer-solar-dates");
    const outerSeasonLayer = document.getElementById("layer-outer-season");
    const textPathDefs = document.getElementById("text-path-defs");
    
    if(dateLayer) dateLayer.innerHTML = "";
    if(outerSeasonLayer) outerSeasonLayer.innerHTML = "";
    if(textPathDefs) textPathDefs.innerHTML = "";

    const gregorianGroup = createSVGElem("g", { class: "layer-date-gregorian" });
    const weekdayGroup = createSVGElem("g", { class: "layer-date-weekday" });
    const lunarGroup = createSVGElem("g", { class: "layer-date-lunar" });
    const zassetsuGroup = createSVGElem("g", { class: "layer-zassetsu" });
    const holidayGroup = createSVGElem("g", { class: "layer-holiday" });
    const importantGroup = createSVGElem("g", { class: "layer-event-important" });
    const eventMixGroup = createSVGElem("g");

    if(dateLayer) {
        dateLayer.appendChild(gregorianGroup);
        dateLayer.appendChild(weekdayGroup);
        dateLayer.appendChild(lunarGroup);
        dateLayer.appendChild(zassetsuGroup);
        dateLayer.appendChild(holidayGroup);
        dateLayer.appendChild(importantGroup);
        dateLayer.appendChild(eventMixGroup);
    }

    const R = concentricRings;
    if(R.length < 30) return;

    const stG = window.layerSettings.gregorian;
    const stW = window.layerSettings.weekday;
    const stL = window.layerSettings.lunar;
    const stZ = window.layerSettings.zassetsu;
    const stH = window.layerSettings.holiday;
    const stI = window.layerSettings.important;

    const daysStr = stW.lang === 'ja' ? ["日", "月", "火", "水", "木", "金", "土"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const r24 = (R[23] + R[24]) / 2, r25 = (R[24] + R[25]) / 2, r26 = (R[25] + R[26]) / 2, r27 = (R[26] + R[27]) / 2, r28 = (R[27] + R[28]) / 2, r29 = (R[28] + R[29]) / 2;
    const r30In = R[R.length - 2], r30Out = R[R.length - 1];
    const r30Lower = r30In + (r30Out - r30In) * 0.25, r30Upper = r30In + (r30Out - r30In) * 0.75; 
    const r30U_text = r30In + (r30Out - r30In) * 0.82, r30M_text = r30In + (r30Out - r30In) * 0.50, r30L_text = r30In + (r30Out - r30In) * 0.18; 

    let startWafu = "";
    let startGregorianMonth = startDate.getMonth() + 1;
    let endGregorianMonth = new Date(startDate.getTime() + (window.currentMonthDays - 1) * 86400000).getMonth() + 1;

    const showShinto = document.getElementById("toggle-event-shinto") ? document.getElementById("toggle-event-shinto").checked : true;
    const showBuddhism = document.getElementById("toggle-event-buddhism") ? document.getElementById("toggle-event-buddhism").checked : true;
    const showChurch = document.getElementById("toggle-event-church") ? document.getElementById("toggle-event-church").checked : true;
    const showSonota = document.getElementById("toggle-event-sonota") ? document.getElementById("toggle-event-sonota").checked : true;

    for (let i = 0; i < window.currentMonthDays; i++) {
        const loopDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        const dateStr = formatDateStr(loopDate);
        const dbRow = koyomiDatabase[dateStr] || [];
        const baseAngle = ((currentStartSegment + i * 4) % 120) * 3;

        const createArc = (id, r, angStart, angEnd) => {
            const p1 = polarToCartesian(cx, cy, r, angStart);
            const p2 = polarToCartesian(cx, cy, r, angEnd);
            if(textPathDefs) textPathDefs.appendChild(createSVGElem("path", { id: id, d: `M ${p1.x} ${p1.y} A ${r} ${r} 0 0 1 ${p2.x} ${p2.y}` }));
        };

        const arcIdBase = `arc_${currentCycle}_${i}`;
        const angStart = baseAngle + 0.5, angEnd = baseAngle + 11.5;

        createArc(`${arcIdBase}_24`, r24, angStart, angEnd); createArc(`${arcIdBase}_25`, r25, angStart, angEnd);
        createArc(`${arcIdBase}_26`, r26, angStart, angEnd); createArc(`${arcIdBase}_27`, r27, angStart, angEnd);
        createArc(`${arcIdBase}_28`, r28, angStart, angEnd); createArc(`${arcIdBase}_29`, r29, angStart, angEnd);
        createArc(`${arcIdBase}_30U_text`, r30U_text + stH.offsetRadius, angStart, angEnd);
        createArc(`${arcIdBase}_30M_text`, r30M_text + stZ.offsetRadius, angStart, angEnd);
        createArc(`${arcIdBase}_30L_text`, r30L_text + stI.offsetRadius, angStart, angEnd);

        const drawSingleText = (pathId, textContent, styleConfig, rVal, targetGroup) => {
            if (!textContent) return;
            const textObj = createStyledText(styleConfig);
            const textPath = createSVGElem("textPath", { href: `#${pathId}`, startOffset: "50%", "text-anchor": "middle" }, textContent);
            const maxLen = 2 * Math.PI * rVal * (11 / 360);
            if (textContent.length * parseFloat(styleConfig.fontSize) > maxLen * 0.9) {
                textPath.setAttribute("textLength", maxLen * 0.9);
                textPath.setAttribute("lengthAdjust", "spacingAndGlyphs");
            }
            textObj.appendChild(textPath);
            targetGroup.appendChild(textObj);
        };

        const holidayText = [dbRow[8], dbRow[14]].filter(Boolean).join(' ／ ');
        drawSingleText(`${arcIdBase}_30U_text`, holidayText, stH, r30U_text + stH.offsetRadius, holidayGroup);
        drawSingleText(`${arcIdBase}_30M_text`, dbRow[7], stZ, r30M_text + stZ.offsetRadius, zassetsuGroup);
        drawSingleText(`${arcIdBase}_30L_text`, dbRow[9], stI, r30L_text + stI.offsetRadius, importantGroup);

        let dailyEvents = [];
        const pushEvents = (cellData, styleConfig) => {
            if (!cellData) return;
            cellData.split('・').forEach(item => { if (item.trim()) dailyEvents.push({ text: item.trim(), st: styleConfig }); });
        };
        if (showShinto) pushEvents(dbRow[10], window.layerSettings.eventShinto);
        if (showBuddhism) pushEvents(dbRow[11], window.layerSettings.eventBuddhism);
        if (showChurch) pushEvents(dbRow[12], window.layerSettings.eventChurch);
        if (showSonota) pushEvents(dbRow[13], window.layerSettings.eventSonota);

        let tracks = [[], [], [], [], [], []]; 
        if (dailyEvents.length > 0) {
            if (dailyEvents.length <= 6) dailyEvents.forEach((ev, idx) => tracks[idx].push(ev));
            else {
                let currentTrack = 0;
                dailyEvents.forEach((ev) => { tracks[currentTrack].push(ev); currentTrack = (currentTrack + 1) % 6; });
            }
        }

        const availableR = [r29, r28, r27, r26, r25, r24];
        const availableIds = [`${arcIdBase}_29`, `${arcIdBase}_28`, `${arcIdBase}_27`, `${arcIdBase}_26`, `${arcIdBase}_25`, `${arcIdBase}_24`];

        tracks.forEach((trackEvents, tIdx) => {
            if (trackEvents.length === 0) return;
            const textObj = createSVGElem("text", { dy: "1.5" });
            const textPath = createSVGElem("textPath", { href: `#${availableIds[tIdx]}`, startOffset: "50%", "text-anchor": "middle" });

            let combinedLen = 0;
            trackEvents.forEach((ev, eIdx) => {
                let txt = (eIdx > 0 ? " \u00A0・\u00A0 " : "") + ev.text;
                textPath.appendChild(createSVGElem("tspan", getStyleAttrs(ev.st), txt));
                combinedLen += txt.length * ev.st.fontSize;
            });

            const maxLen = 2 * Math.PI * availableR[tIdx] * (11 / 360);
            if (combinedLen > maxLen * 0.9) {
                textPath.setAttribute("textLength", maxLen * 0.9);
                textPath.setAttribute("lengthAdjust", "spacingAndGlyphs");
            }
            textObj.appendChild(textPath);
            eventMixGroup.appendChild(textObj);
        });

        const ptDate = polarToCartesian(cx, cy, r30Upper + stG.offsetRadius, baseAngle + 1.5);
        gregorianGroup.appendChild(createStyledText(stG, { class: "layer-date-gregorian", x: ptDate.x, y: ptDate.y, "text-anchor": "middle", "dominant-baseline": "central", transform: `rotate(${baseAngle + 1.5}, ${ptDate.x}, ${ptDate.y})` }, `${loopDate.getMonth() + 1}/${loopDate.getDate()}`));

        const ptDay = polarToCartesian(cx, cy, r30Lower + stW.offsetRadius, baseAngle + 1.5);
        weekdayGroup.appendChild(createStyledText(stW, { class: "layer-date-weekday", x: ptDay.x, y: ptDay.y, "text-anchor": "middle", "dominant-baseline": "central", transform: `rotate(${baseAngle + 1.5}, ${ptDay.x}, ${ptDay.y})` }, daysStr[loopDate.getDay()]));

        if (dbRow[1]) {
            const rawLunarDay = (dbRow[1].match(/旧暦.*?月(.+?)日/) || [])[1] || "";
            const lunarDay = rawLunarDay.replace("三十", "丗").replace("二十", "廿");
            let phaseKey = "normal";
            if (rawLunarDay === "一") phaseKey = "newMoon";
            else if (rawLunarDay === "八") phaseKey = "firstQuarter";
            else if (rawLunarDay === "十五") phaseKey = "fullMoon";
            else if (rawLunarDay === "二十三") phaseKey = "lastQuarter";

            const pst = stL.phases[phaseKey];
            const ptLunar = polarToCartesian(cx, cy, (r30In + r30Out)/2 + stL.offsetRadius, baseAngle + 10.5);
            const lunarRadius = ((r30Out - r30In) * 0.4) * (pst.scale || 1);

            if (pst.shape !== "none") {
                const shapeG = createSVGElem("g", { class: "layer-date-lunar", transform: `rotate(${baseAngle + 10.5}, ${ptLunar.x}, ${ptLunar.y})` });
                let shapeEl = null;
                if (pst.shape === "circle") shapeEl = createSVGElem("circle", { cx: ptLunar.x, cy: ptLunar.y, r: lunarRadius });
                else if (pst.shape === "rect") {
                    const size = lunarRadius * 1.8;
                    shapeEl = createSVGElem("rect", { x: ptLunar.x - size/2, y: ptLunar.y - size/2, width: size, height: size, rx: 2 });
                } else if (pst.shape === "triangle") {
                    const p1 = polarToCartesian(ptLunar.x, ptLunar.y, lunarRadius*1.1, 0), p2 = polarToCartesian(ptLunar.x, ptLunar.y, lunarRadius*1.1, 120), p3 = polarToCartesian(ptLunar.x, ptLunar.y, lunarRadius*1.1, 240);
                    shapeEl = createSVGElem("polygon", { points: `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}` });
                } else if (pst.shape === "star") {
                    let pts = "";
                    for(let k=0; k<10; k++) {
                        const p = polarToCartesian(ptLunar.x, ptLunar.y, k%2 === 0 ? lunarRadius*1.2 : lunarRadius*0.5, k * 36);
                        pts += `${p.x},${p.y} `;
                    }
                    shapeEl = createSVGElem("polygon", { points: pts.trim() });
                }

                if (shapeEl) {
                    shapeEl.setAttribute("fill", pst.bgFill);
                    shapeEl.setAttribute("opacity", stL.opacity);
                    if (pst.shapeStrokeWidth > 0) { shapeEl.setAttribute("stroke", pst.shapeStroke); shapeEl.setAttribute("stroke-width", pst.shapeStrokeWidth); }
                    shapeG.appendChild(shapeEl);
                    lunarGroup.appendChild(shapeG);
                }
            }

            const lunarSt = { ...stL, fill: pst.fill, fontSize: lunarDay.length > 1 ? (stL.fontSize * 0.7) : stL.fontSize };
            lunarGroup.appendChild(createStyledText(lunarSt, { class: "layer-date-lunar", x: ptLunar.x, y: ptLunar.y, "text-anchor": "middle", "dominant-baseline": "central", transform: `rotate(${baseAngle + 10.5}, ${ptLunar.x}, ${ptLunar.y})` }, lunarDay));

            if (i === 0 && dbRow[1].match(/（(.+?)）/)) startWafu = dbRow[1].match(/（(.+?)）/)[1];
        }

        const drawOuterText = (eventName, isSekki, classStr, stOut, angleOffset) => {
            if (!eventName) return;
            const lineAngle = baseAngle + angleOffset;
            const p1 = polarToCartesian(cx, cy, r30Out, lineAngle);
            const p2 = polarToCartesian(cx, cy, r30Out + (isSekki ? 12 : 8), lineAngle);
            if(outerSeasonLayer) outerSeasonLayer.appendChild(createSVGElem("line", { class: classStr, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, stroke: "#2c3e50", "stroke-width": isSekki ? "1.5" : "0.5" }));

            const ptTextOut = polarToCartesian(cx, cy, r30Out + (isSekki ? 45 : 20) + stOut.offsetRadius, lineAngle);
            if(outerSeasonLayer) outerSeasonLayer.appendChild(createStyledText(stOut, { class: classStr, x: ptTextOut.x, y: ptTextOut.y, "dominant-baseline": "middle", "text-anchor": "start", transform: `rotate(${lineAngle}, ${ptTextOut.x}, ${ptTextOut.y})` }, eventName));
        };

        if (dbRow[2]) drawOuterText(dbRow[2], true, "layer-sekki", window.layerSettings.sekki, 0);
        if (dbRow[3]) drawOuterText(dbRow[3], false, "layer-kou", window.layerSettings.kou, dbRow[2] ? 1.5 : 0);
    }

    // ▼▼ 修正箇所：月名テキストをフォントサイズの5文字分右へシフト ▼▼
    const stWafu = window.layerSettings.wafuText;
    const stGreText = window.layerSettings.gregorianText;
    const wafuTextLayer = document.getElementById("layer-wafu-text");
    if(wafuTextLayer) {
        wafuTextLayer.innerHTML = "";
        
        const shiftX = (stWafu.fontSize || 70) * 5;
        const baseX = cx + 860 + shiftX;
        
        wafuTextLayer.appendChild(createStyledText(stWafu, { class: "layer-wafu-text", x: baseX, y: cy - 850 + stWafu.offsetRadius, "text-anchor": "end", transform: `rotate(${-globalRotation}, ${cx}, ${cy})` }, startWafu ? `${startWafu}（旧暦）` : "旧暦取得中"));
        
        const wafuList = ['睦月','如月','弥生','卯月','皐月','水無月','文月','葉月','長月','神無月','霜月','師走'];
        const newWafuStr = startGregorianMonth === endGregorianMonth ? wafuList[startGregorianMonth - 1] : `${wafuList[startGregorianMonth - 1]} ／ ${wafuList[endGregorianMonth - 1]}`;
        wafuTextLayer.appendChild(createStyledText(stGreText, { class: "layer-gregorian-text", x: baseX, y: cy - 850 + (stWafu.fontSize * 0.9) + stGreText.offsetRadius, "text-anchor": "end", transform: `rotate(${-globalRotation}, ${cx}, ${cy})` }, `${newWafuStr}（新暦）`));
    }
    // ▲▲ ここまで ▲▲
}

function drawHaikus(startDate) {
    const layer = document.getElementById("layer-haiku");
    if(layer) layer.innerHTML = "";
    if (concentricRings.length === 0) return;

    const st = window.layerSettings.haikuText;
    if (!st || st.opacity === 0) return;

    const rBase = concentricRings[concentricRings.length - 1] + 90 + st.offsetRadius;
    
    for (let i = 0; i < window.currentMonthDays; i++) {
        const dateStr = formatDateStr(new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000));
        const haikus = window.haikuDatabase[dateStr] || [];
        
        if (haikus.length > 0) {
            const baseAngle = ((currentStartSegment + i * 4) % 120) * 3;
            const displayCount = Math.min(haikus.length, 3);
            const angles = displayCount === 1 ? [6] : displayCount === 2 ? [4, 8] : [2.5, 6, 9.5];
            
            for(let j=0; j < displayCount; j++) {
                const angle = baseAngle + angles[j];
                const pt = polarToCartesian(cx, cy, rBase, angle);
                const text = createStyledText(st, { x: pt.x, y: pt.y, style: "writing-mode: vertical-rl; cursor: pointer;", transform: `rotate(${angle + 180}, ${pt.x}, ${pt.y})` }, haikus[j]);
                text.onclick = () => window.openHaikuModal(dateStr, haikus);
                layer.appendChild(text);
            }
            
            if (haikus.length > 3) {
                const pt = polarToCartesian(cx, cy, rBase + 10, baseAngle + 11.5);
                const moreText = createSVGElem("text", { x: pt.x, y: pt.y, fill: "#d25b4e", "font-size": (st.fontSize * 0.8) + "px", "font-family": st.fontFamily, "text-anchor": "middle", "dominant-baseline": "middle", style: "cursor: pointer;", transform: `rotate(${baseAngle + 11.5}, ${pt.x}, ${pt.y})` }, `＋${haikus.length - 3}`);
                moreText.onclick = () => window.openHaikuModal(dateStr, haikus);
                layer.appendChild(moreText);
            }
        }
    }
}
