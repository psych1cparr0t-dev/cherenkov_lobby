/**
 * pixel_touch.js — Mouse-over pixel spin + tone flurry
 *
 * Moving the mouse over the Liminal Veil disturbs nearby tiles.
 * Each tile spins, showing real video content clipped + rotated.
 * Pentatonic tones fire per tile, pitched to their sampled hue.
 */

(function () {
    'use strict';

    const TILE = 38;    // tile size px
    const RADIUS = 95;    // disturbance radius px
    const DECAY = 0.87;  // spin velocity friction per frame
    const MAX_SPIN = 0.20;  // max spin velocity rad/frame
    const SND_THRESH = 0.045; // min spin speed to trigger sound
    const SND_CD = 260;   // ms cooldown between sounds per tile
    const MAX_SND = 5;     // max new sounds per frame

    // C2–C5 pentatonic
    const SCALE_HZ = [
        65.41, 73.42, 82.41, 98.00, 110.00,
        130.81, 146.83, 164.81, 196.00, 220.00,
        261.63, 293.66, 329.63, 392.00, 440.00,
        523.25, 587.33, 659.25, 784.00, 880.00,
    ];

    // ─── State ────────────────────────────────────────────────────────────────
    let overlay, overlayCtx;
    let veilCanvas;
    let colorCanvas, colorCtx;
    let tiles = [];
    let gridCols = 0;
    let mouse = { x: -9999, y: -9999, vx: 0, vy: 0 };
    let audioCtx = null;
    let colorMap = null;
    let lastColorSample = 0;

    // ─── Tile factory ─────────────────────────────────────────────────────────
    function makeTile(c, r) {
        return {
            col: c, row: r,
            cx: c * TILE + TILE / 2,
            cy: r * TILE + TILE / 2,
            angle: 0, spinVel: 0, scale: 1,
            active: false, lastSound: 0,
        };
    }

    function buildGrid() {
        gridCols = Math.ceil(overlay.width / TILE) + 1;
        const gridRows = Math.ceil(overlay.height / TILE) + 1;
        tiles = [];
        for (let r = 0; r < gridRows; r++)
            for (let c = 0; c < gridCols; c++)
                tiles.push(makeTile(c, r));
    }

    // ─── Color sampling ───────────────────────────────────────────────────────
    function sampleColors() {
        if (!veilCanvas) return;
        try {
            colorCtx.drawImage(veilCanvas, 0, 0, colorCanvas.width, colorCanvas.height);
            colorMap = colorCtx.getImageData(0, 0, colorCanvas.width, colorCanvas.height).data;
        } catch (_) { }
    }

    function tileRGB(tile) {
        if (!colorMap) return [80, 120, 200];
        const i = (tile.row * gridCols + tile.col) * 4;
        return [colorMap[i], colorMap[i + 1], colorMap[i + 2]];
    }

    // ─── Hue → frequency ─────────────────────────────────────────────────────
    function rgbToHue(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        if (max === min) return 180;
        const d = max - min;
        let h;
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            default: h = ((r - g) / d + 4) / 6;
        }
        return h * 360;
    }

    function hueToFreq(h) {
        return SCALE_HZ[Math.floor(h / 360 * SCALE_HZ.length) % SCALE_HZ.length];
    }

    // ─── Audio ────────────────────────────────────────────────────────────────
    function ensureAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') audioCtx.resume();
    }

    function playPluck(freq, strength) {
        if (!audioCtx) return;
        const t = audioCtx.currentTime;
        const vol = Math.min(0.18, 0.05 + strength * 0.22);

        const osc = audioCtx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        osc.detune.value = (Math.random() - 0.5) * 16;

        const filt = audioCtx.createBiquadFilter();
        filt.type = 'lowpass';
        filt.frequency.value = 2600;

        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(vol, t + 0.007);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.20);

        osc.connect(filt);
        filt.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.22);
    }

    // ─── Render + physics loop ────────────────────────────────────────────────
    function tick() {
        requestAnimationFrame(tick);

        const speed = Math.sqrt(mouse.vx ** 2 + mouse.vy ** 2);
        const now = performance.now();
        overlayCtx.clearRect(0, 0, overlay.width, overlay.height);

        // Re-sample colors every 400ms
        if (now - lastColorSample > 400) {
            sampleColors();
            lastColorSample = now;
        }

        const veilVisible = veilCanvas &&
            parseFloat(veilCanvas.style.opacity || '0') > 0.01;

        let soundsThisFrame = 0;

        for (const tile of tiles) {
            const dx = mouse.x - tile.cx;
            const dy = mouse.y - tile.cy;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Disturb tile if mouse is close and moving
            if (dist < RADIUS && speed > 0.8) {
                const proximity = 1 - dist / RADIUS;
                const strength = proximity * Math.min(speed / 18, 1);
                const dir = tile.spinVel === 0
                    ? (Math.random() > 0.5 ? 1 : -1)
                    : Math.sign(tile.spinVel);
                tile.spinVel = dir * Math.min(MAX_SPIN,
                    Math.abs(tile.spinVel) + strength * 0.14);
                tile.active = true;

                // Trigger sound
                if (soundsThisFrame < MAX_SND &&
                    Math.abs(tile.spinVel) > SND_THRESH &&
                    now - tile.lastSound > SND_CD) {
                    ensureAudio();
                    const [r, g, b] = tileRGB(tile);
                    playPluck(hueToFreq(rgbToHue(r, g, b)), strength);
                    tile.lastSound = now;
                    soundsThisFrame++;
                }
            }

            if (!tile.active) continue;

            // Physics update
            tile.angle += tile.spinVel;
            tile.spinVel *= DECAY;
            tile.scale = 1 + Math.abs(tile.spinVel) * 3.5;

            if (Math.abs(tile.spinVel) < 0.0006) {
                tile.spinVel = 0; tile.angle = 0;
                tile.scale = 1; tile.active = false;
                continue;
            }

            // Draw: spin the video slice from that tile position
            const alpha = Math.min(1, Math.abs(tile.spinVel) / 0.035);
            overlayCtx.save();
            overlayCtx.globalAlpha = alpha;
            overlayCtx.translate(tile.cx, tile.cy);
            overlayCtx.rotate(tile.angle);
            overlayCtx.scale(tile.scale, tile.scale);
            overlayCtx.beginPath();
            overlayCtx.rect(-TILE / 2, -TILE / 2, TILE, TILE);
            overlayCtx.clip();

            if (veilVisible) {
                // Draw the exact slice of veil canvas that belongs to this tile
                overlayCtx.drawImage(
                    veilCanvas,
                    tile.cx - TILE / 2, tile.cy - TILE / 2, TILE, TILE, // source
                    -TILE / 2, -TILE / 2, TILE, TILE                     // dest (centered)
                );
            } else {
                // Fallback: solid color block
                const [r, g, b] = tileRGB(tile);
                overlayCtx.fillStyle = `rgb(${r},${g},${b})`;
                overlayCtx.fillRect(-TILE / 2, -TILE / 2, TILE, TILE);
            }

            overlayCtx.restore();
        }

        // Dampen mouse velocity each frame
        mouse.vx *= 0.75;
        mouse.vy *= 0.75;
    }

    // ─── Mouse tracking (on document so it works through overlay) ────────────
    let prevX = null, prevY = null;

    document.addEventListener('mousemove', (e) => {
        if (prevX !== null) {
            mouse.vx = e.clientX - prevX;
            mouse.vy = e.clientY - prevY;
        }
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        prevX = e.clientX;
        prevY = e.clientY;
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
        mouse.x = -9999; mouse.y = -9999;
        mouse.vx = 0; mouse.vy = 0;
        prevX = null; prevY = null;
    });

    // ─── Setup ────────────────────────────────────────────────────────────────
    function setup() {
        veilCanvas = document.getElementById('veil-canvas');
        if (!veilCanvas) { setTimeout(setup, 400); return; }

        const parent = veilCanvas.parentElement;

        overlay = document.createElement('canvas');
        overlay.width = window.innerWidth;
        overlay.height = window.innerHeight;
        overlay.style.cssText = [
            'position:absolute', 'top:0', 'left:0',
            'width:100%', 'height:100%',
            'pointer-events:none', 'z-index:3',
        ].join(';');
        overlayCtx = overlay.getContext('2d');
        parent.appendChild(overlay);

        const gc = Math.ceil(overlay.width / TILE) + 1;
        const gr = Math.ceil(overlay.height / TILE) + 1;
        colorCanvas = document.createElement('canvas');
        colorCanvas.width = gc;
        colorCanvas.height = gr;
        colorCtx = colorCanvas.getContext('2d', { willReadFrequently: true });

        buildGrid();
        requestAnimationFrame(tick);

        window.addEventListener('resize', () => {
            overlay.width = window.innerWidth;
            overlay.height = window.innerHeight;
            colorCanvas.width = Math.ceil(overlay.width / TILE) + 1;
            colorCanvas.height = Math.ceil(overlay.height / TILE) + 1;
            buildGrid();
        });
    }

    window.addEventListener('DOMContentLoaded', setup);

})();
