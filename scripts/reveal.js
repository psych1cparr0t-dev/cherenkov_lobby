/**
 * Proximity Effect: Wordmark Reveal
 * Only responsibility: Show letters on hover and notify when all are visible.
 * Title persists over the mosaic — no fade-out.
 */
(function() {
    const letters = document.querySelectorAll('.letter');
    let triggered = false;

    function revealLetter(letter) {
        if (triggered || letter.classList.contains('visible')) return;
        
        letter.classList.add('visible', 'blue-pulse');
        
        // Count revealed
        const revealedCount = document.querySelectorAll('.letter.visible').length;
        if (revealedCount === letters.length) {
            triggered = true;
            console.log('[Proximity] Wordmark fully revealed.');
            
            // Initializing sequence in the coordinator
            if (window.Cherenkov) {
                window.Cherenkov.setState(window.Cherenkov.STATE.REVEALING);
                window.Cherenkov.startFinalSequence();
            }
        }
    }

    // React to global coordinator states
    document.addEventListener('cherenkov:state:inc_visible', () => {
        const sub = document.getElementById('wordmark-sub');
        if (sub) sub.classList.add('visible');
    });

    // Title stays visible over the mosaic — no fade-out listener

    // Attach listeners
    letters.forEach(letter => {
        letter.addEventListener('mouseenter', () => revealLetter(letter));
        // Touch support for mobile
        letter.addEventListener('touchstart', (e) => {
            e.preventDefault();
            revealLetter(letter);
        });
    });

})();
