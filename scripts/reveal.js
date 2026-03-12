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

    // Logo image (fades in as letters are revealed)
    const logoMark = document.getElementById('logo-mark');

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

        // Fade in logo as letters appear
        const revealed = document.querySelectorAll('.letter.visible').length;
        if (logoMark && revealed >= Math.floor(letters.length / 2)) {
            logoMark.style.opacity = '1';
        }

        if (revealed === letters.length) {
            triggered = true;

            setTimeout(() => {
                if (sub) sub.classList.add('visible');

                setTimeout(() => {
                    const overlay = document.createElement('div');
                    overlay.id = 'fade-overlay';
                    landing.appendChild(overlay);
                    overlay.offsetHeight;
                    overlay.style.opacity = '1';

                    setTimeout(() => {
                        document.dispatchEvent(new CustomEvent('cherenkov:revealed'));
                    }, OVERLAY_FADE_MS - 1000);

                }, INC_SETTLE_MS);
            }, BLUE_PULSE_MS);
        }
    });
})();
