// ui.js (レイヤーコントロールパネル構築・管理モジュール)

const fontOptions = [
    { value: "'Shippori Mincho', serif", label: "明朝体 (Shippori)" },
    { value: "'YuMincho', serif", label: "游明朝 (Yu Mincho)" },
    { value: "'Hiragino Mincho ProN', serif", label: "ヒラギノ明朝" },
    { value: "sans-serif", label: "ゴシック体 (標準)" },
    { value: "'Yu Gothic', sans-serif", label: "游ゴシック (Yu Gothic)" }
];

const uiGroups = [
    {
        title: "キャンバス全体",
        items: [
            { id: "canvasBg", label: "背景色", props: [ { key: "fill", label: "背景色", type: "color" } ] },
            { id: "baseSvg", label: "ベース図形", props: [ { key: "stroke", label: "線の色", type: "color" }, { key: "opacity", label: "透明度", type: "number", min:0, max:1, step:0.05 } ] },
            { id: "lunarShadow", label: "月相シャドウ (ハート型)", props: [ { key: "fill", label: "色", type: "color" }, { key: "opacity", label: "透明度", type: "number", min:0, max:1, step:0.05 } ] },
            { id: "astroPins", label: "天文学的ピン (朔望)", props: [ { key: "fill", label: "塗りの色", type: "color" }, { key: "stroke", label: "線の色", type: "color" }, { key: "strokeWidth", label: "線の太さ", type: "number", min:0, max:5, step:0.1 }, { key: "scale", label: "大きさ", type: "number", min:0.1, max:3, step:0.1 }, { key: "radiusOffset", label: "位置調整", type: "number", min:-20, max:20, step:1 }, { key: "opacity", label: "透明度", type: "number", min:0, max:1, step:0.05 } ] },
            { id: "lunarMansion", label: "二十七宿 (一番外周)", props: [
                { key: "fontFamily", label: "フォント", type: "select", options: fontOptions },
                { key: "fontSize", label: "文字サイズ", type: "number", min: 5, max: 30, step: 0.5 },
                { key: "colorEast", label: "東方青龍 (角〜箕)", type: "color" },
                { key: "colorNorth", label: "北方玄武 (斗〜壁)", type: "color" },
                { key: "colorWest", label: "西方白虎 (奎〜参)", type: "color" },
                { key: "colorSouth", label: "南方朱雀 (井〜軫)", type: "color" },
                { key: "starSize", label: "星の大きさ", type: "number", min: 0.1, max: 5, step: 0.1 },
                { key: "strokeWidth", label: "星座線の太さ", type: "number", min: 0.1, max: 3, step: 0.1 },
                { key: "bgRingColor", label: "背景帯の色", type: "color" },
                { key: "bgRingOpacity", label: "背景帯の透明度", type: "number", min: 0, max: 1, step: 0.01 },
                { key: "opacity", label: "透明度 (全体)", type: "number", min: 0, max: 1, step: 0.05 }
            ]}
        ]
    },
    {
        title: "グラフ・データ",
        items: [
            { id: "tideGraph", label: "潮汐波形", props: [ { key: "stroke", label: "線の色", type: "color" }, { key: "strokeWidth", label: "線の太さ", type: "number", min:0, max:5, step:0.1 }, { key: "opacity", label: "透明度", type: "number", min:0, max:1, step:0.05 } ] },
            { id: "rainGraph", label: "毎時降水量 (棒線)", props: [ { key: "stroke", label: "線の色", type: "color" }, { key: "strokeWidth", label: "線の太さ", type: "number", min:0, max:5, step:0.1 }, { key: "opacity", label: "透明度", type: "number", min:0, max:1, step:0.05 } ] },
            { id: "dailyRainBg", label: "日別総降水量 (背景色)", props: [ { key: "fill", label: "色", type: "color" }, { key: "density", label: "濃さ(密度)", type: "number", min:0.1, max:1, step:0.05 } ] },
            { id: "dailyRainText", label: "日別総降水量 (数値)", props: [ { key: "fontFamily", label: "フォント", type: "select", options: fontOptions }, { key: "fontSize", label: "文字サイズ", type: "number", min:4, max:20, step:0.5 }, { key: "fill", label: "文字色", type: "color" }, { key: "fontWeight", label: "太字にする", type: "checkbox" }, { key: "stroke", label: "縁取り色", type: "color" }, { key: "strokeWidth", label: "縁取り太さ", type: "number", min:0, max:5, step:0.5 }, { key: "offsetRadius", label: "位置", type: "number", min:-20, max:20, step:1 }, { key: "opacity", label: "透明度", type: "number", min:0, max:1, step:0.05 } ] }
        ]
    },
    {
        title: "目盛り・ガイド",
        items: [
            { id: "dateLines", label: "日付区切り線 (30分割)", props: [ { key: "stroke", label: "線の色", type: "color" }, { key: "strokeWidth", label: "線の太さ", type: "number", min:0, max:5, step:0.1 }, { key: "opacity", label: "透明度", type: "number", min:0, max:1, step:0.05 } ] },
            { id: "guideTime", label: "時間 (0/6/12/18)", props: [ { key: "fontFamily", label: "フォント", type: "select", options: fontOptions }, { key: "fontSize", label: "文字サイズ", type: "number", min:4, max:20, step:0.5 }, { key: "fill", label: "文字色", type: "color" }, { key: "fontWeight", label: "太字にする", type: "checkbox" }, { key: "stroke", label: "縁取り色", type: "color" }, { key: "strokeWidth", label: "縁取り太さ", type: "number", min:0, max:5, step:0.5 }, { key: "offsetRadius", label: "位置", type: "number", min:-20, max:20, step:1 }, { key: "opacity", label: "透明度", type: "number", min:0, max:1, step:0.05 } ] },
            
            // ★ 分離された潮位ガイド（線・文字）
            { id: "guideTideLine", label: "潮位 (ft) 目盛り線", props: [ { key: "stroke", label: "線の色", type: "color" }, { key: "strokeWidth", label: "線の太さ", type: "number", min:0, max:5, step:0.1 }, { key: "opacity", label: "透明度", type: "number", min:0, max:1, step:0.05 } ] },
            { id: "guideTideText", label: "潮位 (ft) 文字", props: [ { key: "fontFamily", label: "フォント", type: "select", options: fontOptions }, { key: "fontSize", label: "文字サイズ", type: "number", min:4, max:20, step:0.5 }, { key: "fill", label: "文字色", type: "color" }, { key: "fontWeight", label: "太字にする", type: "checkbox" }, { key: "stroke", label: "縁取り色", type: "color" }, { key: "strokeWidth", label: "縁取り太さ", type: "number", min:0, max:5, step:0.5 }, { key: "offsetRadius", label: "位置", type: "number", min:-20, max:20, step:1 }, { key: "opacity", label: "透明度", type: "number", min:0, max:1, step:0.05 } ] },
            
            // ★ 分離された降水量ガイド（線・文字）
            { id: "guideRainLine", label: "降水量 (mm) 目盛り線", props: [ { key: "stroke", label: "線の色", type: "color" }, { key: "strokeWidth", label: "線の太さ", type: "number", min:0, max:5, step:0.1 }, { key: "opacity", label: "透明度", type: "number", min:0, max:1, step:0.05 } ] },
            { id: "guideRainText", label: "降水量 (mm) 文字", props: [ { key: "fontFamily", label: "フォント", type: "select", options: fontOptions }, { key: "fontSize", label: "文字サイズ", type: "number", min:4, max:20, step:0.5 }, { key: "fill", label: "文字色", type: "color" }, { key: "fontWeight", label: "太字にする", type: "checkbox" }, { key: "stroke", label: "縁取り色", type: "color" }, { key: "strokeWidth", label: "縁取り太さ", type: "number", min:0, max:5, step:0.5 }, { key: "offsetRadius", label: "位置", type: "number", min:-20, max:20, step:1 }, { key: "opacity", label: "透明度", type: "number", min:0, max:1, step:0.05 } ] }
        ]
    },
    {
        title: "日付・暦",
        items: [
            { id: "gregorian", label: "新暦日付 (M/D)", props: [ { key: "fontFamily", label: "フォント", type: "select", options: fontOptions }, { key: "fontSize", label: "文字サイズ", type: "number", min:5, max:30, step:0.5 }, { key: "fill", label: "文字色", type: "color" }, { key: "fontWeight", label: "太字にする", type: "checkbox" }, { key: "stroke", label: "縁取り色", type: "color" }, { key: "strokeWidth", label: "縁取り太さ", type: "number", min:0, max:5, step:0.5 }, { key: "offsetRadius", label: "位置調整", type: "number", min:-20, max:20, step:1 }, { key: "opacity", label: "透明度", type: "number", min:0, max:1, step:0.05 } ] },
            { id: "lunar", label: "旧暦日 (月相対応)", props: [ { key: "fontFamily", label: "フォント", type: "select", options: fontOptions }, { key: "fontSize", label: "文字サイズ", type: "number", min:5, max:30, step:0.5 }, { key: "fontWeight", label: "太字にする", type: "checkbox" }, { key: "offsetRadius", label: "位置調整", type: "number", min:-20, max:20, step:1 }, { key: "opacity", label: "透明度", type: "number", min:0, max:1, step:0.05 } ] },
            { id: "weekday", label: "曜日 (Sun-Sat)", props: [ { key: "lang", label: "言語", type: "select", options: [{value: "en", label:"英語 (Sun-Sat)"}, {value: "ja", label:"日本語 (日-土)"}] }, { key: "fontFamily", label: "フォント", type: "select", options: fontOptions }, { key: "fontSize", label: "文字サイズ", type: "number", min:4, max:20, step:0.5 }, { key: "fill", label: "文字色", type: "color" }, { key: "fontWeight", label: "太字にする", type: "checkbox" }, { key: "stroke", label: "縁取り色", type: "color" }, { key: "strokeWidth", label: "縁取り太さ", type: "number", min:0, max:5, step:0.5 }, { key: "offsetRadius", label: "位置調整", type: "number", min:-20, max:20, step:1 }, { key: "opacity", label: "透明度", type: "number", min:0, max:1, step:0.05 } ] },
            { id: "sekki", label: "24節気 (円外)", props: [ { key: "fontFamily", label: "フォント", type: "select", options: fontOptions }, { key: "fontSize", label: "文字サイズ", type: "number", min:8, max:40, step:0.5 }, { key: "fill", label: "文字色", type: "color" }, { key: "fontWeight", label: "太字にする", type: "checkbox" }, { key: "stroke", label: "縁取り色", type: "color" }, { key: "strokeWidth", label: "縁取り太さ", type: "number", min:0, max:5, step:0.5 }, { key: "offsetRadius", label: "位置調整", type: "number", min:-50, max:50, step:1 }, { key: "opacity", label: "透明度", type: "number", min:0, max:1, step:0.05 } ] },
            { id: "kou", label: "72候 (円外)", props: [ { key: "fontFamily", label: "フォント", type: "select", options: fontOptions }, { key: "fontSize", label: "文字サイズ", type: "number", min:6, max:30, step:0.5 }, { key: "fill", label: "文字色", type: "color" }, { key: "fontWeight", label: "太字にする", type: "checkbox" }, { key: "stroke", label: "縁取り色", type: "color" }, { key: "strokeWidth", label: "縁取り太さ", type: "number", min:0, max:5, step:0.5 }, { key: "offsetRadius", label: "位置調整", type: "number", min:-50, max:50, step:1 }, { key: "opacity", label: "透明度", type: "number", min:0, max:1, step:0.05 } ] },
            { id: "wafuText", label: "右上 月名 (旧暦)", props: [ { key: "fontFamily", label: "フォント", type: "select", options: fontOptions }, { key: "fontSize", label: "文字サイズ", type: "number", min:10, max:120, step:1 }, { key: "fill", label: "文字色", type: "color" }, { key: "fontWeight", label: "太字にする", type: "checkbox" }, { key: "stroke", label: "縁取り色", type: "color" }, { key: "strokeWidth", label: "縁取り太さ", type: "number", min:0, max:10, step:0.5 }, { key: "offsetRadius", label: "位置(縦)", type: "number", min:-100, max:100, step:1 }, { key: "opacity", label: "透明度", type: "number", min:0, max:1, step:0.05 } ] },
            { id: "gregorianText", label: "右上 月名 (新暦)", props: [ { key: "fontFamily", label: "フォント", type: "select", options: fontOptions }, { key: "fontSize", label: "文字サイズ", type: "number", min:10, max:120, step:1 }, { key: "fill", label: "文字色", type: "color" }, { key: "fontWeight", label: "太字にする", type: "checkbox" }, { key: "stroke", label: "縁取り色", type: "color" }, { key: "strokeWidth", label: "縁取り太さ", type: "number", min:0, max:10, step:0.5 }, { key: "offsetRadius", label: "位置(縦)", type: "number", min:-100, max:100, step:1 }, { key: "opacity", label: "透明度", type: "number", min:0, max:1, step:0.05 } ] }
        ]
    },
    {
        title: "特等席 (階層30)",
        items: [
            { id: "holiday", label: "祝日 (上段)", props: [ { key: "fontFamily", label: "フォント", type: "select", options: fontOptions }, { key: "fontSize", label: "文字サイズ", type: "number", min:4, max:20, step:0.5 }, { key: "fill", label: "文字色", type: "color" }, { key: "fontWeight", label: "太字にする", type: "checkbox" }, { key: "stroke", label: "縁取り色", type: "color" }, { key: "strokeWidth", label: "縁取り太さ", type: "number", min:0, max:5, step:0.5 }, { key: "offsetRadius", label: "位置調整", type: "number", min:-20, max:20, step:1 }, { key: "opacity", label: "透明度", type: "number", min:0, max:1, step:0.05 } ] },
            { id: "zassetsu", label: "雑節 (中段)", props: [ { key: "fontFamily", label: "フォント", type: "select", options: fontOptions }, { key: "fontSize", label: "文字サイズ", type: "number", min:4, max:20, step:0.5 }, { key: "fill", label: "文字色", type: "color" }, { key: "fontWeight", label: "太字にする", type: "checkbox" }, { key: "stroke", label: "縁取り色", type: "color" }, { key: "strokeWidth", label: "縁取り太さ", type: "number", min:0, max:5, step:0.5 }, { key: "offsetRadius", label: "位置調整", type: "number", min:-20, max:20, step:1 }, { key: "opacity", label: "透明度", type: "number", min:0, max:1, step:0.05 } ] },
            { id: "important", label: "重要年中行事 (下段)", props: [ { key: "fontFamily", label: "フォント", type: "select", options: fontOptions }, { key: "fontSize", label: "文字サイズ", type: "number", min:4, max:20, step:0.5 }, { key: "fill", label: "文字色", type: "color" }, { key: "fontWeight", label: "太字にする", type: "checkbox" }, { key: "stroke", label: "縁取り色", type: "color" }, { key: "strokeWidth", label: "縁取り太さ", type: "number", min:0, max:5, step:0.5 }, { key: "offsetRadius", label: "位置調整", type: "number", min:-20, max:20, step:1 }, { key: "opacity", label: "透明度", type: "number", min:0, max:1, step:0.05 } ] }
        ]
    },
    {
        title: "年中行事 (階層24-29)",
        items: [
            { id: "eventShinto", label: "神事", toggleId: "toggle-event-shinto", props: [ { key: "fontFamily", label: "フォント", type: "select", options: fontOptions }, { key: "fontSize", label: "文字サイズ", type: "number", min:4, max:20, step:0.5 }, { key: "fill", label: "文字色", type: "color" }, { key: "fontWeight", label: "太字にする", type: "checkbox" }, { key: "stroke", label: "縁取り色", type: "color" }, { key: "strokeWidth", label: "縁取り太さ", type: "number", min:0, max:5, step:0.5 }, { key: "opacity", label: "透明度", type: "number", min:0, max:1, step:0.05 } ] },
            { id: "eventBuddhism", label: "仏事", toggleId: "toggle-event-buddhism", props: [ { key: "fontFamily", label: "フォント", type: "select", options: fontOptions }, { key: "fontSize", label: "文字サイズ", type: "number", min:4, max:20, step:0.5 }, { key: "fill", label: "文字色", type: "color" }, { key: "fontWeight", label: "太字にする", type: "checkbox" }, { key: "stroke", label: "縁取り色", type: "color" }, { key: "strokeWidth", label: "縁取り太さ", type: "number", min:0, max:5, step:0.5 }, { key: "opacity", label: "透明度", type: "number", min:0, max:1, step:0.05 } ] },
            { id: "eventChurch", label: "教会行事", toggleId: "toggle-event-church", props: [ { key: "fontFamily", label: "フォント", type: "select", options: fontOptions }, { key: "fontSize", label: "文字サイズ", type: "number", min:4, max:20, step:0.5 }, { key: "fill", label: "文字色", type: "color" }, { key: "fontWeight", label: "太字にする", type: "checkbox" }, { key: "stroke", label: "縁取り色", type: "color" }, { key: "strokeWidth", label: "縁取り太さ", type: "number", min:0, max:5, step:0.5 }, { key: "opacity", label: "透明度", type: "number", min:0, max:1, step:0.05 } ] },
            { id: "eventSonota", label: "その他", toggleId: "toggle-event-sonota", props: [ { key: "fontFamily", label: "フォント", type: "select", options: fontOptions }, { key: "fontSize", label: "文字サイズ", type: "number", min:4, max:20, step:0.5 }, { key: "fill", label: "文字色", type: "color" }, { key: "fontWeight", label: "太字にする", type: "checkbox" }, { key: "stroke", label: "縁取り色", type: "color" }, { key: "strokeWidth", label: "縁取り太さ", type: "number", min:0, max:5, step:0.5 }, { key: "opacity", label: "透明度", type: "number", min:0, max:1, step:0.05 } ] }
        ]
    }
];

