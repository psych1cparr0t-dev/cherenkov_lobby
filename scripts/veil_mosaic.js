/**
 * Liminal Veil — Native Video Player
 * 12 validated clips, randomised shuffle, 3s crossfade with canplay guard.
 */
(function () {

    // Path to the metadata manifest (hosted on R2)
    const MANIFEST_URL = 'https://pub-27dac5c9109f4094b9094b56fd08c2f6.r2.dev/mosaic_manifest.json';
    
    // Cloudflare R2 Config
    const R2_DOMAIN = 'pub-27dac5c9109f4094b9094b56fd08c2f6.r2.dev'; 

    let SCENES = [];
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

    document.addEventListener('cherenkov:load-mosaic', async () => {
        try {
            const resp = await fetch(MANIFEST_URL);
            const data = await resp.json();
            
            // Flatten all groups into a single array of URLs
            SCENES = [];
            data.forEach(group => {
                group.segments.forEach(seg => {
                    if (R2_DOMAIN) {
                        SCENES.push(`https://${R2_DOMAIN}/${seg.r2_key}`);
                    } else {
                        // Fallback to local path if no R2 domain is provided
                        SCENES.push(`references/liminal_veil/${seg.r2_key}`);
                    }
                });
            });

            console.log(`[Veil] Loaded ${SCENES.length} scenes from manifest.`);
        } catch (e) {
            console.warn('[Veil] Failed to load manifest, using default fallback logic.');
            // Basic fallback if fetch fails
            SCENES = ['references/liminal_veil/mosaic/scene_antarctica_1.webm'];
        }

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
