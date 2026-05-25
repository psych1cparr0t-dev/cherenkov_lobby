/**
 * Contact Modal — Cinematic Glassmorphism Popup
 * Replaces the bare mailto link with a sleek overlay form.
 */
(function () {

    let modalOverlay = null;
    let isOpen = false;

    function createModal() {
        modalOverlay = document.createElement('div');
        modalOverlay.id = 'contact-modal-overlay';
        modalOverlay.innerHTML = `
            <div class="contact-modal" role="dialog" aria-modal="true" aria-labelledby="contact-heading">
                <button class="contact-close" aria-label="Close contact form">&times;</button>
                <h2 id="contact-heading" class="contact-title">Get in Touch</h2>
                <p class="contact-subtitle">We'd love to hear from you.</p>
                <form id="contact-form" class="contact-form" autocomplete="off">
                    <div class="form-group">
                        <input type="text" id="contact-name" name="name" required placeholder=" " />
                        <label for="contact-name">Name</label>
                        <div class="input-line"></div>
                    </div>
                    <div class="form-group">
                        <input type="email" id="contact-email" name="email" required placeholder=" " />
                        <label for="contact-email">Email</label>
                        <div class="input-line"></div>
                    </div>
                    <div class="form-group">
                        <textarea id="contact-message" name="message" rows="4" required placeholder=" "></textarea>
                        <label for="contact-message">Message</label>
                        <div class="input-line"></div>
                    </div>
                    <button type="submit" class="contact-submit">
                        <span class="submit-text">Send Message</span>
                        <span class="submit-loading" style="display:none;">Sending…</span>
                        <span class="submit-done" style="display:none;">✓ Sent</span>
                    </button>
                </form>
            </div>
        `;

        document.body.appendChild(modalOverlay);

        // Close handlers
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });

        modalOverlay.querySelector('.contact-close').addEventListener('click', closeModal);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isOpen) closeModal();
        });

        // Form submit
        const form = modalOverlay.querySelector('#contact-form');
        form.addEventListener('submit', handleSubmit);
    }

    function openModal() {
        if (!modalOverlay) createModal();
        isOpen = true;

        // Force reflow before adding active class
        modalOverlay.style.display = 'flex';
        modalOverlay.offsetHeight; // trigger reflow
        modalOverlay.classList.add('active');

        // Trap focus
        setTimeout(() => {
            modalOverlay.querySelector('#contact-name').focus();
        }, 400);
    }

    function closeModal() {
        if (!modalOverlay || !isOpen) return;
        isOpen = false;
        modalOverlay.classList.remove('active');

        setTimeout(() => {
            modalOverlay.style.display = 'none';
            // Reset form
            const form = modalOverlay.querySelector('#contact-form');
            if (form) form.reset();
            // Reset submit button
            const submitBtn = modalOverlay.querySelector('.contact-submit');
            if (submitBtn) {
                submitBtn.querySelector('.submit-text').style.display = '';
                submitBtn.querySelector('.submit-loading').style.display = 'none';
                submitBtn.querySelector('.submit-done').style.display = 'none';
                submitBtn.disabled = false;
            }
        }, 500);
    }

    function handleSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const submitBtn = form.querySelector('.contact-submit');
        const name = form.querySelector('#contact-name').value;
        const email = form.querySelector('#contact-email').value;
        const message = form.querySelector('#contact-message').value;

        // Show loading state
        submitBtn.querySelector('.submit-text').style.display = 'none';
        submitBtn.querySelector('.submit-loading').style.display = 'inline';
        submitBtn.disabled = true;

        // Compose mailto (fallback — always works, no backend needed)
        const subject = encodeURIComponent(`Contact from ${name}`);
        const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);
        const mailtoUrl = `mailto:contact@cherenkov.industries?subject=${subject}&body=${body}`;

        // Brief pause for UX, then open mail client
        setTimeout(() => {
            window.location.href = mailtoUrl;

            // Show success
            submitBtn.querySelector('.submit-loading').style.display = 'none';
            submitBtn.querySelector('.submit-done').style.display = 'inline';

            // Close after brief delay
            setTimeout(() => closeModal(), 1800);
        }, 600);
    }

    // ── Hook into the Contact link ─────────────────────────────────

    function hookContactLink() {
        const contactLink = document.getElementById('contact-link');
        if (!contactLink) return;

        // Override the mailto with our modal
        contactLink.removeAttribute('href');
        contactLink.style.cursor = 'pointer';
        contactLink.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });
    }

    // Bootstrap after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', hookContactLink);
    } else {
        hookContactLink();
    }

})();
