/**
 * Dev Tool: Drag and Drop Wordmark Adjuster
 * Allows dragging the wordmark container pixel-by-pixel.
 * Logs the calculated CSS values to the console and screen.
 */
(function() {
    window.addEventListener('load', () => {
        const container = document.querySelector('.wordmark-container');
        if (!container) return;

        let isDragging = false;
        let startY;
        let startBottomPx;

        // Make the container obviously draggable
        container.style.cursor = 'grab';
        container.style.userSelect = 'none';

        // Create a readout UI
        const readout = document.createElement('div');
        readout.style.position = 'fixed';
        readout.style.top = '20px';
        readout.style.left = '20px';
        readout.style.color = '#0f0';
        readout.style.background = 'rgba(0,0,0,0.8)';
        readout.style.padding = '12px';
        readout.style.fontFamily = 'monospace';
        readout.style.fontSize = '12px';
        readout.style.zIndex = '9999';
        readout.style.pointerEvents = 'none';
        readout.style.border = '1px solid #0f0';
        readout.innerHTML = 'DEV TOOL ACTIVE<br>Drag the CHERENKOV title vertically.';
        document.body.appendChild(readout);

        function updateReadout(bottomPx) {
            const vh = window.innerHeight;
            const percent = ((bottomPx / vh) * 100).toFixed(2);
            readout.innerHTML = `DEV TOOL ACTIVE<br>Drag the title vertically.<br><br><b>CSS Options:</b><br>bottom: ${Math.round(bottomPx)}px;<br>bottom: ${percent}%;`;
        }

        container.addEventListener('mousedown', (e) => {
            isDragging = true;
            startY = e.clientY;
            const style = window.getComputedStyle(container);
            startBottomPx = parseFloat(style.bottom);
            container.style.cursor = 'grabbing';
            container.style.transition = 'none'; // prevent CSS transition lag while dragging
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const deltaY = startY - e.clientY; // moving mouse up (negative delta) means positive bottom increase
            const newBottomPx = startBottomPx + deltaY;
            container.style.bottom = `${newBottomPx}px`;
            updateReadout(newBottomPx);
        });

        window.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                container.style.cursor = 'grab';
                const style = window.getComputedStyle(container);
                const bottomPx = parseFloat(style.bottom);
                const vh = window.innerHeight;
                const percent = ((bottomPx / vh) * 100).toFixed(2);
                console.log(`%c[DevTool] Perfect position found! Update styles/index.css .wordmark-container to:\nbottom: ${percent}%;\n/* or */\nbottom: ${Math.round(bottomPx)}px;`, "color: #0f0; font-size: 14px; font-weight: bold;");
            }
        });
        
        // Handle mouse leaving the window while dragging
        window.addEventListener('mouseleave', () => {
             if (isDragging) {
                 isDragging = false;
                 container.style.cursor = 'grab';
             }
        });
    });
})();
