/**
 * Cherenkov Experience Coordinator
 * Central source of truth for the timeline and transitions.
 */
window.Cherenkov = (function() {
    
    // TIMING SOURCE OF TRUTH (Seconds)
    const TIMING = {
        BLUE_PULSE: 2.500,    // Wait for initial reveal pulse to settle
        INC_REVEAL: 1.200,    // Subtitle fade-in
        INC_BREATH: 0.200,    // Pause before veil transition
        VEIL_FADE: 4.000,     // White overlay ramp-up
        MOSAIC_START_OFFSET: 3.000, // When backdrop starts loading (during veil fade)
        WORDMARK_DEATH_TOTAL: 2.500, // Total window for staggered "fry out"
        WORDMARK_DEATH_FLICKER: 1.200 // Individual letter animation duration
    };

    const STATE = {
        HIDDEN: 'hidden',
        REVEALING: 'revealing', // Letters appearing
        SETTLING: 'settling',   // Pulse finishing
        INC_VISIBLE: 'inc_visible',
        VEIL_TRANSITIONING: 'veil_transitioning', // Background going white
        ACTIVE: 'active'        // Mosaic running, wordmark gone
    };

    let currentState = STATE.HIDDEN;

    function setState(newState) {
        console.log(`[Cherenkov] State: ${currentState} -> ${newState}`);
        currentState = newState;
        document.body.dataset.state = newState;
        document.dispatchEvent(new CustomEvent(`cherenkov:state:${newState}`));
    }

    function startFinalSequence() {
        if (currentState !== STATE.REVEALING) return;
        
        // 1. Settling
        setState(STATE.SETTLING);

        // 2. Inc Reveal
        setTimeout(() => {
            setState(STATE.INC_VISIBLE);
            
            // 3. Veil Transition
            setTimeout(() => {
                setState(STATE.VEIL_TRANSITIONING);
                
                // 4. Start Mosaic backdrop loading early
                setTimeout(() => {
                   document.dispatchEvent(new CustomEvent('cherenkov:load-mosaic'));
                }, TIMING.MOSAIC_START_OFFSET * 1000);

                // 5. Final State: Wordmark dies, Mosaic takes over
                setTimeout(() => {
                    setState(STATE.ACTIVE);
                    document.dispatchEvent(new CustomEvent('cherenkov:revealed')); // Legacy trigger
                }, TIMING.VEIL_FADE * 1000);

            }, TIMING.INC_BREATH * 1000);

        }, TIMING.BLUE_PULSE * 1000);
    }

    return {
        STATE,
        TIMING,
        setState,
        startFinalSequence,
        getState: () => currentState
    };

})();
