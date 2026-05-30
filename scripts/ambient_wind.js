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
    }

    // ── Bootstrap ──────────────────────────────────────────────────

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
