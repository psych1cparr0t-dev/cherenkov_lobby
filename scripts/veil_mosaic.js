/**
 * Liminal Veil — Native Video Player
 * 12 validated clips, randomised shuffle, 3s crossfade with canplay guard.
 */
(function () {

    const SCENES = [
        'references/liminal_veil/mosaic/scene_antarctica_1.webm',
        'references/liminal_veil/mosaic/scene_antarctica_2.webm',
        'references/liminal_veil/mosaic/scene_antarctica_3.webm',
        'references/liminal_veil/mosaic/scene_cable_car.webm',
        'references/liminal_veil/mosaic/scene_hong_kong_night_1.webm',
        'references/liminal_veil/mosaic/scene_hong_kong_night_2.webm',
        'references/liminal_veil/mosaic/scene_hong_kong_night_3.webm',
        'references/liminal_veil/mosaic/scene_landwasserviadukt_1.webm',
        'references/liminal_veil/mosaic/scene_landwasserviadukt_2.webm',
        'references/liminal_veil/mosaic/scene_village_life_1.webm',
        'references/liminal_veil/mosaic/scene_village_life_2.webm',
        'references/liminal_veil/mosaic/scene_semaphore_tower.webm',
        'references/liminal_veil/mosaic/scene_nyc_1.webm',
        'references/liminal_veil/mosaic/scene_mumbai_1.webm',
        'references/liminal_veil/mosaic/scene_snowy_1.webm',
        'references/liminal_veil/mosaic/scene_bhopal_1.webm',
        'references/liminal_veil/mosaic/scene_mountain_fog_1.webm',
        'references/liminal_veil/mosaic/scene_mountain_fog_2.webm',
        'references/liminal_veil/mosaic/scene_ocean_waves_1.webm',
        'references/liminal_veil/mosaic/scene_train_station_1.webm',
        'references/liminal_veil/mosaic/scene_lightning_1.webm'
    ];

    const XFADE_TIME = 2.0;

    const vidA = document.getElementById('veil-video-a');
    const vidB = document.getElementById('veil-video-b');
    if (!vidA || !vidB) return;

    let current = vidA;
    let next    = vidB;
    let sceneOrder = [];
    let sceneIdx = 0;
    let isTransitioning = false;

    function shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    function loadSource(v, idx) {
        const url = sceneOrder[idx % sceneOrder.length];
        if (!url) return;
        // Only reload if it's actually a different source
        if (!v.src.endsWith(url)) {
            v.src = url;
            v.load();
        }
    }

    function checkTime() {
        if (!current.duration || isNaN(current.duration) || isTransitioning) return;
        const timeLeft = current.duration - current.currentTime;
        if (timeLeft <= XFADE_TIME && timeLeft > 0) {
            beginSwap();
        }
    }

    function beginSwap() {
        if (isTransitioning) return;
        isTransitioning = true;

        next.currentTime = 0;
        next.style.zIndex = '4';
        current.style.zIndex = '3';

        // Wait for actual frame data before showing
        function attemptPlay() {
            next.play().then(() => {
                next.classList.add('playing');
            }).catch(() => {
                // If play fails, skip this clip entirely
                console.warn('[Veil] Skipping unplayable clip');
                forceAdvance();
            });
        }

        if (next.readyState >= 2) {
            attemptPlay();
        } else {
            // Not buffered yet — wait for canplay, with a timeout
            const timeout = setTimeout(() => {
                next.removeEventListener('canplay', onReady);
                console.warn('[Veil] Clip did not buffer in time, skipping');
                forceAdvance();
            }, 5000);

            function onReady() {
                clearTimeout(timeout);
                next.removeEventListener('canplay', onReady);
                attemptPlay();
            }
            next.addEventListener('canplay', onReady);
        }
    }

    function forceAdvance() {
        // Skip the current "next" and move to the one after
        sceneIdx++;
        isTransitioning = false;
        next.style.zIndex = '1';
        loadSource(next, sceneIdx + 1);
    }

    function cleanupSwap() {
        current.classList.remove('playing');
        current.pause();

        [current, next] = [next, current];
        sceneIdx++;
        isTransitioning = false;

        next.style.zIndex = '1';
        current.style.zIndex = '3';

        // Pre-load the clip after next
        loadSource(next, sceneIdx + 1);
    }

    [vidA, vidB].forEach(v => {
        v.addEventListener('ended', () => {
            if (v === current) cleanupSwap();
        });
        v.addEventListener('timeupdate', () => {
            if (v === current && isTransitioning && v.duration - v.currentTime < 0.1) {
                cleanupSwap();
            }
        });
    });

    // --- Dynamic Luminance Detection ---
    // Samples the active video's center strip to detect dark scenes.
    // Toggles data-scene-dark on <body> so CSS can add a silver outline.
    const sampleCanvas = document.createElement('canvas');
    const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
    sampleCanvas.width = 32;
    sampleCanvas.height = 32;
    let lastSampleTime = 0;

    function sampleLuminance() {
        const now = performance.now();
        if (now - lastSampleTime < 500) return; // Throttle to 2x/sec
        lastSampleTime = now;

        const v = current;
        if (!v || v.paused || v.readyState < 2) return;

        try {
            // Sample center strip where the wordmark sits
            sampleCtx.drawImage(v, 0, 0, 32, 32);
            const data = sampleCtx.getImageData(0, 10, 32, 12).data; // Middle rows
            let totalLum = 0;
            const pixelCount = data.length / 4;
            for (let i = 0; i < data.length; i += 4) {
                // Perceived luminance: 0.299R + 0.587G + 0.114B
                totalLum += 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
            }
            const avgLum = totalLum / pixelCount;
            document.body.dataset.sceneDark = avgLum < 100 ? 'true' : 'false';
        } catch (e) {
            // CORS or decode error — fail silently
        }
    }

    let tickRunning = false;
    let mosaicStarted = false;
    
    function tick() {
        if (document.hidden) { 
            tickRunning = false; 
            return; 
        }
        checkTime();
        sampleLuminance();
        requestAnimationFrame(tick);
    }

    function startTick() {
        if (tickRunning) return;
        tickRunning = true;
        requestAnimationFrame(tick);
    }

    // Resume after tab switch — browsers pause video when page is hidden
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && mosaicStarted) {
            console.log('[Veil] Visibility changed: visible. Resuming...');
            // Re-play current video (browser may have paused it)
            if (current && current.paused) {
                current.play().catch(e => console.warn('[Veil] Resume play failed:', e));
            }
            // If we were transitioning, make sure the next video is also attempting to play
            if (isTransitioning && next && next.paused) {
                next.play().catch(e => console.warn('[Veil] Resume next-play failed:', e));
            }
            startTick();
        } else if (document.hidden) {
            console.log('[Veil] Visibility changed: hidden. Pausing loop.');
            tickRunning = false;
        }
    });

    document.addEventListener('cherenkov:load-mosaic', () => {
        mosaicStarted = true;
        sceneOrder = [...SCENES];
        shuffle(sceneOrder);

        sceneIdx = 0;
        loadSource(current, 0);
        loadSource(next, 1);

        current.play().then(() => {
            current.classList.add('playing');
            startTick();
        }).catch(() => {
            startTick();
        });
    });

})();
