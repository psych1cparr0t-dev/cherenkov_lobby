// Cherenkov — Letter Proximity Reveal
// Hovers near letters to reveal them one by one.
// When all 9 letters are visible, waits for the last blue pulse
// to finish settling (~2.5s), then:
//   • "Inc." fades in
//   • background patterns dissolve (2s)
//   • 2.8s later → 'cherenkov:revealed' fires to start the mosaic

(function () {
    const letters = document.querySelectorAll('.letter');
    const sub = document.getElementById('wordmark-sub');
    let triggered = false;

    const BLUE_PULSE_DURATION = 2500; // matches bluePulse animation in CSS
    const PATTERN_FADE_DURATION = 2800; // ms after patterns start fading before mosaic fires

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

            // Wait for the last letter's blue pulse to finish settling into grey
            setTimeout(() => {

                // Inc. fades in once letters are settled
                if (sub) sub.classList.add('visible');

                // Background patterns begin 2s dissolve
                document.querySelectorAll('.background-pattern')
                    .forEach(el => el.classList.add('hidden'));

                // Mosaic fires after patterns are gone
                setTimeout(() => {
                    document.dispatchEvent(new CustomEvent('cherenkov:revealed'));
                }, PATTERN_FADE_DURATION);

            }, BLUE_PULSE_DURATION);
        }
    });
})();
