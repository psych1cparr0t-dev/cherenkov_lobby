/**
 * Ambient Wind — Procedural Mountain Atmosphere
 * Generates a continuous, organic arctic wind ambience using Web Audio API.
 * Inspired by: https://www.youtube.com/watch?v=LvYQcHa_dT8
 * No external audio files needed — pure synthesis.
 */
(function () {

    // ── Configuration ──────────────────────────────────────────────
    const MASTER_VOLUME = 0.18;       // Overall volume (0–1)
    const FADE_IN_DURATION = 4.0;     // Seconds to fade in on first play
    const GUST_INTERVAL_MIN = 3;      // Min seconds between gusts
    const GUST_INTERVAL_MAX = 12;     // Max seconds between gusts
    const GUST_DURATION_MIN = 2;      // Min gust length (seconds)
    const GUST_DURATION_MAX = 6;      // Max gust length (seconds)

    let audioCtx = null;
    let masterGain = null;
    let isPlaying = false;
    let isInitialized = false;
    let muteButton = null;

    // ── Create the mute/unmute toggle ──────────────────────────────
    function createMuteToggle() {
        muteButton = document.createElement('button');
        muteButton.id = 'ambient-toggle';
        muteButton.setAttribute('aria-label', 'Toggle ambient sound');
        muteButton.innerHTML = `
            <svg class="icon-sound-on" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
            </svg>
            <svg class="icon-sound-off" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <line x1="23" y1="9" x2="17" y2="15"/>
                <line x1="17" y1="9" x2="23" y2="15"/>
            </svg>
        `;

        Object.assign(muteButton.style, {
            position: 'fixed',
            bottom: '28px',
            right: '28px',
            zIndex: '200',
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '50%',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'rgba(255, 255, 255, 0.7)',
            transition: 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
            opacity: '0',
            transform: 'translateY(10px)',
            padding: '0',
            outline: 'none'
        });

        // Hover effects
        muteButton.addEventListener('mouseenter', () => {
            muteButton.style.background = 'rgba(255, 255, 255, 0.14)';
            muteButton.style.color = 'rgba(255, 255, 255, 0.95)';
            muteButton.style.transform = 'translateY(0) scale(1.08)';
        });
        muteButton.addEventListener('mouseleave', () => {
            muteButton.style.background = 'rgba(255, 255, 255, 0.08)';
            muteButton.style.color = 'rgba(255, 255, 255, 0.7)';
            muteButton.style.transform = 'translateY(0) scale(1)';
        });

        document.body.appendChild(muteButton);

        // Reveal with delay
        setTimeout(() => {
            muteButton.style.opacity = '1';
            muteButton.style.transform = 'translateY(0)';
        }, 3500);

        muteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleAmbient();
        });

        updateToggleIcon();
    }

    function updateToggleIcon() {
        if (!muteButton) return;
        const onIcon = muteButton.querySelector('.icon-sound-on');
        const offIcon = muteButton.querySelector('.icon-sound-off');
        if (isPlaying) {
            onIcon.style.display = 'block';
            offIcon.style.display = 'none';
        } else {
            onIcon.style.display = 'none';
            offIcon.style.display = 'block';
        }
    }

    // ── Web Audio Synthesis ────────────────────────────────────────

    function initAudio() {
        if (isInitialized) return;
        isInitialized = true;

        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0;
        masterGain.connect(audioCtx.destination);

        // Layer 1: Base wind — filtered white noise (low rumble)
        createWindLayer({
            lowFreq: 40,
            highFreq: 300,
            gain: 0.6,
            type: 'lowpass'
        });

        // Layer 2: Mid wind — breathy mid-range
        createWindLayer({
            lowFreq: 200,
            highFreq: 1200,
            gain: 0.25,
            type: 'bandpass'
        });

        // Layer 3: High whistle — icy sharpness
        createWindLayer({
            lowFreq: 1800,
            highFreq: 4500,
            gain: 0.06,
            type: 'bandpass'
        });

        // Start gust modulation
        scheduleGust();
    }

    function createWindLayer({ lowFreq, highFreq, gain, type }) {
        // Create a buffer of white noise (2 seconds, looped)
        const bufferSize = audioCtx.sampleRate * 2;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1);
        }

        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        // Bandpass/lowpass filter
        const filter = audioCtx.createBiquadFilter();
        filter.type = type;
        filter.frequency.value = (lowFreq + highFreq) / 2;
        if (type === 'bandpass') {
            filter.Q.value = 0.7;
        }

        // Slow LFO for organic drift
        const lfoGain = audioCtx.createGain();
        lfoGain.gain.value = gain;

        const lfo = audioCtx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.05 + Math.random() * 0.1; // Very slow drift
        const lfoDepth = audioCtx.createGain();
        lfoDepth.gain.value = gain * 0.3; // 30% modulation depth

        // Route: noise → filter → lfoGain → master
        source.connect(filter);
        filter.connect(lfoGain);
        lfoGain.connect(masterGain);

        // LFO modulates gain
        lfo.connect(lfoDepth);
        lfoDepth.connect(lfoGain.gain);

        source.start();
        lfo.start();

        return { source, filter, lfoGain };
    }

    function scheduleGust() {
        if (!audioCtx) return;

        const interval = GUST_INTERVAL_MIN + Math.random() * (GUST_INTERVAL_MAX - GUST_INTERVAL_MIN);

        setTimeout(() => {
            if (!isPlaying || !audioCtx) { scheduleGust(); return; }

            const duration = GUST_DURATION_MIN + Math.random() * (GUST_DURATION_MAX - GUST_DURATION_MIN);
            const intensity = 0.3 + Math.random() * 0.5; // 30–80% extra volume

            // Create a burst of higher-frequency noise for the gust
            const gustBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * duration, audioCtx.sampleRate);
            const gustData = gustBuffer.getChannelData(0);
            for (let i = 0; i < gustData.length; i++) {
                const env = Math.sin((i / gustData.length) * Math.PI); // Envelope
                gustData[i] = (Math.random() * 2 - 1) * env;
            }

            const gustSource = audioCtx.createBufferSource();
            gustSource.buffer = gustBuffer;

            const gustFilter = audioCtx.createBiquadFilter();
            gustFilter.type = 'bandpass';
            gustFilter.frequency.value = 600 + Math.random() * 1200;
            gustFilter.Q.value = 0.5;

            const gustGain = audioCtx.createGain();
            gustGain.gain.value = MASTER_VOLUME * intensity * 0.4;

            gustSource.connect(gustFilter);
            gustFilter.connect(gustGain);
            gustGain.connect(masterGain);

            gustSource.start();
            gustSource.stop(audioCtx.currentTime + duration);

            scheduleGust();
        }, interval * 1000);
    }

    // ── Controls ───────────────────────────────────────────────────

    function startAmbient() {
        if (!isInitialized) initAudio();

        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        // Smooth fade in
        masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
        masterGain.gain.setValueAtTime(masterGain.gain.value, audioCtx.currentTime);
        masterGain.gain.linearRampToValueAtTime(MASTER_VOLUME, audioCtx.currentTime + FADE_IN_DURATION);

        isPlaying = true;
        updateToggleIcon();
    }

    function stopAmbient() {
        if (!audioCtx || !masterGain) return;

        masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
        masterGain.gain.setValueAtTime(masterGain.gain.value, audioCtx.currentTime);
        masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.0);

        isPlaying = false;
        updateToggleIcon();
    }

    function toggleAmbient() {
        if (isPlaying) {
            stopAmbient();
        } else {
            startAmbient();
        }
    }

    // ── Bootstrap ──────────────────────────────────────────────────

    // Wait for the experience to be ready, then create controls
    document.addEventListener('cherenkov:load-mosaic', () => {
        createMuteToggle();
    });

    // Auto-start on first user interaction (browser policy requires gesture)
    let hasInteracted = false;
    function onFirstInteraction() {
        if (hasInteracted) return;
        hasInteracted = true;
        startAmbient();
        document.removeEventListener('click', onFirstInteraction);
        document.removeEventListener('wheel', onFirstInteraction);
        document.removeEventListener('keydown', onFirstInteraction);
        document.removeEventListener('touchstart', onFirstInteraction);
    }

    document.addEventListener('click', onFirstInteraction);
    document.addEventListener('wheel', onFirstInteraction);
    document.addEventListener('keydown', onFirstInteraction);
    document.addEventListener('touchstart', onFirstInteraction);

})();
