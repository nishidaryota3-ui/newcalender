
// draw.js (SVG描画モジュール)

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
