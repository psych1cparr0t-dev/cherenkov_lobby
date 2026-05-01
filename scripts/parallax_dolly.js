/**
 * Parallax Dolly Effect
 * Synchronizes multiple video layers with clip-paths and scales them on scroll.
 */
(function() {
    window.addEventListener('load', () => {
        // The masks provided by the user
        const masks = [
            // Base layer is unmasked
            null,
            // Layer 3 (Furthest mountain ridge)
            "polygon(0.52% 47.78%, 3.76% 48.12%, 7.60% 48.24%, 10.13% 47.78%, 13.10% 47.33%, 15.11% 45.28%, 17.29% 42.21%, 18.69% 41.87%, 20.52% 39.02%, 21.48% 38.79%, 23.32% 40.05%, 24.45% 40.16%, 25.50% 39.70%, 25.94% 40.61%, 27.07% 40.61%, 28.30% 39.25%, 29.00% 38.34%, 30.22% 38.34%, 31.00% 37.66%, 32.05% 38.68%, 32.23% 39.59%, 33.10% 39.59%, 33.89% 38.23%, 34.67% 38.23%, 35.46% 36.52%, 36.24% 35.27%, 37.47% 34.81%, 37.90% 34.36%, 39.04% 34.13%, 39.65% 33.90%, 40.61% 33.56%, 41.14% 35.04%, 42.18% 35.72%, 43.06% 36.41%, 43.93% 37.43%, 44.45% 38.45%, 44.63% 39.14%, 45.33% 38.45%, 46.20% 39.36%, 46.55% 40.50%, 47.51% 39.82%, 48.73% 40.27%, 48.91% 40.96%, 50.31% 41.87%, 51.79% 41.64%, 54.50% 41.52%, 58.78% 41.18%, 66.90% 41.18%, 70.13% 41.52%, 71.79% 42.09%, 71.88% 41.98%, 75.28% 56.66%, 76.33% 57.91%, 80.17% 58.25%, 82.53% 59.61%, 86.81% 59.95%, 92.75% 59.84%, 93.28% 59.50%, 96.16% 58.25%, 98.17% 57.91%, 99.65% 57.91%, 99.56% 83.73%, 98.95% 86.12%, 97.90% 87.14%, 96.86% 87.60%, 93.97% 87.83%, 93.01% 88.51%, 91.09% 88.74%, 88.73% 87.49%, 86.64% 84.53%, 85.59% 84.41%, 84.89% 85.32%, 84.02% 84.87%, 83.67% 83.39%, 81.40% 83.28%, 80.70% 84.19%, 79.30% 83.50%, 78.78% 82.14%, 78.25% 82.14%, 77.03% 81.11%, 75.63% 81.34%, 74.50% 79.18%, 73.28% 80.89%, 71.09% 79.86%, 71.09% 80.55%, 69.61% 80.77%, 67.25% 80.09%, 66.03% 79.86%, 64.45% 80.66%, 63.49% 79.64%, 61.75% 79.07%, 61.05% 80.20%, 60.00% 81.68%, 58.34% 82.14%, 57.29% 84.64%, 55.28% 85.78%, 54.50% 86.58%, 52.75% 88.28%, 51.35% 88.51%, 50.22% 87.94%, 49.34% 88.40%, 46.72% 87.03%, 46.03% 88.17%, 45.07% 88.96%, 44.45% 92.26%, 42.88% 89.99%, 41.75% 87.83%, 40.44% 85.78%, 38.25% 83.73%, 37.29% 81.23%, 35.63% 81.34%, 35.81% 82.03%, 33.28% 79.41%, 29.78% 75.65%, 29.26% 76.00%, 27.34% 75.09%, 25.85% 76.00%, 23.84% 74.29%, 20.44% 77.02%, 18.08% 75.31%, 17.12% 76.22%, 16.51% 76.91%, 15.20% 72.92%, 13.19% 69.62%, 11.88% 68.15%, 8.82% 66.21%, 8.30% 66.55%, 6.99% 66.89%, 4.28% 67.35%, 1.40% 69.62%, 0.35% 70.53%, 0.61% 71.10%, 4.80% 67.92%, 0.35% 70.99%, 0% 100%, 100% 100%)",
            // Layer 2 (Midground mountain)
            "polygon(0.35% 71.56%, 4.10% 68.83%, 6.99% 66.89%, 8.21% 67.46%, 9.34% 66.89%, 11.35% 67.92%, 12.93% 69.85%, 16.68% 76.91%, 15.20% 78.61%, 13.01% 78.27%, 12.49% 77.47%, 6.46% 77.93%, 5.15% 81.80%, 4.02% 83.50%, 2.71% 80.66%, 0.87% 81.34%, 0.44% 83.16%, 0.26% 82.37%, 0% 100%, 100% 100%)",
            // Layer 1 (Foreground mountain)
            "polygon(0.35% 84.53%, 1.14% 82.37%, 1.83% 82.14%, 3.67% 82.71%, 4.19% 83.05%, 4.80% 83.39%, 5.24% 81.91%, 5.59% 80.32%, 6.38% 78.50%, 6.90% 77.93%, 8.38% 77.59%, 9.87% 77.59%, 11.70% 77.47%, 12.84% 77.47%, 13.10% 77.47%, 13.36% 78.04%, 14.15% 79.07%, 14.41% 79.07%, 15.20% 78.84%, 16.68% 77.93%, 16.68% 76.68%, 17.12% 75.77%, 17.73% 75.31%, 18.60% 75.31%, 20.44% 76.56%, 20.79% 76.79%, 24.02% 74.74%, 24.72% 75.09%, 25.15% 75.88%, 26.11% 76.34%, 26.64% 76.22%, 27.07% 75.77%, 27.77% 75.43%, 28.47% 75.65%, 29.08% 76.00%, 29.61% 76.34%, 30.22% 76.56%, 30.92% 77.59%, 31.35% 77.93%, 32.05% 78.38%, 32.40% 79.18%, 32.66% 79.64%, 32.75% 79.98%, 33.54% 80.43%, 34.24% 80.77%, 35.55% 81.11%, 35.55% 81.34%, 35.90% 82.03%, 36.07% 82.59%, 36.07% 82.82%, 36.24% 82.03%, 36.51% 81.68%, 36.94% 81.68%, 37.55% 82.25%, 37.73% 83.28%, 37.73% 83.85%, 38.08% 84.41%, 39.74% 85.67%, 39.74% 85.67%, 40.35% 86.35%, 40.79% 86.92%, 40.79% 86.92%, 40.96% 87.03%, 41.48% 86.80%, 41.48% 86.80%, 41.48% 86.80%, 41.48% 86.80%, 41.48% 86.80%, 41.83% 87.49%, 41.83% 87.49%, 42.10% 87.83%, 42.53% 88.51%, 43.06% 88.85%, 43.32% 89.42%, 43.58% 89.87%, 43.58% 89.99%, 43.76% 90.44%, 43.84% 90.78%, 44.02% 91.13%, 44.63% 91.35%, 44.89% 91.24%, 44.98% 90.90%, 44.89% 90.10%, 44.89% 89.76%, 45.15% 89.42%, 45.68% 88.85%, 45.85% 88.62%, 46.29% 88.28%, 46.29% 88.28%, 46.55% 88.28%, 46.72% 88.40%, 46.99% 88.62%, 47.60% 88.40%, 47.69% 88.28%, 47.77% 87.94%, 48.12% 87.49%, 48.30% 87.49%, 48.82% 87.71%, 49.17% 87.94%, 49.34% 88.28%, 49.52% 88.62%, 50.57% 88.51%, 50.66% 88.40%, 50.74% 88.28%, 51.09% 88.05%, 51.27% 88.05%, 51.53% 88.05%, 51.97% 88.17%, 52.14% 88.17%, 52.58% 88.51%, 52.75% 88.51%, 53.28% 88.28%, 53.54% 87.94%, 53.71% 87.71%, 53.89% 87.14%, 54.15% 86.92%, 54.59% 86.58%, 55.02% 86.46%, 55.72% 86.23%, 55.90% 85.89%, 56.07% 85.44%, 56.42% 85.21%, 56.77% 84.98%, 57.03% 84.41%, 57.47% 83.85%, 57.82% 83.05%, 58.25% 82.14%, 59.21% 81.80%, 59.74% 81.57%, 60.87% 81.46%, 60.96% 81.34%, 61.05% 80.20%, 61.83% 79.52%, 62.10% 79.29%, 62.45% 79.29%, 63.06% 79.29%, 63.06% 79.29%, 63.14% 79.75%, 63.23% 80.09%, 63.67% 80.32%, 64.02% 80.43%, 64.54% 80.89%, 64.80% 81.11%, 65.41% 81.23%, 65.76% 80.89%, 66.11% 80.43%, 66.38% 80.20%, 66.72% 79.98%, 67.42% 79.86%, 67.95% 79.98%, 68.38% 80.09%, 68.73% 80.32%, 68.91% 80.43%, 69.61% 80.89%, 69.69% 80.89%, 70.48% 81.00%, 71.18% 81.00%, 71.53% 80.89%, 71.97% 80.55%, 72.14% 80.43%, 72.84% 80.77%, 73.28% 81.11%, 73.28% 81.11%, 73.54% 79.75%, 73.97% 79.41%, 74.15% 79.41%, 74.85% 79.98%, 75.02% 80.43%, 75.46% 81.23%, 75.63% 81.46%, 75.81% 81.91%, 76.16% 82.25%, 77.29% 82.37%, 77.47% 82.37%, 78.08% 82.82%, 78.17% 82.94%, 78.78% 82.82%, 78.86% 83.28%, 78.95% 83.73%, 79.39% 84.07%, 79.91% 84.19%, 80.35% 84.30%, 81.14% 84.41%, 81.92% 84.53%, 82.45% 84.53%, 82.97% 83.85%, 83.32% 83.62%, 83.76% 83.96%, 83.84% 84.41%, 84.02% 84.98%, 84.45% 85.67%, 84.89% 86.01%, 85.76% 86.01%, 85.85% 85.55%, 86.20% 85.21%, 86.38% 85.21%, 86.64% 85.67%, 86.81% 85.89%, 87.25% 85.89%, 87.95% 86.80%, 88.12% 87.14%, 88.38% 87.83%, 88.65% 88.17%, 89.43% 88.62%, 90.31% 89.08%, 90.74% 89.31%, 91.70% 89.87%, 92.66% 90.22%, 93.01% 90.67%, 94.15% 91.81%, 94.67% 92.04%, 95.28% 92.49%, 96.16% 93.17%, 96.24% 93.29%, 96.86% 94.31%, 97.12% 95.22%, 97.38% 95.90%, 97.55% 96.47%, 98.17% 96.93%, 99.39% 97.16%, 98.52% 99.32%, 98.43% 99.43%, 95.55% 99.54%, 0.96% 98.52%, 0.52% 98.18%)"
        ];

        // Make the rates globally accessible so a dev tool can tweak them in real-time
        window.PARALLAX_RATES = [
            { scale: 0.05, y: 0.05, x: 0 },  // Base Layer (sky/far mountains)
            { scale: 0.1, y: 0.1, x: 0 },    // Layer 3
            { scale: 0.2, y: 0.2, x: 0 },    // Layer 2
            { scale: 0.4, y: 0.4, x: 0 },    // Layer 1 (closest)
            { scale: 0, y: 0.3, x: 0 }       // Wordmark Title
        ];

        const baseVideo = document.getElementById('veil-video-a');
        if (!baseVideo) return;
        
        // We need to restructure the DOM slightly. 
        // We will insert our new video layers right after the base video.
        const parent = baseVideo.parentElement;
        
        // Ensure parent and html can scroll
        document.documentElement.style.height = '300vh';
        document.documentElement.style.overflowY = 'auto';
        document.body.style.height = '300vh'; // Make page scrollable
        document.body.style.overflowY = 'auto'; // allow scrolling
        
        // Wrap everything in a fixed container to keep it on screen
        const parallaxContainer = document.createElement('div');
        parallaxContainer.style.position = 'fixed';
        parallaxContainer.style.top = '0';
        parallaxContainer.style.left = '0';
        parallaxContainer.style.width = '100vw';
        parallaxContainer.style.height = '100vh';
        parallaxContainer.style.overflow = 'hidden';
        parallaxContainer.style.zIndex = '3'; // Keep it above the white fade-overlay (z-index: 2)
        
        // Move base video into the container
        baseVideo.parentNode.insertBefore(parallaxContainer, baseVideo);
        parallaxContainer.appendChild(baseVideo);

        // Make base video absolute so others can stack
        baseVideo.style.position = 'absolute';
        baseVideo.style.top = '0';
        baseVideo.style.left = '0';
        baseVideo.style.width = '100vw';
        baseVideo.style.height = '100vh';
        baseVideo.style.objectFit = 'cover';

        // 1. Create the Monolithic HQ (between Base and Layer 3)
        const hqLayer = document.createElement('div');
        hqLayer.id = 'hq-concept';
        hqLayer.style.position = 'absolute';
        hqLayer.style.top = '40%';
        hqLayer.style.left = '50%';
        hqLayer.style.transform = 'translate(-50%, -50%)';
        hqLayer.style.width = '200px';
        hqLayer.style.height = '350px';
        hqLayer.style.background = 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(200,200,200,0.1) 100%)';
        hqLayer.style.boxShadow = '0 0 50px rgba(255,255,255,0.4)';
        hqLayer.style.borderRadius = '2px';
        hqLayer.style.clipPath = 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)'; // Minimalist pyramid/obelisk
        hqLayer.style.zIndex = '1';
        parallaxContainer.appendChild(hqLayer);

        // 2. Create the Glass Blur layer (between HQ and Layer 3)
        const blurLayer = document.createElement('div');
        blurLayer.id = 'glass-monolith';
        blurLayer.style.position = 'absolute';
        blurLayer.style.top = '30%';
        blurLayer.style.left = '50%';
        blurLayer.style.transform = 'translate(-50%, -50%)';
        blurLayer.style.width = '300px';
        blurLayer.style.height = '500px';
        blurLayer.style.backdropFilter = 'blur(15px) contrast(1.1) brightness(1.2)';
        blurLayer.style.webkitBackdropFilter = 'blur(15px) contrast(1.1) brightness(1.2)';
        blurLayer.style.borderRadius = '4px';
        blurLayer.style.zIndex = '2';
        parallaxContainer.appendChild(blurLayer);

        // Array to hold all video elements to scale them on scroll
        const layerElements = [baseVideo]; // Index 0 is base

        document.addEventListener('cherenkov:load-mosaic', () => {
            // Wait a tick for veil_ambient to set the baseVideo.src
            setTimeout(() => {
                // 3. Create duplicate video elements for the foreground masks
                for (let i = 1; i <= 3; i++) {
                    const clone = baseVideo.cloneNode(true);
                    clone.id = `veil-video-layer-${i}`;
                    clone.style.position = 'absolute';
                    clone.style.top = '0';
                    clone.style.left = '0';
                    clone.style.width = '100vw';
                    clone.style.height = '100vh';
                    clone.style.objectFit = 'cover';
                    clone.style.pointerEvents = 'none'; // pass clicks through
                    clone.style.zIndex = (i + 2).toString(); // above blur
                    
                    // The src might not be copied if it was just set dynamically, so force it
                    clone.src = baseVideo.src;
                    
                    // Apply the user's mask!
                    if (masks[i]) {
                        clone.style.clipPath = masks[i];
                        clone.style.webkitClipPath = masks[i];
                    }

                    parallaxContainer.appendChild(clone);
                    layerElements.push(clone);

                    // Sync playback with base video
                    baseVideo.addEventListener('play', () => clone.play());
                    baseVideo.addEventListener('pause', () => clone.pause());
                    baseVideo.addEventListener('seeked', () => clone.currentTime = baseVideo.currentTime);
                    
                    // If base is already playing, play clone
                    if (!baseVideo.paused) clone.play();

                    setInterval(() => {
                        if (Math.abs(clone.currentTime - baseVideo.currentTime) > 0.1) {
                            clone.currentTime = baseVideo.currentTime;
                        }
                    }, 1000);
                }
            }, 100);
        });

        const hqLayer = document.getElementById('hq-concept');
        const blurLayer = document.getElementById('glass-monolith');
        const wordmark = document.querySelector('.wordmark-container');

        let lastScrollY = window.scrollY;
        let isTicking = false;

        function updateParallax() {
            const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
            
            // Scale and translate the layers based on their configured rates
            layerElements.forEach((el, index) => {
                const rate = window.PARALLAX_RATES[index];
                const scale = 1 + (scrollPercent * rate.scale);
                const translateY = scrollPercent * rate.y * 100; // vertical movement
                const translateX = scrollPercent * rate.x * 100; // horizontal movement
                
                el.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
                el.style.transformOrigin = 'bottom center'; // scale from bottom
            });

            // Parallax the HQ and Glass Monolith too
            if (hqLayer) hqLayer.style.transform = `translate(-50%, calc(-50% + ${scrollPercent * 150}px)) scale(${1 + (scrollPercent * 0.1)})`;
            if (blurLayer) blurLayer.style.transform = `translate(-50%, calc(-50% + ${scrollPercent * 100}px)) scale(${1 + (scrollPercent * 0.05)})`;
            
            // Parallax the Wordmark Title
            if (wordmark && window.PARALLAX_RATES[4]) {
                const wRate = window.PARALLAX_RATES[4];
                const wScale = 1 + (scrollPercent * wRate.scale);
                const wTranslateY = scrollPercent * wRate.y * 100;
                const wTranslateX = scrollPercent * wRate.x * 100;
                // Preserve the -50% translateX centering from CSS
                wordmark.style.transform = `translate(calc(-50% + ${wTranslateX}px), ${wTranslateY}px) scale(${wScale})`;
            }
            
            isTicking = false;
        }

        window.addEventListener('scroll', () => {
            if (!isTicking) {
                window.requestAnimationFrame(updateParallax);
                isTicking = true;
            }
        });
        
        // Initial setup
        updateParallax();
    });
})();
