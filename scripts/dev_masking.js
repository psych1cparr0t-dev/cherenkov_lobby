/**
 * Dev Tool: Polygon Masking
 * Allows clicking around the screen to draw a polygon.
 * Outputs the responsive CSS `clip-path: polygon(...)` using percentages.
 */
(function() {
    window.addEventListener('load', () => {
        // Create UI Container
        const uiContainer = document.createElement('div');
        uiContainer.style.position = 'fixed';
        uiContainer.style.bottom = '20px';
        uiContainer.style.right = '20px';
        uiContainer.style.background = 'rgba(0,0,0,0.85)';
        uiContainer.style.color = '#0ff';
        uiContainer.style.padding = '12px';
        uiContainer.style.zIndex = '100000';
        uiContainer.style.fontFamily = 'monospace';
        uiContainer.style.fontSize = '12px';
        uiContainer.style.border = '1px solid #0ff';
        uiContainer.style.boxShadow = '0 0 10px rgba(0,255,255,0.2)';

        let isActive = false;
        let points = [];
        
        // Create SVG Layer for drawing
        const svgNS = "http://www.w3.org/2000/svg";
        const svgLayer = document.createElementNS(svgNS, "svg");
        svgLayer.style.position = 'fixed';
        svgLayer.style.inset = '0';
        svgLayer.style.width = '100vw';
        svgLayer.style.height = '100vh';
        svgLayer.style.zIndex = '99998'; // Just below UI
        svgLayer.style.pointerEvents = 'none'; // Only intercept clicks when active
        
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
            <div style="font-weight:bold; margin-bottom: 8px;">DEV MASKING TOOL</div>
            <div style="margin-bottom: 8px; font-size: 10px; color: #888;">Outline a mountain ridge to generate a CSS clip-path mask.</div>
            <button id="toggle-mask-btn" style="cursor: pointer; background:#000; color:#0ff; border:1px solid #0ff; padding: 4px 8px;">Start Drawing</button>
            <button id="clear-mask-btn" style="cursor: pointer; background:#000; color:#0ff; border:1px solid #0ff; padding: 4px 8px;">Clear</button>
            <button id="close-shape-btn" style="cursor: pointer; background:#000; color:#0ff; border:1px solid #0ff; padding: 4px 8px;">Close Shape</button>
            <div id="mask-output" style="margin-top: 12px; width: 250px; word-wrap: break-word; font-size: 10px; color: #aaa; user-select: all;"></div>
        `;
        document.body.appendChild(uiContainer);

        const toggleBtn = document.getElementById('toggle-mask-btn');
        const clearBtn = document.getElementById('clear-mask-btn');
        const closeBtn = document.getElementById('close-shape-btn');
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
            output.innerHTML = `clip-path: polygon(${cssPts});`;
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
                console.log(`%c[DevMask] Generated Mask:\n${output.innerText}`, "color: #0ff;");
            }
        });

        clearBtn.addEventListener('click', () => {
            points = [];
            updatePolygon();
            output.innerHTML = '';
            previewLine.setAttribute('stroke', 'transparent');
        });
        
        closeBtn.addEventListener('click', () => {
             if (points.length > 2) {
                 isActive = false;
                 toggleBtn.innerText = 'Start Drawing';
                 svgLayer.style.pointerEvents = 'none';
                 previewLine.setAttribute('stroke', 'transparent');
                 console.log(`%c[DevMask] Generated Mask:\n${output.innerText}`, "color: #0ff;");
             }
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
