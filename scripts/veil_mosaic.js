/**
 * Liminal Veil — Smooth Video Sequence
 * Direct video rendering with crossfade transitions.
 */
(function () {

    const SCENES = [
        'references/liminal_veil/first_draft/cherry_blossoms.webm',
        'references/liminal_veil/first_draft/landwasserviadukt_6s.webm',
        'references/liminal_veil/first_draft/village_life_4s.webm',
        'references/liminal_veil/first_draft/hong_kong_island_5s.webm',
        'references/liminal_veil/first_draft/semaphore_tower.webm'
    ];

    const XFADE_TIME = 1.5; // seconds

    const canvas = document.getElementById('veil-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let sceneIdx = 0;
    let isTransitioning = false;

    // Helper to create video elements
    const makeVid = () => {
        const v = document.createElement('video');
        v.muted = true;
        v.playsInline = true;
        v.loop = false;
        v.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;top:-2px;left:-2px';
        document.body.appendChild(v);
        return v;
    };

    let vidA = makeVid();
    let vidB = makeVid();
    let current = vidA;
    let next = vidB;

    function resize() {
        const dpr = window.devicePixelRatio || 1;
        canvas.width  = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width  = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }



    function loadScene(v, idx) {
        v.src = SCENES[idx % SCENES.length];
        v.load();
    }

    function swap() {
        current.pause();
        current = next;
        next = (current === vidA) ? vidB : vidA;
        sceneIdx++;
        loadScene(next, sceneIdx + 1);
        isTransitioning = false;
    }

    function draw() {
        requestAnimationFrame(draw);

        if (window.Cherenkov?.getState() !== 'active' && window.Cherenkov?.getState() !== 'veil_transitioning') return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Calculate "cover" dimensions
        const drawCover = (v, alpha) => {
            if (v.readyState < 2) return;
            const vRatio = v.videoWidth / v.videoHeight;
            const cRatio = canvas.width / canvas.height;
            let dw, dh, dx, dy;

            if (vRatio > cRatio) {
                dh = canvas.height;
                dw = dh * vRatio;
                dx = (canvas.width - dw) / 2;
                dy = 0;
            } else {
                dw = canvas.width;
                dh = dw / vRatio;
                dx = 0;
                dy = (canvas.height - dh) / 2;
            }

            ctx.globalAlpha = alpha;
            ctx.drawImage(v, dx, dy, dw, dh);
        };

        const timeLeft = current.duration - current.currentTime;

        // Check if we should start crossfading
        if (!isTransitioning && timeLeft <= XFADE_TIME && timeLeft > 0) {
            isTransitioning = true;
            next.play().catch(() => {});
        }

        // Handle end of crossfade
        if (isTransitioning && (timeLeft <= 0 || current.ended)) {
            swap();
        }

        if (isTransitioning) {
            const progress = 1 - (timeLeft / XFADE_TIME);
            drawCover(current, 1 - Math.max(0, Math.min(1, progress)));
            drawCover(next, Math.max(0, Math.min(1, progress)));
        } else {
            drawCover(current, 1);
        }

        ctx.globalAlpha = 1;
    }

    document.addEventListener('cherenkov:load-mosaic', () => {
        resize();
        window.addEventListener('resize', resize);
        loadScene(current, 0);
        loadScene(next, 1);
        current.play().catch(() => {});
        requestAnimationFrame(draw);
    });

})();
