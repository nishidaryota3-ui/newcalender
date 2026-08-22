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
        <button id="tool-pointer" title="移動/回転切替 (V)" style="width:26px; height:26px; border-radius:4px; cursor:pointer; background:rgba(212,175,55,0.85); border:1px solid #d4af37; color:#000; padding:0; display:flex; justify-content:center; align-items:center;">${iconPan}</button>
        <button id="tool-paint" title="塗る (B)" style="width:26px; height:26px; border-radius:4px; cursor:pointer; background:transparent; border:1px solid transparent; color:#fff; padding:0; display:flex; justify-content:center; align-items:center;">${iconPaint}</button>
        <button id="tool-erase" title="消す (E)" style="width:26px; height:26px; border-radius:4px; cursor:pointer; background:transparent; border:1px solid transparent; color:#fff; padding:0; display:flex; justify-content:center; align-items:center;">${iconErase}</button>
        <hr style="border-color:rgba(255,255,255,0.1); width:100%; margin:4px 0;">
        <button id="clearBtn" title="選択色を全消去" style="width:26px; height:26px; border-radius:4px; cursor:pointer; background:transparent; border:1px solid transparent; color:#fff; padding:0; display:flex; justify-content:center; align-items:center;">${iconTrash}</button>
        <button id="printBtn" title="印刷 (A3)" style="width:26px; height:26px; border-radius:4px; cursor:pointer; background:transparent; border:1px solid transparent; color:#38bdf8; padding:0; display:flex; justify-content:center; align-items:center;">${iconPrint}</button>
        <hr style="border-color:rgba(255,255,255,0.1); width:100%; margin:4px 0;">
        <button id="homeBtn" title="新月を真上にリセット" style="width:26px; height:26px; border-radius:4px; cursor:pointer; background:transparent; border:1px solid transparent; color:#38bdf8; padding:0; display:flex; justify-content:center; align-items:center;">${iconHome}</button>
    `;
    document.body.appendChild(toolsDiv);

    const paletteDiv = document.createElement('div');
    paletteDiv.className = 'panel-ui';
    paletteDiv.id = 'palette-container';
    paletteDiv.style = "position:fixed; top:134px; left:74px; background:rgba(25,30,40,0.9); padding:10px; border-radius:8px; z-index:99; border: 1px solid rgba(255,255,255,0.1); display:none; grid-template-columns:repeat(4, 1fr); gap:6px; width:120px; box-sizing:border-box;";
    document.body.appendChild(paletteDiv);

    const btnMinimize = document.getElementById('btn-minimize-panel');
    const panelContent = document.getElementById('layer-panel-content');
    if (btnMinimize && panelContent) {
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

    // ★ プリセット管理と全月一括適用のハイブリッドUI
    const themeBox = document.querySelector('#layer-panel-content > div:first-child');
    if (themeBox) {
        themeBox.style.background = "rgba(0, 0, 0, 0.3)";
        themeBox.style.borderColor = "rgba(212, 175, 55, 0.3)";
        themeBox.innerHTML = `
            <div style="font-size:12px; color:#d4af37; margin-bottom:5px; font-weight:bold;">テーマ (プリセット) 管理</div>
            <div style="display:flex; gap:5px; margin-bottom:8px;">
                <select id="theme-select" style="flex:1; background:#222; color:#fff; border:1px solid #555; padding:4px; border-radius:4px; font-size:12px;">
                    <option value="default">デフォルト設定</option>
                </select>
                <button id="btn-theme-load" style="background:#d4af37; border:none; color:#000; padding:4px 8px; border-radius:4px; cursor:pointer; font-weight:bold; font-size:12px;">読込</button>
            </div>
            <div style="display:flex; gap:5px; margin-bottom:12px;">
                <input type="text" id="theme-name-input" placeholder="テーマ名を入力" style="flex:1; background:#222; color:#fff; border:1px solid #555; padding:4px; border-radius:4px; font-size:12px;">
                <button id="btn-theme-save" style="background:rgba(56,189,248,0.2); border:1px solid #38bdf8; color:#38bdf8; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:12px;">保存</button>
            </div>
            
            <hr style="border:0; border-top:1px dashed rgba(255,255,255,0.2); margin:0 0 10px 0;">
            
            <div style="font-size:10px; color:#38bdf8; margin-bottom:6px; font-weight:bold; text-align:center; white-space:nowrap; letter-spacing:-0.2px;">
                ※デザインの変更は「表示中の月」に自動保存されます
            </div>
            <button id="btn-apply-global" style="background:#0ea5e9; color:#fff; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:12px; font-weight:bold; width:100%; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: 0.2s;">
                デザインを全月適用
            </button>
        `;
        
        document.getElementById('btn-apply-global').onmouseover = function() { this.style.background = '#0284c7'; };
        document.getElementById('btn-apply-global').onmouseout = function() { this.style.background = '#0ea5e9'; };
        document.getElementById('btn-apply-global').onclick = () => {
            if(confirm("現在の色や設定を、すべての月の基本デザインとして適用しますか？")) {
                if(typeof window.applyGlobalSettings === 'function') {
                    window.applyGlobalSettings();
                    updateCalendarCycle();
                }
            }
        };
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

    window.addEventListener('mousemove', (e) => {
        if(isDraggingPanel) {
            designPanel.style.left = (e.clientX - dpStartX) + 'px';
            designPanel.style.top = (e.clientY - dpStartY) + 'px';
        }
    });

    window.addEventListener('mouseup', () => {
        isDraggingPanel = false;
        if(dpHeader) dpHeader.style.cursor = 'grab';
    });

    // ★ プリセット管理のイベントリスナー（復活）
    const updateThemeSelect = () => {
        const select = document.getElementById('theme-select');
        if(!select) return;
        select.innerHTML = '<option value="default">デフォルト設定</option>';
        for(let name in window.savedThemes) {
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
            const name = document.getElementById('theme-name-input').value.trim();
            if(!name) return alert("保存するテーマ名を入力してください");
            window.savedThemes[name] = JSON.parse(JSON.stringify(window.layerSettings));
            localStorage.setItem('polarCalendarThemesV1', JSON.stringify(window.savedThemes));
            updateThemeSelect();
            document.getElementById('theme-select').value = name;
            document.getElementById('theme-name-input').value = "";
            alert(`テーマ「${name}」を保存しました！`);
        };
    }

    const btnThemeLoad = document.getElementById('btn-theme-load');
    if (btnThemeLoad) {
        btnThemeLoad.onclick = () => {
            const name = document.getElementById('theme-select').value;
            if(name === 'default') {
                window.layerSettings = JSON.parse(JSON.stringify(window.defaultLayerSettings));
            } else if(window.savedThemes[name]) {
                window.layerSettings = JSON.parse(JSON.stringify(window.savedThemes[name]));
            }
            window.saveLayerSettings();
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
        eventShinto: "神事", eventBuddhism: "仏事", eventChurch: "教会行事", eventSonota: "その他"
    };

    const loadPanelData = () => {
        const st = window.layerSettings[currentDesignTarget];
        if (!st) return;

        ['dp-row-lunar-phase', 'dp-group-text', 'dp-group-shape', 'dp-row-shape-type', 'dp-row-shape-fill', 'dp-row-shape-stroke', 'dp-row-shape-stroke-width', 'dp-shape-stroke-orig', 'dp-shape-stroke-orig-text', 'dp-row-offset', 'dp-row-lang', 'dp-row-density', 'dp-row-shape-scale', 'dp-row-radius-offset', 'dp-group-mansion-colors'].forEach(id => {
            document.getElementById(id).style.display = 'none';
        });

        if (currentDesignTarget === 'canvasBg') {
            document.getElementById('dp-row-opacity').style.display = 'none';
        } else {
            document.getElementById('dp-row-opacity').style.display = 'flex';
            if (st.opacity !== undefined) {
                document.getElementById('dp-opacity').value = st.opacity;
                document.getElementById('dp-opacity-val').innerText = st.opacity;
            }
        }

        const isTextTarget = ['gregorian', 'weekday', 'sekki', 'kou', 'zassetsu', 'holiday', 'important', 'wafuText', 'gregorianText', 'dailyRainText', 'guideTime', 'guideTideText', 'guideRainText', 'lunarMansion', 'eventShinto', 'eventBuddhism', 'eventChurch', 'eventSonota', 'lunar'].includes(currentDesignTarget);
        const isShapeTarget = ['baseSvg', 'lunarShadow', 'astroPins', 'dateLines', 'tideGraph', 'rainGraph', 'dailyRainBg', 'guideTideLine', 'guideRainLine', 'canvasBg'].includes(currentDesignTarget);

        if (isTextTarget) {
            document.getElementById('dp-group-text').style.display = 'flex';
            if(st.offsetRadius !== undefined) document.getElementById('dp-row-offset').style.display = 'flex';
            
            document.getElementById('dp-font').value = st.fontFamily || "Arial";
            document.getElementById('dp-size').value = st.fontSize || 10;
            if(st.offsetRadius !== undefined) document.getElementById('dp-offset').value = st.offsetRadius;
            
            if (currentDesignTarget !== 'lunar') {
                document.getElementById('dp-color').value = st.fill || "#ffffff";
                document.getElementById('dp-bold').checked = st.fontWeight === "bold";
                document.getElementById('dp-stroke-color').value = st.stroke || "#000000";
                document.getElementById('dp-stroke-width').value = st.strokeWidth || 0;
                document.getElementById('dp-stroke-val').innerText = st.strokeWidth || 0;
            }
        }

        if (currentDesignTarget === 'weekday') {
            document.getElementById('dp-row-lang').style.display = 'flex';
            document.getElementById('dp-lang').value = st.lang || 'en';
        }

        if (currentDesignTarget === 'dailyRainBg') {
            document.getElementById('dp-row-density').style.display = 'flex';
            document.getElementById('dp-density').value = st.density || 0.35;
            document.getElementById('dp-density-val').innerText = st.density || 0.35;
        }

        if (currentDesignTarget === 'lunarMansion') {
            document.getElementById('dp-group-mansion-colors').style.display = 'flex';
            document.getElementById('dp-color-east').value = st.colorEast || "#888888";
            document.getElementById('dp-color-south').value = st.colorSouth || "#888888";
            document.getElementById('dp-color-west').value = st.colorWest || "#888888";
            document.getElementById('dp-color-north').value = st.colorNorth || "#888888";
            
            document.getElementById('dp-mansion-star-size').value = st.starSize !== undefined ? st.starSize : 1.5;
            document.getElementById('dp-mansion-star-size-val').innerText = st.starSize !== undefined ? st.starSize : 1.5;
            document.getElementById('dp-mansion-bg-color').value = st.bgRingColor || "#ffffff";
            document.getElementById('dp-mansion-bg-opacity').value = st.bgRingOpacity !== undefined ? st.bgRingOpacity : 0.05;
            document.getElementById('dp-mansion-bg-opacity-val').innerText = st.bgRingOpacity !== undefined ? st.bgRingOpacity : 0.05;

            document.getElementById('dp-row-color').style.display = 'none';
            document.getElementById('dp-row-stroke-color').style.display = 'none';
            document.getElementById('dp-row-stroke-width').style.display = 'none';
        }

        if (isShapeTarget) {
            document.getElementById('dp-group-shape').style.display = 'flex';
            
            if (currentDesignTarget === 'astroPins') {
                document.getElementById('dp-row-shape-scale').style.display = 'flex';
                document.getElementById('dp-shape-scale').value = st.scale || 1;
                document.getElementById('dp-shape-scale-val').innerText = st.scale || 1;
                
                document.getElementById('dp-row-radius-offset').style.display = 'flex';
                document.getElementById('dp-radius-offset').value = st.radiusOffset || 0;
                document.getElementById('dp-radius-offset-val').innerText = st.radiusOffset || 0;
            }

            if (currentDesignTarget === 'canvasBg' || currentDesignTarget === 'dailyRainBg') {
                document.getElementById('dp-row-shape-fill').style.display = 'flex';
                document.getElementById('dp-row-shape-stroke').style.display = 'none';
                document.getElementById('dp-row-shape-stroke-width').style.display = 'none';
                document.getElementById('dp-shape-fill-trans').style.display = 'none';
                document.getElementById('dp-shape-fill-trans-text').style.display = 'none';
            } else {
                document.getElementById('dp-row-shape-fill').style.display = 'flex';
                document.getElementById('dp-row-shape-stroke').style.display = 'flex';
                if (currentDesignTarget !== 'baseSvg') {
                    document.getElementById('dp-row-shape-stroke-width').style.display = 'flex';
                }
                document.getElementById('dp-shape-fill-trans').style.display = 'inline-block';
                document.getElementById('dp-shape-fill-trans-text').style.display = 'inline-block';
            }

            if(st.fill !== undefined) {
                const isTrans = (st.fill === "none" || st.fill === "transparent");
                document.getElementById('dp-shape-fill-trans').checked = isTrans;
                document.getElementById('dp-shape-fill').value = isTrans ? "#000000" : st.fill;
            }
            
            if(st.stroke !== undefined || st.shapeStroke !== undefined) {
                document.getElementById('dp-shape-stroke').value = st.stroke !== undefined ? st.stroke : st.shapeStroke;
                document.getElementById('dp-shape-stroke-width').value = st.strokeWidth !== undefined ? st.strokeWidth : st.shapeStrokeWidth;
                if(document.getElementById('dp-shape-stroke-width-val')) {
                    document.getElementById('dp-shape-stroke-width-val').innerText = document.getElementById('dp-shape-stroke-width').value;
                }
            }

            if (currentDesignTarget === 'baseSvg') {
                document.getElementById('dp-row-shape-fill').style.display = 'none';
                document.getElementById('dp-shape-stroke-orig').style.display = 'inline-block';
                document.getElementById('dp-shape-stroke-orig-text').style.display = 'inline-block';
                const isOrig = (st.stroke === "");
                document.getElementById('dp-shape-stroke-orig').checked = !isOrig;
                document.getElementById('dp-shape-stroke').value = isOrig ? "#000000" : st.stroke;
            } else {
                document.getElementById('dp-shape-stroke-orig').style.display = 'none';
                document.getElementById('dp-shape-stroke-orig-text').style.display = 'none';
            }
        }

        if (currentDesignTarget === 'lunar') {
            document.getElementById('dp-row-lunar-phase').style.display = 'flex';
            document.getElementById('dp-group-shape').style.display = 'flex';
            ['dp-row-shape-type', 'dp-row-shape-scale', 'dp-row-shape-fill', 'dp-row-shape-stroke', 'dp-row-shape-stroke-width'].forEach(id => document.getElementById(id).style.display = 'flex');

            const phase = document.getElementById('dp-lunar-phase').value;
            const pst = st.phases[phase];
            
            document.getElementById('dp-color').value = pst.fill;
            document.getElementById('dp-bold').checked = (st.fontWeight === "bold");
            
            document.getElementById('dp-shape').value = pst.shape;
            document.getElementById('dp-shape-scale').value = pst.scale || 1;
            document.getElementById('dp-shape-scale-val').innerText = pst.scale || 1;
            
            const isTrans = (pst.bgFill === "transparent" || pst.bgFill === "none");
            document.getElementById('dp-shape-fill-trans').checked = isTrans;
            document.getElementById('dp-shape-fill-trans-text').innerText = "透明";
            document.getElementById('dp-shape-fill').value = isTrans ? "#000000" : pst.bgFill;
            
            document.getElementById('dp-shape-stroke').value = pst.shapeStroke;
            document.getElementById('dp-shape-stroke-width').value = pst.shapeStrokeWidth;
            document.getElementById('dp-shape-stroke-width-val').innerText = pst.shapeStrokeWidth;
        }
    };

    document.getElementById('dp-close').onclick = () => {
        designPanel.style.display = 'none';
    };

    document.getElementById('dp-reset').onclick = () => {
        if (confirm(`「${targetNames[currentDesignTarget]}」のデザイン設定を初期状態に戻しますか？`)) {
            window.layerSettings[currentDesignTarget] = JSON.parse(JSON.stringify(window.defaultLayerSettings[currentDesignTarget]));
            window.saveLayerSettings();
            loadPanelData();
            updateDesign();
        }
    };

    document.getElementById('reset-all-settings').onclick = () => {
        if (confirm('⚠️ すべてのデザイン設定を完全に初期化しますか？\n（各月のデザイン設定もすべて消去されます）')) {
            localStorage.removeItem('polarCalendarSettingsV5');
            window.appSettings = { global: JSON.parse(JSON.stringify(window.defaultLayerSettings)), months: {} };
            window.layerSettings = JSON.parse(JSON.stringify(window.defaultLayerSettings));
            window.saveLayerSettings();
            location.reload();
        }
    };

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('layer-settings-btn')) {
            currentDesignTarget = e.target.getAttribute('data-target');
            document.getElementById('dp-title').innerText = `${targetNames[currentDesignTarget]} の設定`;
            designPanel.style.transform = 'translate(-50%, -50%)';
            designPanel.style.left = '50%';
            designPanel.style.top = '50%';
            loadPanelData();
            designPanel.style.display = 'block';
        }
    });

    const updateDesign = () => {
        if (!currentDesignTarget) return;
        const st = window.layerSettings[currentDesignTarget];

        if(document.getElementById('dp-opacity').style.display !== 'none') {
            st.opacity = parseFloat(document.getElementById('dp-opacity').value);
            document.getElementById('dp-opacity-val').innerText = st.opacity;
        }

        const isTextTarget = ['gregorian', 'weekday', 'sekki', 'kou', 'zassetsu', 'holiday', 'important', 'wafuText', 'gregorianText', 'dailyRainText', 'guideTime', 'guideTideText', 'guideRainText', 'lunarMansion', 'eventShinto', 'eventBuddhism', 'eventChurch', 'eventSonota', 'lunar'].includes(currentDesignTarget);

        if (isTextTarget) {
            st.fontFamily = document.getElementById('dp-font').value;
            st.fontSize = parseFloat(document.getElementById('dp-size').value);
            if(st.offsetRadius !== undefined) st.offsetRadius = parseFloat(document.getElementById('dp-offset').value);
            
            if (currentDesignTarget !== 'lunar') {
                st.fill = document.getElementById('dp-color').value;
                st.fontWeight = document.getElementById('dp-bold').checked ? "bold" : "normal";
                st.stroke = document.getElementById('dp-stroke-color').value;
                st.strokeWidth = parseFloat(document.getElementById('dp-stroke-width').value);
                document.getElementById('dp-stroke-val').innerText = st.strokeWidth;
            }
        }

        if (currentDesignTarget === 'weekday') st.lang = document.getElementById('dp-lang').value;
        
        if (currentDesignTarget === 'dailyRainBg') {
            st.density = parseFloat(document.getElementById('dp-density').value);
            document.getElementById('dp-density-val').innerText = st.density;
        }

        if (currentDesignTarget === 'lunarMansion') {
            st.colorEast = document.getElementById('dp-color-east').value;
            st.colorSouth = document.getElementById('dp-color-south').value;
            st.colorWest = document.getElementById('dp-color-west').value;
            st.colorNorth = document.getElementById('dp-color-north').value;
            
            st.starSize = parseFloat(document.getElementById('dp-mansion-star-size').value);
            document.getElementById('dp-mansion-star-size-val').innerText = st.starSize;
            st.bgRingColor = document.getElementById('dp-mansion-bg-color').value;
            st.bgRingOpacity = parseFloat(document.getElementById('dp-mansion-bg-opacity').value);
            document.getElementById('dp-mansion-bg-opacity-val').innerText = st.bgRingOpacity;
        }

        if (currentDesignTarget === 'canvasBg') {
            st.fill = document.getElementById('dp-shape-fill').value;
            document.body.style.backgroundColor = st.fill;
        }

        const isShapeTarget = ['baseSvg', 'lunarShadow', 'astroPins', 'dateLines', 'tideGraph', 'rainGraph', 'dailyRainBg', 'guideTideLine', 'guideRainLine'].includes(currentDesignTarget);

        if(isShapeTarget) {
            if(st.fill !== undefined) st.fill = document.getElementById('dp-shape-fill-trans').checked ? "none" : document.getElementById('dp-shape-fill').value;
            
            if (currentDesignTarget === 'astroPins') {
                st.scale = parseFloat(document.getElementById('dp-shape-scale').value);
                document.getElementById('dp-shape-scale-val').innerText = st.scale;
                
                st.radiusOffset = parseFloat(document.getElementById('dp-radius-offset').value);
                document.getElementById('dp-radius-offset-val').innerText = st.radiusOffset;
            }

            if(currentDesignTarget === 'baseSvg') {
                st.stroke = document.getElementById('dp-shape-stroke-orig').checked ? document.getElementById('dp-shape-stroke').value : "";
            } else if (currentDesignTarget !== 'canvasBg' && currentDesignTarget !== 'dailyRainBg') {
                if(st.stroke !== undefined) st.stroke = document.getElementById('dp-shape-stroke').value;
                if(st.strokeWidth !== undefined) st.strokeWidth = parseFloat(document.getElementById('dp-shape-stroke-width').value);
                if(st.shapeStroke !== undefined) st.shapeStroke = document.getElementById('dp-shape-stroke').value;
                if(st.shapeStrokeWidth !== undefined) st.shapeStrokeWidth = parseFloat(document.getElementById('dp-shape-stroke-width').value);
            }
            if(document.getElementById('dp-shape-stroke-width-val')) {
                document.getElementById('dp-shape-stroke-width-val').innerText = document.getElementById('dp-shape-stroke-width').value;
            }
        }

        if (currentDesignTarget === 'lunar') {
            const phase = document.getElementById('dp-lunar-phase').value;
            const pst = st.phases[phase];
            pst.fill = document.getElementById('dp-color').value;
            st.fontWeight = document.getElementById('dp-bold').checked ? "bold" : "normal";
            
            pst.shape = document.getElementById('dp-shape').value;
            pst.scale = parseFloat(document.getElementById('dp-shape-scale').value);
            document.getElementById('dp-shape-scale-val').innerText = pst.scale;
            
            pst.bgFill = document.getElementById('dp-shape-fill-trans').checked ? "transparent" : document.getElementById('dp-shape-fill').value;
            pst.shapeStroke = document.getElementById('dp-shape-stroke').value;
            pst.shapeStrokeWidth = parseFloat(document.getElementById('dp-shape-stroke-width').value);
            document.getElementById('dp-shape-stroke-width-val').innerText = pst.shapeStrokeWidth;
        }

        window.saveLayerSettings();

        if (currentDesignTarget === 'baseSvg') {
            const bgGroup = document.getElementById('bg-group');
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
        } else if (currentDesignTarget === 'canvasBg') {
        } else if (currentDesignTarget === 'dateLines') {
            if (typeof drawDynamicLines === 'function') drawDynamicLines();
        } else if (currentDesignTarget === 'tideGraph' || currentDesignTarget === 'guideTideLine' || currentDesignTarget === 'guideTideText') {
            if (window.lastCycleStartTimeMs) drawTideGraph(window.lastCycleStartTimeMs);
        } else if (currentDesignTarget === 'rainGraph' || currentDesignTarget === 'guideRainLine' || currentDesignTarget === 'guideRainText') {
            if (window.lastCycleStartTimeMs) drawRainfallGraph(window.lastCycleStartTimeMs);
        } else if (currentDesignTarget === 'lunarShadow') {
            if (window.lastCycleStartTimeMs) drawLunarShadow(window.lastCycleStartTimeMs);
        } else if (currentDesignTarget === 'astroPins') {
            if (typeof drawAstronomicalPins === 'function' && window.lastCycleStartTimeMs) drawAstronomicalPins(window.lastCycleStartTimeMs);
        } else if (currentDesignTarget === 'lunarMansion') {
            if (window.lastCycleStartTimeMs) drawLunarMansions(window.lastCycleStartTimeMs);
        } else if (currentDesignTarget === 'guideTime') {
            drawTimeLabels();
        } else if (currentDesignTarget === 'dailyRainBg' || currentDesignTarget === 'dailyRainText') {
            if (window.lastKoyomiStartDate) drawDailyRainStats(window.lastKoyomiStartDate);
        } else if (window.lastKoyomiStartDate) {
            if (typeof drawKoyomiEvents === 'function') drawKoyomiEvents(window.lastKoyomiStartDate);
        }
    };

    ['dp-lunar-phase', 'dp-font', 'dp-size', 'dp-color', 'dp-bold', 'dp-stroke-color', 'dp-stroke-width', 'dp-shape', 'dp-shape-scale', 'dp-lang', 'dp-density', 'dp-color-east', 'dp-color-south', 'dp-color-west', 'dp-color-north', 'dp-mansion-star-size', 'dp-mansion-bg-color', 'dp-mansion-bg-opacity', 'dp-shape-fill-trans', 'dp-shape-fill', 'dp-shape-stroke-orig', 'dp-shape-stroke', 'dp-shape-stroke-width', 'dp-opacity', 'dp-offset', 'dp-radius-offset'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (id === 'dp-lunar-phase') el.addEventListener('change', loadPanelData);
            else el.addEventListener('input', updateDesign);
        }
    });

    document.getElementById('prevBtn').onclick = () => {
        currentCycle--;
        updateCalendarCycle();
        if (document.getElementById('design-panel').style.display === 'block') loadPanelData();
    };

    document.getElementById('nextBtn').onclick = () => {
        currentCycle++;
        updateCalendarCycle();
        if (document.getElementById('design-panel').style.display === 'block') loadPanelData();
    };

    document.getElementById('printBtn').onclick = () => window.print();

    const cycleDisplay = document.getElementById('cycleDisplay');
    cycleDisplay.onmouseover = () => { cycleDisplay.style.background = "rgba(255,255,255,0.1)"; };
    cycleDisplay.onmouseout = () => { cycleDisplay.style.background = "transparent"; };
    cycleDisplay.onclick = () => {
        jumpDiv.style.display = jumpDiv.style.display === 'none' ? 'flex' : 'none';
    };

    document.getElementById('jumpGoBtn').onclick = () => {
        const val = document.getElementById('jumpInput').value;
        if(!val) return;
        const targetDate = new Date(val + "-15");
        const diffMs = targetDate.getTime() - baseDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        currentCycle = Math.round(diffDays / synodicMonth);
        jumpDiv.style.display = 'none';
        updateCalendarCycle();
        if (document.getElementById('design-panel').style.display === 'block') loadPanelData();
    };

    const btnPointer = document.getElementById('tool-pointer');
    const btnPaint = document.getElementById('tool-paint');
    const btnErase = document.getElementById('tool-erase');

    const setTool = (tool, mode = null) => {
        currentTool = tool;
        if (tool === 'pointer' && mode) interactionMode = mode;
        
        [btnPointer, btnPaint, btnErase].forEach(b => {
            b.style.background = 'transparent';
            b.style.borderColor = 'transparent';
            b.style.color = '#fff';
        });

        paletteDiv.style.display = (tool === 'paint') ? 'grid' : 'none';

        const activeBtn = tool === 'pointer' ? btnPointer : tool === 'paint' ? btnPaint : btnErase;
        activeBtn.style.background = 'rgba(212,175,55,0.85)';
        activeBtn.style.borderColor = '#d4af37';
        activeBtn.style.color = '#000';

        if (currentTool === 'pointer') {
            if (interactionMode === 'pan') {
                btnPointer.innerHTML = iconPan;
                btnPointer.title = "移動 (V)";
            } else {
                btnPointer.innerHTML = iconRotate;
                btnPointer.title = "回転 (V)";
            }
        }

        if (tool === 'pointer') container.style.cursor = interactionMode === 'pan' ? 'grab' : 'ew-resize';
        else if (tool === 'paint') container.style.cursor = 'crosshair';
        else if (tool === 'erase') container.style.cursor = 'cell';
    };

    let previousTool = 'pointer';
    let isSpacePressed = false;

    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.code === 'Space') {
            e.preventDefault();
            if (!isSpacePressed) {
                isSpacePressed = true;
                previousTool = currentTool;
                setTool('pointer', 'pan');
            }
            return;
        }
        const key = e.key.toLowerCase();
        if (key === 'v') setTool('pointer', interactionMode === 'pan' ? 'rotate' : 'pan');
        if (key === 'b') setTool('paint');
        if (key === 'e') setTool('erase');
    });

    document.addEventListener('keyup', (e) => {
        if (e.code === 'Space') {
            isSpacePressed = false;
            setTool(previousTool);
        }
    });

    btnPointer.onclick = () => setTool('pointer', interactionMode === 'pan' ? 'rotate' : 'pan');
    btnPaint.onclick = () => setTool('paint');
    btnErase.onclick = () => setTool('erase');

    document.getElementById('homeBtn').onclick = () => {
        globalRotation = -currentStartSegment * 3;
        masterGroup.setAttribute('transform', `rotate(${globalRotation}, ${cx}, ${cy})`);
        viewBox = { x: 0, y: 0, w: 1841.3719, h: 2382.9518 };
        svg.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`);
    };

    const colors = [
        "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9",
        "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e", "#fb7185", "#a8a29e", "#57534e"
    ];

    colors.forEach(color => {
        const div = document.createElement('div');
        div.style = `width:100%; aspect-ratio:1; background-color:${color}; border-radius:4px; border:2px solid transparent; cursor:pointer; transition:0.1s; box-sizing:border-box;`;
        if(color === activeBrush) {
            div.style.borderColor = '#fff';
            div.style.transform = 'scale(1.1)';
        }
        div.onclick = () => {
            paletteDiv.querySelectorAll('div').forEach(el => {
                el.style.borderColor = 'transparent';
                el.style.transform = 'scale(1)';
            });
            div.style.borderColor = '#fff';
            div.style.transform = 'scale(1.1)';
            activeBrush = color;
        };
        paletteDiv.appendChild(div);
    });

    document.getElementById('clearBtn').onclick = () => {
        if(currentTool !== 'paint') return alert("ペン(B)で消したい色を選択してください。");
        if(confirm(`現在の月（輪）から、選択中の色をすべて削除しますか？`)) {
            for (const key in calendarData) {
                if (key.startsWith(`c${currentCycle}_`) && calendarData[key].color === activeBrush) delete calendarData[key];
            }
            localStorage.setItem('polarCalendarDataV27', JSON.stringify(calendarData));
            renderSavedData();
        }
    };

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

        if(!document.getElementById("toggle-base-svg")?.checked) addHiddenRule("#bg-group");
        if(!document.getElementById("toggle-lunar-shadow")?.checked) addHiddenRule("#layer-shadow");
        if(!document.getElementById("toggle-astro-pins")?.checked) addHiddenRule("#layer-astronomical-pins");
        if(!document.getElementById("toggle-layer-lunar")?.checked) addHiddenRule("#layer-lunar-mansion");
        if(!document.getElementById("toggle-tide-graph")?.checked) addHiddenRule("#layer-tide-wave");
        if(!document.getElementById("toggle-rain-graph")?.checked) addHiddenRule("#layer-rain-graph");
        if(!document.getElementById("toggle-daily-rain-bg")?.checked) addHiddenRule("#layer-daily-rain-bg");
        if(!document.getElementById("toggle-daily-rain-text")?.checked) addHiddenRule("#layer-daily-rain-text");
        if(!document.getElementById("toggle-date-lines")?.checked) addHiddenRule("#layer-lines");
        if(!document.getElementById("toggle-guide-time")?.checked) addHiddenRule("#layer-guide-time");
        
        if(!document.getElementById("toggle-guide-tide-line")?.checked) addHiddenRule(".layer-guide-tide-line");
        if(!document.getElementById("toggle-guide-tide-text")?.checked) addHiddenRule(".layer-guide-tide-text");
        if(!document.getElementById("toggle-guide-rain-line")?.checked) addHiddenRule(".layer-guide-rain-line");
        if(!document.getElementById("toggle-guide-rain-text")?.checked) addHiddenRule(".layer-guide-rain-text");

        if(!document.getElementById("toggle-date-gregorian")?.checked) addHiddenRule(".layer-date-gregorian");
        if(!document.getElementById("toggle-date-lunar")?.checked) addHiddenRule(".layer-date-lunar");
        if(!document.getElementById("toggle-date-weekday")?.checked) addHiddenRule(".layer-date-weekday");
        if(!document.getElementById("toggle-wafu-text")?.checked) addHiddenRule(".layer-wafu-text");
        if(!document.getElementById("toggle-gregorian-text")?.checked) addHiddenRule(".layer-gregorian-text");
        if(!document.getElementById("toggle-sekki")?.checked) addHiddenRule(".layer-sekki");
        if(!document.getElementById("toggle-kou")?.checked) addHiddenRule(".layer-kou");
        if(!document.getElementById("toggle-zassetsu")?.checked) addHiddenRule(".layer-zassetsu");
        if(!document.getElementById("toggle-holiday")?.checked) addHiddenRule(".layer-holiday");
        if(!document.getElementById("toggle-event-important")?.checked) addHiddenRule(".layer-event-important");

        styleBlock.innerHTML = css;

        if (typeof drawKoyomiEvents === 'function' && window.lastKoyomiStartDate) {
            drawKoyomiEvents(window.lastKoyomiStartDate);
        }
    };

    document.querySelectorAll("#layer-panel input[type='checkbox']").forEach(cb => {
        cb.addEventListener("change", updateLayerVisibility);
    });
    updateLayerVisibility();
}

