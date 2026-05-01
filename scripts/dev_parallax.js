/**
 * Dev Tool: Parallax Tuning
 * Allows real-time tuning of scroll translation scales and directions for each layer.
 */
(function() {
    window.addEventListener('load', () => {
        // Create UI Container
        const uiContainer = document.createElement('div');
        uiContainer.style.position = 'fixed';
        uiContainer.style.top = '20px';
        uiContainer.style.left = '20px';
        uiContainer.style.background = 'rgba(0,0,0,0.85)';
        uiContainer.style.color = '#ff0'; // Yellow theme for this tool
        uiContainer.style.padding = '12px';
        uiContainer.style.zIndex = '100000';
        uiContainer.style.fontFamily = 'monospace';
        uiContainer.style.fontSize = '12px';
        uiContainer.style.border = '1px solid #ff0';
        uiContainer.style.boxShadow = '0 0 10px rgba(255,255,0,0.2)';
        uiContainer.style.width = '250px';

        uiContainer.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; font-weight:bold; margin-bottom: 8px;">
                <span>DEV PARALLAX TUNE</span>
                <button id="minimize-parallax-btn" style="cursor: pointer; background:none; color:#ff0; border:none; padding: 0 4px; font-weight:bold;">—</button>
            </div>
            <div id="parallax-menu-content">
                <div style="margin-bottom: 8px; font-size: 10px; color: #888;">Tune scroll rates. Values multiply the scroll percentage. Positive Y moves down, Positive X moves right.</div>
                
                <div id="parallax-inputs" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px;"></div>
                
                <button id="copy-parallax-btn" style="cursor: pointer; background:#000; color:#0f0; border:1px solid #0f0; padding: 4px 8px; width: 100%;">Copy Config</button>
            </div>
        `;
        document.body.appendChild(uiContainer);

        const minimizeBtn = document.getElementById('minimize-parallax-btn');
        const menuContent = document.getElementById('parallax-menu-content');
        const inputsContainer = document.getElementById('parallax-inputs');
        const copyBtn = document.getElementById('copy-parallax-btn');
        
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

        // Generate inputs for each layer
        function renderInputs() {
            if (!window.PARALLAX_RATES) return;
            inputsContainer.innerHTML = '';
            
            const labels = ["Base Layer (0)", "Layer 3 (Far)", "Layer 2 (Mid)", "Layer 1 (Close)", "Wordmark Title"];
            
            window.PARALLAX_RATES.forEach((rate, index) => {
                const row = document.createElement('div');
                row.style.borderBottom = '1px solid #440';
                row.style.paddingBottom = '4px';
                
                row.innerHTML = `
                    <div style="font-weight:bold; color:#ff0; margin-bottom:4px;">${labels[index]}</div>
                    <div style="display:flex; justify-content:space-between; margin-bottom: 2px;">
                        <label>Scale: <input type="number" step="0.05" data-index="${index}" data-prop="scale" value="${rate.scale}" style="width: 50px; background:#222; color:#fff; border:1px solid #555;"></label>
                        <label>X: <input type="number" step="0.05" data-index="${index}" data-prop="x" value="${rate.x}" style="width: 50px; background:#222; color:#fff; border:1px solid #555;"></label>
                        <label>Y: <input type="number" step="0.05" data-index="${index}" data-prop="y" value="${rate.y}" style="width: 50px; background:#222; color:#fff; border:1px solid #555;"></label>
                    </div>
                `;
                inputsContainer.appendChild(row);
            });

            // Add event listeners
            inputsContainer.querySelectorAll('input').forEach(input => {
                input.addEventListener('input', (e) => {
                    const idx = parseInt(e.target.dataset.index);
                    const prop = e.target.dataset.prop;
                    window.PARALLAX_RATES[idx][prop] = parseFloat(e.target.value) || 0;
                    
                    // Trigger a tiny scroll event to instantly preview changes
                    window.dispatchEvent(new Event('scroll'));
                });
            });
        }

        // Poll until parallax_dolly.js has initialized PARALLAX_RATES
        const readyInterval = setInterval(() => {
            if (window.PARALLAX_RATES) {
                clearInterval(readyInterval);
                renderInputs();
            }
        }, 100);

        copyBtn.addEventListener('click', () => {
            if (!window.PARALLAX_RATES) return;
            const configStr = "window.PARALLAX_RATES = " + JSON.stringify(window.PARALLAX_RATES, null, 4) + ";";
            console.log(`%c[DevParallax] Config:\n${configStr}`, "color: #0f0;");
            
            // Try to copy to clipboard
            try {
                navigator.clipboard.writeText(configStr);
                copyBtn.innerText = "Copied to Clipboard!";
            } catch (e) {
                copyBtn.innerText = "Copied to Console!";
            }
            setTimeout(() => { copyBtn.innerText = "Copy Config"; }, 2000);
        });
    });
})();
