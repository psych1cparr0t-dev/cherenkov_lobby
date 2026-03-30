/**
 * Liminal Veil — Block Mosaic
 * Cycles all scenes sequentially with a smooth canvas crossfade.
 */
(function () {

    const SCENES = [
        'references/liminal_veil/first_draft/cherry_blossoms.webm',
        'references/liminal_veil/first_draft/nature1_10s.webm',
        'references/liminal_veil/first_draft/landwasserviadukt_6s.webm',
        'references/liminal_veil/first_draft/village_life_4s.webm',
        'references/liminal_veil/first_draft/hong_kong_island_5s.webm',
        'references/liminal_veil/first_draft/semaphore_tower.webm'
    ];

    const XFADE_MS   = 1200;   // crossfade duration
    const BLOCK_DESK = 7;
    const BLOCK_MOB  = 3;
    const BG         = '#f5f5f5';

    const canvas = document.getElementById('veil-canvas');
    if (!canvas) return;

    const ctx  = canvas.getContext('2d', { willReadFrequently: true });
    const off  = document.createElement('canvas');
    const octx = off.getContext('2d', { willReadFrequently: true });

    let blockSize  = BLOCK_DESK;
    let sceneIdx   = 0;
    let xfadeStart = null;   // timestamp when crossfade began
    let running    = false;

    // Two video slots — current plays, next preloads
    const makeVid = () => {
        const v = document.createElement('video');
        v.muted = true; v.playsInline = true; v.loop = false;
        v.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;top:-2px;left:-2px';
        document.body.appendChild(v);
        return v;
    };

    let cur  = makeVid();
    let next = makeVid();

    // Promise-based load — resolves when the video can play
    function load(vid, idx) {
        return new Promise(resolve => {
            vid.src = SCENES[idx % SCENES.length];
            vid.oncanplay = () => { vid.oncanplay = null; resolve(); };
            vid.onerror   = () => { vid.onerror   = null; resolve(); }; // skip broken files
            vid.load();
        });
    }

    function resize() {
        blockSize     = window.matchMedia('(max-width:768px)').matches ? BLOCK_MOB : BLOCK_DESK;
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
        off.width     = Math.ceil(canvas.width  / blockSize);
        off.height    = Math.ceil(canvas.height / blockSize);
    }

    // Draw mosaic from an offscreen sample of two videos blended at alpha
    function drawFrame(now) {
        const state = window.Cherenkov?.getState();
        if (state !== 'active' && state !== 'veil_transitioning') return;

        let fade = 1; // 0 = fully cur, 1 = fully next
        if (xfadeStart !== null) {
            fade = Math.min(1, (now - xfadeStart) / XFADE_MS);
            if (fade >= 1) {
                // Crossfade done — advance
                xfadeStart = null;
                cur.pause();
                [cur, next] = [next, cur];
                sceneIdx = (sceneIdx + 1) % SCENES.length;
                // Attach ended listener to new current, preload new next
                cur.addEventListener('ended', onEnded, { once: true });
                load(next, (sceneIdx + 1) % SCENES.length);
                fade = 0;
            }
        }

        // Composite cur + next onto offscreen buffer
        octx.clearRect(0, 0, off.width, off.height);
        if (cur.readyState >= 2) {
            octx.globalAlpha = 1 - fade;
            octx.drawImage(cur, 0, 0, off.width, off.height);
        }
        if (fade > 0 && next.readyState >= 2) {
            octx.globalAlpha = fade;
            octx.drawImage(next, 0, 0, off.width, off.height);
        }
        octx.globalAlpha = 1;

        // Render blocks
        // Only draw block grid if we have real video data
        const hasData = (cur.readyState >= 2) || (fade > 0 && next.readyState >= 2);
        if (!hasData) return;

        const px = octx.getImageData(0, 0, off.width, off.height).data;

        ctx.fillStyle = BG;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let r = 0; r < off.height; r++) {
            for (let c = 0; c < off.width; c++) {
                const i = (r * off.width + c) * 4;
                let R = px[i], G = px[i + 1], B = px[i + 2];
                const grey = R * 0.299 + G * 0.587 + B * 0.114;
                R = (R * 0.95 + grey * 0.05) * 0.92 + 20;
                G = (G * 0.95 + grey * 0.05) * 0.92 + 20;
                B = (B * 0.95 + grey * 0.05) * 0.92 + 27;
                ctx.fillStyle = `rgb(${R | 0},${G | 0},${B | 0})`;
                ctx.fillRect(c * blockSize + 1, r * blockSize + 1, blockSize - 2, blockSize - 2);
            }
        }
    }

    function onEnded() {
        // Start crossfade — next is already preloaded
        next.currentTime = 0;
        next.play().catch(() => {});
        xfadeStart = performance.now();
    }

    function tick(now) {
        if (running) {
            drawFrame(now);
            requestAnimationFrame(tick);
        }
    }

    async function start() {
        resize();
        sceneIdx = 0;
        await load(cur, 0);
        cur.play().catch(() => {});
        cur.addEventListener('ended', onEnded, { once: true });
        // Preload slot 1
        await load(next, 1);
        running = true;
        requestAnimationFrame(tick);
    }

    window.addEventListener('resize', resize);
    document.addEventListener('cherenkov:load-mosaic', start);

})();
