/**
 * Proximity Effect: Wordmark Reveal
 * Only responsibility: Show letters on hover and notify when all are visible.
 */
(function() {
    const letters = document.querySelectorAll('.letter');
    let triggered = false;

    function revealLetter(letter) {
        if (triggered || letter.classList.contains('visible')) return;
        
        letter.classList.add('visible');

        
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

    // Attach strict listeners
    letters.forEach(letter => {
        letter.addEventListener('mouseenter', () => revealLetter(letter));
        // Touch support for mobile
        letter.addEventListener('touchstart', (e) => {
            e.preventDefault();
            revealLetter(letter);
        });
    });

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
        }
    }

    // React to global coordinator states
    document.addEventListener('cherenkov:state:inc_visible', () => {
        const sub = document.getElementById('wordmark-sub');
        if (sub) sub.classList.add('visible');
    });

    // document.addEventListener('cherenkov:state:veil_transitioning', fadeLetters);
    
    // Nav reveal follows the veil transition
    document.addEventListener('cherenkov:state:veil_transitioning', () => {
        setTimeout(() => {
            document.querySelectorAll('.nav-link').forEach(link => link.classList.add('revealed'));
        }, 1000); // 1s delay
    });



    // Attach strict listeners
    letters.forEach(letter => {
        letter.addEventListener('mouseenter', () => revealLetter(letter));
        // Touch support for mobile
        letter.addEventListener('touchstart', (e) => {
            e.preventDefault();
            revealLetter(letter);
        });
    });

})();


