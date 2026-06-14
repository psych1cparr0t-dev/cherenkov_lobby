/**
 * Cherenkov Experience Coordinator
 * Central source of truth for the timeline and transitions.
 */
window.Cherenkov = (function() {
    
    // TIMING SOURCE OF TRUTH (Seconds)
    const TIMING = {
        AMBIENT_DELAY: 2.200,  // Delay before video fades in
        TITLE_DELAY: 1.500,    // Wait 1.5s, then start "CHERENKOV"
        INC_DELAY: 1.000,      // Wait 1.0s after TITLE starts, then start "Inc."
        NAV_DELAY: 5.000       // Wait 5.0s after INC starts, then drop Contact icon
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
                letters.forEach(l => l.classList.add('visible'));

                // 3. Wait, then show Inc
                setTimeout(() => {
                    setState(STATE.INC_VISIBLE);
                    const sub = document.getElementById('wordmark-sub');
                    if (sub) sub.classList.add('visible');
                    
                    // 4. Wait a strict 5 seconds, then drop down Nav/map pin
                    setTimeout(() => {
                        setState(STATE.NAV_VISIBLE);
                        document.querySelectorAll('.nav-link, .contact-icon').forEach(el => {
                            el.classList.add('revealed');
                        });

                        // 5. Wait 10s after map pin appears, then dissolve title into the mist
                        setTimeout(() => {
                            setState('title_sinking');
                            const wordmarkContainer = document.querySelector('.wordmark-container');
                            if (wordmarkContainer) wordmarkContainer.classList.add('sink-into-mist');
                        }, 10000);

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
