// ============================================
// CHERENKOV — Letter Proximity Reveal
// Reveals hidden letters as the cursor hovers near them.
// No concierge, no input bar, just the title.
// ============================================

(function () {
    const letters = document.querySelectorAll('.letter');

    document.addEventListener('mousemove', (e) => {
        letters.forEach((letter) => {
            if (letter.classList.contains('visible')) return;

            const rect = letter.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dist = Math.hypot(e.clientX - cx, e.clientY - cy);

            if (dist < 120) {
                letter.classList.add('visible', 'blue-pulse');
            }
        });
    });
})();