function initInteractions() {
    container.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomFactor = e.deltaY > 0 ? 1.05 : 0.95;
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
        
        viewBox.w *= zoomFactor;
        viewBox.h *= zoomFactor;
        viewBox.x = svgP.x - (svgP.x - viewBox.x) * zoomFactor;
        viewBox.y = svgP.y - (svgP.y - viewBox.y) * zoomFactor;
        
        svg.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`);
    }, { passive: false });

    let isInteractionActive = false;
    let startPos = { x: 0, y: 0 }, dragDistance = 0;
    let startGlobalRotation = 0, startAngleOffset = 0;
    let lastPaintedCell = null;

    container.addEventListener('mousedown', (e) => {
        dragDistance = 0;
        isInteractionActive = true;
        lastPaintedCell = null;

        if (currentTool === 'pointer') {
            container.style.cursor = interactionMode === 'pan' ? 'grabbing' : 'ew-resize';
            if (interactionMode === 'rotate') {
                const pt = svg.createSVGPoint();
                pt.x = e.clientX;
                pt.y = e.clientY;
                const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
                startAngleOffset = Math.atan2(svgP.y - cy, svgP.x - cx) * 180 / Math.PI;
                startGlobalRotation = globalRotation;
            } else {
                startPos = { x: e.clientX, y: e.clientY };
            }
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (isInteractionActive && currentTool === 'pointer') {
            if (interactionMode === 'pan') {
                const dxScreen = startPos.x - e.clientX, dyScreen = startPos.y - e.clientY;
                dragDistance += Math.abs(dxScreen) + Math.abs(dyScreen);
                viewBox.x += dxScreen * (viewBox.w / container.clientWidth);
                viewBox.y += dyScreen * (viewBox.h / container.clientHeight);
                svg.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`);
                startPos = { x: e.clientX, y: e.clientY };
            } else if (interactionMode === 'rotate') {
                const pt = svg.createSVGPoint();
                pt.x = e.clientX;
                pt.y = e.clientY;
                const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
                const currentAngleOffset = Math.atan2(svgP.y - cy, svgP.x - cx) * 180 / Math.PI;
                
                let delta = currentAngleOffset - startAngleOffset;
                if (delta > 180) delta -= 360;
                if (delta < -180) delta += 360;
                
                globalRotation = startGlobalRotation + delta;
                masterGroup.setAttribute('transform', `rotate(${globalRotation}, ${cx}, ${cy})`);
                dragDistance += Math.abs(delta) * 5;
                startGlobalRotation = globalRotation;
                startAngleOffset = currentAngleOffset;
            }
        }

        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const ptM = pt.matrixTransform(masterGroup.getScreenCTM().inverse());
        const dx = ptM.x - cx, dy = ptM.y - cy;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        let angle = Math.atan2(dy, dx) * (180 / Math.PI);
        angle = (angle + 90 + 360) % 360;
        
        const absSegment = Math.floor(angle / 3);
        const ringInfo = getRingInfo(distance);

        if (ringInfo) {
            const relSegment = (absSegment - currentStartSegment + 120) % 120;
            const day = Math.floor(relSegment / 4) + 1;
            const timeSlot = relSegment % 4;
            const timeLabels = ["0:00〜6:00", "6:00〜12:00", "12:00〜18:00", "18:00〜24:00"];
            
            statusBar.innerText = `第 ${day} 日目 ｜ ${timeLabels[timeSlot]} ｜ ${ringInfo.name}`;
            statusBar.style.color = "#fff";

            if (isInteractionActive && (currentTool === 'paint' || currentTool === 'erase')) {
                const cellKey = `c${currentCycle}_abs${absSegment}_${ringInfo.layerId}`;
                if (lastPaintedCell !== cellKey) {
                    if (currentTool === 'erase') delete calendarData[cellKey];
                    else calendarData[cellKey] = { color: activeBrush, absSegment: absSegment, rIn: ringInfo.rIn, rOut: ringInfo.rOut };
                    renderSavedData();
                    lastPaintedCell = cellKey;
                }
            }
        } else {
            statusBar.innerText = `キャンバス外`;
            statusBar.style.color = "#8b949e";
        }
    });

    window.addEventListener('mouseup', () => {
        isInteractionActive = false;
        if (currentTool === 'pointer') container.style.cursor = interactionMode === 'pan' ? 'grab' : 'ew-resize';
        localStorage.setItem('polarCalendarDataV27', JSON.stringify(calendarData));
    });

    svg.addEventListener('click', (e) => {
        if (dragDistance > 5 || currentTool === 'pointer') return;
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const ptM = pt.matrixTransform(masterGroup.getScreenCTM().inverse());
        const dx = ptM.x - cx, dy = ptM.y - cy;
        const distance = Math.sqrt(dx * dx + dy * dy);
        let angle = Math.atan2(dy, dx) * (180 / Math.PI);
        angle = (angle + 90 + 360) % 360;
        
        const absSegment = Math.floor(angle / 3);
        const ringInfo = getRingInfo(distance);
        if (!ringInfo) return;

        const cellKey = `c${currentCycle}_abs${absSegment}_${ringInfo.layerId}`;
        
        if (currentTool === 'erase') delete calendarData[cellKey];
        else if (currentTool === 'paint') {
            calendarData[cellKey] = { color: activeBrush, absSegment: absSegment, rIn: ringInfo.rIn, rOut: ringInfo.rOut };
        }
        
        localStorage.setItem('polarCalendarDataV27', JSON.stringify(calendarData));
        renderSavedData();
    });
}