function initUI() {
    const panel = document.getElementById('settings-panel-content');
    if (!panel) return;
    
    let html = `
        <div style="background: #e0f2fe; padding: 10px; border-bottom: 1px solid #ddd; text-align:center; position: sticky; top: 0; z-index: 100;">
            <p style="font-size:11px; margin:0 0 8px 0; color:#0369a1; font-weight:bold;">※現在の設定は「表示中の月」専用です</p>
            <button id="btn-apply-global" style="background:#0ea5e9; color:#fff; border:none; padding:8px 12px; border-radius:4px; cursor:pointer; font-size:12px; font-weight:bold; width:100%; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                このデザインをすべての月に一括適用
            </button>
        </div>
    `;

    uiGroups.forEach(group => {
        html += `<div class="settings-group"><div class="settings-group-title" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display==='none'?'block':'none'">▼ ${group.title}</div><div class="settings-group-content" style="display:none;">`;
        group.items.forEach(item => {
            let toggleHtml = item.toggleId ? `<input type="checkbox" id="${item.toggleId}" checked style="margin-right:5px;">` : "";
            html += `<div class="layer-block"><div class="layer-header" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display==='none'?'block':'none'">${toggleHtml}<span>${item.label}</span><span style="float:right; font-size:12px;">⚙️</span></div><div class="layer-props" style="display:none;">`;
            
            if (item.id === "lunar") {
                html += `<div style="font-size:11px; margin-bottom:8px; color:#555;">[詳細設定] 月相ごとの色や形は draw.js の window.layerSettings.lunar.phases を直接編集してください。</div>`;
            }

            item.props.forEach(prop => {
                const inputId = `input-${item.id}-${prop.key}`;
                html += `<div class="prop-row"><span class="prop-label">${prop.label}</span>`;
                if (prop.type === "color") {
                    html += `<input type="color" id="${inputId}" class="prop-input-color">`;
                } else if (prop.type === "number") {
                    html += `<input type="number" id="${inputId}" class="prop-input-number" min="${prop.min}" max="${prop.max}" step="${prop.step}">`;
                } else if (prop.type === "checkbox") {
                    html += `<input type="checkbox" id="${inputId}">`;
                } else if (prop.type === "select") {
                    html += `<select id="${inputId}" class="prop-input-select">`;
                    prop.options.forEach(opt => {
                        html += `<option value="${opt.value}">${opt.label}</option>`;
                    });
                    html += `</select>`;
                }
                html += `</div>`;
            });
            
            if(item.id === "lunarMansion") {
                html += `<button id="btn-reset-lunarMansion" style="margin-top:10px; width:100%; font-size:11px; padding:4px;">初期化</button>`;
            }

            html += `</div></div>`;
        });
        html += `</div></div>`;
    });

    html += `<div style="margin-top:20px;"><button id="btn-reset-all" style="width:100%; padding:8px; background:#ffe4e4; border:1px solid #ffb3b3; color:#d93025; cursor:pointer;">⚠️ 全デザイン設定を初期化</button></div>`;
    panel.innerHTML = html;

    // ★ イベントリスナー登録
    document.getElementById('btn-apply-global').addEventListener('click', () => {
        if(confirm("現在の色や設定を、すべての月の基本デザインとして適用しますか？")) {
            if(typeof window.applyGlobalSettings === 'function') {
                window.applyGlobalSettings();
                window.refreshUIValues();
                updateCalendarCycle();
            }
        }
    });

    const bindInput = (id, key, subKey) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('input', (e) => {
            let val = el.type === 'checkbox' ? el.checked : el.value;
            if (el.type === 'number') val = parseFloat(val);
            if (window.layerSettings[key]) {
                window.layerSettings[key][subKey] = val;
                if(typeof window.saveLayerSettings === 'function') window.saveLayerSettings();
                updateCalendarCycle();
            }
        });
    };

    uiGroups.forEach(group => {
        group.items.forEach(item => {
            item.props.forEach(prop => {
                bindInput(`input-${item.id}-${prop.key}`, item.id, prop.key);
            });
            if (item.toggleId) {
                const tel = document.getElementById(item.toggleId);
                if (tel) {
                    tel.addEventListener('change', () => updateCalendarCycle());
                }
            }
        });
    });

    const resetLM = document.getElementById('btn-reset-lunarMansion');
    if(resetLM) {
        resetLM.addEventListener('click', () => {
            window.layerSettings.lunarMansion = JSON.parse(JSON.stringify(window.defaultLayerSettings.lunarMansion));
            window.saveLayerSettings();
            window.refreshUIValues();
            updateCalendarCycle();
        });
    }

    document.getElementById('btn-reset-all').addEventListener('click', () => {
        if(confirm("すべてのデザイン設定を完全にリセットしますか？（※カスタマイズしたテーマも破棄されます）")) {
            localStorage.removeItem('polarCalendarSettingsV5');
            window.appSettings = { global: JSON.parse(JSON.stringify(window.defaultLayerSettings)), months: {} };
            window.layerSettings = JSON.parse(JSON.stringify(window.defaultLayerSettings));
            window.refreshUIValues();
            updateCalendarCycle();
        }
    });

    // 初期化時に現在の月の設定をUIに反映させる
    if(typeof window.refreshUIValues === 'function') window.refreshUIValues();
}

// ★ 月が切り替わった時などに、裏側の設定データ（window.layerSettings）を画面のツマミに同期させる関数
window.refreshUIValues = function() {
    for (let groupId in window.layerSettings) {
        let group = window.layerSettings[groupId];
        for (let key in group) {
            let el = document.getElementById(`input-${groupId}-${key}`);
            if (el) {
                if (el.type === 'checkbox') el.checked = group[key];
                else el.value = group[key];
            }
        }
    }
};
