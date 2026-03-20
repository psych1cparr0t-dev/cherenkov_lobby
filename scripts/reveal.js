/**
 * Proximity Effect: Wordmark Reveal
 * Only responsibility: Show letters on hover and notify when all are visible.
 */
(function() {
    const letters = document.querySelectorAll('.letter');
    const logoMark = document.getElementById('logo-mark');
    let triggered = false;

    // Radius for reveal (px)
    const REVEAL_DIST = 120;

    function checkProximity(e) {
        if (triggered) return;

        letters.forEach((letter) => {
            if (letter.classList.contains('visible')) return;
            const rect = letter.getBoundingClientRect();
            const dist = Math.hypot(
                e.clientX - (rect.left + rect.width / 2),
                e.clientY - (rect.top + rect.height / 2)
            );
            if (dist < REVEAL_DIST) {
                letter.classList.add('visible', 'blue-pulse');
            }
        });

        // Logo image fade-in (milestone reveal)
        const revealedCount = document.querySelectorAll('.letter.visible').length;
        if (logoMark && revealedCount >= Math.floor(letters.length / 2)) {
            logoMark.style.opacity = '1';
        }

        // Check if fully revealed
        if (revealedCount === letters.length) {
            triggered = true;
            console.log('[Proximity] Wordmark fully revealed.');
            
            // Initializing sequence in the coordinator
            if (window.Cherenkov) {
                window.Cherenkov.setState(window.Cherenkov.STATE.REVEALING);
                window.Cherenkov.startFinalSequence();
            } else {
                // Fallback for isolated testing
                document.dispatchEvent(new CustomEvent('cherenkov:revealed'));
            }
        }
    }

    // Logic for the staggered "fry out" death – controlled by the 'active' state
    function killLetters() {
        const indices = Array.from({ length: letters.length }, (_, i) => i);
        // Shuffle death order
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }

        indices.forEach((letterIdx, order) => {
            const delay = (order / letters.length) * 2.0 + Math.random() * 0.5;
            const letter = letters[letterIdx];
            letter.style.setProperty('--die-delay', `${delay.toFixed(2)}s`);
            
            letter.classList.remove('visible', 'blue-pulse');
            letter.classList.add('dying');
            
            // Ensuring opacity remains 0 after flickering
            setTimeout(() => { letter.style.opacity = '0'; }, (delay + 1.2) * 1000);
        });

        const sub = document.getElementById('wordmark-sub');
        if (sub) {
            sub.classList.add('dying');
            
            // Nav reveal follows final death
            setTimeout(() => {
                document.querySelectorAll('.nav-link').forEach(link => link.classList.add('revealed'));
            }, 2200);
        }
    }

    // React to global coordinator state
    document.addEventListener('cherenkov:state:active', killLetters);
    document.addEventListener('mousemove', checkProximity);

})();
