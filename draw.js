// draw.js (SVG描画モジュール) - 軽量・最適化版

// ★ 緊急復旧：astronomy.jsの上書きで消えてしまったデータ・関数を安全網として復元
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

// この月が29日か30日かを判定する関数
function computeMonthDays(startDate) {
    window.currentMonthDays = 30; // デフォルトは大の月（30日）
    for (let i = 15; i < 30; i++) { // 月の後半だけをチェック
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

// 天文学的ピン (朔望)
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
                {val: 0, key: 'new'}, 
                {val: 90, key: 'first'}, 
                {val: 180, key: 'full'}, 
                {val: 270, key: 'last'}
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
                    
                    const g = document.createElementNS(svgNS, "g");
                    g.setAttribute("transform", `translate(${pt.x}, ${pt.y}) rotate(${angle})`);
                    g.setAttribute("opacity", st.opacity);
                    
                    const R = 3.5 * (st.scale || 1); 
                    
                    const circle = document.createElementNS(svgNS, "circle");
                    circle.setAttribute("cx", 0);
                    circle.setAttribute("cy", 0);
                    circle.setAttribute("r", R);
                    circle.setAttribute("fill", "none");
                    circle.setAttribute("stroke", st.stroke);
                    circle.setAttribute("stroke-width", st.strokeWidth);
                    
                    if (t.key === 'new') {
                        circle.setAttribute("fill", st.fill);
                        g.appendChild(circle);
                    } else if (t.key === 'full') {
                        g.appendChild(circle);
                    } else if (t.key === 'first') {
                        const path = document.createElementNS(svgNS, "path");
                        path.setAttribute("d", `M 0,-${R} A ${R},${R} 0 0,1 0,${R} Z`);
                        path.setAttribute("fill", st.fill);
                        g.appendChild(path);
                        g.appendChild(circle);
                    } else if (t.key === 'last') {
                        const path = document.createElementNS(svgNS, "path");
                        path.setAttribute("d", `M 0,-${R} A ${R},${R} 0 0,0 0,${R} Z`);
                        path.setAttribute("fill", st.fill);
                        g.appendChild(path);
                        g.appendChild(circle);
                    }
                    layer.appendChild(g);
                }
            }
        }
        prevDiff = diff;
    }
}

// 二十七宿 
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

    const trackBg = document.createElementNS(svgNS, "circle");
    trackBg.setAttribute("cx", cx);
    trackBg.setAttribute("cy", cy);
    trackBg.setAttribute("r", rBase + 15);
    trackBg.setAttribute("fill", "none");
    trackBg.setAttribute("stroke", "rgba(255, 255, 255, 0.05)");
    trackBg.setAttribute("stroke-width", "30");
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
        const lunarLon = getLunarLongitude(timeMs);
        const index = Math.floor(lunarLon / (360 / 27));
        const angle = startAngle + (t * 0.5);

        if (index !== currentMansionIndex) {
            if (currentMansionIndex !== -1) {
                drawConstellationMark(mansionStartAngle, angle, currentMansionIndex, rBase + 15, st, getMansionColor(currentMansionIndex));
            }
            const p1 = polarToCartesian(cx, cy, rBase, angle);
            const p2 = polarToCartesian(cx, cy, rMax, angle);
            const line = document.createElementNS(svgNS, "line");
            line.setAttribute("x1", p1.x);
            line.setAttribute("y1", p1.y);
            line.setAttribute("x2", p2.x);
            line.setAttribute("y2", p2.y);
            line.setAttribute("stroke", getMansionColor(index));
            line.setAttribute("stroke-width", st.strokeWidth);
            line.setAttribute("opacity", st.opacity);
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
    const g = document.createElementNS(svgNS, "g");
    
    const ptText = polarToCartesian(cx, cy, rCenter + 22, midAngle);
    const text = document.createElementNS(svgNS, "text");
    text.setAttribute("x", ptText.x);
    text.setAttribute("y", ptText.y);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "central");
    text.setAttribute("fill", color);
    text.setAttribute("font-size", st.fontSize + "px");
    text.setAttribute("font-family", st.fontFamily);
    text.setAttribute("opacity", st.opacity);
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
        circle.setAttribute("cx", pt.x);
        circle.setAttribute("cy", pt.y);
        circle.setAttribute("r", rand() > 0.8 ? "1.5" : "0.8");
        circle.setAttribute("fill", color);
        circle.setAttribute("opacity", st.opacity);
        g.appendChild(circle);
    }

    for(let i=0; i<stars.length - 1; i++) {
        const line = document.createElementNS(svgNS, "line");
        line.setAttribute("x1", stars[i].x);
        line.setAttribute("y1", stars[i].y);
        line.setAttribute("x2", stars[i+1].x);
        line.setAttribute("y2", stars[i+1].y);
        line.setAttribute("stroke", color);
        line.setAttribute("stroke-width", "0.3");
        line.setAttribute("opacity", st.opacity);
        g.appendChild(line);
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
            const path = document.createElementNS(svgNS, "path");
            path.setAttribute("d", d);
            path.setAttribute("fill", stBg.fill);
            path.setAttribute("opacity", computedOpacity);
            if(bgLayer) bgLayer.appendChild(path);

            const angleMid = startAngle + 6;
            const ptText = polarToCartesian(cx, cy, layer23CenterR + stText.offsetRadius, angleMid);
            
            const textGroup = document.createElementNS(svgNS, "g");
            textGroup.setAttribute("transform", `rotate(${angleMid + 180}, ${ptText.x}, ${ptText.y})`);

            const iconGroup = document.createElementNS(svgNS, "g");
            iconGroup.setAttribute("transform", `translate(${ptText.x - 14}, ${ptText.y - 4})`);
            iconGroup.setAttribute("fill", stText.fill);
            iconGroup.innerHTML = iconDrop;
            textGroup.appendChild(iconGroup);

            const text = document.createElementNS(svgNS, "text");
            text.setAttribute("x", ptText.x - 2);
            text.setAttribute("y", ptText.y);
            text.setAttribute("text-anchor", "start");
            text.setAttribute("dominant-baseline", "central");
            text.setAttribute("fill", stText.fill);
            text.setAttribute("font-size", stText.fontSize + "px");
            text.setAttribute("font-family", stText.fontFamily);
            text.setAttribute("opacity", stText.opacity);
            if(stText.fontWeight === "bold") text.setAttribute("font-weight", "bold");
            if (stText.strokeWidth > 0) {
                text.setAttribute("stroke", stText.stroke);
                text.setAttribute("stroke-width", stText.strokeWidth);
                text.setAttribute("stroke-linejoin", "round");
                text.setAttribute("paint-order", "stroke fill");
            }
            text.textContent = rain.toFixed(1) + "mm";
            textGroup.appendChild(text);

            if(textLayer) textLayer.appendChild(textGroup);
        }
    }
}

