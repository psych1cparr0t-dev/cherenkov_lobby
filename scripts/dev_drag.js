/**
 * Dev Tool: Drag, Drop, and Resize Wordmark
 * Allows moving the wordmark vertically and scaling it proportionally.
 */
(function() {
    window.addEventListener('load', () => {
        const container = document.querySelector('.wordmark-container');
        if (!container) return;

        let isDragging = false;
        let isResizing = false;
        
        let startY, startBottomPx;
        let startX, startScale;
        let currentScale = 1;

        // Make the container obviously draggable
        container.style.cursor = 'grab';
        container.style.userSelect = 'none';

        // Add a visual resize handle to the bottom right
        const handle = document.createElement('div');
        handle.style.position = 'absolute';
        handle.style.bottom = '-10px'; 
        handle.style.right = '-20px'; 
        handle.style.width = '24px';
        handle.style.height = '24px';
        handle.style.backgroundColor = 'rgba(0, 255, 0, 0.4)';
        handle.style.border = '2px solid #0f0';
        handle.style.cursor = 'nwse-resize';
        handle.style.borderRadius = '50%';
        handle.style.zIndex = '1000';
        handle.title = "Drag to resize";
        container.appendChild(handle);

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
        document.body.appendChild(readout);

        function updateReadout(bottomPx, scale) {
            const vh = window.innerHeight;
            const percent = ((bottomPx / vh) * 100).toFixed(2);
            readout.innerHTML = `DEV TOOL ACTIVE<br>Drag text to move vertically.<br>Drag green circle to resize.<br><br><b>CSS Updates for .wordmark-container:</b><br><br>bottom: ${percent}%; /* or ${Math.round(bottomPx)}px */<br>transform: translateX(-50%) scale(${scale.toFixed(2)});`;
        }

        // Initialize readout
        const initialStyle = window.getComputedStyle(container);
        updateReadout(parseFloat(initialStyle.bottom), currentScale);

        // Movement Logic
        container.addEventListener('mousedown', (e) => {
            if (e.target === handle) return; // let handle take care of scaling
            isDragging = true;
            startY = e.clientY;
            const style = window.getComputedStyle(container);
            startBottomPx = parseFloat(style.bottom);
            container.style.cursor = 'grabbing';
            container.style.transition = 'none'; 
        });

        // Scaling Logic
        handle.addEventListener('mousedown', (e) => {
            e.stopPropagation(); // prevent movement drag
            isResizing = true;
            startX = e.clientX;
            startScale = currentScale;
            container.style.transition = 'none';
        });

        window.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const deltaY = startY - e.clientY; // moving mouse up means positive bottom increase
                const newBottomPx = startBottomPx + deltaY;
                container.style.bottom = `${newBottomPx}px`;
                updateReadout(newBottomPx, currentScale);
            } else if (isResizing) {
                const deltaX = e.clientX - startX; 
                // Move mouse right/down to increase scale, left/up to decrease
                const newScale = Math.max(0.1, startScale + (deltaX / 150));
                currentScale = newScale;
                // Important: Keep the centering translateX(-50%) while adding scale!
                container.style.transform = `translateX(-50%) scale(${newScale})`;
                
                const style = window.getComputedStyle(container);
                updateReadout(parseFloat(style.bottom), currentScale);
            }
        });

        window.addEventListener('mouseup', () => {
            if (isDragging || isResizing) {
                isDragging = false;
                isResizing = false;
                container.style.cursor = 'grab';
                const style = window.getComputedStyle(container);
                const bottomPx = parseFloat(style.bottom);
                const vh = window.innerHeight;
                const percent = ((bottomPx / vh) * 100).toFixed(2);
                console.log(`%c[DevTool] Perfect layout found! Update styles/index.css .wordmark-container to:\n\nbottom: ${percent}%;\ntransform: translateX(-50%) scale(${currentScale.toFixed(2)});\n`, "color: #0f0; font-size: 14px; font-weight: bold;");
            }
        });
        
        window.addEventListener('mouseleave', () => {
             if (isDragging || isResizing) {
                 isDragging = false;
                 isResizing = false;
                 container.style.cursor = 'grab';
             }
        });
    });
})();
