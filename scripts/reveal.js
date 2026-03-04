// Cherenkov — Letter Proximity Reveal
// When all 9 letters are visible, waits for blue pulse to settle, then:
//   1. "Inc." fades in immediately (1.2s)
//   2. background patterns dissolve via JS (2s) — no animation-flash
//   3. mosaic fires once patterns are gone (Inc. already settled by then)

(function () {
    const letters = document.querySelectorAll('.letter');
    const sub = document.getElementById('wordmark-sub');
    let triggered = false;

    const BLUE_PULSE_MS = 2500; // matches bluePulse animation duration in CSS
    const PATTERN_FADE_MS = 2000; // ms for pattern opacity fade

    document.addEventListener('mousemove', (e) => {
        if (triggered) return;

        letters.forEach((letter) => {
            if (letter.classList.contains('visible')) return;
            const rect = letter.getBoundingClientRect();
            const dist = Math.hypot(
                e.clientX - (rect.left + rect.width / 2),
                e.clientY - (rect.top + rect.height / 2)
            );
            if (dist < 120) letter.classList.add('visible', 'blue-pulse');
        });

        const revealed = document.querySelectorAll('.letter.visible').length;
        if (revealed === letters.length) {
            triggered = true;

            // Wait for last letter's blue pulse to finish
            setTimeout(() => {

                // Inc. fades in (1.2s)
                if (sub) sub.classList.add('visible');

                // Wait for Inc. to fully appear, then dissolve the background
                const INC_FADE_MS = 1400; // 1.2s transition + 200ms breath
                setTimeout(() => {

                    // CSS animations reassert opacity every frame and beat inline styles.
                    // Drive the fade with rAF instead — sets style.opacity each frame,
                    // nothing can override it.
                    document.querySelectorAll('.background-pattern').forEach(el => {
                        const startOp = parseFloat(window.getComputedStyle(el).opacity) || 0.3;
                        el.style.animation = 'none';    // stop keyframes
                        el.style.opacity = String(startOp); // lock before next paint

                        const duration = PATTERN_FADE_MS;
                        const t0 = performance.now();

                        (function step(now) {
                            const progress = Math.min((now - t0) / duration, 1);
                            el.style.opacity = String(startOp * (1 - progress));
                            if (progress < 1) requestAnimationFrame(step);
                            else el.style.display = 'none';
                        })(performance.now());
                    });

                    // Mosaic fires when patterns are fully gone
                    setTimeout(() => {
                        document.dispatchEvent(new CustomEvent('cherenkov:revealed'));
                    }, PATTERN_FADE_MS);

                }, INC_FADE_MS);

            }, BLUE_PULSE_MS);
        }
    });
})();
