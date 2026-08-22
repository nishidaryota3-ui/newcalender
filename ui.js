
// ui.js (UI構築・イベントモジュール)

function initUI() {
    const oldPalette = document.getElementById('palette');
    if (oldPalette) oldPalette.remove();
    document.querySelectorAll('.panel-ui').forEach(el => el.remove());

    const navDiv = document.createElement('div');
    navDiv.className = 'panel-ui';
    navDiv.style = "position:fixed; top:30px; right:30px; background:rgba(25,30,40,0.85); padding:10px 15px; border-radius:8px; color:#d4af37; z-index:100; display:flex; gap:15px; align-items:center; border: 1px solid rgba(212,175,55,0.3); backdrop-filter: blur(10px);";
    navDiv.innerHTML = `
        <button id="prevBtn" style="background:transparent; border:1px solid #d4af37; color:#d4af37; padding:4px 8px; cursor:pointer; border-radius:4px;">◀</button>
        <div id="cycleDisplay" title="クリックして年月を移動" style="font-weight:bold; font-size:14px; text-align:center; min-width:120px; cursor:pointer; padding:4px; border-radius:4px; transition:background 0.2s;">--</div>
        <button id="nextBtn" style="background:#d4af37; border:none; color:#000; padding:4px 8px; cursor:pointer; border-radius:4px; font-weight:bold;">▶</button>
    `;
    document.body.appendChild(navDiv);

    const jumpDiv = document.createElement('div');
    jumpDiv.className = 'panel-ui';
    jumpDiv.id = 'jumpMenu';
    jumpDiv.style = "position:fixed; top:80px; right:30px; background:rgba(25,30,40,0.9); padding:10px; border-radius:8px; border: 1px solid rgba(212,175,55,0.5); display:none; z-index:101; flex-direction:column; gap:8px;";
    jumpDiv.innerHTML = `
        <div style="font-size:12px; color:#fff;">移動先の年月 (例: 2026-08)</div>
        <div style="display:flex; gap:5px;">
            <input type="month" id="jumpInput" style="padding:4px; border-radius:4px; border:1px solid #555; background:#222; color:#fff;">
            <button id="jumpGoBtn" style="background:#d4af37; border:none; color:#000; padding:4px 8px; border-radius:4px; cursor:pointer; font-weight:bold;">GO</button>
        </div>
    `;
    document.body.appendChild(jumpDiv);

    const toolsDiv = document.createElement('div');
    toolsDiv.className = 'panel-ui';
    toolsDiv.style = "position:fixed; top:100px; left:20px; background:rgba(25,30,40,0.9); padding:8px; border-radius:8px; z-index:100; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 4px 20px rgba(0,0,0,0.5); display:flex; flex-direction:column; gap:8px; width:44px; box-sizing:border-box;";
    toolsDiv.innerHTML = `
        <button id="tool-pointer" title="移動/回転切替 (V)" style="width:26px; height:26px; border-radius:4px; cursor:pointer; background:rgba(212,175,55,0.85); border:1px solid #d4af37; color:#000; padding:0; display:flex; justify-content:center; align-items:center;">${typeof iconPan !== 'undefined' ? iconPan : '👆'}</button>
        <button id="tool-paint" title="塗る (B)" style="width:26px; height:26px; border-radius:4px; cursor:pointer; background:transparent; border:1px solid transparent; color:#fff; padding:0; display:flex; justify-content:center; align-items:center;">${typeof iconPaint !== 'undefined' ? iconPaint : '🖌️'}</button>
        <button id="tool-erase" title="消す (E)" style="width:26px; height:26px; border-radius:4px; cursor:pointer; background:transparent; border:1px solid transparent; color:#fff; padding:0; display:flex; justify-content:center; align-items:center;">${typeof iconErase !== 'undefined' ? iconErase : '🧽'}</button>
        <hr style="border-color:rgba(255,255,255,0.1); width:100%; margin:4px 0;">
        <button id="clearBtn" title="選択色を全消去" style="width:26px; height:26px; border-radius:4px; cursor:pointer; background:transparent; border:1px solid transparent; color:#fff; padding:0; display:flex; justify-content:center; align-items:center;">${typeof iconTrash !== 'undefined' ? iconTrash : '🗑️'}</button>
        <button id="printBtn" title="印刷 (A3)" style="width:26px; height:26px; border-radius:4px; cursor:pointer; background:transparent; border:1px solid transparent; color:#38bdf8; padding:0; display:flex; justify-content:center; align-items:center;">${typeof iconPrint !== 'undefined' ? iconPrint : '🖨️'}</button>
        <hr style="border-color:rgba(255,255,255,0.1); width:100%; margin:4px 0;">
        <button id="homeBtn" title="新月を真上にリセット" style="width:26px; height:26px; border-radius:4px; cursor:pointer; background:transparent; border:1px solid transparent; color:#38bdf8; padding:0; display:flex; justify-content:center; align-items:center;">${typeof iconHome !== 'undefined' ? iconHome : '🏠'}</button>
    `;
    document.body.appendChild(toolsDiv);

    const paletteDiv = document.createElement('div');
    paletteDiv.className = 'panel-ui';
    paletteDiv.id = 'palette-container';
    paletteDiv.style = "position:fixed; top:134px; left:74px; background:rgba(25,30,40,0.9); padding:10px; border-radius:8px; z-index:99; border: 1px solid rgba(255,255,255,0.1); display:none; grid-template-columns:repeat(4, 1fr); gap:6px; width:120px; box-sizing:border-box;";
    document.body.appendChild(paletteDiv);

    const lpTitleDiv = document.querySelector('.layer-panel-title');
    if (lpTitleDiv) {
        lpTitleDiv.style.justifyContent = 'center';
        lpTitleDiv.style.position = 'relative';
        lpTitleDiv.style.textAlign = 'center';
    }

    const btnMinimize = document.getElementById('btn-minimize-panel');
    const panelContent = document.getElementById('layer-panel-content');
    if (btnMinimize && panelContent) {
        btnMinimize.style.position = 'absolute';
        btnMinimize.style.right = '10px';
        btnMinimize.onclick = () => {
            if (panelContent.style.display === 'none') {
                panelContent.style.display = 'block';
                btnMinimize.textContent = '−';
            } else {
                panelContent.style.display = 'none';
                btnMinimize.textContent = '＋';
            }
        };
    }

    if (panelContent) {
        const labels = panelContent.querySelectorAll('label');
        let targetLabel = null;
        labels.forEach(l => { if(l.textContent.includes('二十七宿')) targetLabel = l; });
        if (targetLabel && targetLabel.parentNode && !document.getElementById('toggle-haiku-text')) {
            const containerDiv = targetLabel.parentNode; 
            const newRow = document.createElement('div');
            newRow.style.display = 'flex';
            newRow.style.justifyContent = 'space-between';
            newRow.style.alignItems = 'center';
            newRow.style.marginBottom = '5px';
            newRow.innerHTML = `
                <label style="display:flex; align-items:center; gap:5px; font-size:12px; cursor:pointer;">
                    <input type="checkbox" id="toggle-haiku-text" checked style="accent-color:#d4af37;">
                    俳句 (一番外周)
                </label>
                <button class="layer-settings-btn" data-target="haikuText" style="background:none; border:none; color:#8b949e; cursor:pointer; font-size:14px;">⚙️</button>
            `;
            containerDiv.parentNode.insertBefore(newRow, containerDiv.nextSibling);
        }
    }

    const themeBox = document.querySelector('#layer-panel-content > div:first-child');
    if (themeBox) {
        themeBox.style.background = "rgba(0, 0, 0, 0.3)";
        themeBox.style.borderColor = "rgba(212, 175, 55, 0.3)";
        themeBox.innerHTML = `
            <div style="font-size:12px; color:#d4af37; margin-bottom:8px; font-weight:bold; text-align:center;">テーマ (プリセット) 管理</div>
            <div style="display:flex; gap:5px; margin-bottom:6px; align-items:center;">
                <select id="theme-select" style="flex:1; min-width:0; background:#222; color:#fff; border:1px solid #555; border-radius:4px; font-size:12px; height:26px; box-sizing:border-box; padding:0 4px;">
                    <option value="default">デフォルト設定</option>
                </select>
                <button id="btn-theme-load" style="width:50px; background:#d4af37; border:none; color:#000; border-radius:4px; cursor:pointer; font-weight:bold; font-size:12px; height:26px; box-sizing:border-box; padding:0;">読込</button>
            </div>
            <div style="display:flex; gap:5px; margin-bottom:12px; align-items:center;">
                <input type="text" id="theme-name-input" placeholder="テーマ名を入力" style="flex:1; min-width:0; background:#222; color:#fff; border:1px solid #555; border-radius:4px; font-size:12px; height:26px; box-sizing:border-box; padding:0 6px;">
                <button id="btn-theme-save" style="width:50px; background:rgba(56,189,248,0.2); border:1px solid #38bdf8; color:#38bdf8; border-radius:4px; cursor:pointer; font-weight:bold; font-size:12px; height:26px; box-sizing:border-box; padding:0;">保存</button>
            </div>
            <hr style="border:0; border-top:1px dashed rgba(255,255,255,0.2); margin:0 0 10px 0;">
            <button id="btn-apply-global" style="background:#0ea5e9; color:#fff; border:none; padding:8px 12px; border-radius:4px; cursor:pointer; font-size:12px; font-weight:bold; width:100%; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: 0.2s;">
                デザインを全月適用
            </button>
        `;
        
        const applyBtn = document.getElementById('btn-apply-global');
        if (applyBtn) {
            applyBtn.onmouseover = function() { this.style.background = '#0284c7'; };
            applyBtn.onmouseout = function() { this.style.background = '#0ea5e9'; };
            applyBtn.onclick = () => {
                if(confirm("現在の色や設定を、すべての月の基本デザインとして適用しますか？")) {
                    if(typeof window.applyGlobalSettings === 'function') {
                        window.applyGlobalSettings();
                        if(typeof updateCalendarCycle === 'function') updateCalendarCycle();
                    }
                }
            };
        }
    }

    const designPanel = document.createElement('div');
    designPanel.id = 'design-panel';
    designPanel.className = 'panel-ui';
    designPanel.style = "display:none; position:fixed; top:100px; left:50%; background:rgba(25,30,40,0.95); padding:0 20px 20px 20px; border-radius:12px; border:1px solid rgba(212,175,55,0.5); color:#fff; z-index:200; box-shadow:0 10px 40px rgba(0,0,0,0.8); min-width:320px; backdrop-filter:blur(10px);";
    designPanel.innerHTML = `
        <div id="dp-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid rgba(212,175,55,0.3); padding:12px 0 10px 0; cursor:grab; user-select:none;">
            <div id="dp-title" style="color:#d4af37; font-weight:bold; font-size:15px;">デザイン設定</div>
            <div style="display:flex; gap:10px; align-items:center;">
                <button id="dp-reset" title="この項目を初期化" style="background:rgba(255,100,100,0.2); border:1px solid #ff8888; color:#ff8888; border-radius:4px; font-size:11px; padding:2px 6px; cursor:pointer;">初期化</button>
                <button id="dp-close" style="background:none; border:none; color:#fff; cursor:pointer; font-size:20px; padding:0; line-height:1;">×</button>
            </div>
        </div>
        <div style="display:flex; flex-direction:column; gap:12px; font-size:13px; max-height: 65vh; overflow-y: auto; padding-right: 5px;">
            
            <div id="dp-row-lunar-phase" style="display:none; flex-direction:column; gap:8px;">
                <label style="display:flex; justify-content:space-between; align-items:center; color:#d4af37; font-weight:bold;">編集対象の月相: 
                    <select id="dp-lunar-phase" style="background:#111; color:#d4af37; border:1px solid #d4af37; padding:4px; border-radius:4px; width:150px; font-weight:bold;">
                        <option value="normal">通常 (平月)</option>
                        <option value="newMoon">新月 (一日)</option>
                        <option value="firstQuarter">上弦 (八日)</option>
                        <option value="fullMoon">満月 (十五日)</option>
                        <option value="lastQuarter">下弦 (二十三日)</option>
                    </select>
                </label>
                <hr style="border:0; border-top:1px dashed rgba(255,255,255,0.2); margin:0;">
            </div>

            <div id="dp-group-text" style="display:flex; flex-direction:column; gap:12px;">
                <label id="dp-row-font" style="display:flex; justify-content:space-between; align-items:center;">フォント: 
                    <select id="dp-font" style="background:#222; color:#fff; border:1px solid #555; padding:4px; border-radius:4px; width:150px;">
                        <option value="'Shippori Mincho', serif">明朝体 (Shippori)</option>
                        <option value="'YuMincho', 'Yu Mincho', serif">游明朝 (Yu Mincho)</option>
                        <option value="'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif">ゴシック体 (標準)</option>
                        <option value="'YuGothic', 'Yu Gothic', sans-serif">游ゴシック (Yu Gothic)</option>
                        <option value="'Times New Roman', Times, serif">Times New Roman</option>
                        <option value="Georgia, serif">Georgia</option>
                    </select>
                </label>
                <label id="dp-row-size" style="display:flex; justify-content:space-between; align-items:center;">文字サイズ: 
                    <input type="number" id="dp-size" style="width:60px; background:#222; color:#fff; border:1px solid #555; padding:4px; border-radius:4px;" step="0.5">
                </label>
                <label id="dp-row-lang" style="display:none; justify-content:space-between; align-items:center;">表示言語: 
                    <select id="dp-lang" style="background:#222; color:#fff; border:1px solid #555; padding:4px; border-radius:4px; width:120px;">
                        <option value="en">英語 (Sun-Sat)</option>
                        <option value="ja">日本語 (日-土)</option>
                    </select>
                </label>
                <label id="dp-row-color" style="display:flex; justify-content:space-between; align-items:center;">文字色 (Fill): 
                    <input type="color" id="dp-color" style="background:none; border:none; width:30px; height:30px; cursor:pointer;">
                </label>
                <label id="dp-row-bold" style="display:flex; align-items:center; gap:8px;">
                    <input type="checkbox" id="dp-bold" style="accent-color:#d4af37; width:16px; height:16px;"> 太字にする
                </label>
                <label id="dp-row-stroke-color" style="display:flex; justify-content:space-between; align-items:center;">縁取り色 (Stroke): 
                    <input type="color" id="dp-stroke-color" style="background:none; border:none; width:30px; height:30px; cursor:pointer;">
                </label>
                <label id="dp-row-stroke-width" style="display:flex; justify-content:space-between; align-items:center;">縁取り太さ: 
                    <input type="range" id="dp-stroke-width" min="0" max="5" step="0.1" style="width:100px; accent-color:#d4af37;">
                    <span id="dp-stroke-val" style="width:30px; text-align:right;">0</span>
                </label>
            </div>

            <div id="dp-group-mansion-colors" style="display:none; flex-direction:column; gap:12px; margin-top:5px; padding-top:10px; border-top:1px dashed rgba(255,255,255,0.2);">
                <label style="display:flex; justify-content:space-between; align-items:center;">東方青龍 (角〜箕): <input type="color" id="dp-color-east" style="background:none; border:none; width:30px; height:30px; cursor:pointer;"></label>
                <label style="display:flex; justify-content:space-between; align-items:center;">北方玄武 (斗〜壁): <input type="color" id="dp-color-north" style="background:none; border:none; width:30px; height:30px; cursor:pointer;"></label>
                <label style="display:flex; justify-content:space-between; align-items:center;">西方白虎 (奎〜参): <input type="color" id="dp-color-west" style="background:none; border:none; width:30px; height:30px; cursor:pointer;"></label>
                <label style="display:flex; justify-content:space-between; align-items:center;">南方朱雀 (井〜軫): <input type="color" id="dp-color-south" style="background:none; border:none; width:30px; height:30px; cursor:pointer;"></label>
                <hr style="border:0; border-top:1px dashed rgba(255,255,255,0.2); margin:0;">
                <label style="display:flex; justify-content:space-between; align-items:center;">星の大きさ: <input type="range" id="dp-mansion-star-size" min="0.1" max="5" step="0.1" style="width:100px; accent-color:#d4af37;"> <span id="dp-mansion-star-size-val" style="width:30px; text-align:right;">1.5</span></label>
                <label style="display:flex; justify-content:space-between; align-items:center;">背景帯の色: <input type="color" id="dp-mansion-bg-color" style="background:none; border:none; width:30px; height:30px; cursor:pointer;"></label>
                <label style="display:flex; justify-content:space-between; align-items:center;">背景帯の透明度: <input type="range" id="dp-mansion-bg-opacity" min="0" max="1" step="0.05" style="width:100px; accent-color:#d4af37;"> <span id="dp-mansion-bg-opacity-val" style="width:30px; text-align:right;">0.05</span></label>
            </div>

            <div id="dp-group-shape" style="display:none; flex-direction:column; gap:12px; margin-top:5px; padding-top:10px; border-top:1px dashed rgba(255,255,255,0.2);">
                <label id="dp-row-shape-type" style="display:flex; justify-content:space-between; align-items:center;">背景図形: 
                    <select id="dp-shape" style="background:#222; color:#fff; border:1px solid #555; padding:4px; border-radius:4px; width:100px;">
                        <option value="none">なし</option>
                        <option value="circle">丸</option>
                        <option value="rect">四角</option>
                        <option value="triangle">三角</option>
                        <option value="star">星</option>
                    </select>
                </label>
                <label id="dp-row-shape-scale" style="display:none; justify-content:space-between; align-items:center;">図形のサイズ (倍率): 
                    <input type="range" id="dp-shape-scale" min="0.5" max="4" step="0.1" style="width:100px; accent-color:#d4af37;">
                    <span id="dp-shape-scale-val" style="width:30px; text-align:right;">1</span>
                </label>
                <label id="dp-row-radius-offset" style="display:none; justify-content:space-between; align-items:center;">配置位置 (半径ズラし): 
                    <input type="range" id="dp-radius-offset" min="0" max="800" step="5" style="width:100px; accent-color:#d4af37;">
                    <span id="dp-radius-offset-val" style="width:30px; text-align:right;">0</span>
                </label>
                <label id="dp-row-density" style="display:none; justify-content:space-between; align-items:center;">グラデーション濃度: 
                    <input type="range" id="dp-density" min="0.1" max="1" step="0.05" style="width:100px; accent-color:#d4af37;">
                    <span id="dp-density-val" style="width:30px; text-align:right;">0.35</span>
                </label>
                <label id="dp-row-shape-fill" style="display:flex; justify-content:space-between; align-items:center;">塗りつぶし色: 
                    <div style="display:flex; align-items:center; gap:5px;">
                        <input type="checkbox" id="dp-shape-fill-trans" title="透明にする" style="accent-color:#d4af37;">
                        <span id="dp-shape-fill-trans-text">透明</span>
                        <input type="color" id="dp-shape-fill" style="background:none; border:none; width:30px; height:30px; cursor:pointer;">
                    </div>
                </label>
                <label id="dp-row-shape-stroke" style="display:flex; justify-content:space-between; align-items:center;">線の色: 
                    <div style="display:flex; align-items:center; gap:5px;">
                        <input type="checkbox" id="dp-shape-stroke-orig" title="単色で上書きする" style="display:none; accent-color:#d4af37;">
                        <span id="dp-shape-stroke-orig-text" style="display:none; font-size:11px;">上書きする</span>
                        <input type="color" id="dp-shape-stroke" style="background:none; border:none; width:30px; height:30px; cursor:pointer;">
                    </div>
                </label>
                <label id="dp-row-shape-stroke-width" style="display:flex; justify-content:space-between; align-items:center;">線の太さ: 
                    <input type="range" id="dp-shape-stroke-width" min="0" max="10" step="0.1" style="width:100px; accent-color:#d4af37;">
                    <span id="dp-shape-stroke-width-val" style="width:30px; text-align:right;">0</span>
                </label>
            </div>

            <div id="dp-group-common" style="display:flex; flex-direction:column; gap:12px; margin-top:5px; padding-top:10px; border-top:1px dashed rgba(255,255,255,0.2);">
                <label id="dp-row-opacity" style="display:flex; justify-content:space-between; align-items:center;">透明度 (全体): 
                    <input type="range" id="dp-opacity" min="0" max="1" step="0.05" style="width:100px; accent-color:#d4af37;">
                    <span id="dp-opacity-val" style="width:30px; text-align:right;">1</span>
                </label>
                <label id="dp-row-offset" style="display:flex; justify-content:space-between; align-items:center;">位置 (文字のY軸微調整): 
                    <input type="number" id="dp-offset" style="width:60px; background:#222; color:#fff; border:1px solid #555; padding:4px; border-radius:4px;" step="1">
                </label>
            </div>

        </div>
    `;
    document.body.appendChild(designPanel);

    let isDraggingPanel = false;
    let dpStartX = 0, dpStartY = 0;
    const dpHeader = document.getElementById('dp-header');
    
    if (dpHeader) {
        dpHeader.addEventListener('mousedown', (e) => {
            if(e.target.id === 'dp-close' || e.target.id === 'dp-reset') return;
            isDraggingPanel = true;
            const rect = designPanel.getBoundingClientRect();
            dpStartX = e.clientX - rect.left;
            dpStartY = e.clientY - rect.top;
            dpHeader.style.cursor = 'grabbing';
            designPanel.style.transform = 'none';
            designPanel.style.left = rect.left + 'px';
            designPanel.style.top = rect.top + 'px';
        });
    }

    window.addEventListener('mousemove', (e) => {
        if(isDraggingPanel && designPanel) {
            designPanel.style.left = (e.clientX - dpStartX) + 'px';
            designPanel.style.top = (e.clientY - dpStartY) + 'px';
        }
    });

    window.addEventListener('mouseup', () => {
        isDraggingPanel = false;
        if(dpHeader) dpHeader.style.cursor = 'grab';
    });

    const updateThemeSelect = () => {
        const select = document.getElementById('theme-select');
        if(!select) return;
        select.innerHTML = '<option value="default">デフォルト設定</option>';
        const tMap = window.savedThemes || {};
        for(let name in tMap) {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = name;
            select.appendChild(opt);
        }
    };
    updateThemeSelect();

    const btnThemeSave = document.getElementById('btn-theme-save');
    if (btnThemeSave) {
        btnThemeSave.onclick = () => {
            const nameInput = document.getElementById('theme-name-input');
            const name = nameInput ? nameInput.value.trim() : "";
            if(!name) return alert("保存するテーマ名を入力してください");
            if(!window.savedThemes) window.savedThemes = {};
            window.savedThemes[name] = JSON.parse(JSON.stringify(window.layerSettings));
            localStorage.setItem('polarCalendarThemesV1', JSON.stringify(window.savedThemes));
            updateThemeSelect();
            const sel = document.getElementById('theme-select');
            if(sel) sel.value = name;
            if(nameInput) nameInput.value = "";
            alert(`テーマ「${name}」を保存しました！`);
        };
    }

    const btnThemeLoad = document.getElementById('btn-theme-load');
    if (btnThemeLoad) {
        btnThemeLoad.onclick = () => {
            const sel = document.getElementById('theme-select');
            const name = sel ? sel.value : 'default';
            if(name === 'default') {
                window.layerSettings = JSON.parse(JSON.stringify(window.defaultLayerSettings));
            } else if(window.savedThemes && window.savedThemes[name]) {
                window.layerSettings = JSON.parse(JSON.stringify(window.savedThemes[name]));
            }
            if(typeof window.saveLayerSettings === 'function') window.saveLayerSettings();
            location.reload();
        };
    }

    let currentDesignTarget = null;
    const targetNames = {
        canvasBg: "キャンバス背景", baseSvg: "ベース図形", lunarShadow: "月相シャドウ", astroPins: "天文学的ピン (朔望)", 
        dateLines: "日付区切り線 (30等分)", lunarMansion: "二十七宿", tideGraph: "潮汐波形", rainGraph: "毎時降水量 (棒線)", 
        dailyRainBg: "日別総降水量 (背景)", dailyRainText: "日別総降水量 (数値)", guideTime: "時間ガイド (0/6/12/18)", 
        guideTideLine: "潮位ガイド (ft) 目盛り線", guideTideText: "潮位ガイド (ft) 文字", 
        guideRainLine: "降水量ガイド (mm) 目盛り線", guideRainText: "降水量ガイド (mm) 文字", 
        gregorian: "新暦日付", weekday: "曜日", lunar: "旧暦 (月相対応)", 
        sekki: "24節気", kou: "72候", wafuText: "右上 月名 (旧暦)", gregorianText: "右上 月名 (新暦)", 
        holiday: "祝日 (上段)", zassetsu: "雑節 (中段)", important: "重要年中行事 (下段)", 
        eventShinto: "神事", eventBuddhism: "仏事", eventChurch: "教会行事", eventSonota: "その他",
        haikuText: "俳句 (一番外周)"
    };

    const loadPanelData = () => {
        const st = (window.layerSettings || {})[currentDesignTarget];
        if (!st) return;

        ['dp-row-lunar-phase', 'dp-group-text', 'dp-group-shape', 'dp-row-shape-type', 'dp-row-shape-fill', 'dp-row-shape-stroke', 'dp-row-shape-stroke-width', 'dp-shape-stroke-orig', 'dp-shape-stroke-orig-text', 'dp-row-offset', 'dp-row-lang', 'dp-row-density', 'dp-row-shape-scale', 'dp-row-radius-offset', 'dp-group-mansion-colors'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.style.display = 'none';
        });

        if (currentDesignTarget === 'canvasBg') {
            const op = document.getElementById('dp-row-opacity');
            if(op) op.style.display = 'none';
        } else {
            const op = document.getElementById('dp-row-opacity');
            if(op) op.style.display = 'flex';
            if (st.opacity !== undefined) {
                const dop = document.getElementById('dp-opacity');
                const dval = document.getElementById('dp-opacity-val');
                if(dop) dop.value = st.opacity;
                if(dval) dval.innerText = st.opacity;
            }
        }

        const isTextTarget = ['gregorian', 'weekday', 'sekki', 'kou', 'zassetsu', 'holiday', 'important', 'wafuText', 'gregorianText', 'dailyRainText', 'guideTime', 'guideTideText', 'guideRainText', 'lunarMansion', 'eventShinto', 'eventBuddhism', 'eventChurch', 'eventSonota', 'lunar', 'haikuText'].includes(currentDesignTarget);
        const isShapeTarget = ['baseSvg', 'lunarShadow', 'astroPins', 'dateLines', 'tideGraph', 'rainGraph', 'dailyRainBg', 'guideTideLine', 'guideRainLine', 'canvasBg'].includes(currentDesignTarget);

        if (isTextTarget) {
            const gt = document.getElementById('dp-group-text');
            if(gt) gt.style.display = 'flex';
            const ro = document.getElementById('dp-row-offset');
            if(st.offsetRadius !== undefined && ro) ro.style.display = 'flex';
            
            const df = document.getElementById('dp-font');
            const ds = document.getElementById('dp-size');
            const dof = document.getElementById('dp-offset');
            if(df) df.value = st.fontFamily || "Arial";
            if(ds) ds.value = st.fontSize || 10;
            if(st.offsetRadius !== undefined && dof) dof.value = st.offsetRadius;
            
            if (currentDesignTarget !== 'lunar') {
                const dc = document.getElementById('dp-color');
                const db = document.getElementById('dp-bold');
                const dsc = document.getElementById('dp-stroke-color');
                const dsw = document.getElementById('dp-stroke-width');
                const dsv = document.getElementById('dp-stroke-val');
                if(dc) dc.value = st.fill || "#ffffff";
                if(db) db.checked = st.fontWeight === "bold";
                if(dsc) dsc.value = st.stroke || "#000000";
                if(dsw) dsw.value = st.strokeWidth || 0;
                if(dsv) dsv.innerText = st.strokeWidth || 0;
            }
        }

        if (currentDesignTarget === 'weekday') {
            const rl = document.getElementById('dp-row-lang');
            const dl = document.getElementById('dp-lang');
            if(rl) rl.style.display = 'flex';
            if(dl) dl.value = st.lang || 'en';
        }

        if (currentDesignTarget === 'dailyRainBg') {
            const rd = document.getElementById('dp-row-density');
            const den = document.getElementById('dp-density');
            const dval = document.getElementById('dp-density-val');
            if(rd) rd.style.display = 'flex';
            if(den) den.value = st.density || 0.35;
            if(dval) dval.innerText = st.density || 0.35;
        }

        if (currentDesignTarget === 'lunarMansion') {
            const gmc = document.getElementById('dp-group-mansion-colors');
            if(gmc) gmc.style.display = 'flex';
            const ce = document.getElementById('dp-color-east');
            const cs = document.getElementById('dp-color-south');
            const cw = document.getElementById('dp-color-west');
            const cn = document.getElementById('dp-color-north');
            if(ce) ce.value = st.colorEast || "#888888";
            if(cs) cs.value = st.colorSouth || "#888888";
            if(cw) cw.value = st.colorWest || "#888888";
            if(cn) cn.value = st.colorNorth || "#888888";
            
            const ss = document.getElementById('dp-mansion-star-size');
            const ssv = document.getElementById('dp-mansion-star-size-val');
            if(ss) ss.value = st.starSize !== undefined ? st.starSize : 1.5;
            if(ssv) ssv.innerText = st.starSize !== undefined ? st.starSize : 1.5;
            
            const bc = document.getElementById('dp-mansion-bg-color');
            const bo = document.getElementById('dp-mansion-bg-opacity');
            const bov = document.getElementById('dp-mansion-bg-opacity-val');
            if(bc) bc.value = st.bgRingColor || "#ffffff";
            if(bo) bo.value = st.bgRingOpacity !== undefined ? st.bgRingOpacity : 0.05;
            if(bov) bov.innerText = st.bgRingOpacity !== undefined ? st.bgRingOpacity : 0.05;

            const rc = document.getElementById('dp-row-color');
            const rsc = document.getElementById('dp-row-stroke-color');
            const rsw = document.getElementById('dp-row-stroke-width');
            if(rc) rc.style.display = 'none';
            if(rsc) rsc.style.display = 'none';
            if(rsw) rsw.style.display = 'none';
        }

        if (isShapeTarget) {
            const gs = document.getElementById('dp-group-shape');
            if(gs) gs.style.display = 'flex';
            
            if (currentDesignTarget === 'astroPins') {
                const rss = document.getElementById('dp-row-shape-scale');
                const sss = document.getElementById('dp-shape-scale');
                const ssv = document.getElementById('dp-shape-scale-val');
                if(rss) rss.style.display = 'flex';
                if(sss) sss.value = st.scale || 1;
                if(ssv) ssv.innerText = st.scale || 1;
                
                const rro = document.getElementById('dp-row-radius-offset');
                const dro = document.getElementById('dp-radius-offset');
                const drov = document.getElementById('dp-radius-offset-val');
                if(rro) rro.style.display = 'flex';
                if(dro) dro.value = st.radiusOffset || 0;
                if(drov) drov.innerText = st.radiusOffset || 0;
            }

            if (currentDesignTarget === 'canvasBg' || currentDesignTarget === 'dailyRainBg') {
                const rsf = document.getElementById('dp-row-shape-fill');
                const rst = document.getElementById('dp-row-shape-stroke');
                const rstw = document.getElementById('dp-row-shape-stroke-width');
                const ft = document.getElementById('dp-shape-fill-trans');
                const ftt = document.getElementById('dp-shape-fill-trans-text');
                if(rsf) rsf.style.display = 'flex';
                if(rst) rst.style.display = 'none';
                if(rstw) rstw.style.display = 'none';
                if(ft) ft.style.display = 'none';
                if(ftt) ftt.style.display = 'none';
            } else {
                const rsf = document.getElementById('dp-row-shape-fill');
                const rst = document.getElementById('dp-row-shape-stroke');
                const ft = document.getElementById('dp-shape-fill-trans');
                const ftt = document.getElementById('dp-shape-fill-trans-text');
                if(rsf) rsf.style.display = 'flex';
                if(rst) rst.style.display = 'flex';
                if (currentDesignTarget !== 'baseSvg') {
                    const rstw = document.getElementById('dp-row-shape-stroke-width');
                    if(rstw) rstw.style.display = 'flex';
                }
                if(ft) ft.style.display = 'inline-block';
                if(ftt) ftt.style.display = 'inline-block';
            }

            if(st.fill !== undefined) {
                const isTrans = (st.fill === "none" || st.fill === "transparent");
                const ft = document.getElementById('dp-shape-fill-trans');
                const sf = document.getElementById('dp-shape-fill');
                if(ft) ft.checked = isTrans;
                if(sf) sf.value = isTrans ? "#000000" : st.fill;
            }
            
            if(st.stroke !== undefined || st.shapeStroke !== undefined) {
                const ss = document.getElementById('dp-shape-stroke');
                const ssw = document.getElementById('dp-shape-stroke-width');
                const sswv = document.getElementById('dp-shape-stroke-width-val');
                if(ss) ss.value = st.stroke !== undefined ? st.stroke : st.shapeStroke;
                if(ssw) ssw.value = st.strokeWidth !== undefined ? st.strokeWidth : st.shapeStrokeWidth;
                if(sswv && ssw) sswv.innerText = ssw.value;
            }

            if (currentDesignTarget === 'baseSvg') {
                const rsf = document.getElementById('dp-row-shape-fill');
                const sso = document.getElementById('dp-shape-stroke-orig');
                const ssot = document.getElementById('dp-shape-stroke-orig-text');
                const ss = document.getElementById('dp-shape-stroke');
                if(rsf) rsf.style.display = 'none';
                if(sso) sso.style.display = 'inline-block';
                if(ssot) ssot.style.display = 'inline-block';
                const isOrig = (st.stroke === "");
                if(sso) sso.checked = !isOrig;
                if(ss) ss.value = isOrig ? "#000000" : st.stroke;
            } else {
                const sso = document.getElementById('dp-shape-stroke-orig');
                const ssot = document.getElementById('dp-shape-stroke-orig-text');
                if(sso) sso.style.display = 'none';
                if(ssot) ssot.style.display = 'none';
            }
        }

        if (currentDesignTarget === 'lunar') {
            const rlp = document.getElementById('dp-row-lunar-phase');
            const gs = document.getElementById('dp-group-shape');
            if(rlp) rlp.style.display = 'flex';
            if(gs) gs.style.display = 'flex';
            ['dp-row-shape-type', 'dp-row-shape-scale', 'dp-row-shape-fill', 'dp-row-shape-stroke', 'dp-row-shape-stroke-width'].forEach(id => {
                const el = document.getElementById(id);
                if(el) el.style.display = 'flex';
            });

            const lp = document.getElementById('dp-lunar-phase');
            if(lp) {
                const phase = lp.value;
                const pst = st.phases[phase];
                const dc = document.getElementById('dp-color');
                const db = document.getElementById('dp-bold');
                if(dc) pst.fill = dc.value;
                if(db) st.fontWeight = db.checked ? "bold" : "normal";
                
                const dsh = document.getElementById('dp-shape');
                const sc = document.getElementById('dp-shape-scale');
                if(dsh) pst.shape = dsh.value;
                if(sc) {
                    pst.scale = parseFloat(sc.value);
                    const scv = document.getElementById('dp-shape-scale-val');
                    if(scv) scv.innerText = pst.scale;
                }
                
                const ft = document.getElementById('dp-shape-fill-trans');
                const sf = document.getElementById('dp-shape-fill');
                if(ft && sf) pst.bgFill = ft.checked ? "transparent" : sf.value;
                
                const ss = document.getElementById('dp-shape-stroke');
                const ssw = document.getElementById('dp-shape-stroke-width');
                if(ss) pst.shapeStroke = ss.value;
                if(ssw) {
                    pst.shapeStrokeWidth = parseFloat(ssw.value);
                    const sswv = document.getElementById('dp-shape-stroke-width-val');
                    if(sswv) sswv.innerText = pst.shapeStrokeWidth;
                }
            }
        }
    };

    const dpClose = document.getElementById('dp-close');
    if (dpClose) {
        dpClose.onclick = () => { designPanel.style.display = 'none'; };
    }

    const dpReset = document.getElementById('dp-reset');
    if (dpReset) {
        dpReset.onclick = () => {
            if (confirm(`「${targetNames[currentDesignTarget]}」のデザイン設定を初期状態に戻しますか？`)) {
                if (window.defaultLayerSettings && window.layerSettings) {
                    window.layerSettings[currentDesignTarget] = JSON.parse(JSON.stringify(window.defaultLayerSettings[currentDesignTarget]));
                    if(typeof window.saveLayerSettings === 'function') window.saveLayerSettings();
                    loadPanelData();
                    if (typeof updateDesign === 'function') updateDesign();
                }
            }
        };
    }

    const resetAll = document.getElementById('reset-all-settings');
    if (resetAll) {
        resetAll.onclick = () => {
            if (confirm('⚠️ すべてのデザイン設定を完全に初期化しますか？\n（各月のデザイン設定もすべて消去されます）')) {
                localStorage.removeItem('polarCalendarSettingsV5');
                window.appSettings = { global: JSON.parse(JSON.stringify(window.defaultLayerSettings)), months: {} };
                window.layerSettings = JSON.parse(JSON.stringify(window.defaultLayerSettings));
                if(typeof window.saveLayerSettings === 'function') window.saveLayerSettings();
                location.reload();
            }
        };
    }

    document.addEventListener('click', (e) => {
        if (e.target && e.target.classList && e.target.classList.contains('layer-settings-btn')) {
            currentDesignTarget = e.target.getAttribute('data-target');
            const dt = document.getElementById('dp-title');
            if(dt) dt.innerText = `${targetNames[currentDesignTarget]} の設定`;
            if(designPanel) {
                designPanel.style.transform = 'translate(-50%, -50%)';
                designPanel.style.left = '50%';
                designPanel.style.top = '50%';
                loadPanelData();
                designPanel.style.display = 'block';
            }
        }
    });

    const updateDesign = () => {
        if (!currentDesignTarget || !window.layerSettings) return;
        const st = window.layerSettings[currentDesignTarget];
        if (!st) return;

        const op = document.getElementById('dp-opacity');
        if(op && op.style.display !== 'none') {
            st.opacity = parseFloat(op.value);
            const opv = document.getElementById('dp-opacity-val');
            if(opv) opv.innerText = st.opacity;
        }

        const isTextTarget = ['gregorian', 'weekday', 'sekki', 'kou', 'zassetsu', 'holiday', 'important', 'wafuText', 'gregorianText', 'dailyRainText', 'guideTime', 'guideTideText', 'guideRainText', 'lunarMansion', 'eventShinto', 'eventBuddhism', 'eventChurch', 'eventSonota', 'lunar', 'haikuText'].includes(currentDesignTarget);

        if (isTextTarget) {
            const df = document.getElementById('dp-font');
            const ds = document.getElementById('dp-size');
            const dof = document.getElementById('dp-offset');
            if(df) st.fontFamily = df.value;
            if(ds) st.fontSize = parseFloat(ds.value);
            if(st.offsetRadius !== undefined && dof) st.offsetRadius = parseFloat(dof.value);
            
            if (currentDesignTarget !== 'lunar') {
                const dc = document.getElementById('dp-color');
                const db = document.getElementById('dp-bold');
                const dsc = document.getElementById('dp-stroke-color');
                const dsw = document.getElementById('dp-stroke-width');
                const dsv = document.getElementById('dp-stroke-val');
                if(dc) st.fill = dc.value;
                if(db) st.fontWeight = db.checked ? "bold" : "normal";
                if(dsc) st.stroke = dsc.value;
                if(dsw) {
                    st.strokeWidth = parseFloat(dsw.value);
                    if(dsv) dsv.innerText = st.strokeWidth;
                }
            }
        }

        if (currentDesignTarget === 'weekday') {
            const dl = document.getElementById('dp-lang');
            if(dl) st.lang = dl.value;
        }
        
        if (currentDesignTarget === 'dailyRainBg') {
            const den = document.getElementById('dp-density');
            if(den) {
                st.density = parseFloat(den.value);
                const dval = document.getElementById('dp-density-val');
                if(dval) dval.innerText = st.density;
            }
        }

        if (currentDesignTarget === 'lunarMansion') {
            const ce = document.getElementById('dp-color-east');
            const cs = document.getElementById('dp-color-south');
            const cw = document.getElementById('dp-color-west');
            const cn = document.getElementById('dp-color-north');
            if(ce) st.colorEast = ce.value;
            if(cs) st.colorSouth = cs.value;
            if(cw) st.colorWest = cw.value;
            if(cn) st.colorNorth = cn.value;
            
            const ss = document.getElementById('dp-mansion-star-size');
            if(ss) {
                st.starSize = parseFloat(ss.value);
                const ssv = document.getElementById('dp-mansion-star-size-val');
                if(ssv) ssv.innerText = st.starSize;
            }
            const bc = document.getElementById('dp-mansion-bg-color');
            const bo = document.getElementById('dp-mansion-bg-opacity');
            if(bc) st.bgRingColor = bc.value;
            if(bo) {
                st.bgRingOpacity = parseFloat(bo.value);
                const bov = document.getElementById('dp-mansion-bg-opacity-val');
                if(bov) bov.innerText = st.bgRingOpacity;
            }
        }

        if (currentDesignTarget === 'canvasBg') {
            const sf = document.getElementById('dp-shape-fill');
            if(sf) {
                st.fill = sf.value;
                document.body.style.backgroundColor = st.fill;
            }
        }

        const isShapeTarget = ['baseSvg', 'lunarShadow', 'astroPins', 'dateLines', 'tideGraph', 'rainGraph', 'dailyRainBg', 'guideTideLine', 'guideRainLine'].includes(currentDesignTarget);

        if(isShapeTarget) {
            const ft = document.getElementById('dp-shape-fill-trans');
            const sf = document.getElementById('dp-shape-fill');
            if(st.fill !== undefined && ft && sf) {
                st.fill = ft.checked ? "none" : sf.value;
            }
            
            if (currentDesignTarget === 'astroPins') {
                const sc = document.getElementById('dp-shape-scale');
                if(sc) {
                    st.scale = parseFloat(sc.value);
                    const scv = document.getElementById('dp-shape-scale-val');
                    if(scv) scv.innerText = st.scale;
                }
                const ro = document.getElementById('dp-radius-offset');
                if(ro) {
                    st.radiusOffset = parseFloat(ro.value);
                    const rov = document.getElementById('dp-radius-offset-val');
                    if(rov) rov.innerText = st.radiusOffset;
                }
            }

            if(currentDesignTarget === 'baseSvg') {
                const sso = document.getElementById('dp-shape-stroke-orig');
                const ss = document.getElementById('dp-shape-stroke');
                if(sso && ss) st.stroke = sso.checked ? ss.value : "";
            } else if (currentDesignTarget !== 'canvasBg' && currentDesignTarget !== 'dailyRainBg') {
                const ss = document.getElementById('dp-shape-stroke');
                const ssw = document.getElementById('dp-shape-stroke-width');
                if(st.stroke !== undefined && ss) st.stroke = ss.value;
                if(st.strokeWidth !== undefined && ssw) st.strokeWidth = parseFloat(ssw.value);
                if(st.shapeStroke !== undefined && ss) st.shapeStroke = ss.value;
                if(st.shapeStrokeWidth !== undefined && ssw) st.shapeStrokeWidth = parseFloat(ssw.value);
            }
            const ssw = document.getElementById('dp-shape-stroke-width');
            const sswv = document.getElementById('dp-shape-stroke-width-val');
            if(sswv && ssw) sswv.innerText = ssw.value;
        }

        if (currentDesignTarget === 'lunar') {
            const lp = document.getElementById('dp-lunar-phase');
            if(lp) {
                const phase = lp.value;
                const pst = st.phases[phase];
                const dc = document.getElementById('dp-color');
                const db = document.getElementById('dp-bold');
                if(dc) pst.fill = dc.value;
                if(db) st.fontWeight = db.checked ? "bold" : "normal";
                
                const dsh = document.getElementById('dp-shape');
                const sc = document.getElementById('dp-shape-scale');
                if(dsh) pst.shape = dsh.value;
                if(sc) {
                    pst.scale = parseFloat(sc.value);
                    const scv = document.getElementById('dp-shape-scale-val');
                    if(scv) scv.innerText = pst.scale;
                }
                
                const ft = document.getElementById('dp-shape-fill-trans');
                const sf = document.getElementById('dp-shape-fill');
                if(ft && sf) pst.bgFill = ft.checked ? "transparent" : sf.value;
                
                const ss = document.getElementById('dp-shape-stroke');
                const ssw = document.getElementById('dp-shape-stroke-width');
                if(ss) pst.shapeStroke = ss.value;
                if(ssw) {
                    pst.shapeStrokeWidth = parseFloat(ssw.value);
                    const sswv = document.getElementById('dp-shape-stroke-width-val');
                    if(sswv) sswv.innerText = pst.shapeStrokeWidth;
                }
            }
        }

        if(typeof window.saveLayerSettings === 'function') window.saveLayerSettings();

        if (currentDesignTarget === 'baseSvg') {
            const bgGroup = document.getElementById('bg-group') || window.bgGroup;
            if(bgGroup) {
                bgGroup.style.opacity = st.opacity;
                Array.from(bgGroup.querySelectorAll('*')).forEach(el => {
                    if (st.stroke !== "") {
                        el.setAttribute('stroke', st.stroke);
                    } else {
                        const orig = el.getAttribute('data-orig-stroke');
                        if(orig) el.setAttribute('stroke', orig);
                        else el.removeAttribute('stroke');
                    }
                });
            }
        } else if (currentDesignTarget === 'dateLines') {
            if (typeof drawDynamicLines === 'function') drawDynamicLines();
        } else if (currentDesignTarget === 'tideGraph' || currentDesignTarget === 'guideTideLine' || currentDesignTarget === 'guideTideText') {
            if (window.lastCycleStartTimeMs && typeof drawTideGraph === 'function') drawTideGraph(window.lastCycleStartTimeMs);
        } else if (currentDesignTarget === 'rainGraph' || currentDesignTarget === 'guideRainLine' || currentDesignTarget === 'guideRainText') {
            if (window.lastCycleStartTimeMs && typeof drawRainfallGraph === 'function') drawRainfallGraph(window.lastCycleStartTimeMs);
        } else if (currentDesignTarget === 'lunarShadow') {
            if (window.lastCycleStartTimeMs && typeof drawLunarShadow === 'function') drawLunarShadow(window.lastCycleStartTimeMs);
        } else if (currentDesignTarget === 'astroPins') {
            if (window.lastCycleStartTimeMs && typeof drawAstronomicalPins === 'function') drawAstronomicalPins(window.lastCycleStartTimeMs);
        } else if (currentDesignTarget === 'lunarMansion') {
            if (window.lastCycleStartTimeMs && typeof drawLunarMansions === 'function') drawLunarMansions(window.lastCycleStartTimeMs);
        } else if (currentDesignTarget === 'guideTime') {
            if (typeof drawTimeLabels === 'function') drawTimeLabels();
        } else if (currentDesignTarget === 'dailyRainBg' || currentDesignTarget === 'dailyRainText') {
            if (window.lastKoyomiStartDate && typeof drawDailyRainStats === 'function') drawDailyRainStats(window.lastKoyomiStartDate);
        } else if (window.lastKoyomiStartDate) {
            if (typeof drawKoyomiEvents === 'function') drawKoyomiEvents(window.lastKoyomiStartDate);
        }
        
        if (currentDesignTarget === 'haikuText' && window.lastKoyomiStartDate) {
            if (typeof drawHaikus === 'function') drawHaikus(window.lastKoyomiStartDate);
        }
    };

    ['dp-lunar-phase', 'dp-font', 'dp-size', 'dp-color', 'dp-bold', 'dp-stroke-color', 'dp-stroke-width', 'dp-shape', 'dp-shape-scale', 'dp-lang', 'dp-density', 'dp-color-east', 'dp-color-south', 'dp-color-west', 'dp-color-north', 'dp-mansion-star-size', 'dp-mansion-bg-color', 'dp-mansion-bg-opacity', 'dp-shape-fill-trans', 'dp-shape-fill', 'dp-shape-stroke-orig', 'dp-shape-stroke', 'dp-shape-stroke-width', 'dp-opacity', 'dp-offset', 'dp-radius-offset'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (id === 'dp-lunar-phase') el.addEventListener('change', loadPanelData);
            else el.addEventListener('input', updateDesign);
        }
    });

    const pBtn = document.getElementById('prevBtn');
    if (pBtn) {
        pBtn.onclick = () => {
            if (typeof currentCycle !== 'undefined') window.currentCycle--;
            if (typeof updateCalendarCycle === 'function') updateCalendarCycle();
            if (designPanel && designPanel.style.display === 'block') loadPanelData();
        };
    }

    const nBtn = document.getElementById('nextBtn');
    if (nBtn) {
        nBtn.onclick = () => {
            if (typeof currentCycle !== 'undefined') window.currentCycle++;
            if (typeof updateCalendarCycle === 'function') updateCalendarCycle();
            if (designPanel && designPanel.style.display === 'block') loadPanelData();
        };
    }

    const prBtn = document.getElementById('printBtn');
    if (prBtn) prBtn.onclick = () => window.print();

    const cycleDisplay = document.getElementById('cycleDisplay');
    if (cycleDisplay) {
        cycleDisplay.onmouseover = () => { cycleDisplay.style.background = "rgba(255,255,255,0.1)"; };
        cycleDisplay.onmouseout = () => { cycleDisplay.style.background = "transparent"; };
        cycleDisplay.onclick = () => {
            if(jumpDiv) jumpDiv.style.display = jumpDiv.style.display === 'none' ? 'flex' : 'none';
        };
    }

    const jGo = document.getElementById('jumpGoBtn');
    if (jGo) {
        jGo.onclick = () => {
            const jInp = document.getElementById('jumpInput');
            if(!jInp || !jInp.value) return;
            const targetDate = new Date(jInp.value + "-15");
            const bDate = typeof baseDate !== 'undefined' ? baseDate : new Date('2025-12-20T00:00:00+09:00');
            const sMonth = typeof synodicMonth !== 'undefined' ? synodicMonth : 29.530588853;
            const diffMs = targetDate.getTime() - bDate.getTime();
            const diffDays = diffMs / (1000 * 60 * 60 * 24);
            window.currentCycle = Math.round(diffDays / sMonth);
            if(jumpDiv) jumpDiv.style.display = 'none';
            if (typeof updateCalendarCycle === 'function') updateCalendarCycle();
            if (designPanel && designPanel.style.display === 'block') loadPanelData();
        };
    }

    const btnPointer = document.getElementById('tool-pointer');
    const btnPaint = document.getElementById('tool-paint');
    const btnErase = document.getElementById('tool-erase');

    const setTool = (tool, mode = null) => {
        window.currentTool = tool;
        if (tool === 'pointer' && mode) window.interactionMode = mode;
        
        [btnPointer, btnPaint, btnErase].forEach(b => {
            if(b) {
                b.style.background = 'transparent';
                b.style.borderColor = 'transparent';
                b.style.color = '#fff';
            }
        });

        if (paletteDiv) paletteDiv.style.display = (tool === 'paint') ? 'grid' : 'none';

        const activeBtn = tool === 'pointer' ? btnPointer : tool === 'paint' ? btnPaint : btnErase;
        if (activeBtn) {
            activeBtn.style.background = 'rgba(212,175,55,0.85)';
            activeBtn.style.borderColor = '#d4af37';
            activeBtn.style.color = '#000';
        }

        if (tool === 'pointer' && btnPointer) {
            if (window.interactionMode === 'pan') {
                btnPointer.innerHTML = typeof iconPan !== 'undefined' ? iconPan : '👆';
                btnPointer.title = "移動 (V)";
            } else {
                btnPointer.innerHTML = typeof iconRotate !== 'undefined' ? iconRotate : '🔄';
                btnPointer.title = "回転 (V)";
            }
        }

        // ★ カーソルを強制適用するCSSを注入してIビーム（文字選択十字）を無効化
        let cursorStyle = 'default';
        if (tool === 'pointer') cursorStyle = window.interactionMode === 'pan' ? 'grab' : 'ew-resize';
        else if (tool === 'paint') cursorStyle = 'crosshair';
        else if (tool === 'erase') cursorStyle = 'cell';

        let cursorStyleBlock = document.getElementById("cursor-style-block");
        if (!cursorStyleBlock) {
            cursorStyleBlock = document.createElement("style");
            cursorStyleBlock.id = "cursor-style-block";
            document.head.appendChild(cursorStyleBlock);
        }
        cursorStyleBlock.innerHTML = `
            #calendar-container, #calendar-container svg { cursor: ${cursorStyle} !important; }
            #calendar-container svg text { cursor: inherit; user-select: none; -webkit-user-select: none; }
            #calendar-container svg text[style*="cursor: pointer"] { cursor: pointer !important; }
        `;
    };

    window.previousTool = 'pointer';
    window.isSpacePressed = false;

    document.addEventListener('keydown', (e) => {
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
        if (e.code === 'Space') {
            e.preventDefault();
            if (!window.isSpacePressed) {
                window.isSpacePressed = true;
                window.previousTool = window.currentTool || 'pointer';
                setTool('pointer', 'pan');
            }
            return;
        }
        const key = e.key.toLowerCase();
        if (key === 'v') setTool('pointer', window.interactionMode === 'pan' ? 'rotate' : 'pan');
        if (key === 'b') setTool('paint');
        if (key === 'e') setTool('erase');
    });

    document.addEventListener('keyup', (e) => {
        if (e.code === 'Space') {
            window.isSpacePressed = false;
            setTool(window.previousTool || 'pointer');
        }
    });

    if(btnPointer) btnPointer.onclick = () => setTool('pointer', window.interactionMode === 'pan' ? 'rotate' : 'pan');
    if(btnPaint) btnPaint.onclick = () => setTool('paint');
    if(btnErase) btnErase.onclick = () => setTool('erase');

    const hBtn = document.getElementById('homeBtn');
    if (hBtn) {
        hBtn.onclick = () => {
            window.globalRotation = -(window.currentStartSegment || 0) * 3;
            if (window.masterGroup) window.masterGroup.setAttribute('transform', `rotate(${window.globalRotation}, ${typeof cx !== 'undefined'?cx:0}, ${typeof cy !== 'undefined'?cy:0})`);
            const vb = typeof viewBox !== 'undefined' ? viewBox : { x: -841.89 / 2, y: -841.89 / 2, w: 841.89, h: 841.89 };
            window.viewBox = { x: 0, y: 0, w: 1841.3719, h: 2382.9518 }; 
            if (window.svg) window.svg.setAttribute('viewBox', `${window.viewBox.x} ${window.viewBox.y} ${window.viewBox.w} ${window.viewBox.h}`);
        };
    }

    const colors = [
        "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9",
        "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e", "#fb7185", "#a8a29e", "#57534e"
    ];

    window.activeBrush = window.activeBrush || colors[0];

    colors.forEach(color => {
        const div = document.createElement('div');
        div.style = `width:100%; aspect-ratio:1; background-color:${color}; border-radius:4px; border:2px solid transparent; cursor:pointer; transition:0.1s; box-sizing:border-box;`;
        if(color === window.activeBrush) {
            div.style.borderColor = '#fff';
            div.style.transform = 'scale(1.1)';
        }
        div.onclick = () => {
            if(paletteDiv) {
                paletteDiv.querySelectorAll('div').forEach(el => {
                    el.style.borderColor = 'transparent';
                    el.style.transform = 'scale(1)';
                });
            }
            div.style.borderColor = '#fff';
            div.style.transform = 'scale(1.1)';
            window.activeBrush = color;
        };
        if(paletteDiv) paletteDiv.appendChild(div);
    });

    const cBtn = document.getElementById('clearBtn');
    if (cBtn) {
        cBtn.onclick = () => {
            if(window.currentTool !== 'paint') return alert("ペン(B)で消したい色を選択してください。");
            if(confirm(`現在の月（輪）から、選択中の色をすべて削除しますか？`)) {
                const cData = window.calendarData || {};
                for (const key in cData) {
                    if (key.startsWith(`c${window.currentCycle || 0}_`) && cData[key].color === window.activeBrush) delete cData[key];
                }
                localStorage.setItem('polarCalendarDataV27', JSON.stringify(cData));
                if (typeof renderSavedData === 'function') renderSavedData();
            }
        };
    }

    setTool('pointer', 'pan');

    let styleBlock = document.getElementById("layer-style-block");
    if (!styleBlock) {
        styleBlock = document.createElement("style");
        styleBlock.id = "layer-style-block";
        document.head.appendChild(styleBlock);
    }

    const updateLayerVisibility = () => {
        let css = "";
        const addHiddenRule = (selector) => { css += `${selector} { display: none !important; }\n`; };

        const check = (id) => { const el = document.getElementById(id); return el ? el.checked : true; };

        if(!check("toggle-base-svg")) addHiddenRule("#bg-group");
        if(!check("toggle-lunar-shadow")) addHiddenRule("#layer-shadow");
        if(!check("toggle-astro-pins")) addHiddenRule("#layer-astronomical-pins");
        if(!check("toggle-layer-lunar")) addHiddenRule("#layer-lunar-mansion");
        if(!check("toggle-tide-graph")) addHiddenRule("#layer-tide-wave");
        if(!check("toggle-rain-graph")) addHiddenRule("#layer-rain-graph");
        if(!check("toggle-daily-rain-bg")) addHiddenRule("#layer-daily-rain-bg");
        if(!check("toggle-daily-rain-text")) addHiddenRule("#layer-daily-rain-text");
        if(!check("toggle-date-lines")) addHiddenRule("#layer-lines");
        if(!check("toggle-guide-time")) addHiddenRule("#layer-guide-time");
        if(!check("toggle-haiku-text")) addHiddenRule("#layer-haiku"); 
        
        if(!check("toggle-guide-tide-line")) addHiddenRule(".layer-guide-tide-line");
        if(!check("toggle-guide-tide-text")) addHiddenRule(".layer-guide-tide-text");
        if(!check("toggle-guide-rain-line")) addHiddenRule(".layer-guide-rain-line");
        if(!check("toggle-guide-rain-text")) addHiddenRule(".layer-guide-rain-text");

        if(!check("toggle-date-gregorian")) addHiddenRule(".layer-date-gregorian");
        if(!check("toggle-date-lunar")) addHiddenRule(".layer-date-lunar");
        if(!check("toggle-date-weekday")) addHiddenRule(".layer-date-weekday");
        if(!check("toggle-wafu-text")) addHiddenRule(".layer-wafu-text");
        if(!check("toggle-gregorian-text")) addHiddenRule(".layer-gregorian-text");
        if(!check("toggle-sekki")) addHiddenRule(".layer-sekki");
        if(!check("toggle-kou")) addHiddenRule(".layer-kou");
        if(!check("toggle-zassetsu")) addHiddenRule(".layer-zassetsu");
        if(!check("toggle-holiday")) addHiddenRule(".layer-holiday");
        if(!check("toggle-event-important")) addHiddenRule(".layer-event-important");

        if (styleBlock) styleBlock.innerHTML = css;

        if (typeof drawKoyomiEvents === 'function' && window.lastKoyomiStartDate) {
            drawKoyomiEvents(window.lastKoyomiStartDate);
        }
    };

    document.body.addEventListener("change", (e) => {
        if (e.target && e.target.type === 'checkbox' && e.target.id && e.target.id.startsWith('toggle-')) {
            updateLayerVisibility();
        }
    });
    updateLayerVisibility();
}

