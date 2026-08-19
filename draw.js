// draw.js (SVG描画モジュール)

function drawLunarShadow(cycleStartTimeMs) {
  shadowLayer.innerHTML = "";
  const R = concentricRings;
  if (R.length < 30) return;

  const rMin = R[0];
  const rMax = R[29];

  for (let i = 0; i < 30; i++) {
    const dTime = cycleStartTimeMs + i * 24 * 60 * 60 * 1000;
    
    // ▼修正箇所：存在しない関数を削除し、直接計算する式に変更▼
    const elongation = (i / 29.53059) * 360; 
    
    const illumination = (1 - Math.cos(elongation * Math.PI / 180)) / 2;

    const absoluteSegment = (currentStartSegment + i * 4) % 120;
    const baseAngle = absoluteSegment * 3;
    const angStart = baseAngle;
    const angEnd = baseAngle + 12;

    const p1 = polarToCartesian(cx, cy, rMin, angStart);
    const p2 = polarToCartesian(cx, cy, rMax, angStart);
    const p3 = polarToCartesian(cx, cy, rMax, angEnd);
    const p4 = polarToCartesian(cx, cy, rMin, angEnd);

    const opacity = (1 - illumination) * 0.8;

    const poly = document.createElementNS(svgNS, "polygon");
    poly.setAttribute("points", `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`);
    poly.setAttribute("fill", "black");
    poly.setAttribute("opacity", opacity.toString());
    shadowLayer.appendChild(poly);
  }
}

function drawDynamicLines() {
  linesLayer.innerHTML = "";
  
  // ▼ ユーザー設定から区切り線の透明度を読み込む ▼
  linesLayer.setAttribute("opacity", userSettings.linesOpacity);

  const rMin = concentricRings[0];
  const rMax = concentricRings[concentricRings.length - 1];

  const ringDateInner = document.createElementNS(svgNS, "circle");
  ringDateInner.setAttribute("cx", cx); ringDateInner.setAttribute("cy", cy);
  ringDateInner.setAttribute("r", concentricRings[29]);
  ringDateInner.setAttribute("fill", "none"); ringDateInner.setAttribute("stroke", "#d4af37");
  ringDateInner.setAttribute("stroke-width", "0.5");
  linesLayer.appendChild(ringDateInner);

  for (let i = 0; i < 120; i++) {
    const rStart = (i % 4 === 0) ? rMin : concentricRings[23];
    const p1 = polarToCartesian(cx, cy, rStart, i * 3);
    const p2 = polarToCartesian(cx, cy, rMax, i * 3);
    
    const line = document.createElementNS(svgNS, "line");
    line.setAttribute("x1", p1.x); line.setAttribute("y1", p1.y);
    line.setAttribute("x2", p2.x); line.setAttribute("y2", p2.y);
    line.setAttribute("stroke", "#555");
    line.setAttribute("stroke-width", (i % 4 === 0) ? "0.8" : "0.3");
    
    // 0:00 の線だけは少し色を変えて強調する
    if (i % 4 === 0) {
      line.setAttribute("stroke", "#888");
      line.setAttribute("stroke-dasharray", "2,2");
    }
    linesLayer.appendChild(line);
  }
}

