/**
 * Dev Tool: Polygon Masking
 * Allows clicking around the screen to draw multiple polygon layers.
 */
(function() {
    window.addEventListener('load', () => {
        // Create UI Container
        const uiContainer = document.createElement('div');
        uiContainer.style.position = 'fixed';
        uiContainer.style.top = '20px';
        uiContainer.style.right = '20px';
        uiContainer.style.background = 'rgba(0,0,0,0.85)';
        uiContainer.style.color = '#0ff';
        uiContainer.style.padding = '12px';
        uiContainer.style.zIndex = '100000';
        uiContainer.style.fontFamily = 'monospace';
        uiContainer.style.fontSize = '12px';
        uiContainer.style.border = '1px solid #0ff';
        uiContainer.style.boxShadow = '0 0 10px rgba(0,255,255,0.2)';
        uiContainer.style.maxWidth = '300px';

        let isActive = false;
        let points = [];
        let savedMasks = [];
        
        // Create SVG Layer for drawing
        const svgNS = "http://www.w3.org/2000/svg";
        const svgLayer = document.createElementNS(svgNS, "svg");
        svgLayer.style.position = 'fixed';
        svgLayer.style.top = '0';
        svgLayer.style.left = '0';
        svgLayer.style.width = '100%';
        svgLayer.style.height = '100%';
        svgLayer.style.zIndex = '99998'; // Just below UI
        svgLayer.style.pointerEvents = 'none'; // Only intercept clicks when active

        function syncSVGViewBox() {
            const w = window.innerWidth;
            const h = window.innerHeight;
            svgLayer.setAttribute('viewBox', `0 0 ${w} ${h}`);
            svgLayer.setAttribute('width', w);
            svgLayer.setAttribute('height', h);
        }
        syncSVGViewBox();
        window.addEventListener('resize', syncSVGViewBox);
        
        const polygon = document.createElementNS(svgNS, "polygon");
        polygon.setAttribute('fill', 'rgba(0, 255, 255, 0.1)');
        polygon.setAttribute('stroke', '#0ff');
        polygon.setAttribute('stroke-width', '2');
        svgLayer.appendChild(polygon);
        
        const previewLine = document.createElementNS(svgNS, "line");
        previewLine.setAttribute('stroke', 'transparent');
        previewLine.setAttribute('stroke-width', '2');
        previewLine.setAttribute('stroke-dasharray', '5,5');
        svgLayer.appendChild(previewLine);
        
        document.body.appendChild(svgLayer);

        uiContainer.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; font-weight:bold; margin-bottom: 8px;">
                <span>DEV MASKING TOOL</span>
                <button id="minimize-mask-btn" style="cursor: pointer; background:none; color:#0ff; border:none; padding: 0 4px; font-weight:bold;">—</button>
            </div>
            <div id="mask-menu-content">
                <div style="margin-bottom: 8px; font-size: 10px; color: #888;">Outline a mountain ridge to generate a CSS clip-path mask. Click "Save Layer" to keep it and start drawing the next one.</div>
                
                <div style="display:flex; gap: 4px; flex-wrap: wrap; margin-bottom: 8px;">
                    <button id="toggle-mask-btn" style="cursor: pointer; background:#000; color:#0ff; border:1px solid #0ff; padding: 4px 8px;">Start Drawing</button>
                    <button id="save-mask-btn" style="cursor: pointer; background:#000; color:#0f0; border:1px solid #0f0; padding: 4px 8px;">Save Layer</button>
                    <button id="clear-mask-btn" style="cursor: pointer; background:#000; color:#f00; border:1px solid #f00; padding: 4px 8px;">Clear Current</button>
                    <button id="clear-all-btn" style="cursor: pointer; background:#f00; color:#fff; border:1px solid #f00; padding: 4px 8px;">Clear All</button>
                </div>
                
                <div id="mask-output" style="margin-top: 12px; max-height: 300px; overflow-y: auto; word-wrap: break-word; font-size: 9px; color: #aaa; user-select: all;"></div>
            </div>
        `;
        document.body.appendChild(uiContainer);

        const minimizeBtn = document.getElementById('minimize-mask-btn');
        const menuContent = document.getElementById('mask-menu-content');
        
        minimizeBtn.addEventListener('click', () => {
            if (menuContent.style.display === 'none') {
                menuContent.style.display = 'block';
                minimizeBtn.innerText = '—';
                uiContainer.style.background = 'rgba(0,0,0,0.85)';
            } else {
                menuContent.style.display = 'none';
                minimizeBtn.innerText = '+';
                uiContainer.style.background = 'rgba(0,0,0,0.3)';
            }
        });

        const toggleBtn = document.getElementById('toggle-mask-btn');
        const saveBtn = document.getElementById('save-mask-btn');
        const clearBtn = document.getElementById('clear-mask-btn');
        const clearAllBtn = document.getElementById('clear-all-btn');
        const output = document.getElementById('mask-output');

        function updatePolygon() {
            if (points.length === 0) {
                polygon.setAttribute('points', '');
                return;
            }
            const pts = points.map(p => `${p.x},${p.y}`).join(' ');
            polygon.setAttribute('points', pts);
            
            const w = window.innerWidth;
            const h = window.innerHeight;
            const cssPts = points.map(p => `${((p.x/w)*100).toFixed(2)}% ${((p.y/h)*100).toFixed(2)}%`).join(', ');
            
            // Re-render UI
            let outHTML = savedMasks.map((m, i) => `<strong style="color:#0f0;">Layer ${i+1}</strong><br>${m}`).join('<br><br>');
            if (points.length > 2) {
                outHTML += `${savedMasks.length > 0 ? '<br><br>' : ''}<strong style="color:#0ff;">Current Layer</strong><br>clip-path: polygon(${cssPts});`;
            }
            output.innerHTML = outHTML;
        }

        toggleBtn.addEventListener('click', () => {
            isActive = !isActive;
            if (isActive) {
                toggleBtn.innerText = 'Stop Drawing';
                svgLayer.style.pointerEvents = 'auto';
                svgLayer.style.cursor = 'crosshair';
                document.body.style.userSelect = 'none';
            } else {
                toggleBtn.innerText = 'Start Drawing';
                svgLayer.style.pointerEvents = 'none';
                previewLine.setAttribute('stroke', 'transparent');
                document.body.style.userSelect = 'auto';
            }
        });

        saveBtn.addEventListener('click', () => {
            if (points.length < 3) return;
            const w = window.innerWidth;
            const h = window.innerHeight;
            const cssPts = points.map(p => `${((p.x/w)*100).toFixed(2)}% ${((p.y/h)*100).toFixed(2)}%`).join(', ');
            const clipPath = `clip-path: polygon(${cssPts});`;
            
            savedMasks.push(clipPath);
            
            // "Freeze" the visual on screen so user sees what they've already drawn
            const frozenPolygon = document.createElementNS(svgNS, "polygon");
            frozenPolygon.setAttribute('class', 'frozen-polygon');
            frozenPolygon.setAttribute('fill', 'rgba(0, 255, 0, 0.1)');
            frozenPolygon.setAttribute('stroke', 'rgba(0, 255, 0, 0.5)');
            frozenPolygon.setAttribute('stroke-width', '1');
            frozenPolygon.setAttribute('points', polygon.getAttribute('points'));
            svgLayer.insertBefore(frozenPolygon, polygon);
            
            // Auto-apply to the live parallax DOM so the user can test scroll!
            // Assuming the user draws foreground (Layer 1) -> midground -> background
            // veil-video-layer-3 is foreground, veil-video-layer-1 is background
            const domLayerIndex = 4 - savedMasks.length; 
            if (domLayerIndex >= 1 && domLayerIndex <= 3) {
                const liveVideoLayer = document.getElementById(`veil-video-layer-${domLayerIndex}`);
                if (liveVideoLayer) {
                    liveVideoLayer.style.clipPath = `polygon(${cssPts})`;
                    liveVideoLayer.style.webkitClipPath = `polygon(${cssPts})`;
                    console.log(`%c[DevMask] Auto-applied to veil-video-layer-${domLayerIndex}!`, "color: #ff0; font-weight: bold;");
                }
            }
            
            // Reset for next drawing
            points = [];
            updatePolygon();
            previewLine.setAttribute('stroke', 'transparent');
            
            console.log(`%c[DevMask] Saved Layer ${savedMasks.length}:\n${clipPath}`, "color: #0f0; font-weight: bold;");
        });

        clearBtn.addEventListener('click', () => {
            points = [];
            updatePolygon();
            previewLine.setAttribute('stroke', 'transparent');
        });

        clearAllBtn.addEventListener('click', () => {
            savedMasks = [];
            points = [];
            
            // Remove all frozen polygons
            const frozenPolygons = svgLayer.querySelectorAll('.frozen-polygon');
            frozenPolygons.forEach(p => p.remove());
            
            updatePolygon();
            previewLine.setAttribute('stroke', 'transparent');
        });

        svgLayer.addEventListener('mousedown', (e) => {
            if (!isActive) return;
            points.push({x: e.clientX, y: e.clientY});
            updatePolygon();
        });
        
        svgLayer.addEventListener('mousemove', (e) => {
            if (!isActive || points.length === 0) {
                previewLine.setAttribute('stroke', 'transparent');
                return;
            }
            previewLine.setAttribute('stroke', 'rgba(0, 255, 255, 0.8)');
            const lastPt = points[points.length - 1];
            previewLine.setAttribute('x1', lastPt.x);
            previewLine.setAttribute('y1', lastPt.y);
            previewLine.setAttribute('x2', e.clientX);
            previewLine.setAttribute('y2', e.clientY);
        });
    });
})();
