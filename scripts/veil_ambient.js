/**
 * Liminal Veil — Ambient Expression
 * Replaces the mosaic with a single, long-duration static timelapse.
 */
(function () {

    // The primary atmospheric asset (hosted locally until uploaded to R2)
    const AMBIENT_VIDEO_URL = 'assets/kanchenjunga_delogo_smaller.mp4';
    
    const vidA = document.getElementById('veil-video-a');
    const vidB = document.getElementById('veil-video-b'); // Kept for DOM structure compatibility
    if (!vidA) return;

    // --- Dynamic Luminance Detection ---
    const sampleCanvas = document.createElement('canvas');
    const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
    sampleCanvas.width = 32;
    sampleCanvas.height = 32;
    let lastSampleTime = 0;

    function sampleLuminance() {
        const now = performance.now();
        if (now - lastSampleTime < 500) return; 
        lastSampleTime = now;

        if (!vidA || vidA.paused || vidA.readyState < 2) return;

        try {
            sampleCtx.drawImage(vidA, 0, 0, 32, 32);
            const data = sampleCtx.getImageData(0, 10, 32, 12).data; 
            let totalLum = 0;
            const pixelCount = data.length / 4;
            for (let i = 0; i < data.length; i += 4) {
                totalLum += 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
            }
            const avgLum = totalLum / pixelCount;
            document.body.dataset.sceneDark = avgLum < 100 ? 'true' : 'false';
        } catch (e) {
            // fail silently
        }
    }

    let tickRunning = false;
    let ambientStarted = false;
    
    function tick() {
        if (document.hidden) { 
            tickRunning = false; 
            return; 
        }
        sampleLuminance();
        requestAnimationFrame(tick);
    }

    function startTick() {
        if (tickRunning) return;
        tickRunning = true;
        requestAnimationFrame(tick);
    }

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && ambientStarted) {
            if (vidA && vidA.paused) {
                vidA.play().catch(e => console.warn('[Veil] Resume play failed:', e));
            }
            startTick();
        } else if (document.hidden) {
            tickRunning = false;
        }
    });

    document.addEventListener('cherenkov:load-mosaic', () => {
        console.log('[Veil] Transitioning to Ambient Expression...');
        
        vidA.src = AMBIENT_VIDEO_URL;
        vidA.loop = true;
        vidA.load();

        ambientStarted = true;
        
        vidA.play().then(() => {
            vidA.classList.add('playing');
            startTick();
        }).catch(() => {
            startTick();
        });
        
        // Hide second video if it exists
        if (vidB) vidB.style.display = 'none';
    });

})();