function drawTideGraph(cycleStartTimeMs) {
  tideLayer.innerHTML = "";
  const R = concentricRings;
  if(R.length < 24) return;
  
  const cycleEndMs = cycleStartTimeMs + 30 * 24 * 60 * 60 * 1000;
  const cyclePoints = highLowTidePoints.filter(p => p.time >= cycleStartTimeMs && p.time <= cycleEndMs);
  if(cyclePoints.length < 2) return;

  const minTide = -1.5, maxTide = 7.5;
  const rMin = R[0], rMax = R[23];
  
  const getRForTide = (tide) => {
    let t = Math.max(minTide, Math.min(maxTide, tide));
    return rMin + ((t - minTide) / (maxTide - minTide)) * (rMax - rMin);
  };

  for (let t = Math.ceil(minTide); t <= Math.floor(maxTide); t++) {
    const r = getRForTide(t);
    const c = document.createElementNS(svgNS, "circle");
    c.setAttribute("cx", cx); c.setAttribute("cy", cy);
    c.setAttribute("r", r);
    c.setAttribute("fill", "none");
    c.setAttribute("stroke", t === 0 ? "#888" : "#444");
    c.setAttribute("stroke-width", t === 0 ? "0.5" : "0.2");
    if(t !== 0) c.setAttribute("stroke-dasharray", "2,2");
    tideLayer.appendChild(c);

    const txt = document.createElementNS(svgNS, "text");
    txt.setAttribute("x", cx + 2); txt.setAttribute("y", cy - r + 8);
    txt.setAttribute("fill", "#666"); txt.setAttribute("font-size", "8px");
    txt.textContent = t + "ft";
    tideLayer.appendChild(txt);
  }

  let pathD = "";
  for (let i = 0; i < cyclePoints.length; i++) {
    const pt = cyclePoints[i];
    const diffHours = (pt.time - cycleStartTimeMs) / (60 * 60 * 1000);
    const segmentIndex = (currentStartSegment + diffHours * (4/24)) % 120;
    const angle = segmentIndex * 3;
    const r = getRForTide(pt.tide);
    const coords = polarToCartesian(cx, cy, r, angle);
    
    if(i === 0) {
      pathD += `M ${coords.x} ${coords.y} `;
    } else {
      const prev = cyclePoints[i-1];
      const diffHPrev = (prev.time - cycleStartTimeMs) / (60 * 60 * 1000);
      const segPrev = (currentStartSegment + diffHPrev * (4/24)) % 120;
      let anglePrev = segPrev * 3;
      if(angle < anglePrev) angle += 360; 
      
      const cp1Angle = anglePrev + (angle - anglePrev) * 0.33;
      const cp2Angle = anglePrev + (angle - anglePrev) * 0.67;
      const rPrev = getRForTide(prev.tide);
      
      const cp1 = polarToCartesian(cx, cy, rPrev, cp1Angle);
      const cp2 = polarToCartesian(cx, cy, r, cp2Angle);
      
      pathD += `C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${coords.x} ${coords.y} `;
    }
  }

  const wavePath = document.createElementNS(svgNS, "path");
  wavePath.setAttribute("d", pathD);
  wavePath.setAttribute("fill", "none");
  
  // ▼ ユーザー設定から色と太さを読み込む ▼
  wavePath.setAttribute("stroke", userSettings.tideColor);
  wavePath.setAttribute("stroke-width", userSettings.tideWidth);
  tideLayer.appendChild(wavePath);
}

function drawRainfallGraph(cycleStartTimeMs) {
  rainfallLayer.innerHTML = "";
  const rBase = concentricRings[29];
  const maxRain = 30; 
  
  for(let v = 5; v <= maxRain; v += 5) {
      const rGuide = rBase - (v / maxRain) * 120;
      const c = document.createElementNS(svgNS, "circle");
      c.setAttribute("cx", cx); c.setAttribute("cy", cy);
      c.setAttribute("r", rGuide);
      c.setAttribute("fill", "none");
      c.setAttribute("stroke", "#334455");
      c.setAttribute("stroke-width", "0.2");
      c.setAttribute("stroke-dasharray", "1,2");
      rainfallLayer.appendChild(c);
      
      const txt = document.createElementNS(svgNS, "text");
      txt.setAttribute("x", cx + 2); txt.setAttribute("y", cy - rGuide + 8);
      txt.setAttribute("fill", "#557799"); txt.setAttribute("font-size", "6px");
      txt.textContent = v + "mm";
      rainfallLayer.appendChild(txt);
  }

  for(let h = 0; h < 720; h++) {
      const rain = apiRainData[h];
      if(!rain || rain <= 0) continue;
      
      const segment = (currentStartSegment + h * (4/24)) % 120;
      const angle = segment * 3;
      const rainLen = Math.min((rain / maxRain) * 120, 120);
      
      const p1 = polarToCartesian(cx, cy, rBase, angle);
      const p2 = polarToCartesian(cx, cy, rBase - rainLen, angle);
      
      const line = document.createElementNS(svgNS, "line");
      line.setAttribute("x1", p1.x); line.setAttribute("y1", p1.y);
      line.setAttribute("x2", p2.x); line.setAttribute("y2", p2.y);
      line.setAttribute("stroke", "rgba(59, 130, 246, 0.6)");
      line.setAttribute("stroke-width", "1.5");
      rainfallLayer.appendChild(line);
  }
}

