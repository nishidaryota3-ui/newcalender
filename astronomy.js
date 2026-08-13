
// astronomy.js (天体・暦の計算)

function getSolarLongitude(timeMs) {
  let jd = timeMs / 86400000 + 2440587.5;
  let t = (jd - 2451545.0) / 36525;
  let m = 357.52911 + 35999.05029 * t - 0.0001537 * t * t;
  let rad = Math.PI / 180;
  let c = (1.914602 - 0.004817 * t - 0.000014 * t * t) * Math.sin(m * rad) + (0.019993 - 0.000101 * t) * Math.sin(2 * m * rad);
  let l0 = 280.46646 + 36000.76983 * t + 0.0003032 * t * t;
  let trueLon = l0 + c;
  let omega = 125.04 - 1934.136 * t;
  let lon = (trueLon - 0.00569 - 0.00478 * Math.sin(omega * rad)) % 360;
  return lon < 0 ? lon + 360 : lon;
}

function getLunarLongitude(timeMs) {
  let jd = timeMs / 86400000 + 2440587.5;
  let T = (jd - 2451545.0) / 36525;
  let Lp = 218.3164477 + 481267.88123421 * T;
  let M = 357.5291092 + 35999.0502909 * T;
  let Mp = 134.9633964 + 477198.8675055 * T;
  let D = 297.8501921 + 445267.1114034 * T;
  let F = 93.2720950 + 483202.0175233 * T;
  let rad = Math.PI / 180;
  let lon = Lp + 6.289 * Math.sin(Mp * rad) - 1.274 * Math.sin((2*D - Mp) * rad) + 0.658 * Math.sin(2*D * rad) + 0.214 * Math.sin(2*Mp * rad) - 0.186 * Math.sin(M * rad) - 0.114 * Math.sin(2*F * rad);
  let res = lon % 360;
  return res < 0 ? res + 360 : res;
}

function getLunarPhaseEvent(timeMsStart, timeMsEnd) {
  let diffStart = (getLunarLongitude(timeMsStart) - getSolarLongitude(timeMsStart) + 360) % 360;
  let diffEnd = (getLunarLongitude(timeMsEnd) - getSolarLongitude(timeMsEnd) + 360) % 360;
  if (diffStart > 300 && diffEnd < 60) return "新月";
  if (diffStart <= 90 && diffEnd > 90) return "上弦";
  if (diffStart <= 180 && diffEnd > 180) return "満月";
  if (diffStart <= 270 && diffEnd > 270) return "下弦";
  return null;
}

function findTimeForLongitude(targetLon, left, right) {
  while (right - left > 60000) { 
    let mid = (left + right) / 2;
    let midLon = getSolarLongitude(mid);
    let diff = midLon - targetLon;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    if (diff > 0) right = mid; else left = mid;
  }
  return left;
}

function generateAstronomicalData() {
  generatedSeasons = [];
  let startTime = new Date(2025, 0, 1).getTime(); 
  let endTime = new Date(2028, 0, 1).getTime(); 
  let kouPoints = [];
  let currentTime = startTime;
  let prevLon = getSolarLongitude(currentTime);
  
  while (currentTime < endTime) {
    let nextTime = currentTime + 86400000; 
    let nextLon = getSolarLongitude(nextTime);
    let floorPrev = Math.floor(prevLon / 5) * 5;
    let floorNext = Math.floor(nextLon / 5) * 5;
    if (floorPrev !== floorNext) {
      let targetLon = (floorPrev === 355 && floorNext === 0) ? 0 : floorNext;
      if (targetLon === 360) targetLon = 0;
      let exactTime = findTimeForLongitude(targetLon, currentTime, nextTime);
      kouPoints.push({ time: exactTime, lon: targetLon });
    }
    currentTime = nextTime; prevLon = nextLon;
  }

  for (let i = 0; i < kouPoints.length - 1; i++) {
    let p1 = kouPoints[i];
    let deg = p1.lon;
    let kouIndex = Math.floor(((deg - 315 + 360) % 360) / 5);
    let isSekkiStart = (deg % 15 === 0);
    generatedSeasons.push({ type: 'kou', name: kouNames[kouIndex], start: p1.time });
    if (isSekkiStart) {
      let sekkiIndex = Math.floor(((deg - 315 + 360) % 360) / 15);
      generatedSeasons.push({ type: 'sekki', name: sekkiNames[sekkiIndex], start: p1.time });
    }
  }
}