window.openHaikuModal = function(dateStr, haikus) {
    let modal = document.getElementById('haiku-modal');
    if(!modal) {
        modal = document.createElement('div');
        modal.id = 'haiku-modal';
        modal.style = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.8); z-index:9999; display:flex; justify-content:center; align-items:center; opacity:0; transition:opacity 0.3s;";
        modal.innerHTML = `
            <div style="background:#fdfbf7; padding:50px 40px 40px 40px; border-radius:8px; max-width:80%; max-height:80%; overflow-x:auto; overflow-y:hidden; display:flex; flex-direction:column; align-items:center; position:relative; box-shadow:0 10px 40px rgba(0,0,0,0.8); border: 1px solid #d4af37;">
                <button id="haiku-modal-close" style="position:absolute; top:10px; right:15px; background:none; border:none; font-size:28px; cursor:pointer; color:#888;">×</button>
                <div id="haiku-modal-date" style="font-family:'Shippori Mincho', serif; font-size:16px; color:#888; margin-bottom:20px; letter-spacing:2px;"></div>
                <div id="haiku-modal-content" style="font-family:'Shippori Mincho', serif; font-size:18px; color:#2c3e50; writing-mode: vertical-rl; max-height: 60vh; text-align: left;">
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        const closeBtn = document.getElementById('haiku-modal-close');
        if(closeBtn) {
            closeBtn.onclick = () => {
                modal.style.opacity = '0';
                setTimeout(() => modal.style.display = 'none', 300);
            };
        }
        modal.onclick = (e) => {
            if(e.target === modal) {
                modal.style.opacity = '0';
                setTimeout(() => modal.style.display = 'none', 300);
            }
        };
    }
    
    const dEl = document.getElementById('haiku-modal-date');
    if(dEl) dEl.textContent = dateStr.replace(/-/g, '年').replace(/年(\d+)$/, '月$1日');
    
    const content = document.getElementById('haiku-modal-content');
    if(content) {
        content.innerHTML = '';
        haikus.forEach(h => {
            const div = document.createElement('div');
            div.style = "border-left:1px dashed rgba(212, 175, 55, 0.5); margin-left:20px; padding-left:20px; line-height:2; letter-spacing:3px;";
            div.textContent = h;
            content.appendChild(div);
        });
    }
    
    modal.style.display = 'flex';
    void modal.offsetWidth; 
    modal.style.opacity = '1';
};

function initInteractions() {
    const appContainer = document.getElementById('calendar-container') || document.body;
    
    appContainer.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomFactor = e.deltaY > 0 ? 1.05 : 0.95;
        if (typeof window.svg === 'undefined' || !window.svg) return;
        const pt = window.svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgP = pt.matrixTransform(window.svg.getScreenCTM().inverse());
        
        const vb = window.viewBox || { x: -841.89 / 2, y: -841.89 / 2, w: 841.89, h: 841.89 };
        vb.w *= zoomFactor;
        vb.h *= zoomFactor;
        vb.x = svgP.x - (svgP.x - vb.x) * zoomFactor;
        vb.y = svgP.y - (svgP.y - vb.y) * zoomFactor;
        
        window.svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
    }, { passive: false });

    window.isInteractionActive = false;
    window.startPos = { x: 0, y: 0 };
    window.dragDistance = 0;
    window.startGlobalRotation = 0;
    window.startAngleOffset = 0;
    window.lastPaintedCell = null;

    appContainer.addEventListener('mousedown', (e) => {
        window.dragDistance = 0;
        window.isInteractionActive = true;
        window.lastPaintedCell = null;

        if (window.currentTool === 'pointer') {
            const cur = window.interactionMode === 'pan' ? 'grabbing' : 'ew-resize';
            
            // ★ マウスダウン時も強制的にカーソルを上書き
            let cursorStyleBlock = document.getElementById("cursor-style-block");
            if (cursorStyleBlock) {
                cursorStyleBlock.innerHTML = `
                    #calendar-container, #calendar-container svg { cursor: ${cur} !important; }
                    #calendar-container svg text { cursor: inherit; user-select: none; -webkit-user-select: none; }
                    #calendar-container svg text[style*="cursor: pointer"] { cursor: pointer !important; }
                `;
            }

            if (window.interactionMode === 'rotate') {
                if(typeof window.svg === 'undefined' || !window.svg) return;
                const pt = window.svg.createSVGPoint();
                pt.x = e.clientX;
                pt.y = e.clientY;
                const svgP = pt.matrixTransform(window.svg.getScreenCTM().inverse());
                window.startAngleOffset = Math.atan2(svgP.y - (typeof cy !== 'undefined'?cy:0), svgP.x - (typeof cx !== 'undefined'?cx:0)) * 180 / Math.PI;
                window.startGlobalRotation = window.globalRotation || 0;
            } else {
                window.startPos = { x: e.clientX, y: e.clientY };
            }
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (window.isInteractionActive && window.currentTool === 'pointer') {
            if (window.interactionMode === 'pan') {
                const dxScreen = window.startPos.x - e.clientX, dyScreen = window.startPos.y - e.clientY;
                window.dragDistance += Math.abs(dxScreen) + Math.abs(dyScreen);
                const vb = window.viewBox;
                if(vb && appContainer && typeof window.svg !== 'undefined' && window.svg) {
                    vb.x += dxScreen * (vb.w / appContainer.clientWidth);
                    vb.y += dyScreen * (vb.h / appContainer.clientHeight);
                    window.svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
                }
                window.startPos = { x: e.clientX, y: e.clientY };
            } else if (window.interactionMode === 'rotate') {
                if(typeof window.svg === 'undefined' || !window.svg) return;
                const pt = window.svg.createSVGPoint();
                pt.x = e.clientX;
                pt.y = e.clientY;
                const svgP = pt.matrixTransform(window.svg.getScreenCTM().inverse());
                const currentAngleOffset = Math.atan2(svgP.y - (typeof cy !== 'undefined'?cy:0), svgP.x - (typeof cx !== 'undefined'?cx:0)) * 180 / Math.PI;
                
                let delta = currentAngleOffset - window.startAngleOffset;
                if (delta > 180) delta -= 360;
                if (delta < -180) delta += 360;
                
                window.globalRotation = window.startGlobalRotation + delta;
                if(typeof window.masterGroup !== 'undefined' && window.masterGroup) {
                    window.masterGroup.setAttribute('transform', `rotate(${window.globalRotation}, ${typeof cx !== 'undefined'?cx:0}, ${typeof cy !== 'undefined'?cy:0})`);
                }
                window.dragDistance += Math.abs(delta) * 5;
                window.startGlobalRotation = window.globalRotation;
                window.startAngleOffset = currentAngleOffset;
            }
        }

        if (typeof window.svg === 'undefined' || !window.svg || typeof window.masterGroup === 'undefined' || !window.masterGroup) return;
        const pt = window.svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const ptM = pt.matrixTransform(window.masterGroup.getScreenCTM().inverse());
        const dx = ptM.x - (typeof cx !== 'undefined'?cx:0), dy = ptM.y - (typeof cy !== 'undefined'?cy:0);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        let angle = Math.atan2(dy, dx) * (180 / Math.PI);
        angle = (angle + 90 + 360) % 360;
        
        const absSegment = Math.floor(angle / 3);
        let ringInfo = null;
        if (typeof getRingInfo === 'function') ringInfo = getRingInfo(distance);

        let sb = document.getElementById('status-bar');
        if(!sb) {
            sb = document.createElement('div');
            sb.id = 'status-bar';
            document.body.appendChild(sb);
        }

        if (ringInfo) {
            const relSegment = (absSegment - (window.currentStartSegment || 0) + 120) % 120;
            const day = Math.floor(relSegment / 4) + 1;
            const timeSlot = relSegment % 4;
            const timeLabels = ["0:00〜6:00", "6:00〜12:00", "12:00〜18:00", "18:00〜24:00"];
            
            sb.innerText = `第 ${day} 日目 ｜ ${timeLabels[timeSlot]} ｜ ${ringInfo.name}`;
            sb.style.color = "#fff";

            if (window.isInteractionActive && (window.currentTool === 'paint' || window.currentTool === 'erase')) {
                const cellKey = `c${window.currentCycle || 0}_abs${absSegment}_${ringInfo.layerId}`;
                if (window.lastPaintedCell !== cellKey) {
                    const cData = window.calendarData || {};
                    if (window.currentTool === 'erase') delete cData[cellKey];
                    else cData[cellKey] = { color: window.activeBrush, absSegment: absSegment, rIn: ringInfo.rIn, rOut: ringInfo.rOut };
                    if (typeof renderSavedData === 'function') renderSavedData();
                    window.lastPaintedCell = cellKey;
                }
            }
        } else {
            sb.innerText = `キャンバス外`;
            sb.style.color = "#8b949e";
        }
    });

    window.addEventListener('mouseup', () => {
        window.isInteractionActive = false;
        if (window.currentTool === 'pointer') {
            const cur = window.interactionMode === 'pan' ? 'grab' : 'ew-resize';
            
            // ★ マウスを離した時もカーソルを元に戻す
            let cursorStyleBlock = document.getElementById("cursor-style-block");
            if (cursorStyleBlock) {
                cursorStyleBlock.innerHTML = `
                    #calendar-container, #calendar-container svg { cursor: ${cur} !important; }
                    #calendar-container svg text { cursor: inherit; user-select: none; -webkit-user-select: none; }
                    #calendar-container svg text[style*="cursor: pointer"] { cursor: pointer !important; }
                `;
            }
        }
        if (typeof window.calendarData !== 'undefined') localStorage.setItem('polarCalendarDataV27', JSON.stringify(window.calendarData));
    });

    if(typeof window.svg !== 'undefined' && window.svg) {
        window.svg.addEventListener('click', (e) => {
            if (window.dragDistance > 5 || window.currentTool === 'pointer') return;
            const pt = window.svg.createSVGPoint();
            pt.x = e.clientX;
            pt.y = e.clientY;
            if(typeof window.masterGroup === 'undefined' || !window.masterGroup) return;
            const ptM = pt.matrixTransform(window.masterGroup.getScreenCTM().inverse());
            const dx = ptM.x - (typeof cx !== 'undefined'?cx:0), dy = ptM.y - (typeof cy !== 'undefined'?cy:0);
            const distance = Math.sqrt(dx * dx + dy * dy);
            let angle = Math.atan2(dy, dx) * (180 / Math.PI);
            angle = (angle + 90 + 360) % 360;
            
            const absSegment = Math.floor(angle / 3);
            let ringInfo = null;
            if(typeof getRingInfo === 'function') ringInfo = getRingInfo(distance);
            if (!ringInfo) return;

            const cellKey = `c${window.currentCycle || 0}_abs${absSegment}_${ringInfo.layerId}`;
            const cData = window.calendarData || {};
            
            if (window.currentTool === 'erase') delete cData[cellKey];
            else if (window.currentTool === 'paint') {
                cData[cellKey] = { color: window.activeBrush, absSegment: absSegment, rIn: ringInfo.rIn, rOut: ringInfo.rOut };
            }
            
            localStorage.setItem('polarCalendarDataV27', JSON.stringify(cData));
            if(typeof renderSavedData === 'function') renderSavedData();
        });
    }
}
