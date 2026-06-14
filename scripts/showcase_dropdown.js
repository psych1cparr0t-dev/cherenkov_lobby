/**
 * Top Glass Bar - Cinematic Pulldown Menu
 */
(function() {
    window.addEventListener('load', () => {
        const topBar = document.getElementById('top-glass-bar');
        if (!topBar) return;

        let isOpen = false;

        function toggleMenu() {
            isOpen = !isOpen;
            if (isOpen) {
                topBar.classList.add('expanded');
            } else {
                topBar.classList.remove('expanded');
            }
        }

        // Click anywhere on the bar toggles the menu
        topBar.addEventListener('click', (e) => {
            // Prevent toggling if they click an actual project link inside the menu
            if (e.target.tagName.toLowerCase() === 'a') return;
            toggleMenu();
        });

        // Close if they click anywhere outside the bar when it's open
        document.addEventListener('click', (e) => {
            if (isOpen && !topBar.contains(e.target)) {
                toggleMenu();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isOpen) {
                toggleMenu();
            }
        });
    });
})();