// 潮汐波形 
function drawTideGraph(cycleStartTimeMs) {
    const waveLayer = document.getElementById("layer-tide-wave");
    const guideLayer = document.getElementById("layer-guide-tide");
    if(waveLayer) waveLayer.innerHTML = "";
    if(guideLayer) guideLayer.innerHTML = "";
    
    if (concentricRings.length < 23) return;

    const stGraph = window.layerSettings.tideGraph;
    // ★ 潮位の線と文字を分離して読み込み
    const stLine = window.layerSettings.guideTideLine || window.layerSettings.guideTide;
    const stText = window.layerSettings.guideTideText || window.layerSettings.guideTide;

    const rMin = concentricRings[16];
    const rMax = concentricRings[22];
    const cycleEndMs = cycleStartTimeMs + window.currentMonthDays * 24 * 60 * 60 * 1000; 
    
    const waveGroup = document.createElementNS(svgNS, "g");

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
                const segPrev = (currentStartSegment + diffHPrev * (4/24)) % 120;
                let anglePrev = segPrev * 3;
                if(angle < anglePrev) angle += 360; 

                const cp1Angle = anglePrev + (angle - anglePrev) * 0.4;
                const cp2Angle = anglePrev + (angle - anglePrev) * 0.6;
                const rPrev = window.getTideRadius(prev.tide, rMin, rMax); 
                const cp1 = polarToCartesian(cx, cy, rPrev, cp1Angle);
                const cp2 = polarToCartesian(cx, cy, r, cp2Angle);
                
                pathD += `C ${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${coords.x},${coords.y} `;
            }
        }
        const wavePath = document.createElementNS(svgNS, "path");
        wavePath.setAttribute("d", pathD);
        wavePath.setAttribute("fill", "none");
        wavePath.setAttribute("stroke", stGraph.stroke);
        wavePath.setAttribute("stroke-width", stGraph.strokeWidth);
        wavePath.setAttribute("opacity", stGraph.opacity);
        waveGroup.appendChild(wavePath);
    }

    const guideTides = [-1.5, 0, 1.5, 3.0, 4.5, 6.0, 7.5];
    guideTides.forEach(ft => {
        const r = window.getTideRadius(ft, rMin, rMax); 
        const circle = document.createElementNS(svgNS, "circle");
        circle.setAttribute("class", "layer-guide-tide-line");
        circle.setAttribute("cx", cx);
        circle.setAttribute("cy", cy);
        circle.setAttribute("r", r);
        circle.setAttribute("fill", "none");
        // ★ 分離された線の設定を適用
        circle.setAttribute("stroke", stLine.stroke);
        circle.setAttribute("stroke-width", stLine.strokeWidth);
        circle.setAttribute("stroke-dasharray", "4,4");
        circle.setAttribute("opacity", stLine.opacity);
        if(guideLayer) guideLayer.appendChild(circle);

        for(let i = 0; i < 6; i++) {
            const labelAngle = currentStartSegment * 3 + (i * 60);
            const labelPt = polarToCartesian(cx, cy, r + stText.offsetRadius, labelAngle);
            const text = document.createElementNS(svgNS, "text");
            text.setAttribute("class", "layer-guide-tide-text");
            text.setAttribute("x", labelPt.x);
            text.setAttribute("y", labelPt.y);
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("dominant-baseline", "central");
            
            // ★ 分離された文字の設定を適用
            text.setAttribute("fill", stText.fill);
            text.setAttribute("font-size", stText.fontSize + "px");
            text.setAttribute("font-family", stText.fontFamily);
            if(stText.fontWeight === "bold") text.setAttribute("font-weight", "bold");
            text.setAttribute("opacity", stText.opacity);
            text.setAttribute("transform", `rotate(${labelAngle}, ${labelPt.x}, ${labelPt.y})`);
            text.textContent = ft + "ft";
            
            if(stText.strokeWidth > 0) {
                text.setAttribute("stroke", stText.stroke);
                text.setAttribute("stroke-width", stText.strokeWidth);
                text.setAttribute("stroke-linejoin", "round");
                text.setAttribute("paint-order", "stroke fill");
            }
            if(guideLayer) guideLayer.appendChild(text);
        }
    });

    if(waveLayer) waveLayer.appendChild(waveGroup);
}

