/**
 * Liminal Veil: Block-Mosaic Video Bridge
 * Responsibility: Render a low-fidelity grid of video pixel data.
 */
(function() {

    // Only using videos confirmed in the current environment
    const SCENES = [
        'references/liminal_veil/first_draft/cherry_blossoms.webm',
        'references/liminal_veil/first_draft/colosseum_aerial_10s.webm',
        'references/liminal_veil/first_draft/nature1_10s.webm',
        'references/liminal_veil/first_draft/landwasserviadukt_6s.webm',
        'references/liminal_veil/first_draft/village_life_4s.webm',
        'references/liminal_veil/first_draft/hong_kong_island_5s.webm',
        'references/liminal_veil/first_draft/semaphore_tower.webm'
    ];




    const canvas = document.getElementById('veil-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const off = document.createElement('canvas'); // Offscreen sampling buffer
    const octx = off.getContext('2d', { willReadFrequently: true });

    // Internal state
    let ready = false;
    let opacity = 0;
    let currentIndex = 0;
    let isDrawing = false;
    let isTransitioning = false;
    let blockSize = 7;

    const vidA = document.createElement('video');
    const vidB = document.createElement('video');
    const player = [vidA, vidB];
    let currentVid = vidA, nextVid = vidB;

    player.forEach(v => {
        v.muted = true;
        v.playsInline = true;
        v.loop = false;
        v.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;top:-2px;left:-2px;';
        document.body.appendChild(v);
        v.addEventListener('error', () => skipToNext(v));
    });

    const XFADE_TIME = 1.0;

    function init() {
        // Mobile/Desktop config
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        blockSize = isMobile ? 3 : 7;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        off.width = Math.ceil(canvas.width / blockSize);
        off.height = Math.ceil(canvas.height / blockSize);

        currentIndex = 0;
        loadScene(0, currentVid);
        loadScene(1, nextVid);
        currentVid.play().catch(() => {});
    }

    function loadScene(i, v) {
        v.src = SCENES[i % SCENES.length];
        v.load();
    }

    function skipToNext(v) {
        if (v === currentVid) swap();
        else loadScene(currentIndex + 2, nextVid);
    }

    function swap() {
        currentIndex++;
        [currentVid, nextVid] = [nextVid, currentVid];
        loadScene(currentIndex + 1, nextVid);
        currentVid.play().catch(() => {});
        isTransitioning = false;
    }

    currentVid.addEventListener('canplay', () => { ready = true; });

    function drawFrame() {
        if (!ready || currentVid.readyState < 2 || isDrawing) return;
        isDrawing = true;

        const cfg = { lift: 20, colorScale: 0.92, desat: 0.05, maxOp: 0.92 };

        try {
            // Check crossfade
            const timeLeft = currentVid.duration - currentVid.currentTime;
            if (timeLeft <= XFADE_TIME && !isTransitioning) {
                isTransitioning = true;
                nextVid.play().catch(() => {});
            }
            if (timeLeft <= 0.05 || currentVid.ended) swap();

            octx.clearRect(0, 0, off.width, off.height);
            
            // Blit current
            octx.globalAlpha = 1.0;
            octx.drawImage(currentVid, 0, 0, off.width, off.height);

            // Blit next if fading
            if (isTransitioning) {
                const fade = 1 - (timeLeft / XFADE_TIME);
                octx.globalAlpha = Math.max(0, Math.min(1, fade));
                octx.drawImage(nextVid, 0, 0, off.width, off.height);
            }

            const px = octx.getImageData(0, 0, off.width, off.height).data;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let r = 0; r < off.height; r++) {
                for (let c = 0; c < off.width; c++) {
                    const i = (r * off.width + c) * 4;
                    let R = px[i], G = px[i+1], B = px[i+2];
                    
                    // Desaturate & Lift
                    const grey = R * 0.299 + G * 0.587 + B * 0.114;
                    R = (R * (1 - cfg.desat) + grey * cfg.desat) * cfg.colorScale + cfg.lift;
                    G = (G * (1 - cfg.desat) + grey * cfg.desat) * cfg.colorScale + cfg.lift;
                    B = (B * (1 - cfg.desat) + grey * cfg.desat) * cfg.colorScale + cfg.lift + 7;

                    ctx.fillStyle = `rgb(${R|0},${G|0},${B|0})`;
                    ctx.fillRect(c * blockSize + 1, r * blockSize + 1, blockSize - 2, blockSize - 2);
                }
            }
        } finally {
            isDrawing = false;
        }
    }

    function tick() {
        if (!window.Cherenkov) return;
        const state = window.Cherenkov.getState();
        
        // Start drawing during the transition phase, but let CSS handle the alpha
        if (state === 'active' || state === 'veil_transitioning') {
            drawFrame();
        }
    }


    window.addEventListener('resize', init);
    document.addEventListener('cherenkov:load-mosaic', init);
    
    // Start ticker
    setInterval(tick, 33);

})();

