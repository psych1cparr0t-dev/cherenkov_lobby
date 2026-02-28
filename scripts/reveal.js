// ============================================
// CHERENKOV — Letter Proximity Reveal
// Reveals hidden letters as the cursor hovers near them.
// Dispatches 'cherenkov:revealed' once all letters are shown,
// which triggers the veil mosaic to fade in.
// ============================================

(function () {
    const letters = document.querySelectorAll('.letter');
    let veilTriggered = false;

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

        if (!veilTriggered && document.querySelectorAll('.letter.visible').length === letters.length) {
            veilTriggered = true;
            setTimeout(() => {
                document.dispatchEvent(new CustomEvent('cherenkov:revealed'));
            }, 1200);
        }
    });
})();
