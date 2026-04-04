/**
 * Liminal Veil — Native Video Player
 * Direct DOM rendering for maximum fidelity.
 */
(function () {

    const SCENES = [
        'references/liminal_veil/mosaic/scene_antarctica.webm',
        'references/liminal_veil/mosaic/scene_cable_car.webm',
        'references/liminal_veil/mosaic/scene_hong_kong_night.webm',
        'references/liminal_veil/mosaic/scene_landwasserviadukt.webm',
        'references/liminal_veil/mosaic/scene_village_life.webm',
        'references/liminal_veil/mosaic/scene_semaphore_tower.webm',
        'references/liminal_veil/mosaic/scene_hong_kong_day.webm'
    ];

    const XFADE_TIME = 2.0; // Seconds

    const vidA = document.getElementById('veil-video-a');
    const vidB = document.getElementById('veil-video-b');

    if (!vidA || !vidB) return;

    let current = vidA;
    let next    = vidB;
    let sceneIdx = 0;
    let isTransitioning = false;

    function loadSource(v, idx) {
        const url = SCENES[idx % SCENES.length];
        if (v.src.indexOf(url) === -1) {
            v.src = url;
            v.load();
        }
    }

    function checkTime() {
        if (!current.duration || isTransitioning) return;

        const timeLeft = current.duration - current.currentTime;

        // When nearing end, begin the crossfade
        if (timeLeft <= XFADE_TIME && timeLeft > 0) {
            beginSwap();
        }
    }

    function beginSwap() {
        isTransitioning = true;
        
        // 1. Prepare next video
        next.currentTime = 0;
        next.style.zIndex = '4';
        current.style.zIndex = '3';

        // 2. Only show the transition after the first frame has successfully rendered
        const onPlaying = () => {
            next.removeEventListener('playing', onPlaying);
            next.classList.add('playing');
        };
        next.addEventListener('playing', onPlaying);
        
        next.play().catch(() => {
            // fallback if play fails
            cleanupSwap();
        });
    }

    function cleanupSwap() {
        // Complete the swap
        current.classList.remove('playing');
        current.pause();

        [current, next] = [next, current];
        sceneIdx++;
        isTransitioning = false;
        
        // Hide previous video behind
        next.style.zIndex = '1';
        current.style.zIndex = '3';

        // Preload next
        loadSource(next, sceneIdx + 1);
    }

    // Explicit listener for end-of-scene to ensure no hanging frames
    [vidA, vidB].forEach(v => {
        v.addEventListener('ended', () => {
            if (v === current) cleanupSwap();
        });
        
        // Backup: if it gets stuck near the end, push it forward
        v.addEventListener('timeupdate', () => {
            if (v === current && isTransitioning && v.duration - v.currentTime < 0.1) {
                cleanupSwap();
            }
        });
    });

    function tick() {
        checkTime();
        requestAnimationFrame(tick);
    }

    document.addEventListener('cherenkov:load-mosaic', () => {
        sceneIdx = 0;
        loadSource(current, 0);
        loadSource(next, 1);
        
        current.play().then(() => {
            current.classList.add('playing');
            requestAnimationFrame(tick);
        }).catch(() => {});
    });

})();
