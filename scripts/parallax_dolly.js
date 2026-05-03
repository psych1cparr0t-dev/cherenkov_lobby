/**
 * Parallax Dolly Effect
 * Synchronizes multiple video layers with clip-paths and scales them on scroll.
 */
(function() {
    window.addEventListener('load', () => {
        const masks = [
            null, // Base layer (unmasked)
            // Layer 4: Left mid-ground ridge
            "polygon(0.00% 79.96%, 0.00% 69.10%, 1.61% 69.62%, 1.82% 70.46%, 1.93% 70.56%, 2.60% 70.98%, 3.13% 71.82%, 3.59% 72.44%, 4.11% 72.96%, 4.53% 73.17%, 5.52% 73.70%, 6.20% 74.11%, 7.76% 76.30%, 7.86% 76.30%, 8.39% 77.14%, 9.01% 78.18%, 9.64% 79.44%, 10.31% 79.85%, 11.25% 80.06%, 11.61% 80.69%, 12.19% 81.32%, 12.66% 81.94%, 13.49% 82.57%, 13.96% 82.67%, 14.48% 83.19%, 15.52% 84.03%, 16.56% 84.55%, 16.98% 84.86%, 17.45% 85.07%, 17.45% 85.18%, 17.34% 86.74%, 17.29% 87.06%, 17.03% 87.79%, 16.72% 88.10%, 16.67% 88.31%, 16.56% 88.20%, 16.51% 87.68%, 16.51% 87.47%, 16.15% 86.85%, 15.68% 86.85%, 15.47% 87.16%, 15.42% 87.79%, 14.90% 88.10%, 14.74% 88.00%, 14.69% 87.37%, 14.64% 86.53%, 14.22% 86.43%, 13.91% 86.64%, 13.91% 86.85%, 14.01% 87.47%, 13.75% 87.89%, 13.54% 88.31%, 13.39% 88.94%, 13.13% 89.04%, 12.81% 89.87%, 12.81% 90.08%, 12.76% 90.40%, 12.81% 91.44%, 12.45% 91.96%, 11.88% 91.86%, 12.03% 91.02%, 12.03% 89.46%, 11.61% 88.62%, 11.46% 87.89%, 11.30% 87.16%, 10.99% 86.12%, 10.94% 86.01%, 10.31% 86.74%, 10.21% 87.58%, 9.79% 88.10%, 9.17% 88.83%, 9.22% 89.04%, 9.01% 88.52%, 9.01% 87.58%, 8.39% 87.27%, 7.81% 87.16%, 7.14% 86.95%, 6.67% 86.85%, 5.94% 86.85%, 5.83% 86.95%, 5.52% 87.27%, 5.26% 86.74%, 5.16% 86.01%, 5.00% 84.97%, 4.69% 83.82%, 4.32% 82.99%, 3.80% 81.84%, 2.97% 81.42%, 2.55% 80.90%, 1.20% 79.75%, 0.94% 79.54%, 0.42% 79.02%, 0.00% 79.12%)",
            // Current Layer: Left-centre mid ridge
            "polygon(25.00% 79.75%, 24.43% 78.39%, 24.01% 77.04%, 23.39% 75.16%, 23.02% 73.38%, 22.55% 71.61%, 22.08% 70.67%, 21.56% 70.04%, 20.26% 69.42%, 19.11% 69.00%, 18.65% 69.00%, 18.07% 69.21%, 16.98% 69.94%, 16.61% 70.46%, 16.61% 70.67%, 16.15% 70.98%, 15.94% 71.71%, 15.83% 71.82%, 15.52% 72.23%, 15.26% 72.44%, 15.00% 72.76%, 14.53% 73.28%, 14.48% 73.28%, 13.65% 73.59%, 13.44% 74.01%, 12.92% 74.11%, 12.24% 73.90%, 11.98% 73.90%, 11.41% 73.80%, 11.09% 73.28%, 10.68% 73.28%, 10.26% 72.13%, 9.53% 70.15%, 9.32% 71.19%, 8.75% 70.67%, 8.02% 70.35%, 7.50% 70.67%, 7.14% 70.98%, 6.98% 71.09%, 6.72% 71.29%, 5.73% 71.09%, 5.52% 71.19%, 4.06% 70.98%, 3.96% 70.88%, 3.44% 70.88%, 3.39% 71.29%, 4.22% 71.82%, 4.27% 71.92%, 5.05% 72.96%, 5.57% 73.38%, 6.15% 74.11%, 6.72% 75.05%, 6.93% 75.57%, 7.71% 76.51%, 7.86% 76.83%, 8.39% 77.56%, 8.70% 78.29%, 9.11% 79.23%, 9.95% 79.96%, 10.16% 80.27%, 10.63% 80.38%, 10.94% 80.27%, 11.04% 80.58%, 11.46% 81.94%, 11.98% 81.52%, 12.08% 81.42%, 12.29% 81.42%, 12.40% 81.73%, 12.71% 82.25%, 13.18% 82.67%, 13.28% 82.99%, 13.39% 83.09%, 13.54% 83.40%, 14.17% 84.03%, 14.64% 83.82%, 15.16% 84.45%, 15.42% 84.76%, 15.52% 84.86%, 15.68% 84.97%, 15.89% 85.07%, 16.35% 85.39%, 16.35% 85.49%, 16.88% 85.49%, 17.29% 85.39%, 17.34% 85.28%, 17.40% 85.18%, 17.81% 84.45%, 17.97% 84.24%, 18.54% 82.88%, 18.85% 82.36%, 19.27% 81.94%, 20.05% 81.42%, 20.94% 81.73%, 21.15% 81.84%, 22.14% 81.73%, 22.66% 81.84%, 23.23% 82.15%, 23.85% 82.88%, 24.58% 82.67%, 24.84% 82.46%, 25.31% 81.63%, 25.52% 81.11%, 25.62% 80.58%)",
            // Layer 5: Centre gap fill
            "polygon(41.15% 87.79%, 41.35% 88.31%, 41.51% 88.83%, 41.93% 89.77%, 42.50% 90.50%, 43.02% 91.44%, 43.70% 92.17%, 43.96% 92.80%, 44.22% 93.74%, 44.64% 94.57%, 45.21% 95.41%, 45.63% 96.24%, 45.99% 96.97%, 46.35% 96.97%, 46.35% 96.14%, 46.56% 94.99%, 46.77% 94.36%, 46.88% 93.63%, 47.29% 93.32%, 47.45% 93.42%, 47.97% 93.74%, 48.23% 93.74%, 48.49% 92.59%, 47.86% 91.96%, 46.41% 91.02%, 45.73% 90.08%, 45.26% 89.77%, 44.58% 89.98%, 44.17% 90.08%, 43.54% 89.77%, 43.39% 89.35%, 42.92% 88.83%, 42.55% 88.94%, 41.88% 89.14%, 41.04% 88.52%)",
            // Layer 1: Foreground left
            "polygon(0.00% 99.90%, 0.00% 79.75%, 0.10% 79.33%, 0.21% 79.23%, 0.47% 79.02%, 0.83% 79.02%, 1.09% 79.44%, 1.15% 79.54%, 1.61% 80.58%, 1.88% 80.79%, 2.24% 80.58%, 2.40% 80.58%, 2.86% 81.11%, 3.18% 81.63%, 3.91% 82.25%, 4.38% 82.67%, 4.38% 82.78%, 4.90% 83.61%, 4.95% 83.72%, 4.84% 84.13%, 5.00% 85.07%, 5.36% 85.70%, 5.63% 86.64%, 5.78% 87.06%, 5.73% 88.00%, 6.09% 87.27%, 6.30% 87.06%, 7.03% 87.06%, 7.92% 87.37%, 8.70% 87.79%, 8.85% 88.00%, 8.91% 88.00%, 9.01% 88.52%, 9.06% 89.35%, 9.06% 89.46%, 9.58% 88.94%, 9.64% 88.41%, 9.74% 87.58%, 10.00% 87.06%, 10.47% 86.22%, 10.73% 86.12%, 10.94% 86.85%, 11.04% 87.27%, 11.15% 88.52%, 11.35% 89.46%, 11.61% 89.98%, 11.88% 90.81%, 12.08% 91.44%, 12.29% 91.86%, 12.60% 91.96%, 13.07% 92.07%, 13.13% 91.23%, 13.23% 90.29%, 13.44% 89.67%, 13.54% 89.04%, 13.75% 88.41%, 13.75% 87.79%, 13.80% 86.85%, 14.11% 86.43%, 14.17% 86.43%, 14.53% 86.95%, 14.74% 87.68%, 14.90% 88.31%, 15.10% 88.31%, 15.16% 88.10%, 15.31% 87.27%, 15.78% 87.06%, 16.51% 87.58%, 16.30% 87.89%, 16.35% 88.62%, 16.98% 88.83%, 17.24% 87.79%, 17.50% 86.53%, 17.55% 85.18%, 17.92% 83.61%, 18.18% 82.78%, 18.75% 82.25%, 19.27% 81.94%, 20.10% 81.84%, 20.57% 81.63%, 21.82% 81.52%, 22.24% 81.42%, 22.60% 81.42%, 23.13% 81.94%, 23.33% 82.36%, 23.75% 82.88%, 24.17% 82.99%, 24.32% 82.88%, 24.79% 82.05%, 24.95% 81.63%, 25.16% 81.00%, 25.52% 80.06%, 25.78% 79.75%, 26.30% 79.23%, 26.82% 79.02%, 27.45% 78.91%, 27.97% 79.12%, 28.23% 80.27%, 28.54% 80.90%, 29.01% 80.17%, 29.48% 79.65%, 29.64% 79.23%, 30.10% 78.60%, 30.42% 78.39%, 31.04% 78.18%, 31.41% 78.71%, 31.46% 78.81%, 31.77% 79.44%, 32.19% 79.65%, 32.45% 79.75%, 32.60% 79.75%, 33.13% 79.54%, 33.44% 79.33%, 33.75% 79.23%, 34.22% 79.33%, 34.27% 79.44%, 34.69% 79.96%, 35.00% 80.27%, 35.52% 80.58%, 35.57% 80.58%, 35.78% 81.21%, 36.09% 81.84%, 36.25% 82.25%, 36.67% 82.99%, 37.14% 83.72%, 37.19% 83.72%, 37.66% 84.13%, 37.76% 84.24%, 38.39% 84.66%, 38.70% 85.28%, 39.01% 85.80%, 39.17% 86.22%, 39.32% 86.64%, 39.48% 87.16%, 39.79% 87.37%, 39.95% 86.95%, 40.10% 86.22%, 40.31% 86.12%, 40.57% 86.22%, 40.83% 86.95%, 40.94% 87.47%, 41.04% 88.00%, 41.15% 88.52%, 41.25% 88.73%, 41.56% 89.25%, 41.82% 89.56%, 42.34% 89.98%, 42.45% 90.08%, 42.71% 90.61%, 42.97% 91.02%, 43.13% 91.34%, 43.39% 91.86%, 43.75% 92.48%, 44.01% 93.11%, 44.38% 93.95%, 44.48% 94.26%, 44.79% 95.09%, 45.16% 95.82%, 45.42% 96.35%, 45.63% 96.87%, 45.68% 96.97%, 45.78% 97.39%, 45.68% 97.91%, 45.57% 98.96%, 45.36% 99.69%, 45.42% 99.90%)",
            // Layer 2: Foreground right
            "polygon(45.68% 99.90%, 46.09% 96.97%, 45.99% 96.45%, 46.20% 95.09%, 46.67% 94.26%, 46.88% 93.53%, 47.08% 93.22%, 47.60% 92.90%, 47.71% 92.90%, 47.92% 93.74%, 48.28% 94.15%, 48.49% 93.42%, 48.70% 92.59%, 48.96% 92.07%, 49.22% 92.38%, 49.53% 93.22%, 49.64% 93.74%, 50.16% 94.15%, 50.68% 93.74%, 51.04% 93.22%, 51.25% 93.32%, 51.51% 94.15%, 52.19% 94.26%, 52.45% 93.95%, 52.71% 93.22%, 53.07% 92.59%, 53.07% 92.48%, 53.49% 91.96%, 53.85% 91.75%, 54.32% 91.44%, 54.48% 91.23%, 54.90% 90.71%, 55.05% 90.50%, 55.26% 90.08%, 55.57% 89.35%, 55.89% 88.83%, 55.99% 88.00%, 56.30% 87.37%, 56.61% 87.06%, 57.24% 86.53%, 57.45% 86.33%, 57.86% 86.12%, 57.97% 86.01%, 58.39% 85.18%, 58.54% 84.45%, 58.96% 83.40%, 59.17% 83.30%, 59.74% 84.13%, 60.16% 84.55%, 60.57% 84.66%, 60.62% 85.28%, 60.99% 85.80%, 61.04% 85.80%, 61.67% 85.59%, 62.19% 84.76%, 62.45% 84.34%, 62.76% 84.34%, 62.86% 84.45%, 63.75% 84.86%, 64.06% 85.18%, 64.32% 85.28%, 64.53% 85.39%, 65.26% 85.70%, 65.42% 85.70%, 65.99% 85.49%, 66.41% 84.76%, 66.77% 85.28%, 66.98% 85.59%, 67.29% 85.80%, 67.45% 84.86%, 67.60% 83.92%, 67.76% 83.72%, 67.81% 83.92%, 68.02% 84.55%, 68.49% 85.28%, 68.59% 86.01%, 68.75% 86.64%, 69.11% 86.43%, 69.38% 86.22%, 69.95% 86.64%, 70.21% 87.06%, 70.31% 87.37%, 70.68% 87.27%, 70.73% 87.16%, 71.20% 87.06%, 71.46% 87.68%, 71.61% 88.20%, 72.14% 88.52%, 72.55% 88.52%, 72.92% 88.62%, 73.75% 88.83%, 74.01% 88.62%, 74.22% 88.31%, 74.43% 88.20%, 74.48% 88.20%, 74.79% 89.04%, 74.90% 89.67%, 75.05% 90.08%, 75.68% 90.29%, 75.94% 90.40%, 76.15% 90.29%, 76.56% 89.67%, 76.77% 90.29%, 77.08% 90.29%, 77.45% 90.92%, 77.50% 91.13%, 78.02% 92.07%, 78.28% 92.48%, 78.44% 92.90%, 79.01% 93.74%, 79.43% 94.36%, 80.00% 94.57%, 80.47% 94.99%, 81.09% 95.72%, 81.67% 96.24%, 82.03% 96.66%, 82.71% 97.39%, 83.07% 97.91%, 83.54% 98.43%, 83.96% 99.06%, 84.22% 99.58%, 84.43% 99.90%)",
            // Layer 3: Far right
            "polygon(79.90% 94.57%, 80.73% 94.26%, 81.20% 93.95%, 81.61% 93.63%, 82.24% 93.42%, 82.81% 93.01%, 83.75% 92.59%, 84.22% 92.17%, 84.53% 92.07%, 84.90% 91.96%, 85.42% 91.13%, 85.83% 89.98%, 86.25% 89.04%, 86.51% 88.52%, 87.03% 87.89%, 87.45% 87.27%, 87.86% 86.85%, 88.49% 86.22%, 88.96% 85.80%, 89.53% 85.28%, 90.26% 84.76%, 90.68% 84.86%, 91.46% 85.59%, 92.24% 85.70%, 92.50% 85.70%, 93.44% 85.91%, 94.43% 86.33%, 94.84% 86.95%, 95.10% 87.47%, 95.89% 88.73%, 96.15% 89.04%, 96.72% 89.67%, 97.29% 89.87%, 97.60% 89.98%, 98.85% 89.98%, 99.01% 89.87%, 99.38% 89.04%, 99.84% 87.68%, 99.84% 87.58%, 99.95% 90.81%, 99.95% 92.17%, 99.95% 93.74%, 99.95% 96.35%, 99.90% 98.33%, 99.95% 99.79%, 99.95% 99.90%, 98.18% 99.90%, 96.30% 99.90%, 93.91% 99.90%, 91.98% 99.90%, 89.32% 99.90%, 87.08% 99.58%, 85.26% 99.90%, 84.38% 99.69%)"
        ];

        // Rates: one per mask entry (index 0 = base, 1-6 = layers, 7 = wordmark)
        window.PARALLAX_RATES = [
            { scale: 0.02, y: 0, x: 0 },  // Base (sky)
            { scale: 0.06, y: 0, x: 0 },  // Layer 4 – left mid-ground
            { scale: 0.08, y: 0, x: 0 },  // Current – left-centre mid
            { scale: 0.12, y: 0, x: 0 },  // Layer 5 – centre gap fill
            { scale: 0.25, y: 0, x: 0 },  // Layer 1 – foreground left
            { scale: 0.25, y: 0, x: 0 },  // Layer 2 – foreground right
            { scale: 0.18, y: 0, x: 0 },  // Layer 3 – far right
            { scale: 0,    y: 0, x: 0 },  // Wordmark Title
            { scale: 0,    y: 0, x: 0 }   // Contact Nav
        ];

        const baseVideo = document.getElementById('veil-video-a');
        if (!baseVideo) return;

        // Scroll setup — append a tall spacer so the native scrollbar appears,
        // but drive parallax from wheel events directly (avoids window.scrollY unreliability)
        const spacer = document.createElement('div');
        spacer.style.position = 'absolute';
        spacer.style.top = '0';
        spacer.style.left = '0';
        spacer.style.width = '1px';
        spacer.style.height = '300vh';
        spacer.style.pointerEvents = 'none';
        spacer.style.visibility = 'hidden';
        document.body.appendChild(spacer);
        document.documentElement.style.overflowY = 'scroll';
        document.body.style.overflowY = 'visible';

        // Manual scroll progress: driven by wheel events for reliability
        let scrollProgress = 0; // 0 = top, 1 = bottom
        const SCROLL_SPEED = 0.0006; // tune: how fast wheel moves through the scene

        // Fixed container for all parallax layers
        const parallaxContainer = document.createElement('div');
        parallaxContainer.style.position = 'fixed';
        parallaxContainer.style.top = '0';
        parallaxContainer.style.left = '0';
        parallaxContainer.style.width = '100vw';
        parallaxContainer.style.height = '100vh';
        parallaxContainer.style.overflow = 'hidden';
        parallaxContainer.style.zIndex = '3';

        // Append parallax container to body directly (avoids #landing-page clipping)
        document.body.appendChild(parallaxContainer);
        parallaxContainer.appendChild(baseVideo);

        baseVideo.style.position = 'absolute';
        baseVideo.style.top = '0';
        baseVideo.style.left = '0';
        baseVideo.style.width = '100vw';
        baseVideo.style.height = '100vh';
        baseVideo.style.objectFit = 'cover';

        // (Tower and glass monolith removed — reserved for future reveal)

        // Array: index 0 = base video
        const layerElements = [baseVideo];

        document.addEventListener('cherenkov:load-mosaic', () => {
            setTimeout(() => {
                const totalLayers = masks.length - 1; // 6
                for (let i = 1; i <= totalLayers; i++) {
                    const clone = baseVideo.cloneNode(true);
                    clone.id = `veil-video-layer-${i}`;
                    clone.style.position = 'absolute';
                    clone.style.top = '0';
                    clone.style.left = '0';
                    clone.style.width = '100%';
                    clone.style.height = '100%';
                    clone.style.objectFit = 'cover';
                    clone.style.pointerEvents = 'none';
                    clone.style.zIndex = 'auto';
                    clone.src = baseVideo.src;

                    // Wrapper div: clip-path lives here (position:absolute = element-box-relative %)
                    // Transform also applied here so the mask boundary moves with the scale.
                    // If clip-path were on the video (position:fixed ancestor chain), browsers
                    // treat percentages as viewport-relative and the mask stays frozen on screen.
                    const wrapper = document.createElement('div');
                    wrapper.style.position = 'absolute';
                    wrapper.style.top = '0';
                    wrapper.style.left = '0';
                    wrapper.style.width = '100%';
                    wrapper.style.height = '100%';
                    wrapper.style.pointerEvents = 'none';
                    wrapper.style.zIndex = (i + 2).toString();
                    wrapper.style.transformOrigin = 'bottom center';

                    if (masks[i]) {
                        wrapper.style.clipPath = masks[i];
                        wrapper.style.webkitClipPath = masks[i];
                    }

                    wrapper.appendChild(clone);
                    parallaxContainer.appendChild(wrapper);
                    layerElements.push(wrapper);  // transform targets the wrapper now

                    baseVideo.addEventListener('play', () => clone.play());
                    baseVideo.addEventListener('pause', () => clone.pause());
                    baseVideo.addEventListener('seeked', () => { clone.currentTime = baseVideo.currentTime; });
                    if (!baseVideo.paused) clone.play();

                    setInterval(() => {
                        if (Math.abs(clone.currentTime - baseVideo.currentTime) > 0.1) {
                            clone.currentTime = baseVideo.currentTime;
                        }
                    }, 1000);
                }
            }, 100);
        });

        const wordmark = document.querySelector('.wordmark-container');
        const topNav = document.querySelector('.top-nav');
        const wordmarkRateIndex = masks.length; // index after all video layers
        const navRateIndex = masks.length + 1;

        let isTicking = false;

        function updateParallax() {
            const scrollPercent = scrollProgress;

            layerElements.forEach((el, index) => {
                const rate = window.PARALLAX_RATES[index];
                if (!rate) return;
                const scale = 1 + (scrollPercent * rate.scale);
                const ty = scrollPercent * rate.y * 100;
                const tx = scrollPercent * rate.x * 100;
                el.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
                el.style.transformOrigin = 'bottom center';
            });

            // Parallax the HQ — slide up gently as user scrolls, preserve bottom anchor
            if (hqEl) hqEl.style.transform = `translateX(-50%) translateY(${-scrollPercent * 80}px)`;
            if (blurEl) blurEl.style.transform = `translate(-50%, calc(-50% + ${scrollPercent * 100}px)) scale(${1 + scrollPercent * 0.05})`;

            const wRate = window.PARALLAX_RATES[wordmarkRateIndex];
            if (wordmark && wRate) {
                const ws = 1 + scrollPercent * wRate.scale;
                const wy = scrollPercent * wRate.y * 100;
                const wx = scrollPercent * wRate.x * 100;
                wordmark.style.transform = `translate(calc(-50% + ${wx}px), ${wy}px) scale(${ws})`;
            }

            const nRate = window.PARALLAX_RATES[navRateIndex];
            if (topNav && nRate) {
                const ns = 1 + scrollPercent * nRate.scale;
                const ny = scrollPercent * nRate.y * 100;
                const nx = scrollPercent * nRate.x * 100;
                topNav.style.transform = `translate(${nx}px, ${ny}px) scale(${ns})`;
            }

            isTicking = false;
        }

        const onScroll = () => {
            if (!isTicking) {
                window.requestAnimationFrame(updateParallax);
                isTicking = true;
            }
        };

        // Wheel event is the most reliable cross-browser way to drive parallax
        window.addEventListener('wheel', (e) => {
            scrollProgress = Math.max(0, Math.min(1, scrollProgress + e.deltaY * SCROLL_SPEED));
            // Also sync the native scrollbar position to match
            const scrollMax = document.documentElement.scrollHeight - window.innerHeight;
            window.scrollTo({ top: scrollProgress * scrollMax, behavior: 'instant' });
            onScroll();
        }, { passive: true });

        // Keep window scroll listener as fallback (keyboard arrows, trackpad momentum, etc.)
        window.addEventListener('scroll', () => {
            const scrollMax = document.documentElement.scrollHeight - window.innerHeight;
            if (scrollMax > 0) scrollProgress = window.scrollY / scrollMax;
            onScroll();
        }, { passive: true });


        updateParallax();
    });
})();
