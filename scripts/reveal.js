/**
 * Proximity Effect: Wordmark Reveal
 * Only responsibility: Show letters on hover and notify when all are visible.
 */
(function() {
    const letters = document.querySelectorAll('.letter');
    let triggered = false;

    // Radius for reveal (px)
    const REVEAL_DIST = 140;

    function checkProximity(e) {
        if (triggered) return;

        let revealedCount = 0;
        letters.forEach((letter) => {
            if (letter.classList.contains('visible')) {
                revealedCount++;
                return;
            }
            const rect = letter.getBoundingClientRect();
            const dist = Math.hypot(
                e.clientX - (rect.left + rect.width / 2),
                e.clientY - (rect.top + rect.height / 2)
            );
            if (dist < REVEAL_DIST) {
                letter.classList.add('visible', 'blue-pulse');
                revealedCount++;
            }
        });

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

    // Logic for the clean fade-out – controlled by the 'active' state
    function fadeLetters() {
        const lettersList = Array.from(letters);
        
        // Staggered fade from left to right
        lettersList.forEach((letter, i) => {
            const delay = (i / lettersList.length) * 0.8;
            letter.style.transitionDelay = `${delay.toFixed(2)}s`;
            letter.classList.remove('visible', 'blue-pulse');
        });

        const sub = document.getElementById('wordmark-sub');
        if (sub) {
            sub.style.transitionDelay = '0.5s';
            sub.classList.remove('visible');
            
            // Nav reveal follows the wordmark fade-out
            setTimeout(() => {
                document.querySelectorAll('.nav-link').forEach(link => link.classList.add('revealed'));
            }, 1500);
        }
    }

    // React to global coordinator state
    document.addEventListener('cherenkov:state:active', fadeLetters);

    document.addEventListener('mousemove', checkProximity);

})();