function drawDailyRainStats(startDate) {
  for (let i = 0; i < 30; i++) {
      const d = new Date(startDate.getTime() + i * 86400000);
      const dateKey = formatDateStr(d);
      const rain = localRainData[dateKey];
      if(rain === undefined || rain <= 0) continue;
      
      const absoluteSegment = (currentStartSegment + i * 4) % 120;
      const baseAngle = absoluteSegment * 3;
      
      const pText = polarToCartesian(cx, cy, concentricRings[29] - 130, baseAngle + 6);
      
      const txt = document.createElementNS(svgNS, "text");
      txt.setAttribute("x", pText.x); txt.setAttribute("y", pText.y);
      txt.setAttribute("text-anchor", "middle"); txt.setAttribute("dominant-baseline", "central");
      txt.setAttribute("fill", "#60a5fa"); txt.setAttribute("font-size", "7px");
      txt.setAttribute("font-weight", "bold");
      
      let rot = baseAngle + 6;
      if (rot > 90 && rot < 270) rot += 180;
      txt.setAttribute("transform", `rotate(${rot}, ${pText.x}, ${pText.y})`);
      txt.textContent = `💧 ${rain}mm`;
      
      rainfallLayer.appendChild(txt);
  }
}

function drawLunarMansions(cycleStartTimeMs) {
  lunarMansionLayer.innerHTML = "";
  const rText = concentricRings[29] + 25;
  const rConstellation = concentricRings[29] + 45;
  
  const startDay = new Date(cycleStartTimeMs);
  let baseLunarLon = 0;
  let dObjStr = formatDateStr(startDay);
  const dbRow = koyomiDatabase[dObjStr];
  if(dbRow && dbRow[1]) {
      const match = dbRow[1].match(/旧暦.*?月(.+?)日/);
      if(match) {
          const lunarDay = kanjiToNum(match[1]);
          baseLunarLon = ((lunarDay - 1) / 29.53) * 360; 
      }
  }

  for(let i = 0; i < 30; i++) {
      const dTime = cycleStartTimeMs + i * 86400000;
      const currentLunarLon = (baseLunarLon + (i / 29.53)*360) % 360;
      const mansionIdx = Math.floor(currentLunarLon / (360 / 27));
      
      // ▼修正箇所：lunarMansions に名前を統一▼
      const mData = lunarMansions[mansionIdx]; 
      
      // もし mData が未定義の場合はスキップしてエラーを防ぐ
      if (!mData) continue;
      
      const absoluteSegment = (currentStartSegment + i * 4) % 120;
      const angle = absoluteSegment * 3 + 6; 
      
      const ptText = polarToCartesian(cx, cy, rText, angle);
      const text = document.createElementNS(svgNS, "text");
      text.setAttribute("x", ptText.x); text.setAttribute("y", ptText.y);
      text.setAttribute("fill", mData.color);
      text.setAttribute("font-size", "10px");
      text.setAttribute("font-family", "'Shippori Mincho', serif");
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "central");
      
      let rot = angle;
      if (rot > 90 && rot < 270) rot += 180;
      text.setAttribute("transform", `rotate(${rot}, ${ptText.x}, ${ptText.y})`);
      text.textContent = mData.name;
      lunarMansionLayer.appendChild(text);

      const ptConst = polarToCartesian(cx, cy, rConstellation, angle);
      const gConst = document.createElementNS(svgNS, "g");
      gConst.setAttribute("transform", `translate(${ptConst.x}, ${ptConst.y}) rotate(${angle})`);
      
      const stars = [
          {x: 0, y: -4}, {x: -3, y: 3}, {x: 3, y: 3}, {x: 0, y: 8}
      ];
      
      for(let j=0; j<stars.length-1; j++) {
          const line = document.createElementNS(svgNS, "line");
          line.setAttribute("x1", stars[j].x); line.setAttribute("y1", stars[j].y);
          line.setAttribute("x2", stars[j+1].x); line.setAttribute("y2", stars[j+1].y);
          line.setAttribute("stroke", mData.color);
          line.setAttribute("stroke-width", "0.5");
          line.setAttribute("opacity", "0.5");
          gConst.appendChild(line);
      }
      
      stars.forEach(s => {
          const circle = document.createElementNS(svgNS, "circle");
          circle.setAttribute("cx", s.x); circle.setAttribute("cy", s.y);
          circle.setAttribute("r", "1.2");
          circle.setAttribute("fill", mData.color);
          gConst.appendChild(circle);
      });
      lunarMansionLayer.appendChild(gConst);
  }
}

