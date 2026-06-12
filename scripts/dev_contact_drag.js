/**
 * Dev Tool: Drag, Drop, and Resize Contact Icon
 * Auto-calculates native video coordinates for smart-repositioning!
 */
(function() {
    window.addEventListener('load', () => {
        const container = document.querySelector('.bottom-contact-container');
        if (!container) return;

        const VIDEO_ASPECT = 16 / 9;

        let isDragging = false;
        let isResizing = false;
        
        let startY, startX;
        let startScaleX, startScale;
        let currentScale = 1;
        let currentBottomPx, currentLeftPx;

        // Visual setup
        container.style.width = 'max-content';
        container.style.border = '1px dashed rgba(0, 255, 0, 0.5)';
        container.style.cursor = 'grab';
        container.style.pointerEvents = 'auto';

        const link = container.querySelector('a');
        if (link) {
            link.addEventListener('click', (e) => {
                if (isDragging || isResizing) { e.preventDefault(); e.stopPropagation(); }
            });
        }

        // Resize Handle
        const handle = document.createElement('div');
        handle.style.position = 'absolute';
        handle.style.bottom = '-8px'; 
        handle.style.right = '-8px'; 
        handle.style.width = '16px';
        handle.style.height = '16px';
        handle.style.backgroundColor = 'rgba(0, 255, 0, 0.8)';
        handle.style.border = '2px solid #000';
        handle.style.cursor = 'nwse-resize';
        handle.style.borderRadius = '50%';
        handle.style.zIndex = '1000';
        handle.title = "Drag to resize";
        container.appendChild(handle);

        // Readout UI
        const readout = document.createElement('div');
        readout.style.position = 'fixed';
        readout.style.bottom = '20px';
        readout.style.right = '20px';
        readout.style.color = '#0f0';
        readout.style.background = 'rgba(0,0,0,0.85)';
        readout.style.padding = '12px 16px';
        readout.style.fontFamily = 'monospace';
        readout.style.fontSize = '13px';
        readout.style.zIndex = '99999';
        readout.style.pointerEvents = 'none';
        readout.style.border = '1px solid #0f0';
        readout.style.borderRadius = '8px';
        document.body.appendChild(readout);

        function calculateVideoBounds() {
            const winW = window.innerWidth;
            const winH = window.innerHeight;
            const winAspect = winW / winH;
            let vidW, vidH, offsetX, offsetY;
            if (winAspect > VIDEO_ASPECT) {
                vidW = winW; vidH = winW / VIDEO_ASPECT;
                offsetX = 0; offsetY = (winH - vidH) / 2;
            } else {
                vidW = winH * VIDEO_ASPECT; vidH = winH;
                offsetX = (winW - vidW) / 2; offsetY = 0;
            }
            return { vidW, vidH, offsetX, offsetY, winW, winH };
        }

        function updateReadout(bottomPx, leftPx, scale) {
            const bounds = calculateVideoBounds();
            const topPx = bounds.winH - bottomPx;
            
            // Calculate native coordinates
            const nX = (leftPx - bounds.offsetX) / bounds.vidW;
            const nY = (topPx - bounds.offsetY) / bounds.vidH;

            readout.innerHTML = `<strong style="color:#fff">CONTACT DEV TOOL</strong><br>
            <span style="color:#aaa">Position auto-saved to localStorage.</span><br><br>
            <span style="color:#0f0">Native X: ${nX.toFixed(4)}</span><br>
            <span style="color:#0f0">Native Y: ${nY.toFixed(4)}</span><br><br>
            <span style="color:#aaa">/* To hardcode forever, put this in pin_to_video.js */</span><br><br>
            <b>const nativeX = ${nX.toFixed(4)};</b><br>
            <b>const nativeY = ${nY.toFixed(4)};</b><br>`;
            
            // Save to local storage so pin_to_video.js can use it!
            localStorage.setItem('cherenkov_pin_x', nX);
            localStorage.setItem('cherenkov_pin_y', nY);
        }

        const initialStyle = window.getComputedStyle(container);
        currentBottomPx = parseFloat(initialStyle.bottom) || 0;
        currentLeftPx = parseFloat(initialStyle.left) || window.innerWidth / 2;
        updateReadout(currentBottomPx, currentLeftPx, currentScale);

        // Movement Logic
        container.addEventListener('mousedown', (e) => {
            if (e.target === handle) return;
            e.preventDefault();
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const style = window.getComputedStyle(container);
            currentBottomPx = parseFloat(style.bottom) || 0;
            currentLeftPx = parseFloat(style.left) || window.innerWidth / 2;
            container.style.cursor = 'grabbing';
            container.style.transition = 'none'; 
        });

        // Scaling Logic
        handle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            e.preventDefault();
            isResizing = true;
            startScaleX = e.clientX;
            startScale = currentScale;
            container.style.transition = 'none';
        });

        window.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const deltaY = startY - e.clientY; 
                const deltaX = e.clientX - startX; 
                const newBottomPx = currentBottomPx + deltaY;
                const newLeftPx = currentLeftPx + deltaX;
                container.style.bottom = `${newBottomPx}px`;
                container.style.left = `${newLeftPx}px`;
                updateReadout(newBottomPx, newLeftPx, currentScale);
            } else if (isResizing) {
                const deltaX = e.clientX - startScaleX; 
                const newScale = Math.max(0.1, startScale + (deltaX / 100));
                currentScale = newScale;
                container.style.transform = `translateX(-50%) scale(${newScale})`;
            }
        });

        const stopDrag = () => {
            if (isDragging || isResizing) {
                isDragging = false;
                isResizing = false;
                container.style.cursor = 'grab';
                const style = window.getComputedStyle(container);
                currentBottomPx = parseFloat(style.bottom) || currentBottomPx;
                currentLeftPx = parseFloat(style.left) || currentLeftPx;
                
                // If pin_to_video.js is active, tell it to snap to the new exact coordinate
                if (window.forcePinUpdate) window.forcePinUpdate();
            }
        };

        window.addEventListener('mouseup', stopDrag);
    });
})();
