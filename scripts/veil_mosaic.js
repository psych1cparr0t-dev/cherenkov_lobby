/**
 * Liminal Veil — Native Video Player
 * Direct DOM rendering for maximum fidelity.
 */
(function () {

    const SCENES = [
        'references/liminal_veil/first_draft/cherry_blossoms.webm',
        'references/liminal_veil/first_draft/landwasserviadukt_6s.webm',
        'references/liminal_veil/first_draft/village_life_4s.webm',
        'references/liminal_veil/first_draft/hong_kong_island_5s.webm',
        'references/liminal_veil/first_draft/semaphore_tower.webm'
    ];

    const XFADE_TIME = 1.5; // (Seconds) MUST MATCH CSS TRANSITION
    const vidA = document.getElementById('veil-video-a');
    const vidB = document.getElementById('veil-video-b');

    if (!vidA || !vidB) return;

    let current = vidA;
    let next = vidB;
    let sceneIdx = 0;
    let isTransitioning = false;

    function loadNext() {
        const nextIdx = (sceneIdx + 1) % SCENES.length;
        next.src = SCENES[nextIdx];
        next.load();
    }

    function checkTime() {
        if (!current.duration) return;

        const timeLeft = current.duration - current.currentTime;

        // Start crossfading
        if (!isTransitioning && timeLeft <= XFADE_TIME && timeLeft > 0) {
            isTransitioning = true;
            next.play().catch(() => {});
            next.classList.add('playing');
        }

        // End of crossfade
        if (isTransitioning && (timeLeft <= 0.05 || current.ended)) {
            current.classList.remove('playing');
            current.pause();

            // Swap roles
            [current, next] = [next, current];
            sceneIdx = (sceneIdx + 1) % SCENES.length;
            isTransitioning = false;
            loadNext();
        }
    }

    function tick() {
        checkTime();
        requestAnimationFrame(tick);
    }

    document.addEventListener('cherenkov:load-mosaic', () => {
        sceneIdx = 0;
        current.src = SCENES[0];
        current.load();
        current.play().catch(() => {});
        current.classList.add('playing');
        
        loadNext();
        requestAnimationFrame(tick);
    });

})();