// 降水量棒グラフ
function drawRainfallGraph(cycleStartTimeMs) {
    const rainLayer = document.getElementById("layer-rain-graph");
    const guideLayer = document.getElementById("layer-guide-rain");
    if(rainLayer) rainLayer.innerHTML = "";
    if(guideLayer) guideLayer.innerHTML = "";
    
    if (concentricRings.length < 23) return;

    const stGraph = window.layerSettings.rainGraph;
    // ★ 降水量の線と文字を分離して読み込み
    const stLine = window.layerSettings.guideRainLine || window.layerSettings.guideRain;
    const stText = window.layerSettings.guideRainText || window.layerSettings.guideRain;

    const rMin = concentricRings[16];
    const rMax = concentricRings[22];
    const maxRain = 30;

    const rainGroup = document.createElementNS(svgNS, "g");

    const circle = document.createElementNS(svgNS, "circle");
    circle.setAttribute("class", "layer-guide-rain-line");
    circle.setAttribute("cx", cx);
    circle.setAttribute("cy", cy);
    circle.setAttribute("r", rMax);
    circle.setAttribute("fill", "none");
    // ★ 分離された線の設定を適用
    circle.setAttribute("stroke", stLine.stroke);
    circle.setAttribute("stroke-width", stLine.strokeWidth);
    circle.setAttribute("opacity", stLine.opacity);
    if(guideLayer) guideLayer.appendChild(circle);

    const startAngle = currentStartSegment * 3;
    for (let h = 0; h < window.currentMonthDays * 24; h++) {
        let rain = apiRainData[h];
        if(rain === null || isNaN(rain) || rain <= 0) continue;
        
        const r = rMax - (rMax - rMin) * (rain / maxRain);
        const angle = startAngle + h * 0.5 + 0.25;
        const p1 = polarToCartesian(cx, cy, rMax, angle);
        const p2 = polarToCartesian(cx, cy, r, angle);
        
        const line = document.createElementNS(svgNS, "line");
        line.setAttribute("x1", p1.x);
        line.setAttribute("y1", p1.y);
        line.setAttribute("x2", p2.x);
        line.setAttribute("y2", p2.y);
        line.setAttribute("stroke", stGraph.stroke);
        line.setAttribute("stroke-width", stGraph.strokeWidth);
        line.setAttribute("stroke-linecap", "round");
        line.setAttribute("opacity", stGraph.opacity);
        rainGroup.appendChild(line);
    }

    const labelsToDraw = [
        { relAngle: 96 },
        { relAngle: 288 }
    ];

    labelsToDraw.forEach(target => {
        const labelAngle = startAngle + target.relAngle;
        [5, 10, 15, 20, 25, 30].forEach(val => {
            const r = rMax - (rMax - rMin) * (val / maxRain);
            
            const p1 = polarToCartesian(cx, cy, r - 3, labelAngle);
            const p2 = polarToCartesian(cx, cy, r + 3, labelAngle);
            const tick = document.createElementNS(svgNS, "line");
            tick.setAttribute("class", "layer-guide-rain-line");
            tick.setAttribute("x1", p1.x);
            tick.setAttribute("y1", p1.y);
            tick.setAttribute("x2", p2.x);
            tick.setAttribute("y2", p2.y);
            tick.setAttribute("stroke", stLine.stroke);
            tick.setAttribute("stroke-width", stLine.strokeWidth);
            tick.setAttribute("opacity", stLine.opacity);
            if(guideLayer) guideLayer.appendChild(tick);
            
            const ptLabel = polarToCartesian(cx, cy, r + stText.offsetRadius, labelAngle);
            const text = document.createElementNS(svgNS, "text");
            text.setAttribute("class", "layer-guide-rain-text");
            text.setAttribute("x", ptLabel.x);
            text.setAttribute("y", ptLabel.y);
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("dominant-baseline", "central");
            
            // ★ 分離された文字の設定を適用
            text.setAttribute("fill", stText.fill);
            text.setAttribute("font-size", stText.fontSize + "px");
            text.setAttribute("font-family", stText.fontFamily);
            text.setAttribute("opacity", stText.opacity);
            if(stText.fontWeight === "bold") text.setAttribute("font-weight", "bold");
            
            if(stText.strokeWidth > 0) {
                text.setAttribute("stroke", stText.stroke);
                text.setAttribute("stroke-width", stText.strokeWidth);
                text.setAttribute("stroke-linejoin", "round");
                text.setAttribute("paint-order", "stroke fill");
            }
            
            // ★ 左右どちらも外側から読めるように +180度 に統一
            let textRot = labelAngle + 180;
            text.setAttribute("transform", `rotate(${textRot}, ${ptLabel.x}, ${ptLabel.y})`);
            text.textContent = val + "mm";
            if(guideLayer) guideLayer.appendChild(text);
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
        
        const textTime = document.createElementNS(svgNS, "text");
        textTime.setAttribute("x", ptTime.x);
        textTime.setAttribute("y", ptTime.y);
        textTime.setAttribute("text-anchor", "middle");
        textTime.setAttribute("dominant-baseline", "central");
        textTime.setAttribute("fill", st.fill);
        textTime.setAttribute("font-size", st.fontSize + "px");
        textTime.setAttribute("font-family", st.fontFamily);
        textTime.setAttribute("opacity", st.opacity);
        if(st.fontWeight === "bold") textTime.setAttribute("font-weight", "bold");
        
        if (st.strokeWidth > 0) {
            textTime.setAttribute("stroke", st.stroke);
            textTime.setAttribute("stroke-width", st.strokeWidth);
            textTime.setAttribute("stroke-linejoin", "round");
            textTime.setAttribute("paint-order", "stroke fill");
        }
        
        textTime.setAttribute("transform", `rotate(${angle}, ${ptTime.x}, ${ptTime.y})`);
        textTime.textContent = timeStr[i % 4];
        if(timeLayer) timeLayer.appendChild(textTime);
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
        
        const illumination = 0.5 * (1 - Math.cos(diff * Math.PI / 180));
        const shadow = 1.0 - illumination;
        
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

    const shadowPath = document.createElementNS(svgNS, "path");
    shadowPath.setAttribute("d", pathD);
    shadowPath.setAttribute("fill", st.fill);
    shadowPath.setAttribute("opacity", st.opacity);
    if(shadowLayer) shadowLayer.appendChild(shadowPath);
}

function drawDynamicLines() {
    const linesLayer = document.getElementById("layer-lines");
    if(linesLayer) linesLayer.innerHTML = "";
    const st = window.layerSettings.dateLines;
    const rMin = concentricRings[0];
    const rMax = concentricRings[concentricRings.length - 1];

    const ringDateInner = document.createElementNS(svgNS, "circle");
    ringDateInner.setAttribute("cx", cx);
    ringDateInner.setAttribute("cy", cy);
    ringDateInner.setAttribute("r", concentricRings[concentricRings.length - 2]);
    ringDateInner.setAttribute("fill", "none");
    ringDateInner.setAttribute("stroke", st.stroke);
    ringDateInner.setAttribute("stroke-width", st.strokeWidth);
    ringDateInner.setAttribute("opacity", st.opacity);
    if(linesLayer) linesLayer.appendChild(ringDateInner);

    for (let i = 0; i < 30; i++) { 
        const angle = ((currentStartSegment + i * 4) % 120) * 3;
        const ptInner = polarToCartesian(cx, cy, rMin, angle);
        const ptOuter = polarToCartesian(cx, cy, rMax, angle);
        
        const line = document.createElementNS(svgNS, "line");
        line.setAttribute("x1", ptInner.x);
        line.setAttribute("y1", ptInner.y);
        line.setAttribute("x2", ptOuter.x);
        line.setAttribute("y2", ptOuter.y);
        line.setAttribute("stroke", st.stroke);
        line.setAttribute("stroke-width", st.strokeWidth);
        line.setAttribute("opacity", st.opacity);
        if(linesLayer) linesLayer.appendChild(line);
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
    const d = [
        "M", startOut.x, startOut.y,
        "A", rOut, rOut, 0, largeArcFlag, 0, endOut.x, endOut.y,
        "L", endIn.x, endIn.y,
        "A", rIn, rIn, 0, largeArcFlag, 1, startIn.x, startIn.y,
        "Z"
    ].join(" ");

    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", d);
    path.setAttribute("fill", color);
    path.setAttribute("opacity", "0.6");
    const dataLayer = document.getElementById("layer-data");
    if(dataLayer) dataLayer.appendChild(path);
}

function getRingInfo(distance) {
    if (concentricRings.length === 0) return null;
    for (let i = 0; i < concentricRings.length - 1; i++) {
        if (distance > concentricRings[i] && distance <= concentricRings[i+1]) {
            return {
                layerId: `layer_${i}`,
                name: `階層 ${i+1}`,
                rIn: concentricRings[i],
                rOut: concentricRings[i+1]
            };
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

    const gregorianGroup = document.createElementNS(svgNS, "g");
    gregorianGroup.setAttribute("class", "layer-date-gregorian");
    const weekdayGroup = document.createElementNS(svgNS, "g");
    weekdayGroup.setAttribute("class", "layer-date-weekday");
    const lunarGroup = document.createElementNS(svgNS, "g");
    lunarGroup.setAttribute("class", "layer-date-lunar");

    const zassetsuGroup = document.createElementNS(svgNS, "g");
    zassetsuGroup.setAttribute("class", "layer-zassetsu");
    const holidayGroup = document.createElementNS(svgNS, "g");
    holidayGroup.setAttribute("class", "layer-holiday");
    const importantGroup = document.createElementNS(svgNS, "g");
    importantGroup.setAttribute("class", "layer-event-important");

    const eventMixGroup = document.createElementNS(svgNS, "g");

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

    const daysStr = stW.lang === 'ja' 
        ? ["日", "月", "火", "水", "木", "金", "土"]
        : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const r24 = (R[23] + R[24]) / 2;
    const r25 = (R[24] + R[25]) / 2;
    const r26 = (R[25] + R[26]) / 2;
    const r27 = (R[26] + R[27]) / 2;
    const r28 = (R[27] + R[28]) / 2;
    const r29 = (R[28] + R[29]) / 2;
    
    const r30In = R[R.length - 2];
    const r30Out = R[R.length - 1];
    const r30Lower = r30In + (r30Out - r30In) * 0.25; 
    const r30Upper = r30In + (r30Out - r30In) * 0.75; 
    
    const r30U_text = r30In + (r30Out - r30In) * 0.82; 
    const r30M_text = r30In + (r30Out - r30In) * 0.50; 
    const r30L_text = r30In + (r30Out - r30In) * 0.18; 

    let startWafu = "";
    let startGregorianMonth = startDate.getMonth() + 1;
    let endGregorianMonth = new Date(startDate.getTime() + (window.currentMonthDays - 1) * 86400000).getMonth() + 1;

    const cbShinto = document.getElementById("toggle-event-shinto");
    const cbBuddhism = document.getElementById("toggle-event-buddhism");
    const cbChurch = document.getElementById("toggle-event-church");
    const cbSonota = document.getElementById("toggle-event-sonota");

    const showShinto = cbShinto ? cbShinto.checked : true;
    const showBuddhism = cbBuddhism ? cbBuddhism.checked : true;
    const showChurch = cbChurch ? cbChurch.checked : true;
    const showSonota = cbSonota ? cbSonota.checked : true;

    for (let i = 0; i < window.currentMonthDays; i++) {
        const loopDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        const dateStr = formatDateStr(loopDate);
        const dbRow = koyomiDatabase[dateStr] || [];

        const absoluteSegment = (currentStartSegment + i * 4) % 120;
        const baseAngle = absoluteSegment * 3;

        const createArc = (id, r, angStart, angEnd) => {
            const p1 = polarToCartesian(cx, cy, r, angStart);
            const p2 = polarToCartesian(cx, cy, r, angEnd);
            const d = `M ${p1.x} ${p1.y} A ${r} ${r} 0 0 1 ${p2.x} ${p2.y}`;
            const path = document.createElementNS(svgNS, "path");
            path.setAttribute("id", id);
            path.setAttribute("d", d);
            if(textPathDefs) textPathDefs.appendChild(path);
        };

        const arcIdBase = `arc_${currentCycle}_${i}`;
        const angStart = baseAngle + 0.5;
        const angEnd = baseAngle + 11.5;

        createArc(`${arcIdBase}_24`, r24, angStart, angEnd);
        createArc(`${arcIdBase}_25`, r25, angStart, angEnd);
        createArc(`${arcIdBase}_26`, r26, angStart, angEnd);
        createArc(`${arcIdBase}_27`, r27, angStart, angEnd);
        createArc(`${arcIdBase}_28`, r28, angStart, angEnd);
        createArc(`${arcIdBase}_29`, r29, angStart, angEnd);
        
        createArc(`${arcIdBase}_30U_text`, r30U_text + stH.offsetRadius, angStart, angEnd);
        createArc(`${arcIdBase}_30M_text`, r30M_text + stZ.offsetRadius, angStart, angEnd);
        createArc(`${arcIdBase}_30L_text`, r30L_text + stI.offsetRadius, angStart, angEnd);

        const drawSingleText = (pathId, textContent, styleConfig, rVal, targetGroup) => {
            if (!textContent) return;
            const textObj = document.createElementNS(svgNS, "text");
            textObj.setAttribute("fill", styleConfig.fill);
            textObj.setAttribute("font-size", styleConfig.fontSize + "px");
            textObj.setAttribute("font-family", styleConfig.fontFamily);
            if (styleConfig.fontWeight === "bold") textObj.setAttribute("font-weight", "bold");
            textObj.setAttribute("opacity", styleConfig.opacity);
            
            if (styleConfig.strokeWidth > 0) {
                textObj.setAttribute("stroke", styleConfig.stroke);
                textObj.setAttribute("stroke-width", styleConfig.strokeWidth);
                textObj.setAttribute("stroke-linejoin", "round");
                textObj.setAttribute("paint-order", "stroke fill");
            }

            const textPath = document.createElementNS(svgNS, "textPath");
            textPath.setAttribute("href", `#${pathId}`);
            textPath.setAttribute("startOffset", "50%");
            textPath.setAttribute("text-anchor", "middle");
            textPath.textContent = textContent;

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
            cellData.split('・').forEach(item => {
                const trimmed = item.trim();
                if (trimmed) dailyEvents.push({ text: trimmed, st: styleConfig });
            });
        };

        if (showShinto) pushEvents(dbRow[10], window.layerSettings.eventShinto);
        if (showBuddhism) pushEvents(dbRow[11], window.layerSettings.eventBuddhism);
        if (showChurch) pushEvents(dbRow[12], window.layerSettings.eventChurch);
        if (showSonota) pushEvents(dbRow[13], window.layerSettings.eventSonota);

        let tracks = [[], [], [], [], [], []]; 
        if (dailyEvents.length > 0) {
            if (dailyEvents.length <= 6) {
                dailyEvents.forEach((ev, idx) => tracks[idx].push(ev));
            } else {
                let currentTrack = 0;
                dailyEvents.forEach((ev) => {
                    tracks[currentTrack].push(ev);
                    currentTrack = (currentTrack + 1) % 6;
                });
            }
        }

        const availableR = [r29, r28, r27, r26, r25, r24];
        const availableIds = [`${arcIdBase}_29`, `${arcIdBase}_28`, `${arcIdBase}_27`, `${arcIdBase}_26`, `${arcIdBase}_25`, `${arcIdBase}_24`];

        tracks.forEach((trackEvents, tIdx) => {
            if (trackEvents.length === 0) return;
            const rVal = availableR[tIdx];
            const pathId = availableIds[tIdx];

            const textObj = document.createElementNS(svgNS, "text");
            textObj.setAttribute("dy", "1.5"); 
            const textPath = document.createElementNS(svgNS, "textPath");
            textPath.setAttribute("href", `#${pathId}`);
            textPath.setAttribute("startOffset", "50%");
            textPath.setAttribute("text-anchor", "middle");

            let combinedLen = 0;
            trackEvents.forEach((ev, eIdx) => {
                const tspan = document.createElementNS(svgNS, "tspan");
                tspan.setAttribute("fill", ev.st.fill);
                tspan.setAttribute("font-size", ev.st.fontSize + "px");
                tspan.setAttribute("font-family", ev.st.fontFamily);
                tspan.setAttribute("opacity", ev.st.opacity);
                if (ev.st.fontWeight === "bold") tspan.setAttribute("font-weight", "bold");
                
                if (ev.st.strokeWidth > 0) {
                    tspan.setAttribute("stroke", ev.st.stroke);
                    tspan.setAttribute("stroke-width", ev.st.strokeWidth);
                    tspan.setAttribute("stroke-linejoin", "round");
                    tspan.setAttribute("paint-order", "stroke fill");
                }

                let txt = (eIdx > 0 ? " \u00A0・\u00A0 " : "") + ev.text;
                tspan.textContent = txt;
                textPath.appendChild(tspan);
                combinedLen += txt.length * ev.st.fontSize;
            });

            const maxLen = 2 * Math.PI * rVal * (11 / 360);
            if (combinedLen > maxLen * 0.9) {
                textPath.setAttribute("textLength", maxLen * 0.9);
                textPath.setAttribute("lengthAdjust", "spacingAndGlyphs");
            }
            textObj.appendChild(textPath);
            eventMixGroup.appendChild(textObj);
        });

        const ptDate = polarToCartesian(cx, cy, r30Upper + stG.offsetRadius, baseAngle + 1.5);
        const textDate = document.createElementNS(svgNS, "text");
        textDate.setAttribute("class", "layer-date-gregorian");
        textDate.setAttribute("x", ptDate.x);
        textDate.setAttribute("y", ptDate.y);
        textDate.setAttribute("text-anchor", "middle");
        textDate.setAttribute("dominant-baseline", "central");
        textDate.setAttribute("fill", stG.fill);
        textDate.setAttribute("font-size", stG.fontSize + "px");
        textDate.setAttribute("font-family", stG.fontFamily);
        if (stG.fontWeight === "bold") textDate.setAttribute("font-weight", "bold");
        textDate.setAttribute("opacity", stG.opacity);
        if (stG.strokeWidth > 0) {
            textDate.setAttribute("stroke", stG.stroke);
            textDate.setAttribute("stroke-width", stG.strokeWidth);
            textDate.setAttribute("stroke-linejoin", "round");
            textDate.setAttribute("paint-order", "stroke fill");
        }
        textDate.setAttribute("transform", `rotate(${baseAngle + 1.5}, ${ptDate.x}, ${ptDate.y})`);
        textDate.textContent = `${loopDate.getMonth() + 1}/${loopDate.getDate()}`;
        gregorianGroup.appendChild(textDate); 

        const ptDay = polarToCartesian(cx, cy, r30Lower + stW.offsetRadius, baseAngle + 1.5);
        const textDay = document.createElementNS(svgNS, "text");
        textDay.setAttribute("class", "layer-date-weekday");
        textDay.setAttribute("x", ptDay.x);
        textDay.setAttribute("y", ptDay.y);
        textDay.setAttribute("text-anchor", "middle");
        textDay.setAttribute("dominant-baseline", "central");
        textDay.setAttribute("fill", stW.fill);
        textDay.setAttribute("font-size", stW.fontSize + "px");
        textDay.setAttribute("font-family", stW.fontFamily);
        if (stW.fontWeight === "bold") textDay.setAttribute("font-weight", "bold");
        textDay.setAttribute("opacity", stW.opacity);
        if (stW.strokeWidth > 0) {
            textDay.setAttribute("stroke", stW.stroke);
            textDay.setAttribute("stroke-width", stW.strokeWidth);
            textDay.setAttribute("stroke-linejoin", "round");
            textDay.setAttribute("paint-order", "stroke fill");
        }
        textDay.setAttribute("transform", `rotate(${baseAngle + 1.5}, ${ptDay.x}, ${ptDay.y})`);
        textDay.textContent = daysStr[loopDate.getDay()];
        weekdayGroup.appendChild(textDay); 

        if (dbRow[1]) {
            const lunarMatch = dbRow[1].match(/旧暦.*?月(.+?)日/);
            const rawLunarDay = lunarMatch ? lunarMatch[1] : "";
            
            const lunarDay = rawLunarDay.replace("三十", "丗").replace("二十", "廿");
            
            let phaseKey = "normal";
            if (rawLunarDay === "一") phaseKey = "newMoon";
            else if (rawLunarDay === "八") phaseKey = "firstQuarter";
            else if (rawLunarDay === "十五") phaseKey = "fullMoon";
            else if (rawLunarDay === "二十三") phaseKey = "lastQuarter";

            const pst = stL.phases[phaseKey];
            const rLun = (r30In + r30Out)/2 + stL.offsetRadius;
            const ptLunar = polarToCartesian(cx, cy, rLun, baseAngle + 10.5);
            
            const lunarRadius = ((r30Out - r30In) * 0.4) * (pst.scale || 1);

            if (pst.shape !== "none") {
                const shapeG = document.createElementNS(svgNS, "g");
                shapeG.setAttribute("class", "layer-date-lunar");
                shapeG.setAttribute("transform", `rotate(${baseAngle + 10.5}, ${ptLunar.x}, ${ptLunar.y})`);

                let shapeEl = null;
                if (pst.shape === "circle") {
                    shapeEl = document.createElementNS(svgNS, "circle");
                    shapeEl.setAttribute("cx", ptLunar.x);
                    shapeEl.setAttribute("cy", ptLunar.y);
                    shapeEl.setAttribute("r", lunarRadius);
                } else if (pst.shape === "rect") {
                    shapeEl = document.createElementNS(svgNS, "rect");
                    const size = lunarRadius * 1.8;
                    shapeEl.setAttribute("x", ptLunar.x - size/2);
                    shapeEl.setAttribute("y", ptLunar.y - size/2);
                    shapeEl.setAttribute("width", size);
                    shapeEl.setAttribute("height", size);
                    shapeEl.setAttribute("rx", 2);
                } else if (pst.shape === "triangle") {
                    shapeEl = document.createElementNS(svgNS, "polygon");
                    const p1 = polarToCartesian(ptLunar.x, ptLunar.y, lunarRadius*1.1, 0);
                    const p2 = polarToCartesian(ptLunar.x, ptLunar.y, lunarRadius*1.1, 120);
                    const p3 = polarToCartesian(ptLunar.x, ptLunar.y, lunarRadius*1.1, 240);
                    shapeEl.setAttribute("points", `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`);
                } else if (pst.shape === "star") {
                    shapeEl = document.createElementNS(svgNS, "polygon");
                    let pts = "";
                    for(let k=0; k<10; k++) {
                        const radius = k%2 === 0 ? lunarRadius*1.2 : lunarRadius*0.5;
                        const p = polarToCartesian(ptLunar.x, ptLunar.y, radius, k * 36);
                        pts += `${p.x},${p.y} `;
                    }
                    shapeEl.setAttribute("points", pts.trim());
                }

                if (shapeEl) {
                    shapeEl.setAttribute("fill", pst.bgFill);
                    shapeEl.setAttribute("opacity", stL.opacity);
                    if (pst.shapeStrokeWidth > 0) {
                        shapeEl.setAttribute("stroke", pst.shapeStroke);
                        shapeEl.setAttribute("stroke-width", pst.shapeStrokeWidth);
                    }
                    shapeG.appendChild(shapeEl);
                    lunarGroup.appendChild(shapeG);
                }
            }

            const textLunar = document.createElementNS(svgNS, "text");
            textLunar.setAttribute("class", "layer-date-lunar");
            textLunar.setAttribute("x", ptLunar.x);
            textLunar.setAttribute("y", ptLunar.y);
            textLunar.setAttribute("text-anchor", "middle");
            textLunar.setAttribute("dominant-baseline", "central");
            textLunar.setAttribute("fill", pst.fill);
            textLunar.setAttribute("font-size", lunarDay.length > 1 ? (stL.fontSize * 0.7) + "px" : stL.fontSize + "px");
            textLunar.setAttribute("font-family", stL.fontFamily);
            if (stL.fontWeight === "bold") textLunar.setAttribute("font-weight", "bold");
            textLunar.setAttribute("opacity", stL.opacity);
            textLunar.setAttribute("transform", `rotate(${baseAngle + 10.5}, ${ptLunar.x}, ${ptLunar.y})`);
            
            textLunar.textContent = lunarDay; 
            lunarGroup.appendChild(textLunar);

            if (i === 0) {
                const wafuMatch = dbRow[1].match(/（(.+?)）/);
                if (wafuMatch) startWafu = wafuMatch[1];
            }
        }

        const drawOuterText = (eventName, isSekki, classStr, stOut, angleOffset) => {
            if (!eventName) return;
            const lineAngle = baseAngle + angleOffset;
            const p1 = polarToCartesian(cx, cy, r30Out, lineAngle);
            const p2 = polarToCartesian(cx, cy, r30Out + (isSekki ? 12 : 8), lineAngle);
            
            const outLine = document.createElementNS(svgNS, "line");
            outLine.setAttribute("class", classStr);
            outLine.setAttribute("x1", p1.x);
            outLine.setAttribute("y1", p1.y);
            outLine.setAttribute("x2", p2.x);
            outLine.setAttribute("y2", p2.y);
            outLine.setAttribute("stroke", "#2c3e50");
            outLine.setAttribute("stroke-width", isSekki ? "1.5" : "0.5");
            if(outerSeasonLayer) outerSeasonLayer.appendChild(outLine);

            const rText = r30Out + (isSekki ? 45 : 20) + stOut.offsetRadius;
            const ptTextOut = polarToCartesian(cx, cy, rText, lineAngle);
            const outText = document.createElementNS(svgNS, "text");
            outText.setAttribute("class", classStr);
            outText.setAttribute("fill", stOut.fill);
            outText.setAttribute("font-size", stOut.fontSize + "px");
            outText.setAttribute("font-family", stOut.fontFamily);
            if (stOut.fontWeight === "bold") outText.setAttribute("font-weight", "bold");
            outText.setAttribute("opacity", stOut.opacity);
            if (stOut.strokeWidth > 0) {
                outText.setAttribute("stroke", stOut.stroke);
                outText.setAttribute("stroke-width", stOut.strokeWidth);
                outText.setAttribute("stroke-linejoin", "round");
                outText.setAttribute("paint-order", "stroke fill");
            }
            outText.setAttribute("dominant-baseline", "middle");
            outText.setAttribute("text-anchor", "start");
            outText.setAttribute("transform", `rotate(${lineAngle}, ${ptTextOut.x}, ${ptTextOut.y})`);
            outText.setAttribute("x", ptTextOut.x);
            outText.setAttribute("y", ptTextOut.y);
            outText.textContent = eventName;
            if(outerSeasonLayer) outerSeasonLayer.appendChild(outText);
        };

        if (dbRow[2]) drawOuterText(dbRow[2], true, "layer-sekki", window.layerSettings.sekki, 0);
        if (dbRow[3]) drawOuterText(dbRow[3], false, "layer-kou", window.layerSettings.kou, dbRow[2] ? 1.5 : 0);
    }

    const stWafu = window.layerSettings.wafuText;
    const stGreText = window.layerSettings.gregorianText;

    const wafuTextLayer = document.getElementById("layer-wafu-text");
    if(wafuTextLayer) wafuTextLayer.innerHTML = "";
    
    if(wafuTextLayer) {
        const tspanOld = document.createElementNS(svgNS, "text");
        tspanOld.setAttribute("class", "layer-wafu-text");
        tspanOld.setAttribute("x", cx + 860);
        tspanOld.setAttribute("y", cy - 850 + stWafu.offsetRadius);
        tspanOld.setAttribute("text-anchor", "end");
        tspanOld.setAttribute("fill", stWafu.fill);
        tspanOld.setAttribute("font-size", stWafu.fontSize + "px");
        tspanOld.setAttribute("font-family", stWafu.fontFamily);
        tspanOld.setAttribute("opacity", stWafu.opacity);
        if(stWafu.fontWeight === "bold") tspanOld.setAttribute("font-weight", "bold");
        if (stWafu.strokeWidth > 0) {
            tspanOld.setAttribute("stroke", stWafu.stroke);
            tspanOld.setAttribute("stroke-width", stWafu.strokeWidth);
            tspanOld.setAttribute("stroke-linejoin", "round");
            tspanOld.setAttribute("paint-order", "stroke fill");
        }
        
        tspanOld.setAttribute("transform", `rotate(${-globalRotation}, ${cx}, ${cy})`);
        
        tspanOld.textContent = startWafu ? `${startWafu}（旧暦）` : "旧暦取得中";
        wafuTextLayer.appendChild(tspanOld);
        
        const tspanNew = document.createElementNS(svgNS, "text");
        tspanNew.setAttribute("class", "layer-gregorian-text");
        const wafuList = ['睦月','如月','弥生','卯月','皐月','水無月','文月','葉月','長月','神無月','霜月','師走'];
        const newWafuStr = startGregorianMonth === endGregorianMonth 
            ? wafuList[startGregorianMonth - 1] 
            : `${wafuList[startGregorianMonth - 1]} ／ ${wafuList[endGregorianMonth - 1]}`;
        
        tspanNew.setAttribute("x", cx + 860);
        tspanNew.setAttribute("y", cy - 850 + (stWafu.fontSize * 0.9) + stGreText.offsetRadius);
        tspanNew.setAttribute("text-anchor", "end");
        tspanNew.setAttribute("fill", stGreText.fill);
        tspanNew.setAttribute("font-size", stGreText.fontSize + "px");
        tspanNew.setAttribute("font-family", stGreText.fontFamily);
        tspanNew.setAttribute("opacity", stGreText.opacity);
        if(stGreText.fontWeight === "bold") tspanNew.setAttribute("font-weight", "bold");
        if (stGreText.strokeWidth > 0) {
            tspanNew.setAttribute("stroke", stGreText.stroke);
            tspanNew.setAttribute("stroke-width", stGreText.strokeWidth);
            tspanNew.setAttribute("stroke-linejoin", "round");
            tspanNew.setAttribute("paint-order", "stroke fill");
        }
        
        tspanNew.setAttribute("transform", `rotate(${-globalRotation}, ${cx}, ${cy})`);
        
        tspanNew.textContent = `${newWafuStr}（新暦）`;
        wafuTextLayer.appendChild(tspanNew);
    }
}
