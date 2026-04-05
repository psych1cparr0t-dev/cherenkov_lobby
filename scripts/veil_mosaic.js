/**
 * Liminal Veil — Native Video Player (Worldly Montage Edition)
 * High-fidelity 10s clips with a 3.5s ultra-smooth crossfade.
 */
(function () {

    const SCENES = [
        'references/liminal_veil/mosaic/scene_antarctica_1.webm',
        'references/liminal_veil/mosaic/scene_antarctica_2.webm',
        'references/liminal_veil/mosaic/scene_antarctica_3.webm',
        'references/liminal_veil/mosaic/scene_cable_car_1.webm',
        'references/liminal_veil/mosaic/scene_cable_car_2.webm',
        'references/liminal_veil/mosaic/scene_hong_kong_night_1.webm',
        'references/liminal_veil/mosaic/scene_hong_kong_night_2.webm',
        'references/liminal_veil/mosaic/scene_hong_kong_night_3.webm',
        'references/liminal_veil/mosaic/scene_landwasserviadukt_1.webm',
        'references/liminal_veil/mosaic/scene_landwasserviadukt_2.webm',
        'references/liminal_veil/mosaic/scene_village_life_1.webm',
        'references/liminal_veil/mosaic/scene_village_life_2.webm',
        'references/liminal_veil/mosaic/scene_semaphore_tower_1.webm',
        'references/liminal_veil/mosaic/scene_semaphore_tower_2.webm'
    ];

    const XFADE_TIME = 3.5; // Increased for ultra-smooth buttery feel

    const vidA = document.getElementById('veil-video-a');
    const vidB = document.getElementById('veil-video-b');

    if (!vidA || !vidB) return;

    let current = vidA;
    let next    = vidB;
    let sceneOrder = [];
    let sceneIdx = 0;
    let isTransitioning = false;

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function loadSource(v, idx) {
        const url = sceneOrder[idx % sceneOrder.length];
        if (v.src.indexOf(url) === -1) {
            v.src = url;
            v.load();
        }
    }

    function checkTime() {
        if (!current.duration || isTransitioning) return;
        const timeLeft = current.duration - current.currentTime;
        if (timeLeft <= XFADE_TIME && timeLeft > 0) {
            beginSwap();
        }
    }

    function beginSwap() {
        isTransitioning = true;
        next.currentTime = 0;
        next.style.zIndex = '4';
        current.style.zIndex = '3';

        const onPlaying = () => {
            next.removeEventListener('playing', onPlaying);
            next.classList.add('playing');
        };
        next.addEventListener('playing', onPlaying);
        
        next.play().catch(() => cleanupSwap());
    }

    function cleanupSwap() {
        current.classList.remove('playing');
        current.pause();

        [current, next] = [next, current];
        sceneIdx++;
        isTransitioning = false;
        
        next.style.zIndex = '1';
        current.style.zIndex = '3';

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

    function tick() {
        checkTime();
        requestAnimationFrame(tick);
    }

    document.addEventListener('cherenkov:load-mosaic', () => {
        // Initialize randomized order
        sceneOrder = [...SCENES];
        shuffle(sceneOrder);
        
        sceneIdx = 0;
        loadSource(current, 0);
        loadSource(next, 1);
        
        current.play().then(() => {
            current.classList.add('playing');
            requestAnimationFrame(tick);
        }).catch(() => {});
    });

})();
