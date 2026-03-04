// Cherenkov — Letter Proximity Reveal
// When all 9 letters are visible:
//   1. Wait for blue pulse to settle (2.5s)
//   2. Inc. fades in (1.2s)
//   3. After Inc. settles, a white overlay fades IN over the patterns (4s CSS transition)
//      — no animation fighting, just a plain element fading
//   4. Once overlay is opaque, mosaic fires underneath (canvas z-index:4 > overlay z-index:3)

(function () {
    const letters = document.querySelectorAll('.letter');
    const sub = document.getElementById('wordmark-sub');
    const landing = document.getElementById('landing-page');
    let triggered = false;

    const BLUE_PULSE_MS = 2500; // matches bluePulse animation in CSS
    const INC_SETTLE_MS = 1400; // 1.2s Inc. fade + 200ms breath
    const OVERLAY_FADE_MS = 4000; // how long the white overlay takes to cover patterns

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

            // Wait for last blue pulse to settle into grey
            setTimeout(() => {

                // Inc. fades in
                if (sub) sub.classList.add('visible');

                // After Inc. has settled, fade in white overlay over the patterns
                setTimeout(() => {

                    // Create overlay — CSS transition, no animation conflict
                    const overlay = document.createElement('div');
                    overlay.id = 'fade-overlay';
                    landing.appendChild(overlay);

                    // Force reflow so transition fires from opacity:0
                    overlay.offsetHeight;

                    // Trigger the CSS transition (defined in index.css)
                    overlay.style.opacity = '1';

                    // Mosaic fires once overlay is opaque (canvas z-index:4 sits above overlay z-index:3)
                    setTimeout(() => {
                        document.dispatchEvent(new CustomEvent('cherenkov:revealed'));
                    }, OVERLAY_FADE_MS);

                }, INC_SETTLE_MS);

            }, BLUE_PULSE_MS);
        }
    });
})();
