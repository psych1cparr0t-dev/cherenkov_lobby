/**
 * ambient_audio.js — Liminal Veil Pixel Ambience v3
 *
 * Persistent oscillator pool — one sustained tone per scale note,
 * always running. Each sample cycle, pixel color changes are
 * aggregated per note and used to set "key pressure" (gain).
 * More pixels changing to a given hue = louder that note.
 * Only the top 4 most-pressed notes are audible at once.
 *
 * Like a keyboard played by the mosaic itself.
 */

(function () {
    'use strict';

    // 4 octaves, C2–C5 pentatonic (20 sustained tones)
    const SCALE_HZ = [
        65.41, 73.42, 82.41, 98.00, 110.00,   // C2
        130.81, 146.83, 164.81, 196.00, 220.00,   // C3
        261.63, 293.66, 329.63, 392.00, 440.00,   // C4
        523.25, 587.33, 659.25, 784.00, 880.00,   // C5
    ];

    const CFG = {
        gridCols: 12,
        gridRows: 7,
        sampleMs: 80,
        changeThreshold: 12,  // min pixel delta to count
        maxActive: 4,         // max simultaneous audible notes
        maxNoteGain: 0.14,    // gain at full pressure
        gainSmoothing: 0.28,  // setTargetAtTime τ — controls attack + release feel
        minPressure: 0.10,    // below this → fade to silence
        minSat: 0.05,
        reverbDur: 4.5,
        reverbMix: 0.40,
        breathHz: 0.048,
        breathDepth: 0.04,
        masterBase: 0.20,
        opacityGate: 0.06,
    };

    let audioCtx, masterGain, reverbSend, lfo;
    let initialized = false;
    let sampleCanvas, sampleCtx2d, sampleTimer;
    const prevColors = {};

    // Persistent oscillator + gain node per scale note
    const oscPool = [];
    const gainPool = [];

    // ─── Reverb ───────────────────────────────────────────────────────────────
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

    // ─── Color math ───────────────────────────────────────────────────────────
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

    // ─── Oscillator pool init ─────────────────────────────────────────────────
    function initPool() {
        SCALE_HZ.forEach((freq) => {
            const osc = audioCtx.createOscillator();
            osc.type = 'triangle'; // warm, natural harmonics
            osc.frequency.value = freq;
            osc.detune.value = (Math.random() - 0.5) * 10; // fixed slight detune per note

            const filt = audioCtx.createBiquadFilter();
            filt.type = 'lowpass';
            filt.frequency.value = 1800;
            filt.Q.value = 0.5;

            const gn = audioCtx.createGain();
            gn.gain.value = 0; // silent until pressed

            osc.connect(filt);
            filt.connect(gn);
            gn.connect(masterGain);
            gn.connect(reverbSend);

            osc.start();
            oscPool.push(osc);
            gainPool.push(gn);
        });
    }

    // ─── Sample + update gains ────────────────────────────────────────────────
    function sample() {
        if (!initialized) return;

        const veilCanvas = document.getElementById('veil-canvas');
        if (!veilCanvas) return;

        const opacity = parseFloat(veilCanvas.style.opacity || '0');
        const t = audioCtx.currentTime;

        if (opacity < CFG.opacityGate) {
            gainPool.forEach(gn => gn.gain.setTargetAtTime(0, t, CFG.gainSmoothing));
            return;
        }

        // Breathe master with mosaic opacity
        masterGain.gain.setTargetAtTime(
            CFG.masterBase * Math.min(opacity / 0.45, 1),
            t, 2.0
        );

        try {
            sampleCtx2d.drawImage(veilCanvas, 0, 0, CFG.gridCols, CFG.gridRows);
            const px = sampleCtx2d.getImageData(0, 0, CFG.gridCols, CFG.gridRows).data;

            // Accumulate weighted color delta per note bucket
            const pressure = new Float32Array(SCALE_HZ.length);

            for (let i = 0; i < CFG.gridCols * CFG.gridRows; i++) {
                const p = i * 4;
                const r = px[p], g = px[p + 1], b = px[p + 2];
                const prev = prevColors[i];

                if (prev) {
                    const delta = Math.abs(r - prev[0]) + Math.abs(g - prev[1]) + Math.abs(b - prev[2]);
                    if (delta > CFG.changeThreshold) {
                        const [h, s] = rgbToHsl(r, g, b);
                        if (s > CFG.minSat) {
                            const idx = Math.floor((h / 360) * SCALE_HZ.length) % SCALE_HZ.length;
                            pressure[idx] += delta * s; // weight by both magnitude and saturation
                        }
                    }
                }
                prevColors[i] = [r, g, b];
            }

            // Normalize to 0..1
            const maxP = Math.max(...pressure) || 1;
            const norm = pressure.map(p => p / maxP);

            // Only top maxActive notes above minPressure are audible
            const ranked = norm
                .map((p, i) => ({ p, i }))
                .sort((a, b) => b.p - a.p);
            const activeSet = new Set(
                ranked.slice(0, CFG.maxActive).filter(x => x.p >= CFG.minPressure).map(x => x.i)
            );

            // Update every gain node
            gainPool.forEach((gn, i) => {
                const target = activeSet.has(i) ? CFG.maxNoteGain * norm[i] : 0;
                gn.gain.setTargetAtTime(target, t, CFG.gainSmoothing);
            });

        } catch (_e) {
            clearInterval(sampleTimer);
        }
    }

    // ─── Init audio graph ─────────────────────────────────────────────────────
    function init() {
        if (initialized) return;

        audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0;

        lfo = audioCtx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = CFG.breathHz;
        const lfoGain = audioCtx.createGain();
        lfoGain.gain.value = CFG.breathDepth;
        lfo.connect(lfoGain);
        lfoGain.connect(masterGain.gain);
        lfo.start();

        const convolver = audioCtx.createConvolver();
        convolver.buffer = buildImpulse(audioCtx, CFG.reverbDur, 2.8);
        const reverbGain = audioCtx.createGain();
        reverbGain.gain.value = CFG.reverbMix;
        reverbSend = audioCtx.createGain();
        reverbSend.gain.value = 0.35;
        reverbSend.connect(convolver);
        convolver.connect(reverbGain);
        reverbGain.connect(audioCtx.destination);
        masterGain.connect(audioCtx.destination);

        masterGain.gain.setTargetAtTime(CFG.masterBase, audioCtx.currentTime, 3.0);

        sampleCanvas = document.createElement('canvas');
        sampleCanvas.width = CFG.gridCols;
        sampleCanvas.height = CFG.gridRows;
        sampleCtx2d = sampleCanvas.getContext('2d', { willReadFrequently: true });

        initPool();
        initialized = true;
        sampleTimer = setInterval(sample, CFG.sampleMs);
        console.log('✦ Pixel ambience v3 — sustained harmonic pool');
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
