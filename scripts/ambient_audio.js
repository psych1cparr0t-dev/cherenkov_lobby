/**
 * ambient_audio.js — Liminal Veil Pixel Ambience
 *
 * Inspired by science museum sound installations (Exploratorium, etc.)
 * Each block in the Liminal Veil mosaic that changes color triggers a
 * soft, sustained sine tone mapped to a pentatonic scale.
 * A slow LFO breathes the master volume in and out.
 *
 * Starts on first user interaction (browser autoplay policy).
 */

(function () {
    'use strict';

    // ─── Musical config ──────────────────────────────────────────────────────
    // C major pentatonic across 3 octaves (ethereal, no dissonance possible)
    const SCALE_HZ = [
        32.70, 36.71, 41.20, 49.00, 55.00,   // C1 penta
        65.41, 73.42, 82.41, 98.00, 110.00,  // C2 penta
        130.81, 146.83, 164.81, 196.00, 220.00,  // C3 penta
        261.63, 293.66, 329.63, 392.00, 440.00,  // C4 penta
    ];

    const CFG = {
        gridCols: 12,
        gridRows: 7,
        sampleInterval: 80,       // ms between canvas samples
        changeThreshold: 18,      // pixel delta to trigger note
        maxNotesPerCycle: 3,      // cap simultaneous new notes per sample
        noteGain: 0.07,           // per-note volume
        attack: 2.0,              // note attack seconds
        release: 3.0,             // note release seconds
        reverbDuration: 5.0,      // reverb tail seconds
        reverbDecay: 3.5,
        reverbMix: 0.6,           // wet/dry ratio
        breathFreq: 0.055,        // LFO Hz  (~18s per breath)
        breathDepth: 0.07,        // LFO gain depth
        masterBase: 0.12,         // base master gain
        minSaturation: 0.06,      // ignore near-grey pixels
        opacityGate: 0.08,        // only play when mosaic is this visible
    };

    // ─── State ───────────────────────────────────────────────────────────────
    let audioCtx = null;
    let masterGain = null;
    let lfo = null;
    let initialized = false;
    const prevColors = {};
    let sampleCanvas, sampleCtx2d;
    let sampleTimer = null;

    // ─── Reverb ──────────────────────────────────────────────────────────────
    function buildImpulse(ctx, dur, decay) {
        const len = Math.floor(ctx.sampleRate * dur);
        const buf = ctx.createBuffer(2, len, ctx.sampleRate);
        for (let ch = 0; ch < 2; ch++) {
            const d = buf.getChannelData(ch);
            for (let i = 0; i < len; i++) {
                d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
            }
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
        // hue → scale degree (wrap 0–360 across all scale notes)
        const deg = Math.floor((h / 360) * SCALE_HZ.length) % SCALE_HZ.length;
        // brightness shifts up an octave at high lightness
        const octMul = l > 0.65 ? 2 : 1;
        return SCALE_HZ[deg] * octMul;
    }

    // ─── Note player ─────────────────────────────────────────────────────────
    function playNote(freq, reverbSend) {
        if (!audioCtx) return;
        const now = audioCtx.currentTime;

        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        // Subtle detune for warmth
        osc.detune.value = (Math.random() - 0.5) * 6;

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1400;
        filter.Q.value = 0.4;

        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(CFG.noteGain, now + CFG.attack);
        gain.gain.setTargetAtTime(0, now + CFG.attack, CFG.release * 0.6);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        gain.connect(reverbSend); // also send to reverb

        osc.start(now);
        osc.stop(now + CFG.attack + CFG.release + 0.5);
    }

    // ─── Canvas sampler ──────────────────────────────────────────────────────
    function sample() {
        if (!initialized) return;

        const veilCanvas = document.getElementById('veil-canvas');
        if (!veilCanvas) return;

        // Gate: only play when mosaic is visible
        const opacity = parseFloat(veilCanvas.style.opacity || '0');
        if (opacity < CFG.opacityGate) return;

        // Also fade master gain with mosaic opacity for extra coherence
        if (masterGain) {
            const target = CFG.masterBase * Math.min(opacity / 0.5, 1);
            masterGain.gain.setTargetAtTime(target, audioCtx.currentTime, 1.5);
        }

        try {
            sampleCtx2d.drawImage(veilCanvas, 0, 0, CFG.gridCols, CFG.gridRows);
            const pixels = sampleCtx2d.getImageData(0, 0, CFG.gridCols, CFG.gridRows).data;
            let noteCount = 0;

            for (let i = 0; i < CFG.gridCols * CFG.gridRows; i++) {
                if (noteCount >= CFG.maxNotesPerCycle) break;

                const p = i * 4;
                const r = pixels[p], g = pixels[p + 1], b = pixels[p + 2];
                const prev = prevColors[i];

                if (prev) {
                    const delta = Math.abs(r - prev[0]) + Math.abs(g - prev[1]) + Math.abs(b - prev[2]);
                    if (delta > CFG.changeThreshold) {
                        const [h, s, l] = rgbToHsl(r, g, b);
                        if (s > CFG.minSaturation) {
                            playNote(hslToFreq(h, l), reverbSend);
                            noteCount++;
                        }
                    }
                }

                prevColors[i] = [r, g, b];
            }
        } catch (_e) {
            // Canvas tainted or unavailable — fail silently
            clearInterval(sampleTimer);
        }
    }

    // Keep reverbSend reference outside init scope
    let reverbSend = null;

    // ─── Init audio graph ─────────────────────────────────────────────────────
    function init() {
        if (initialized) return;

        audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        // Master gain
        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0;

        // LFO for breathing
        lfo = audioCtx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = CFG.breathFreq;
        const lfoGain = audioCtx.createGain();
        lfoGain.gain.value = CFG.breathDepth;
        lfo.connect(lfoGain);
        lfoGain.connect(masterGain.gain);
        lfo.start();

        // Reverb
        const convolver = audioCtx.createConvolver();
        convolver.buffer = buildImpulse(audioCtx, CFG.reverbDuration, CFG.reverbDecay);
        const reverbGain = audioCtx.createGain();
        reverbGain.gain.value = CFG.reverbMix;
        reverbSend = audioCtx.createGain();
        reverbSend.gain.value = 0.5;
        reverbSend.connect(convolver);
        convolver.connect(reverbGain);
        reverbGain.connect(audioCtx.destination);
        masterGain.connect(audioCtx.destination);

        // Fade master in slowly
        masterGain.gain.setTargetAtTime(CFG.masterBase, audioCtx.currentTime, 3.0);

        // Sampler canvas (tiny - just grid size for perf)
        sampleCanvas = document.createElement('canvas');
        sampleCanvas.width = CFG.gridCols;
        sampleCanvas.height = CFG.gridRows;
        sampleCtx2d = sampleCanvas.getContext('2d', { willReadFrequently: true });

        initialized = true;
        sampleTimer = setInterval(sample, CFG.sampleInterval);
        console.log('✦ Pixel ambience active');
    }

    // ─── First-interaction trigger ────────────────────────────────────────────
    function onInteraction() {
        init();
        document.removeEventListener('click', onInteraction);
        document.removeEventListener('mousemove', onInteraction);
        document.removeEventListener('keydown', onInteraction);
    }

    // Wait until the mosaic has started before arming the listener,
    // so we don't init audio before the experience begins.
    function armWhenReady() {
        const canvas = document.getElementById('veil-canvas');
        if (canvas) {
            document.addEventListener('click', onInteraction, { once: false });
            document.addEventListener('mousemove', onInteraction, { once: false });
            document.addEventListener('keydown', onInteraction, { once: false });
        } else {
            setTimeout(armWhenReady, 500);
        }
    }

    window.addEventListener('DOMContentLoaded', armWhenReady);

})();
