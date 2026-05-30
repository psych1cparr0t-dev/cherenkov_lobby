/**
 * Cherenkov Experience Coordinator
 * Central source of truth for the timeline and transitions.
 */
window.Cherenkov = (function() {
    
    // TIMING SOURCE OF TRUTH (Seconds)
    const TIMING = {
        AMBIENT_DELAY: 0.100,  // Start video immediately
        TITLE_DELAY: 1.500,    // Delay before "CHERENKOV" fades in over video
        INC_DELAY: 1.000,      // Delay before "Inc." appears after title
        NAV_DELAY: 1.000       // Delay before Contact button drops down
    };

    const STATE = {
        HIDDEN: 'hidden',
        ACTIVE: 'active',      // Video playing
        TITLE_VISIBLE: 'title_visible',
        INC_VISIBLE: 'inc_visible',
        NAV_VISIBLE: 'nav_visible'
    };

    let currentState = STATE.HIDDEN;

    function setState(newState) {
        console.log(`[Cherenkov] State: ${currentState} -> ${newState}`);
        currentState = newState;
        document.body.dataset.state = newState;
        document.dispatchEvent(new CustomEvent(`cherenkov:state:${newState}`));
    }

    function startSequence() {
        // 1. Immediately start Ambient Video
        setTimeout(() => {
            setState(STATE.ACTIVE);
            document.dispatchEvent(new CustomEvent('cherenkov:load-mosaic'));
            document.dispatchEvent(new CustomEvent('cherenkov:revealed'));
            
            // 2. Wait, then show CHERENKOV title
            setTimeout(() => {
                setState(STATE.TITLE_VISIBLE);
                const letters = document.querySelectorAll('.letter');
                letters.forEach((l, i) => {
                    setTimeout(() => l.classList.add('visible'), i * 80);
                });

                // 3. Wait, then show Inc
                setTimeout(() => {
                    setState(STATE.INC_VISIBLE);
                    const sub = document.getElementById('wordmark-sub');
                    if (sub) sub.classList.add('visible');
                    
                    // 4. Wait, then drop down Nav
                    setTimeout(() => {
                        setState(STATE.NAV_VISIBLE);
                        document.querySelectorAll('.nav-link').forEach(link => {
                            link.classList.add('revealed');
                        });
                    }, TIMING.NAV_DELAY * 1000);

                }, TIMING.INC_DELAY * 1000);

            }, TIMING.TITLE_DELAY * 1000);

        }, TIMING.AMBIENT_DELAY * 1000);
    }

    // Automatically start on load
    window.addEventListener('load', () => {
        startSequence();
    });

    return {
        STATE,
        TIMING,
        setState,
        startSequence,
        getState: () => currentState
    };

})();
