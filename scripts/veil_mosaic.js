/**
 * Liminal Veil — Pixelated Video Sequence
 * Phase 1: Videos play one after another.
 * Phase 2: Cherenkov pixel grid overlay — an inventive context layer.
 */
(function () {

    const SCENES = [
        'references/liminal_veil/first_draft/cherry_blossoms.webm',
        'references/liminal_veil/first_draft/landwasserviadukt_6s.webm',
        'references/liminal_veil/first_draft/village_life_4s.webm',
        'references/liminal_veil/first_draft/hong_kong_island_5s.webm',
        'references/liminal_veil/first_draft/semaphore_tower.webm'
    ];

    const BLOCK = window.matchMedia('(max-width:768px)').matches ? 4 : 8;

    const canvas = document.getElementById('veil-canvas');
    if (!canvas) return;

    const ctx  = canvas.getContext('2d', { willReadFrequently: true });
    const off  = document.createElement('canvas');
    const octx = off.getContext('2d', { willReadFrequently: true });

    let sceneIdx = 0;

    // Single video element — simplest possible queue
    const vid = document.createElement('video');
    vid.muted      = true;
    vid.playsInline = true;
    vid.loop       = false;
    vid.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;top:-2px;left:-2px';
    document.body.appendChild(vid);

    function resize() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
        off.width     = Math.ceil(canvas.width  / BLOCK);
        off.height    = Math.ceil(canvas.height / BLOCK);
    }

    function playNext() {
        vid.src = SCENES[sceneIdx % SCENES.length];
        sceneIdx++;
        vid.load();
        vid.play().catch(() => {});
    }

    // Advance to next scene when current ends
    vid.addEventListener('ended', playNext);

    function draw() {
        requestAnimationFrame(draw);

        if (window.Cherenkov?.getState() !== 'active') return;
        if (vid.readyState < 2) return;

        // Sample video at block resolution
        octx.drawImage(vid, 0, 0, off.width, off.height);
        const px = octx.getImageData(0, 0, off.width, off.height).data;

        // White base — prevents any bleed-through
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Cherenkov pixel grid — the world seen through an inventive context layer
        for (let r = 0; r < off.height; r++) {
            for (let c = 0; c < off.width; c++) {
                const i = (r * off.width + c) * 4;
                let R = px[i], G = px[i + 1], B = px[i + 2];
                // Slight desaturate + lift — keeps it light and readable
                const grey = R * 0.299 + G * 0.587 + B * 0.114;
                R = (R * 0.8 + grey * 0.2) + 18;
                G = (G * 0.8 + grey * 0.2) + 18;
                B = (B * 0.8 + grey * 0.2) + 25;
                ctx.fillStyle = `rgb(${R | 0},${G | 0},${B | 0})`;
                ctx.fillRect(c * BLOCK + 1, r * BLOCK + 1, BLOCK - 2, BLOCK - 2);
            }
        }
    }

    document.addEventListener('cherenkov:load-mosaic', () => {
        resize();
        window.addEventListener('resize', resize);
        playNext();
        requestAnimationFrame(draw);
    });

})();
