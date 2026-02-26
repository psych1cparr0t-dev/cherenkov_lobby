/**
 * ambient_audio.js — Liminal Veil Pixel Ambience v2
 *
 * Clear pixel → sound mapping:
 * - Selects the single most-changed block per sample cycle
 * - Fast 40ms attack so you hear it *right when* the block changes
 * - Stereo panning = block X position (left block → left ear)
 * - Brief visual flash on the triggering block
 * - Short notes (no wash) + light reverb tail
 * - Slow LFO breathes master volume
 */

(function () {
    'use strict';

    // ─── Musical config ──────────────────────────────────────────────────────
    const SCALE_HZ = [
        261.63, 293.66, 329.63, 392.00, 440.00,   // C4 pentatonic
        523.25, 587.33, 659.25, 784.00, 880.00,   // C5 pentatonic
    ];

    const CFG = {
        gridCols: 8,
        gridRows: 5,
        sampleMs: 160,          // how often to check blocks
        threshold: 22,          // min color delta to trigger
        noteGain: 0.22,         // per-note loudness
        attack: 0.04,           // 40ms — immediate
        hold: 0.12,             // sustain hold
        release: 0.55,          // quick decay
        reverbMix: 0.18,        // light reverb — spatial not washy
        reverbDur: 2.5,
        breathHz: 0.048,        // one breath per ~21s
        breathDepth: 0.06,
        masterBase: 0.20,
        minSat: 0.07,
        flashDur: 240,          // visual flash duration ms
        opacityGate: 0.06,
    };

    // ─── State ───────────────────────────────────────────────────────────────
    let audioCtx, masterGain, reverbSend, lfo;
    let initialized = false;
    let prevColors = {};
    let sampleCanvas, sampleCtx2d;
    let flashCanvas, flashCtx;
    let sampleTimer = null;

    // ─── Reverb builder ──────────────────────────────────────────────────────
    function buildImpulse(ctx, dur, decay) {
        const len = Math.floor(ctx.sampleRate * dur);
        const buf = ctx.createBuffer(2, len, ctx.sampleRate);
        for (let ch = 0; ch < 2; ch++) {
            const d = buf.getChannelData(ch);
            for (let i = 0; i < len; i++)
                d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
        }
        return buf;
    }

    // ─── Color math ──────────────────────────────────────────────────────────
    function rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0;
        const l = (max + min) / 2;
        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }
        return [h * 360, s, l];
    }

    function hslToFreq(h, l) {
        const deg = Math.floor((h / 360) * SCALE_HZ.length) % SCALE_HZ.length;
        return SCALE_HZ[deg] * (l > 0.6 ? 2 : 1);
    }

    // ─── Note player (with stereo pan) ───────────────────────────────────────
    function playNote(freq, pan) {
        if (!audioCtx) return;
        const now = audioCtx.currentTime;

        const osc = audioCtx.createOscillator();
        osc.type = 'triangle';     // more character than sine
        osc.frequency.value = freq;
        osc.detune.value = (Math.random() - 0.5) * 5;

        const panner = audioCtx.createStereoPanner();
        panner.pan.value = Math.max(-1, Math.min(1, pan));

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 2200;
        filter.Q.value = 0.6;

        const gain = audioCtx.createGain();
        const total = CFG.attack + CFG.hold + CFG.release;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(CFG.noteGain, now + CFG.attack);
        gain.gain.setValueAtTime(CFG.noteGain, now + CFG.attack + CFG.hold);
        gain.gain.exponentialRampToValueAtTime(0.001, now + total);

        osc.connect(filter);
        filter.connect(panner);
        panner.connect(gain);
        gain.connect(masterGain);

        // Reverb send (also panned)
        const rvPan = audioCtx.createStereoPanner();
        rvPan.pan.value = pan * 0.5;
        gain.connect(rvPan);
        rvPan.connect(reverbSend);

        osc.start(now);
        osc.stop(now + total + 0.1);
    }

    // ─── Visual flash overlay ────────────────────────────────────────────────
    function ensureFlashCanvas() {
        if (flashCanvas) return;
        const veil = document.getElementById('veil-canvas');
        if (!veil) return;

        flashCanvas = document.createElement('canvas');
        flashCanvas.style.cssText = `
      position: absolute; top: 0; left: 0;
      width: 100%; height: 100%;
      pointer-events: none; z-index: 2;
    `;
        flashCanvas.width = veil.offsetWidth || innerWidth;
        flashCanvas.height = veil.offsetHeight || innerHeight;
        flashCtx = flashCanvas.getContext('2d');
        veil.parentElement.appendChild(flashCanvas);
    }

    function flashBlock(col, row) {
        ensureFlashCanvas();
        if (!flashCtx) return;

        const cw = flashCanvas.width, ch = flashCanvas.height;
        const bw = cw / CFG.gridCols, bh = ch / CFG.gridRows;
        const x = col * bw, y = row * bh;

        // Draw bright flash rect
        flashCtx.clearRect(x - 2, y - 2, bw + 4, bh + 4);
        flashCtx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        flashCtx.fillRect(x, y, bw, bh);

        // Fade it out
        const start = performance.now();
        function fade(ts) {
            const t = (ts - start) / CFG.flashDur;
            if (t >= 1) { flashCtx.clearRect(x - 2, y - 2, bw + 4, bh + 4); return; }
            flashCtx.clearRect(x - 2, y - 2, bw + 4, bh + 4);
            flashCtx.fillStyle = `rgba(255, 255, 255, ${0.75 * (1 - t)})`;
            flashCtx.fillRect(x, y, bw, bh);
            requestAnimationFrame(fade);
        }
        requestAnimationFrame(fade);
    }

    // ─── Sampler ─────────────────────────────────────────────────────────────
    function sample() {
        if (!initialized) return;

        const veilCanvas = document.getElementById('veil-canvas');
        if (!veilCanvas) return;

        const opacity = parseFloat(veilCanvas.style.opacity || '0');
        if (opacity < CFG.opacityGate) return;

        // Breathe master gain with mosaic opacity
        if (masterGain) {
            const target = CFG.masterBase * Math.min(opacity / 0.45, 1);
            masterGain.gain.setTargetAtTime(target, audioCtx.currentTime, 2.0);
        }

        try {
            sampleCtx2d.drawImage(veilCanvas, 0, 0, CFG.gridCols, CFG.gridRows);
            const px = sampleCtx2d.getImageData(0, 0, CFG.gridCols, CFG.gridRows).data;

            // Find single most-changed block
            let bestDelta = 0, bestIdx = -1;
            for (let i = 0; i < CFG.gridCols * CFG.gridRows; i++) {
                const p = i * 4;
                const r = px[p], g = px[p + 1], b = px[p + 2];
                const prev = prevColors[i];
                if (prev) {
                    const d = Math.abs(r - prev[0]) + Math.abs(g - prev[1]) + Math.abs(b - prev[2]);
                    if (d > bestDelta) { bestDelta = d; bestIdx = i; }
                }
                prevColors[i] = [r, g, b];
            }

            if (bestIdx >= 0 && bestDelta > CFG.threshold) {
                const col = bestIdx % CFG.gridCols;
                const row = Math.floor(bestIdx / CFG.gridCols);
                const p = bestIdx * 4;
                const [h, s, l] = rgbToHsl(px[p], px[p + 1], px[p + 2]);

                if (s > CFG.minSat) {
                    // Pan: left col = -1, right col = +1
                    const pan = (col / (CFG.gridCols - 1)) * 2 - 1;
                    playNote(hslToFreq(h, l), pan);
                    flashBlock(col, row);
                }
            }
        } catch (_e) {
            clearInterval(sampleTimer);
        }
    }

    // ─── Audio graph init ─────────────────────────────────────────────────────
    function init() {
        if (initialized) return;

        audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0;

        // Breathing LFO
        lfo = audioCtx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = CFG.breathHz;
        const lfoGain = audioCtx.createGain();
        lfoGain.gain.value = CFG.breathDepth;
        lfo.connect(lfoGain);
        lfoGain.connect(masterGain.gain);
        lfo.start();

        // Reverb
        const convolver = audioCtx.createConvolver();
        convolver.buffer = buildImpulse(audioCtx, CFG.reverbDur, 2.8);
        const reverbGain = audioCtx.createGain();
        reverbGain.gain.value = CFG.reverbMix;
        reverbSend = audioCtx.createGain();
        reverbSend.gain.value = 0.4;
        reverbSend.connect(convolver);
        convolver.connect(reverbGain);
        reverbGain.connect(audioCtx.destination);
        masterGain.connect(audioCtx.destination);

        masterGain.gain.setTargetAtTime(CFG.masterBase, audioCtx.currentTime, 2.5);

        sampleCanvas = document.createElement('canvas');
        sampleCanvas.width = CFG.gridCols;
        sampleCanvas.height = CFG.gridRows;
        sampleCtx2d = sampleCanvas.getContext('2d', { willReadFrequently: true });

        initialized = true;
        sampleTimer = setInterval(sample, CFG.sampleMs);
        console.log('✦ Pixel ambience v2 — one note, one flash, one pixel');
    }

    // ─── Interaction gate ─────────────────────────────────────────────────────
    function onInteraction() {
        init();
        document.removeEventListener('mousemove', onInteraction);
        document.removeEventListener('click', onInteraction);
        document.removeEventListener('keydown', onInteraction);
    }

    window.addEventListener('DOMContentLoaded', () => {
        document.addEventListener('mousemove', onInteraction, { once: false });
        document.addEventListener('click', onInteraction, { once: false });
        document.addEventListener('keydown', onInteraction, { once: false });
    });

})();
