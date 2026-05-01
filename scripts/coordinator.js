/**
 * Cherenkov Experience Coordinator
 * Central source of truth for the timeline and transitions.
 */
window.Cherenkov = (function() {
    
    // TIMING SOURCE OF TRUTH (Seconds)
    const TIMING = {
        TITLE_DELAY: 0.500,    // Initial delay before letters start showing
        INC_DELAY: 1.000,      // Delay before Inc appears after title
        NAV_DELAY: 1.000,      // Delay before Nav drops down after Inc
        AMBIENT_DELAY: 1.000   // Delay before video fades in
    };

    const STATE = {
        HIDDEN: 'hidden',
        TITLE_VISIBLE: 'title_visible',
        INC_VISIBLE: 'inc_visible',
        NAV_VISIBLE: 'nav_visible',
        ACTIVE: 'active' // Video playing
    };

    let currentState = STATE.HIDDEN;

    function setState(newState) {
        console.log(`[Cherenkov] State: ${currentState} -> ${newState}`);
        currentState = newState;
        document.body.dataset.state = newState;
        document.dispatchEvent(new CustomEvent(`cherenkov:state:${newState}`));
    }

    function startSequence() {
        // 1. Initial wait, then show title
        setTimeout(() => {
            setState(STATE.TITLE_VISIBLE);
            const letters = document.querySelectorAll('.letter');
            letters.forEach(l => l.classList.add('visible'));

            // 2. Wait, then show Inc
            setTimeout(() => {
                setState(STATE.INC_VISIBLE);
                
                // 3. Wait, then drop down Nav
                setTimeout(() => {
                    setState(STATE.NAV_VISIBLE);
                    document.querySelectorAll('.nav-link').forEach(link => {
                        link.classList.add('revealed');
                    });
                    
                    // 4. Wait, then start Video/Ambient
                    setTimeout(() => {
                        setState(STATE.ACTIVE);
                        document.dispatchEvent(new CustomEvent('cherenkov:load-mosaic'));
                        document.dispatchEvent(new CustomEvent('cherenkov:revealed'));
                        
                        // Clean up fade overlay if it still exists
                        setTimeout(() => {
                            const overlay = document.getElementById('fade-overlay');
                            if (overlay) overlay.remove();
                        }, 1000);

                    }, TIMING.AMBIENT_DELAY * 1000);

                }, TIMING.NAV_DELAY * 1000);

            }, TIMING.INC_DELAY * 1000);

        }, TIMING.TITLE_DELAY * 1000);
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
