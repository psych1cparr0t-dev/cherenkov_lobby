/**
 * Dev Tool: Drag, Drop, and Resize Contact Icon
 * Allows moving the contact icon horizontally, vertically, and scaling it.
 */
(function() {
    window.addEventListener('load', () => {
        const container = document.querySelector('.bottom-contact-container');
        if (!container) return;

        let isDragging = false;
        let isResizing = false;
        
        let startY, startX;
        let startScaleX, startScale;
        let currentScale = 1;
        let currentBottomPx, currentLeftPx;

        // Make the container hug the icon to act as a proper bounding box
        container.style.width = 'max-content';
        container.style.border = '1px dashed rgba(0, 255, 0, 0.5)';
        container.style.cursor = 'grab';
        container.style.pointerEvents = 'auto'; // allow dragging on container

        // Ensure links don't trigger click while dragging
        const link = container.querySelector('a');
        if (link) {
            link.addEventListener('click', (e) => {
                if (isDragging || isResizing) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            });
        }

        // Add a visual resize handle
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

        // Create a readout UI
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

        function updateReadout(bottomPx, leftPx, scale) {
            const vh = window.innerHeight;
            const vw = window.innerWidth;
            const bottomPercent = ((bottomPx / vh) * 100).toFixed(2);
            const leftPercent = ((leftPx / vw) * 100).toFixed(2);
            readout.innerHTML = `<strong style="color:#fff">CONTACT DEV TOOL</strong><br><br>Drag icon to move.<br>Drag green dot to resize.<br><br><span style="color:#aaa">/* Update styles/index.css */</span><br><br><b>.bottom-contact-container {</b><br>  bottom: ${bottomPercent}%;<br>  left: ${leftPercent}%;<br>  transform: translateX(-50%) scale(${scale.toFixed(2)});<br><b>}</b>`;
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
                const deltaY = startY - e.clientY; // moving mouse up increases bottom
                const deltaX = e.clientX - startX; // moving mouse right increases left
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
                updateReadout(currentBottomPx, currentLeftPx, currentScale);
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
            }
        };

        window.addEventListener('mouseup', stopDrag);
    });
})();
