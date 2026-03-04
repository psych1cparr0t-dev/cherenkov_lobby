// Cherenkov — Letter Proximity Reveal
// Hovers near letters to reveal them one by one.
// When all 9 are visible:
//   • "Inc." fades in
//   • background patterns fade out (2s CSS transition)
//   • 2.8s later → fires 'cherenkov:revealed' to start the mosaic
//     (giving the background time to fully disappear first)

(function () {
    const letters = document.querySelectorAll('.letter');
    const sub = document.getElementById('wordmark-sub');
    let triggered = false;

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

            // Inc. fades in
            if (sub) sub.classList.add('visible');

            // Background patterns start fading out immediately (2s CSS transition)
            document.querySelectorAll('.background-pattern')
                .forEach(el => el.classList.add('hidden'));

            // Mosaic fires after patterns have fully faded — brief clear pause
            setTimeout(() => {
                document.dispatchEvent(new CustomEvent('cherenkov:revealed'));
            }, 2800);
        }
    });
})();