function renderSavedData() {
  dataLayer.innerHTML = "";
  for (let key in cellData) {
      const parts = key.split('_');
      if (parts.length === 2) {
          const seg = parseInt(parts[0]);
          const ring = parseInt(parts[1]);
          const colorInfo = cellData[key];
          
          if (seg >= 0 && seg < 120 && ring >= 0 && ring < concentricRings.length - 1) {
              const rIn = concentricRings[ring];
              const rOut = concentricRings[ring + 1];
              const angStart = seg * 3;
              const angEnd = (seg + 1) * 3;

              const p1 = polarToCartesian(cx, cy, rIn, angStart);
              const p2 = polarToCartesian(cx, cy, rOut, angStart);
              const p3 = polarToCartesian(cx, cy, rOut, angEnd);
              const p4 = polarToCartesian(cx, cy, rIn, angEnd);

              const path = document.createElementNS(svgNS, "path");
              const d = `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} A ${rOut} ${rOut} 0 0 1 ${p3.x} ${p3.y} L ${p4.x} ${p4.y} A ${rIn} ${rIn} 0 0 0 ${p1.x} ${p1.y} Z`;
              
              path.setAttribute("d", d);
              path.setAttribute("fill", colorInfo.color);
              path.setAttribute("opacity", colorInfo.opacity);
              path.setAttribute("stroke", "rgba(255,255,255,0.2)");
              path.setAttribute("stroke-width", "0.5");
              path.style.pointerEvents = "none";
              dataLayer.appendChild(path);
          }
      }
  }
}

function drawTimeLabels() {
  const rTime = concentricRings[0] - 15; 
  for (let i = 0; i < 120; i++) {
    if (i % 4 !== 0) continue;
    const hour = (i % 24) / 4 * 6; 
    
    const absoluteSegment = (currentStartSegment + i) % 120;
    const angle = absoluteSegment * 3;
    const pt = polarToCartesian(cx, cy, rTime, angle);
    
    const text = document.createElementNS(svgNS, "text");
    text.setAttribute("x", pt.x); text.setAttribute("y", pt.y);
    text.setAttribute("text-anchor", "middle"); text.setAttribute("dominant-baseline", "central");
    text.setAttribute("fill", "#888"); text.setAttribute("font-size", "7px");
    
    let rot = angle;
    if (rot > 90 && rot < 270) rot += 180; 
    text.setAttribute("transform", `rotate(${rot}, ${pt.x}, ${pt.y})`);
    
    text.textContent = hour;
    linesLayer.appendChild(text);
  }
}

