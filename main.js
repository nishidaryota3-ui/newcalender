
// main.js (司令塔・初期化モジュール)

function formatDateStr(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

async function fetchMeteoData(startDateMs) {
    loader.style.display = 'flex';
    const dStart = new Date(startDateMs);
    const dEnd = new Date(startDateMs + 30 * 86400000); 
    const startStr = formatDateStr(dStart);
    const endStr = formatDateStr(dEnd);
    
    apiRainData = new Array(720).fill(null);
    const isHistorical = dEnd.getTime() < Date.now() - (5 * 86400000);
    const rainApiUrl = isHistorical 
        ? `https://archive-api.open-meteo.com/v1/archive?latitude=${PALAU_LAT}&longitude=${PALAU_LON}&hourly=precipitation&start_date=${startStr}&end_date=${endStr}&timezone=Asia%2FTokyo`
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
    loader.style.display = 'none';
}

async function loadLocalCSV() {
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
                        const y = dateParts[0];
                        const m = dateParts[1].padStart(2, '0');
                        const d = dateParts[2].padStart(2, '0');
                        dateStr = `${y}-${m}-${d}`;
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
  const totalElapsedDays = currentCycle * synodicMonth;
  const cycleStartTimeMs = baseDate.getTime() + totalElapsedDays * 24 * 60 * 60 * 1000;
  const startDate = new Date(cycleStartTimeMs);
  currentStartSegment = Math.round((totalElapsedDays % 30) / 0.25);
  
  const y = startDate.getFullYear();
  const m = startDate.getMonth() + 1;
  const d = startDate.getDate();
  document.getElementById('cycleDisplay').innerHTML = `${y}年 ${m}月 <span style="font-size:10px;">▼</span><br><span style="font-size:11px; color:#8b949e;">新月: ${m}月${d}日〜</span>`;

  await fetchMeteoData(cycleStartTimeMs);

  drawLunarShadow(cycleStartTimeMs);  
  drawDynamicLines(); 
  drawTideGraph(cycleStartTimeMs);    
  drawRainfallGraph(cycleStartTimeMs); 
  drawDailyRainStats(startDate);
  drawLunarMansions(cycleStartTimeMs);
  renderSavedData();
  drawOuterSeasons(cycleStartTimeMs); 
  drawTimeLabels(); 
  drawSolarDates(startDate); 

  globalRotation = -currentStartSegment * 3;
  masterGroup.setAttribute('transform', `rotate(${globalRotation}, ${cx}, ${cy})`);
}

// アプリの起動処理
initUI();

loadLocalCSV().then(() => {
    fetch('calendar.svg')
      .then(response => response.text())
      .then(svgCode => {
        container.innerHTML = svgCode;
        svg = container.querySelector('svg');
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
        bgGroup.setAttribute("opacity", "0.8");
        while (svg.firstChild) bgGroup.appendChild(svg.firstChild);
        
        masterGroup.appendChild(bgGroup);
        svg.appendChild(masterGroup);

        textPathDefs = document.createElementNS(svgNS, "defs");
        dataLayer = document.createElementNS(svgNS, "g");       
        shadowLayer = document.createElementNS(svgNS, "g");     
        linesLayer = document.createElementNS(svgNS, "g");      
        tideLayer = document.createElementNS(svgNS, "g");       
        rainfallLayer = document.createElementNS(svgNS, "g");   
        
        lunarMansionLayer = document.createElementNS(svgNS, "g");
        lunarMansionLayer.setAttribute("id", "lunar-mansion-layer");
        outerSeasonLayer = document.createElementNS(svgNS, "g");

        masterGroup.appendChild(textPathDefs);
        masterGroup.appendChild(dataLayer);
        masterGroup.appendChild(shadowLayer);
        masterGroup.appendChild(linesLayer);
        masterGroup.appendChild(tideLayer);
        masterGroup.appendChild(rainfallLayer);
        masterGroup.appendChild(lunarMansionLayer);
        masterGroup.appendChild(outerSeasonLayer);

        generateAstronomicalData();
        updateCalendarCycle();
        initInteractions();
      })
      .catch(err => console.error("SVG読み込みエラー:", err));
});
