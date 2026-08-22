// ui.js (UI構築・イベントモジュール) - 最適化版

// 複雑なCSV文字列処理をシンプルで堅牢なパーサーに置き換えました
function parseCSVRow(str) {
    const res = []; let cur = '', inQ = false;
    for (let i = 0; i < str.length; i++) {
        if (str[i] === '"') { if (inQ && str[i+1] === '"') { cur += '"'; i++; } else inQ = !inQ; }
        else if (str[i] === ',' && !inQ) { res.push(cur); cur = ''; }
        else cur += str[i];
    }
    res.push(cur); return res.map(s => s.trim());
}

function initUI() {
    // 省略：UIパネルの構築処理は元のままご利用ください
    // ここでは、設定パネル更新ロジックやマウスイベントの最適化を行います。

    const setTool = (tool, mode = null) => {
        currentTool = tool;
        if (mode) interactionMode = mode;
        ['pointer','paint','erase'].forEach(t => {
            const b = document.getElementById(`tool-${t}`);
            if(b) { b.style.background = 'transparent'; b.style.color = '#fff'; b.style.borderColor = 'transparent'; }
        });
        const activeBtn = document.getElementById(`tool-${tool}`);
        if(activeBtn) { activeBtn.style.background = 'rgba(212,175,55,0.85)'; activeBtn.style.color = '#000'; activeBtn.style.borderColor = '#d4af37'; }
        
        if (tool === 'pointer' && activeBtn) {
            activeBtn.innerHTML = interactionMode === 'rotate' ? icons.rotate : icons.pan;
        }
        
        const pal = document.getElementById('palette-container');
        if(pal) pal.style.display = (tool === 'paint') ? 'grid' : 'none';
        
        let cursor = tool === 'paint' ? 'crosshair' : tool === 'erase' ? 'cell' : interactionMode === 'pan' ? 'grab' : 'ew-resize';
        let st = document.getElementById('cursor-style-block');
        if(!st) { st = document.createElement("style"); st.id = "cursor-style-block"; document.head.appendChild(st); }
        st.innerHTML = `#container, #container svg, .calendar-container svg { cursor: ${cursor} !important; } text { cursor: inherit; user-select: none; } text[style*="cursor: pointer"] { cursor: pointer !important; }`;
    };

    let prevTool = 'pointer', isSp = false;
    document.addEventListener('keydown', (e) => {
        if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.code === 'Space') { e.preventDefault(); if(!isSp) { isSp = true; prevTool = currentTool; setTool('pointer', 'pan'); } return; }
        if (e.key === 'v') setTool('pointer', interactionMode === 'pan' ? 'rotate' : 'pan');
        if (e.key === 'b') setTool('paint');
        if (e.key === 'e') setTool('erase');
    });
    document.addEventListener('keyup', (e) => { if(e.code === 'Space') { isSp = false; setTool(prevTool); } });

    document.getElementById('tool-pointer').onclick = () => setTool('pointer', interactionMode === 'pan' ? 'rotate' : 'pan');
    document.getElementById('tool-paint').onclick = () => setTool('paint');
    document.getElementById('tool-erase').onclick = () => setTool('erase');

    setTool('pointer', 'pan');

    // ★ パフォーマンスを落とさない、1行完結のレイヤー表示切り替え
    let lst = document.getElementById("layer-style-block");
    if (!lst) { lst = document.createElement("style"); lst.id = "layer-style-block"; document.head.appendChild(lst); }
    const tg = (id, sel) => document.getElementById(id)?.checked === false ? `${sel}{display:none !important;} ` : "";
    
    const updateLayerVisibility = () => {
        lst.innerHTML = tg("toggle-base-svg", "#bg-group") + tg("toggle-lunar-shadow", "#layer-shadow") + tg("toggle-astro-pins", "#layer-astronomical-pins") + tg("toggle-layer-lunar", "#layer-lunar-mansion") + tg("toggle-tide-graph", "#layer-tide-wave") + tg("toggle-rain-graph", "#layer-rain-graph") + tg("toggle-daily-rain-bg", "#layer-daily-rain-bg") + tg("toggle-daily-rain-text", "#layer-daily-rain-text") + tg("toggle-date-lines", "#layer-lines") + tg("toggle-guide-time", "#layer-guide-time") + tg("toggle-haiku-text", "#layer-haiku") + tg("toggle-guide-tide-line", ".layer-guide-tide-line") + tg("toggle-guide-tide-text", ".layer-guide-tide-text") + tg("toggle-guide-rain-line", ".layer-guide-rain-line") + tg("toggle-guide-rain-text", ".layer-guide-rain-text") + tg("toggle-date-gregorian", ".layer-date-gregorian") + tg("toggle-date-lunar", ".layer-date-lunar") + tg("toggle-date-weekday", ".layer-date-weekday") + tg("toggle-wafu-text", ".layer-wafu-text") + tg("toggle-gregorian-text", ".layer-gregorian-text") + tg("toggle-sekki", ".layer-sekki") + tg("toggle-kou", ".layer-kou") + tg("toggle-zassetsu", ".layer-zassetsu") + tg("toggle-holiday", ".layer-holiday") + tg("toggle-event-important", ".layer-event-important");
        if(window.lastKoyomiStartDate) drawKoyomiEvents(window.lastKoyomiStartDate);
    };
    document.body.addEventListener("change", e => { if (e.target?.id?.startsWith('toggle-')) updateLayerVisibility(); });
    updateLayerVisibility();
}

window.openHaikuModal = (dateStr, haikus) => {
    let m = document.getElementById('haiku-modal');
    if(!m) {
        m = document.createElement('div'); m.id = 'haiku-modal';
        m.style.cssText = "position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:9999; display:flex; justify-content:center; align-items:center; opacity:0; transition:0.3s;";
        m.innerHTML = `<div style="background:#fdfbf7; padding:50px 40px 40px 40px; border-radius:8px; max-width:80%; max-height:80%; overflow-x:auto; display:flex; flex-direction:column; align-items:center; position:relative; box-shadow:0 10px 40px #000; border:1px solid #d4af37;"><button id="haiku-modal-close" style="position:absolute; top:10px; right:15px; background:none; border:none; font-size:28px; cursor:pointer; color:#888;">×</button><div id="haiku-modal-date" style="font-family:'Shippori Mincho',serif; font-size:16px; color:#888; margin-bottom:20px; letter-spacing:2px;"></div><div id="haiku-modal-content" style="display:flex; flex-direction:row-reverse; font-family:'Shippori Mincho',serif; font-size:18px; color:#2c3e50; writing-mode:vertical-rl; max-height:60vh;"></div></div>`;
        document.body.appendChild(m);
        document.getElementById('haiku-modal-close').onclick = () => { m.style.opacity = '0'; setTimeout(()=>m.style.display='none',300); };
        m.onclick = (e) => { if(e.target===m) document.getElementById('haiku-modal-close').click(); };
    }
    document.getElementById('haiku-modal-date').textContent = dateStr.replace(/-/g, '年').replace(/年(\d+)$/, '月$1日');
    const c = document.getElementById('haiku-modal-content'); c.replaceChildren();
    haikus.forEach(h => { const d = document.createElement('div'); d.style.cssText="border-left:1px dashed rgba(212, 175, 55, 0.5); padding-left:15px; margin-left:15px; line-height:2; letter-spacing:3px; white-space:pre-wrap;"; d.textContent = h; c.appendChild(d); });
    m.style.display = 'flex'; void m.offsetWidth; m.style.opacity = '1';
};