function drawKoyomiEvents(startDate) {
  let dateLayer = document.getElementById("solar-dates-layer");
  if(dateLayer) { dateLayer.innerHTML = ""; } 
  else {
    dateLayer = document.createElementNS(svgNS, "g");
    dateLayer.setAttribute("id", "solar-dates-layer");
    masterGroup.appendChild(dateLayer); 
  }

  // ▼ カテゴリごとに透明な専用フォルダを作成し、表示・非表示を制御する機能 ▼
  const getOrCreateLayer = (id) => {
    let layer = document.getElementById(id);
    if (!layer) {
      layer = document.createElementNS(svgNS, "g");
      layer.setAttribute("id", id);
      dateLayer.appendChild(layer);
    } else {
      layer.innerHTML = "";
    }
    // globals.jsのsettingsを見て、非表示なら display = "none" にする
    layer.style.display = userSettings.layers[id] === false ? "none" : "inline";
    return layer;
  };

  // 各種レイヤーフォルダの準備
  const layerShinji = getOrCreateLayer("layerShinji");
  const layerButsuji = getOrCreateLayer("layerButsuji");
  const layerKyoukai = getOrCreateLayer("layerKyoukai");
  const layerIslam = getOrCreateLayer("layerIslam");
  const layerSonota = getOrCreateLayer("layerSonota");
  const layerHoliday = getOrCreateLayer("layerHoliday");
  const layerZassetsu = getOrCreateLayer("layerZassetsu");
  const layerLunar = getOrCreateLayer("layerLunar"); 

  outerSeasonLayer.innerHTML = ""; 
  textPathDefs.innerHTML = "";

  const R = concentricRings;
  if(R.length < 30) return;

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

  const daysStr = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  let startWafu = "";
  let startGregorianMonth = startDate.getMonth() + 1;
  let endGregorianMonth = new Date(startDate.getTime() + 29 * 86400000).getMonth() + 1;

  for (let i = 0; i < 30; i++) {
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
        path.setAttribute("id", id); path.setAttribute("d", d);
        textPathDefs.appendChild(path);
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
    createArc(`${arcIdBase}_30L`, r30Lower, angStart, angEnd);
    createArc(`${arcIdBase}_30U`, r30Upper, angStart, angEnd);

    // テキストを指定されたフォルダ（parentLayer）に描画する
    const drawCurvedText = (pathId, textContent, color, fontSize, isBold = false, rVal, parentLayer) => {
        if (!textContent) return;
        const textObj = document.createElementNS(svgNS, "text");
        textObj.setAttribute("fill", color);
        textObj.setAttribute("font-size", fontSize);
        textObj.setAttribute("font-family", "'Shippori Mincho', serif");
        
        // ▼ 文字の上下の中心をパスに合わせる ▼
        textObj.setAttribute("dominant-baseline", "central");
        
        if (isBold) textObj.setAttribute("font-weight", "bold");
        
        const textPath = document.createElementNS(svgNS, "textPath");
        textPath.setAttribute("href", `#${pathId}`);
        textPath.setAttribute("startOffset", "50%"); 
        textPath.setAttribute("text-anchor", "middle");
        textPath.textContent = textContent;

        const maxLen = 2 * Math.PI * rVal * (11 / 360); 
        const estimatedTextLen = textContent.length * parseFloat(fontSize);
        if (estimatedTextLen > maxLen * 0.9) {
            textPath.setAttribute("textLength", maxLen * 0.9);
            textPath.setAttribute("lengthAdjust", "spacingAndGlyphs");
        }
        
        textObj.appendChild(textPath);
        parentLayer.appendChild(textObj);
    };

    // それぞれのテキストを専用フォルダに振り分ける
    drawCurvedText(`${arcIdBase}_24`, dbRow[14], "#727171", "6.5px", false, r24, layerSonota); 
    drawCurvedText(`${arcIdBase}_25`, dbRow[13], "#2c3e50", "6.5px", false, r25, layerIslam); 
    drawCurvedText(`${arcIdBase}_26`, dbRow[12], "#2c3e50", "6.5px", false, r26, layerKyoukai); 
    drawCurvedText(`${arcIdBase}_27`, dbRow[11], "#2c3e50", "6.5px", false, r27, layerButsuji); 

    if (dbRow[10]) {
        const shintoEvents = dbRow[10].split('・');
        const shinto28 = shintoEvents.filter((_, idx) => idx % 2 === 0).join(' ｜ ');
        const shinto29 = shintoEvents.filter((_, idx) => idx % 2 !== 0).join(' ｜ ');
        drawCurvedText(`${arcIdBase}_28`, shinto28, "#2c3e50", "6.5px", false, r28, layerShinji);
        drawCurvedText(`${arcIdBase}_29`, shinto29, "#2c3e50", "6.5px", false, r29, layerShinji);
    }

    drawCurvedText(`${arcIdBase}_30U`, dbRow[5], "#d25b4e", "8px", true, r30Upper, layerHoliday); 
    drawCurvedText(`${arcIdBase}_30L`, dbRow[4], "#555555", "7px", false, r30Lower, layerZassetsu);

    // 日付と曜日の描画（layerLunarフォルダへ）
    const ptDate = polarToCartesian(cx, cy, r30Upper, baseAngle + 1.5);
    const ptDay = polarToCartesian(cx, cy, r30Lower, baseAngle + 1.5);
    
    const textDate = document.createElementNS(svgNS, "text");
    textDate.setAttribute("x", ptDate.x); textDate.setAttribute("y", ptDate.y);
    textDate.setAttribute("text-anchor", "middle"); textDate.setAttribute("dominant-baseline", "central");
    textDate.setAttribute("fill", "#727171"); textDate.setAttribute("font-size", "9px");
    textDate.setAttribute("font-weight", "bold");
    textDate.setAttribute("transform", `rotate(${baseAngle + 1.5}, ${ptDate.x}, ${ptDate.y})`);
    textDate.textContent = `${loopDate.getMonth() + 1}/${loopDate.getDate()}`;
    layerLunar.appendChild(textDate);

    const textDay = document.createElementNS(svgNS, "text");
    textDay.setAttribute("x", ptDay.x); textDay.setAttribute("y", ptDay.y);
    textDay.setAttribute("text-anchor", "middle"); textDay.setAttribute("dominant-baseline", "central");
    textDay.setAttribute("fill", "#b0b0b0"); textDay.setAttribute("font-size", "6px");
    textDay.setAttribute("transform", `rotate(${baseAngle + 1.5}, ${ptDay.x}, ${ptDay.y})`);
    textDay.textContent = daysStr[loopDate.getDay()];
    layerLunar.appendChild(textDay);

    // 旧暦（月齢）の丸とテキストの描画（layerLunarフォルダへ）
    if (dbRow[1]) {
        const lunarMatch = dbRow[1].match(/旧暦.*?月(.+?)日/);
        const lunarDay = lunarMatch ? lunarMatch[1] : "";
        const isNewMoon = lunarDay === "一"; 

        const ptLunar = polarToCartesian(cx, cy, (r30In + r30Out)/2, baseAngle + 10.5);
        const lunarRadius = (r30Out - r30In) * 0.4;
        
        const circle = document.createElementNS(svgNS, "circle");
        circle.setAttribute("cx", ptLunar.x); circle.setAttribute("cy", ptLunar.y);
        circle.setAttribute("r", lunarRadius);
        circle.setAttribute("fill", "none");
        circle.setAttribute("stroke", isNewMoon ? "#d4af37" : "#555555");
        circle.setAttribute("stroke-width", isNewMoon ? "1.2" : "0.8");
        layerLunar.appendChild(circle); 

        const textLunar = document.createElementNS(svgNS, "text");
        textLunar.setAttribute("x", ptLunar.x); textLunar.setAttribute("y", ptLunar.y);
        textLunar.setAttribute("text-anchor", "middle"); textLunar.setAttribute("dominant-baseline", "central");
        textLunar.setAttribute("fill", isNewMoon ? "#d4af37" : "#2c3e50");
        textLunar.setAttribute("font-size", lunarDay.length > 1 ? "8px" : "11px");
        textLunar.setAttribute("font-family", "'Shippori Mincho', serif");
        if(isNewMoon) textLunar.setAttribute("font-weight", "bold");
        textLunar.setAttribute("transform", `rotate(${baseAngle + 10.5}, ${ptLunar.x}, ${ptLunar.y})`);
        textLunar.textContent = isNewMoon ? "新月" : lunarDay;
        layerLunar.appendChild(textLunar); 

        if (i === 0) {
            const wafuMatch = dbRow[1].match(/（(.+?)）/);
            if (wafuMatch) startWafu = wafuMatch[1];
        }
    }

    // 外周（二十四節気など）の描画
    if (dbRow[2] || dbRow[3]) {
        const is24 = !!dbRow[2];
        const textStr = dbRow[2] || dbRow[3];
        const rOuter = R[R.length - 1];

        const lineP1 = polarToCartesian(cx, cy, rOuter, baseAngle);
        const lineP2 = polarToCartesian(cx, cy, rOuter + 10, baseAngle);
        const outLine = document.createElementNS(svgNS, "line");
        outLine.setAttribute("x1", lineP1.x); outLine.setAttribute("y1", lineP1.y);
        outLine.setAttribute("x2", lineP2.x); outLine.setAttribute("y2", lineP2.y);
        outLine.setAttribute("stroke", "#555555");
        outLine.setAttribute("stroke-width", "0.5");
        outerSeasonLayer.appendChild(outLine);

        const tP = polarToCartesian(cx, cy, rOuter + 15, baseAngle);
        const outText = document.createElementNS(svgNS, "text");
        outText.setAttribute("x", tP.x); outText.setAttribute("y", tP.y);
        outText.setAttribute("fill", "#2c3e50");
        outText.setAttribute("font-size", is24 ? "12px" : "8px");
        outText.setAttribute("font-family", "'Shippori Mincho', serif");
        if(is24) outText.setAttribute("font-weight", "bold");
        outText.setAttribute("text-anchor", "start");
        outText.setAttribute("dominant-baseline", "central");
        
        let rot = baseAngle;
        if (rot > 90 && rot < 270) {
            rot += 180;
            outText.setAttribute("text-anchor", "end");
        }
        outText.setAttribute("transform", `rotate(${rot}, ${tP.x}, ${tP.y})`);
        outText.textContent = textStr;
        outerSeasonLayer.appendChild(outText);
    }
  }

  // 右上の和風月名描画
  let wafuTextLayer = document.getElementById("wafu-text-layer");
  if(wafuTextLayer) { wafuTextLayer.innerHTML = ""; }
  else {
    wafuTextLayer = document.createElementNS(svgNS, "text");
    wafuTextLayer.setAttribute("id", "wafu-text-layer");
    svg.appendChild(wafuTextLayer);
  }
  
  // ▼ 位置を右上へ避難させる ▼
  wafuTextLayer.setAttribute("x", cx + 860); 
  wafuTextLayer.setAttribute("y", cy - 850); 
  wafuTextLayer.setAttribute("text-anchor", "end");
  wafuTextLayer.setAttribute("font-family", "'Shippori Mincho', serif");

  const tspanOld = document.createElementNS(svgNS, "tspan");
  tspanOld.setAttribute("x", cx + 860);
  tspanOld.setAttribute("dy", "0");
  tspanOld.setAttribute("fill", "#d4af37");
  tspanOld.setAttribute("font-size", "70px");
  tspanOld.setAttribute("font-weight", "bold");
  tspanOld.textContent = startWafu ? `${startWafu}（旧暦）` : "旧暦取得中";
  wafuTextLayer.appendChild(tspanOld);

  const tspanNew = document.createElementNS(svgNS, "tspan");
  const wafuList = ['睦月','如月','弥生','卯月','皐月','水無月','文月','葉月','長月','神無月','霜月','師走'];
  
  // ▼ 新暦の区切りを「／」に変更 ▼
  const newWafuStr = startGregorianMonth === endGregorianMonth 
      ? wafuList[startGregorianMonth - 1] 
      : `${wafuList[startGregorianMonth - 1]} ／ ${wafuList[endGregorianMonth - 1]}`;
  
  tspanNew.setAttribute("x", cx + 860);
  tspanNew.setAttribute("dy", "60"); 
  tspanNew.setAttribute("fill", "#b0b0b0");
  tspanNew.setAttribute("font-size", "40px");
  tspanNew.textContent = `${newWafuStr}（新暦）`;
  wafuTextLayer.appendChild(tspanNew);
}
