
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

    document.getElementById('prevBtn').onclick = () => { currentCycle--; updateCalendarCycle(); };
    document.getElementById('nextBtn').onclick = () => { currentCycle++; updateCalendarCycle(); };
    
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
    };

    const btnPointer = document.getElementById('tool-pointer');
    const btnPaint = document.getElementById('tool-paint');
    const btnErase = document.getElementById('tool-erase');

    const setTool = (tool, mode = null) => {
        currentTool = tool;
        if (tool === 'pointer' && mode) interactionMode = mode;

        [btnPointer, btnPaint, btnErase].forEach(b => {
            b.style.background = 'transparent'; b.style.borderColor = 'transparent'; b.style.color = '#fff';
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

    const colors = ["#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e", "#fb7185", "#a8a29e", "#57534e"];
    colors.forEach(color => {
        const div = document.createElement('div');
        div.style = `width:100%; aspect-ratio:1; background-color:${color}; border-radius:4px; border:2px solid transparent; cursor:pointer; transition:0.1s; box-sizing:border-box;`;
        if(color === activeBrush) { div.style.borderColor = '#fff'; div.style.transform = 'scale(1.1)'; }
        div.onclick = () => {
            paletteDiv.querySelectorAll('div').forEach(el => { el.style.borderColor = 'transparent'; el.style.transform = 'scale(1)'; });
            div.style.borderColor = '#fff'; div.style.transform = 'scale(1.1)';
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
}

function initInteractions() {
  container.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 1.05 : 0.95;
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
    viewBox.w *= zoomFactor; viewBox.h *= zoomFactor;
    viewBox.x = svgP.x - (svgP.x - viewBox.x) * zoomFactor; viewBox.y = svgP.y - (svgP.y - viewBox.y) * zoomFactor;
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
            const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
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
            viewBox.x += dxScreen * (viewBox.w / container.clientWidth); viewBox.y += dyScreen * (viewBox.h / container.clientHeight);
            svg.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`);
            startPos = { x: e.clientX, y: e.clientY };
        } else if (interactionMode === 'rotate') {
            const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
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

    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const ptM = pt.matrixTransform(masterGroup.getScreenCTM().inverse());
    const dx = ptM.x - cx, dy = ptM.y - cy;
    const distance = Math.sqrt(dx * dx + dy * dy);
    let angle = Math.atan2(dy, dx) * (180 / Math.PI); angle = (angle + 90 + 360) % 360;

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
      statusBar.innerText = `キャンバス外`; statusBar.style.color = "#8b949e";
    }
  });

  window.addEventListener('mouseup', () => { 
    isInteractionActive = false;
    if (currentTool === 'pointer') container.style.cursor = interactionMode === 'pan' ? 'grab' : 'ew-resize'; 
    localStorage.setItem('polarCalendarDataV27', JSON.stringify(calendarData));
  });

  svg.addEventListener('click', (e) => {
    if (dragDistance > 5 || currentTool === 'pointer') return;
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const ptM = pt.matrixTransform(masterGroup.getScreenCTM().inverse());
    const dx = ptM.x - cx, dy = ptM.y - cy;
    const distance = Math.sqrt(dx * dx + dy * dy);
    let angle = Math.atan2(dy, dx) * (180 / Math.PI); angle = (angle + 90 + 360) % 360;

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
