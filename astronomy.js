// astronomy.js (高精度 天体計算アルゴリズム)

function getJulianCentury(timeMs) {
    // timeMsは1970年1月1日からのミリ秒 (UTC)
    // 2440587.5 は 1970年1月1日のユリウス日
    const jd = (timeMs / 86400000.0) + 2440587.5;
    // J2000.0 からのユリウス世紀数 (1世紀 = 36525日)
    return (jd - 2451545.0) / 36525.0;
}

function getSolarLongitude(timeMs) {
    const T = getJulianCentury(timeMs);
    const rad = Math.PI / 180.0;
    
    // 太陽の平均黄経
    let L0 = 280.46646 + 36000.76983 * T;
    // 太陽の平均近点角
    let M = 357.52911 + 35999.05029 * T;
    
    // 太陽の中心差（軌道の楕円性によるズレ）
    let C = (1.914602 - 0.004817 * T) * Math.sin(M * rad)
          + (0.019993 - 0.000101 * T) * Math.sin(2 * M * rad)
          + 0.000289 * Math.sin(3 * M * rad);
          
    let theta = L0 + C;
    return (theta % 360.0 + 360.0) % 360.0;
}

function getLunarLongitude(timeMs) {
    const T = getJulianCentury(timeMs);
    const rad = Math.PI / 180.0;

    // 月の平均黄経 (L')
    const L_prime = 218.3164477 + 481267.88123421 * T;
    // 月の平均離角 (D)
    const D = 297.8501921 + 445267.1114034 * T;
    // 太陽の平均近点角 (M)
    const M = 357.5291092 + 35999.0502909 * T;
    // 月の平均近点角 (M')
    const M_prime = 134.9633964 + 477198.8675055 * T;
    // 月の緯度引数 (F)
    const F = 93.2720950 + 483202.0175233 * T;

    // ジャン・メーウスのアルゴリズムに基づく月の黄経の主要な摂動（揺らぎ）補正項
    let sigma_l = 0;
    sigma_l += 6.288774 * Math.sin(M_prime * rad);              // 中心差
    sigma_l += 1.274027 * Math.sin((2*D - M_prime) * rad);      // 出差 (Evection)
    sigma_l += 0.658314 * Math.sin(2*D * rad);                  // 二均差 (Variation)
    sigma_l += 0.213618 * Math.sin(2*M_prime * rad);
    sigma_l -= 0.185116 * Math.sin(M * rad);                    // 年差 (Annual equation)
    sigma_l -= 0.114332 * Math.sin(2*F * rad);                  // 帰差 (Reduction to ecliptic)
    sigma_l += 0.058793 * Math.sin((2*D - 2*M_prime) * rad);
    sigma_l += 0.057066 * Math.sin((2*D - M - M_prime) * rad);
    sigma_l += 0.053322 * Math.sin((2*D + M_prime) * rad);
    sigma_l += 0.045758 * Math.sin((2*D - M) * rad);
    sigma_l -= 0.040923 * Math.sin((M - M_prime) * rad);
    sigma_l -= 0.034720 * Math.sin(D * rad);
    sigma_l -= 0.030383 * Math.sin((M + M_prime) * rad);
    
    let lambda = L_prime + sigma_l;
    return (lambda % 360.0 + 360.0) % 360.0;
}