function getWafuMonthName(cycleStartTime) {
    let lon1 = getSolarLongitude(cycleStartTime);
    let lon2 = getSolarLongitude(cycleStartTime + synodicMonth * 86400000);
    if (lon2 < lon1) lon2 += 360;
    let chukis = [];
    for (let deg = 0; deg < 360; deg += 30) {
        let checkLon = deg;
        if (checkLon < lon1 && (checkLon + 360) <= lon2) checkLon += 360;
        if (checkLon >= lon1 && checkLon <= lon2) chukis.push(deg);
    }
    if (chukis.length > 0) return wafuNames[(Math.floor(chukis[0] / 30) + 1) % 12];
    
    let prevLon1 = getSolarLongitude(cycleStartTime - synodicMonth * 86400000);
    let prevLon2 = lon1;
    if (prevLon2 < prevLon1) prevLon2 += 360;
    let prevChukis = [];
    for (let deg = 0; deg < 360; deg += 30) {
        let checkLon = deg;
        if (checkLon < prevLon1 && (checkLon + 360) <= prevLon2) checkLon += 360;
        if (checkLon >= prevLon1 && checkLon <= prevLon2) prevChukis.push(deg);
    }
    if (prevChukis.length > 0) return "閏" + wafuNames[(Math.floor(prevChukis[0] / 30) + 1) % 12];
    return "閏月";
}

function getLunarDayKanji(dayInt) {
  const kanji = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
  if (dayInt <= 10) return kanji[dayInt] || "十";
  if (dayInt > 10 && dayInt < 20) return "十" + kanji[dayInt % 10];
  if (dayInt === 20) return "廿";
  if (dayInt > 20 && dayInt < 30) return "廿" + kanji[dayInt % 10];
  if (dayInt === 30) return "丗";
  return dayInt.toString();
}

function getSimulatedTideValue(timeMs) {
    const MSL = 3.2; 
    const diff = (getLunarLongitude(timeMs) - getSolarLongitude(timeMs) + 360) % 360;
    const phaseFactor = 0.7 + 0.3 * Math.cos(diff * 2 * Math.PI / 180); 
    const t_hours = timeMs / 3600000;
    const M2 = { a: 2.2 * phaseFactor, speed: 28.984, phase: 210 }; 
    const K1 = { a: 1.2, speed: 15.041, phase: 50 }; 
    return MSL + M2.a * Math.cos((M2.speed * t_hours - M2.phase) * Math.PI / 180) 
               + K1.a * Math.cos((K1.speed * t_hours - K1.phase) * Math.PI / 180);
}

function getInterpolatedTide(timeMs) {
    if (highLowTidePoints.length === 0) return getSimulatedTideValue(timeMs);
    let p1 = null; let p2 = null;
    for (let i = 0; i < highLowTidePoints.length - 1; i++) {
        if (timeMs >= highLowTidePoints[i].time && timeMs <= highLowTidePoints[i+1].time) {
            p1 = highLowTidePoints[i]; p2 = highLowTidePoints[i+1]; break;
        }
    }
    if (p1 && p2) {
        const timeRange = p2.time - p1.time;
        if (timeRange === 0) return p1.tide; 
        const ratio = (timeMs - p1.time) / timeRange; 
        const smoothRatio = (1 - Math.cos(Math.PI * ratio)) / 2;
        return p1.tide + (p2.tide - p1.tide) * smoothRatio;
    }
    return getSimulatedTideValue(timeMs);
}

function getTideRadius(tide, rMin, rMax) {
    const totalWidth = rMax - rMin;
    let ratio = 0;
    if (tide <= 0) {
        let clamped = Math.max(-1.5, tide);
        ratio = 0.25 * ((clamped + 1.5) / 1.5);
    } else if (tide <= 6.0) {
        ratio = 0.25 + 0.5 * (tide / 6.0);
    } else {
        let clamped = Math.min(7.5, tide);
        ratio = 0.75 + 0.25 * ((clamped - 6.0) / 1.5);
    }
    return rMin + totalWidth * ratio;
}
