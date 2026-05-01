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
            "polygon(0.35% 98.52%, 0.35% 83.85%, 1.48% 81.46%, 2.79% 81.34%, 3.58% 82.59%, 4.02% 84.19%, 4.72% 83.05%, 5.41% 81.23%, 5.94% 79.29%, 6.90% 78.04%, 7.86% 77.82%, 9.08% 77.70%, 10.74% 77.93%, 12.58% 77.82%, 13.45% 78.84%, 13.71% 78.95%, 14.76% 79.18%, 16.16% 77.82%, 17.55% 76.22%, 18.17% 76.00%, 19.39% 75.77%, 20.44% 77.25%, 21.48% 76.11%, 23.14% 75.20%, 24.02% 74.63%, 25.33% 76.00%, 26.46% 76.34%, 27.86% 75.43%, 29.08% 76.68%, 29.78% 75.88%, 30.74% 77.25%, 32.23% 78.84%, 33.10% 79.86%, 34.59% 80.66%, 35.46% 81.91%, 35.98% 82.37%, 36.59% 81.57%, 38.17% 82.48%, 37.90% 83.85%, 39.56% 85.21%, 40.96% 86.58%, 41.83% 87.83%, 42.97% 89.53%, 44.19% 91.24%, 44.72% 91.58%, 45.41% 88.96%, 46.11% 88.05%, 46.90% 88.74%, 47.95% 87.49%, 48.56% 87.71%, 49.61% 88.51%, 50.74% 88.05%, 51.79% 88.51%, 52.58% 88.74%, 54.06% 87.03%, 54.76% 86.46%, 55.63% 86.12%, 56.42% 85.21%, 57.73% 83.85%, 58.34% 82.37%, 60.70% 81.80%, 61.40% 80.20%, 62.53% 79.29%, 63.67% 80.55%, 64.89% 80.32%, 64.98% 81.46%, 65.76% 80.89%, 66.81% 80.09%, 68.30% 80.09%, 69.08% 81.11%, 70.04% 81.46%, 70.66% 81.34%, 71.44% 81.23%, 72.23% 80.55%, 73.36% 81.34%, 74.15% 79.86%, 75.20% 81.00%, 75.90% 81.80%, 77.38% 81.57%, 78.17% 82.48%, 77.90% 82.71%, 78.95% 82.48%, 79.21% 83.50%, 79.65% 84.53%, 81.05% 84.41%, 82.01% 84.53%, 82.97% 83.50%, 83.49% 83.39%, 84.10% 84.53%, 83.93% 85.55%, 85.15% 85.78%, 86.03% 85.78%, 86.11% 84.76%, 86.90% 85.67%, 87.77% 86.35%, 88.12% 87.26%, 89.17% 88.05%, 91.44% 89.53%, 93.10% 89.19%, 92.75% 90.44%, 93.89% 91.13%, 96.16% 92.49%, 96.59% 93.52%, 97.12% 94.54%, 97.38% 95.79%, 99.13% 95.34%, 98.52% 99.09%, 100% 100%, 0% 100%)"
        ];

        // The parallax rates for each layer (how much they scale/translate on scroll)
        // Layer 0 = background, slowest
        // Layer 3 = foreground, fastest
        const parallaxRates = [
            { scale: 0.05, y: 0.05 },  // Base Layer (sky/far mountains)
            { scale: 0.1, y: 0.1 },    // Layer 3
            { scale: 0.2, y: 0.2 },    // Layer 2
            { scale: 0.4, y: 0.4 }     // Layer 1 (closest)
        ];

        const baseVideo = document.getElementById('veil-video-a');
        if (!baseVideo) return;
        
        // We need to restructure the DOM slightly. 
        // We will insert our new video layers right after the base video.
        const parent = baseVideo.parentElement;
        
        // Ensure parent can scroll
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
        parallaxContainer.style.zIndex = '-1';
        
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

        // 3. Create duplicate video elements for the foreground masks
        // We loop 1 to 3 to create the layers above the HQ/Blur
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
            // Continual sync check (since multiple videos can drift)
            setInterval(() => {
                if (Math.abs(clone.currentTime - baseVideo.currentTime) > 0.1) {
                    clone.currentTime = baseVideo.currentTime;
                }
            }, 1000);
        }

        // --- THE SCROLL PARALLAX LOGIC ---
        let lastScrollY = window.scrollY;
        let isTicking = false;

        function updateParallax() {
            const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
            
            // Scale and translate the layers based on their configured rates
            layerElements.forEach((el, index) => {
                const rate = parallaxRates[index];
                const scale = 1 + (scrollPercent * rate.scale);
                const translateY = scrollPercent * rate.y * 100; // push down slightly as it scales
                
                el.style.transform = `scale(${scale}) translateY(${translateY}px)`;
                el.style.transformOrigin = 'bottom center'; // scale from bottom
            });

            // Parallax the HQ and Glass Monolith too
            hqLayer.style.transform = `translate(-50%, calc(-50% + ${scrollPercent * 150}px)) scale(${1 + (scrollPercent * 0.1)})`;
            blurLayer.style.transform = `translate(-50%, calc(-50% + ${scrollPercent * 100}px)) scale(${1 + (scrollPercent * 0.05)})`;
            
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
