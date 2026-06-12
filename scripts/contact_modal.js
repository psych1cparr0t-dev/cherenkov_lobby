/**
 * Contact Modal — Ultra Minimalist
 * Stripped down form to let the visual presentation and soundscape breathe.
 */
(function () {

    let modalOverlay = null;
    let isOpen = false;

    function createModal() {
        modalOverlay = document.createElement('div');
        modalOverlay.id = 'contact-modal-overlay';
        modalOverlay.innerHTML = `
            <div class="contact-modal" role="dialog" aria-modal="true" aria-label="Contact">
                <button class="contact-close" aria-label="Close">&times;</button>
                <form id="contact-form" class="contact-form" autocomplete="off">
                    <input type="email" id="contact-email" name="email" required placeholder="Your email..." />
                    <textarea id="contact-message" name="message" rows="4" required placeholder="Message..."></textarea>
                    <button type="submit" class="contact-submit">
                        <span class="submit-text">Send</span>
                        <span class="submit-loading" style="display:none;">Sending...</span>
                        <span class="submit-done" style="display:none;">Sent</span>
                    </button>
                </form>
            </div>
        `;

        document.body.appendChild(modalOverlay);

        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });

        modalOverlay.querySelector('.contact-close').addEventListener('click', closeModal);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isOpen) closeModal();
        });

        const form = modalOverlay.querySelector('#contact-form');
        form.addEventListener('submit', handleSubmit);
    }

    function openModal() {
        if (!modalOverlay) createModal();
        isOpen = true;

        modalOverlay.style.display = 'flex';
        modalOverlay.offsetHeight; // force reflow
        modalOverlay.classList.add('active');

        setTimeout(() => {
            modalOverlay.querySelector('#contact-email').focus();
        }, 400);
    }

    function closeModal() {
        if (!modalOverlay || !isOpen) return;
        isOpen = false;
        modalOverlay.classList.remove('active');

        setTimeout(() => {
            modalOverlay.style.display = 'none';
            const form = modalOverlay.querySelector('#contact-form');
            if (form) form.reset();
            const submitBtn = modalOverlay.querySelector('.contact-submit');
            if (submitBtn) {
                submitBtn.querySelector('.submit-text').style.display = '';
                submitBtn.querySelector('.submit-loading').style.display = 'none';
                submitBtn.querySelector('.submit-done').style.display = 'none';
                submitBtn.disabled = false;
            }
        }, 400);
    }

    function handleSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const submitBtn = form.querySelector('.contact-submit');
        const email = form.querySelector('#contact-email').value;
        const message = form.querySelector('#contact-message').value;

        submitBtn.querySelector('.submit-text').style.display = 'none';
        submitBtn.querySelector('.submit-loading').style.display = 'inline';
        submitBtn.disabled = true;

        // Fallback mailto (since there is no backend)
        const subject = encodeURIComponent(`Inquiry`);
        const body = encodeURIComponent(`From: ${email}\n\n${message}`);
        const mailtoUrl = `mailto:max@cherenkov.industries?subject=${subject}&body=${body}`;

        setTimeout(() => {
            window.location.href = mailtoUrl;

            submitBtn.querySelector('.submit-loading').style.display = 'none';
            submitBtn.querySelector('.submit-done').style.display = 'inline';

            setTimeout(() => closeModal(), 1500);
        }, 600);
    }

    function hookContactLink() {
        const contactLink = document.getElementById('contact-link');
        if (!contactLink) return;

        contactLink.removeAttribute('href');
        contactLink.style.cursor = 'pointer';
        contactLink.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', hookContactLink);
    } else {
        hookContactLink();
    }

})();
