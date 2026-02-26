/**
 * ambient_audio.js — Liminal Veil Pixel Ambience v4
 *
 * Persistent oscillator pool. Gains driven by pixel color presence.
 * Key fixes over v3:
 *  - audioCtx.resume() called explicitly on every interaction
 *  - masterGain set directly (no setTargetAtTime queue buildup)
 *  - cancelScheduledValues before gain updates
 *  - Very low thresholds so static video color still produces presence
 */

(function () {
    'use strict';

    // C2–C5 pentatonic (20 notes)
    const SCALE_HZ = [
        65.41, 73.42, 82.41, 98.00, 110.00,
        130.81, 146.83, 164.81, 196.00, 220.00,
        261.63, 293.66, 329.63, 392.00, 440.00,
        523.25, 587.33, 659.25, 784.00, 880.00,
    ];

    const CFG = {
        gridCols: 12, gridRows: 7,
        sampleMs: 80,
        maxActive: 4,
        maxNoteGain: 0.12,
        gainTau: 0.3,          // attack / release smoothing
        minPressure: 0.01,
        minSat: 0.02,
        presenceWeight: 0.2,   // static color contribution
        deltaThreshold: 3,
        reverbDur: 4.0, reverbDecay: 2.8, reverbMix: 0.35,
        breathHz: 0.048, breathDepth: 0.035,
        masterGain: 0.22,
        opacityGate: 0.02,
    };

    let audioCtx = null;
    let masterNode = null;
    let reverbSend = null;
    let initialized = false;
    let sampleTimer = null;
    const prevColors = {};
    const oscPool = [];
    const gainPool = [];

    // ── Reverb ────────────────────────────────────────────────────────────────
    function buildImpulse(ctx) {
        const len = Math.floor(ctx.sampleRate * CFG.reverbDur);
        const buf = ctx.createBuffer(2, len, ctx.sampleRate);
        for (let ch = 0; ch < 2; ch++) {
            const d = buf.getChannelData(ch);
            for (let i = 0; i < len; i++)
                d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, CFG.reverbDecay);
        }
        return buf;
    }

    // ── Color ─────────────────────────────────────────────────────────────────
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

    // ── Oscillator pool ───────────────────────────────────────────────────────
    function initPool() {
        SCALE_HZ.forEach((freq) => {
            const osc = audioCtx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            osc.detune.value = (Math.random() - 0.5) * 12;

            const filt = audioCtx.createBiquadFilter();
            filt.type = 'lowpass';
            filt.frequency.value = 2000;

            const gn = audioCtx.createGain();
            gn.gain.value = 0;

            osc.connect(filt);
            filt.connect(gn);
            gn.connect(masterNode);
            gn.connect(reverbSend);

            osc.start();
            oscPool.push(osc);
            gainPool.push(gn);
        });
        console.log('✦ Ambience pool started:', SCALE_HZ.length, 'oscillators');
    }

    // ── Sample loop ───────────────────────────────────────────────────────────
    function sample() {
        if (!initialized || !audioCtx) return;
        if (audioCtx.state === 'suspended') { audioCtx.resume(); return; }

        const veil = document.getElementById('veil-canvas');
        if (!veil) return;

        const opacity = parseFloat(veil.style.opacity || '0');
        const t = audioCtx.currentTime;

        if (opacity < CFG.opacityGate) {
            gainPool.forEach(gn => {
                gn.gain.cancelScheduledValues(t);
                gn.gain.setTargetAtTime(0, t, CFG.gainTau);
            });
            return;
        }

        let sCanvas, sCtx;
        try {
            sCanvas = sCanvas || (() => {
                const c = document.createElement('canvas');
                c.width = CFG.gridCols; c.height = CFG.gridRows;
                return c;
            })();
        } catch (_) { }

        // Use module-level sample canvas
        try {
            _sCtx.drawImage(veil, 0, 0, CFG.gridCols, CFG.gridRows);
            const px = _sCtx.getImageData(0, 0, CFG.gridCols, CFG.gridRows).data;

            const pressure = new Float32Array(SCALE_HZ.length);

            for (let i = 0; i < CFG.gridCols * CFG.gridRows; i++) {
                const p = i * 4;
                const r = px[p], g = px[p + 1], b = px[p + 2];
                const [h, s] = rgbToHsl(r, g, b);

                if (s > CFG.minSat) {
                    const idx = Math.floor((h / 360) * SCALE_HZ.length) % SCALE_HZ.length;
                    // baseline presence from current color
                    pressure[idx] += s * CFG.presenceWeight;
                    // bonus from color change
                    const prev = prevColors[i];
                    if (prev) {
                        const delta = Math.abs(r - prev[0]) + Math.abs(g - prev[1]) + Math.abs(b - prev[2]);
                        if (delta > CFG.deltaThreshold) pressure[idx] += delta * s * 0.01;
                    }
                }
                prevColors[i] = [r, g, b];
            }

            // Normalize and pick top N
            const maxP = Math.max(...pressure) || 1;
            const norm = Array.from(pressure, p => p / maxP);
            const ranked = norm.map((p, i) => ({ p, i })).sort((a, b) => b.p - a.p);
            const active = new Set(
                ranked.slice(0, CFG.maxActive).filter(x => x.p >= CFG.minPressure).map(x => x.i)
            );

            gainPool.forEach((gn, i) => {
                const target = active.has(i) ? CFG.maxNoteGain * norm[i] : 0;
                gn.gain.cancelScheduledValues(t);
                gn.gain.setTargetAtTime(target, t, CFG.gainTau);
            });

        } catch (e) {
            console.warn('Ambience sample error:', e.message);
        }
    }

    // module-level sample canvas
    let _sCanvas, _sCtx;

    // ── Init ─────────────────────────────────────────────────────────────────
    function init() {
        if (initialized) return;

        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        audioCtx.resume(); // explicit resume — critical for suspended contexts

        // Master
        masterNode = audioCtx.createGain();
        masterNode.gain.value = CFG.masterGain;

        // Breathing LFO
        const lfo = audioCtx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = CFG.breathHz;
        const lfoG = audioCtx.createGain();
        lfoG.gain.value = CFG.breathDepth;
        lfo.connect(lfoG);
        lfoG.connect(masterNode.gain);
        lfo.start();

        // Reverb
        const conv = audioCtx.createConvolver();
        conv.buffer = buildImpulse(audioCtx);
        const rvG = audioCtx.createGain();
        rvG.gain.value = CFG.reverbMix;
        reverbSend = audioCtx.createGain();
        reverbSend.gain.value = 0.4;
        reverbSend.connect(conv);
        conv.connect(rvG);
        rvG.connect(audioCtx.destination);
        masterNode.connect(audioCtx.destination);

        // Sample canvas
        _sCanvas = document.createElement('canvas');
        _sCanvas.width = CFG.gridCols;
        _sCanvas.height = CFG.gridRows;
        _sCtx = _sCanvas.getContext('2d', { willReadFrequently: true });

        initPool();
        initialized = true;
        sampleTimer = setInterval(sample, CFG.sampleMs);
        console.log('✦ Ambience v4 active, ctx state:', audioCtx.state);
    }

    // ── Interaction gate ──────────────────────────────────────────────────────
    function onInteraction() {
        if (!initialized) {
            init();
        } else if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    window.addEventListener('DOMContentLoaded', () => {
        ['click', 'keydown', 'mousemove', 'touchstart'].forEach(ev =>
            document.addEventListener(ev, onInteraction, { passive: true })
        );
    });

})();
