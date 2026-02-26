/**
 * pixel_touch.js — Mouse-over mosaic pixel spin + tone flurry
 *
 * Each block matches veil_mosaic's currentBlockSize (7px).
 * Cursor disturbs blocks in a radius, each spins showing its
 * video content. Pentatonic plucks fire per disturbed block.
 * Spatial index ensures O(radius²) performance, not O(total).
 */

(function () {
    'use strict';

    const TILE = 7;     // must match veil_mosaic currentBlockSize
    const RADIUS = 56;    // disturbance radius in px (~8 blocks)
    const DECAY = 0.84;  // spin friction per frame
    const MAX_SPIN = 0.28;  // max rad/frame
    const SND_MIN = 0.05;  // spin threshold to trigger sound
    const SND_CD = 220;   // ms cooldown per tile
    const MAX_SND = 8;     // max new sounds per frame

    const SCALE_HZ = [
        65.41, 73.42, 82.41, 98.00, 110.00,
        130.81, 146.83, 164.81, 196.00, 220.00,
        261.63, 293.66, 329.63, 392.00, 440.00,
        523.25, 587.33, 659.25, 784.00, 880.00,
    ];

    // ─── State ────────────────────────────────────────────────────────────────
    let overlay, oCtx;
    let veilCanvas;
    let colorCanvas, colorCtx;
    let tileGrid = null;           // 2d array [row][col]
    let activeTiles = new Set();   // only active tiles rendered
    let gridCols = 0, gridRows = 0;
    let mouse = { x: -9999, y: -9999, vx: 0, vy: 0 };
    let audioCtx = null;
    let colorMap = null;
    let lastColorSample = 0;

    // ─── Tile ─────────────────────────────────────────────────────────────────
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
        gridRows = Math.ceil(overlay.height / TILE) + 1;
        tileGrid = [];
        for (let r = 0; r < gridRows; r++) {
            tileGrid[r] = [];
            for (let c = 0; c < gridCols; c++)
                tileGrid[r][c] = makeTile(c, r);
        }
        activeTiles.clear();
    }

    // ─── Spatial: only iterate tiles in cursor's bounding box ─────────────────
    function tilesInRadius(cb) {
        if (mouse.x < -999) return;
        const c0 = Math.max(0, Math.floor((mouse.x - RADIUS) / TILE));
        const c1 = Math.min(gridCols - 1, Math.ceil((mouse.x + RADIUS) / TILE));
        const r0 = Math.max(0, Math.floor((mouse.y - RADIUS) / TILE));
        const r1 = Math.min(gridRows - 1, Math.ceil((mouse.y + RADIUS) / TILE));
        for (let r = r0; r <= r1; r++)
            for (let c = c0; c <= c1; c++)
                cb(tileGrid[r][c]);
    }

    // ─── Color sampling ───────────────────────────────────────────────────────
    function sampleColors() {
        if (!veilCanvas || !colorCtx) return;
        try {
            colorCtx.drawImage(veilCanvas, 0, 0, gridCols, gridRows);
            colorMap = colorCtx.getImageData(0, 0, gridCols, gridRows).data;
        } catch (_) { }
    }

    function tileRGB(tile) {
        if (!colorMap) return [80, 120, 200];
        const i = (tile.row * gridCols + tile.col) * 4;
        return [colorMap[i], colorMap[i + 1], colorMap[i + 2]];
    }

    // ─── Color → pitch ────────────────────────────────────────────────────────
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
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
    }

    function playPluck(freq, strength) {
        if (!audioCtx) return;
        const t = audioCtx.currentTime;
        const vol = Math.min(0.15, 0.04 + strength * 0.18);
        const osc = audioCtx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        osc.detune.value = (Math.random() - 0.5) * 18;
        const filt = audioCtx.createBiquadFilter();
        filt.type = 'lowpass';
        filt.frequency.value = 2800;
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(vol, t + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        osc.connect(filt); filt.connect(gain); gain.connect(audioCtx.destination);
        osc.start(t); osc.stop(t + 0.20);
    }

    // ─── Render + physics ─────────────────────────────────────────────────────
    function tick() {
        requestAnimationFrame(tick);

        const speed = Math.sqrt(mouse.vx ** 2 + mouse.vy ** 2);
        const now = performance.now();
        oCtx.clearRect(0, 0, overlay.width, overlay.height);

        if (now - lastColorSample > 350) {
            sampleColors();
            lastColorSample = now;
        }

        const veilVisible = veilCanvas &&
            parseFloat(veilCanvas.style.opacity || '0') > 0.01;

        let soundsThisFrame = 0;

        // Disturb tiles near cursor
        if (speed > 0.5) {
            tilesInRadius((tile) => {
                const dx = mouse.x - tile.cx;
                const dy = mouse.y - tile.cy;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist >= RADIUS) return;

                const proximity = 1 - dist / RADIUS;
                const strength = proximity * Math.min(speed / 16, 1);
                const dir = tile.spinVel === 0
                    ? (Math.random() > 0.5 ? 1 : -1)
                    : Math.sign(tile.spinVel);

                tile.spinVel = dir * Math.min(MAX_SPIN,
                    Math.abs(tile.spinVel) + strength * 0.18);

                if (!tile.active) {
                    tile.active = true;
                    activeTiles.add(tile);
                }

                if (soundsThisFrame < MAX_SND &&
                    Math.abs(tile.spinVel) > SND_MIN &&
                    now - tile.lastSound > SND_CD) {
                    ensureAudio();
                    const [r, g, b] = tileRGB(tile);
                    playPluck(hueToFreq(rgbToHue(r, g, b)), strength);
                    tile.lastSound = now;
                    soundsThisFrame++;
                }
            });
        }

        // Update + render active tiles
        for (const tile of activeTiles) {
            tile.angle += tile.spinVel;
            tile.spinVel *= DECAY;
            tile.scale = 1 + Math.abs(tile.spinVel) * 3.2;

            if (Math.abs(tile.spinVel) < 0.0005) {
                tile.spinVel = 0; tile.angle = 0; tile.scale = 1;
                tile.active = false;
                activeTiles.delete(tile);
                continue;
            }

            const alpha = Math.min(1, Math.abs(tile.spinVel) / 0.03);
            oCtx.save();
            oCtx.globalAlpha = alpha;
            oCtx.translate(tile.cx, tile.cy);
            oCtx.rotate(tile.angle);
            oCtx.scale(tile.scale, tile.scale);
            oCtx.beginPath();
            oCtx.rect(-TILE / 2, -TILE / 2, TILE, TILE);
            oCtx.clip();

            if (veilVisible) {
                oCtx.drawImage(
                    veilCanvas,
                    tile.cx - TILE / 2, tile.cy - TILE / 2, TILE, TILE,
                    -TILE / 2, -TILE / 2, TILE, TILE
                );
            } else {
                const [r, g, b] = tileRGB(tile);
                oCtx.fillStyle = `rgb(${r},${g},${b})`;
                oCtx.fillRect(-TILE / 2, -TILE / 2, TILE, TILE);
            }
            oCtx.restore();
        }

        mouse.vx *= 0.78;
        mouse.vy *= 0.78;
    }

    // ─── Mouse ────────────────────────────────────────────────────────────────
    let _px = null, _py = null;
    document.addEventListener('mousemove', (e) => {
        if (_px !== null) { mouse.vx = e.clientX - _px; mouse.vy = e.clientY - _py; }
        mouse.x = e.clientX; mouse.y = e.clientY;
        _px = e.clientX; _py = e.clientY;
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
        mouse.x = -9999; mouse.y = -9999;
        mouse.vx = 0; mouse.vy = 0;
        _px = null; _py = null;
    });

    // ─── Setup ────────────────────────────────────────────────────────────────
    function setup() {
        veilCanvas = document.getElementById('veil-canvas');
        if (!veilCanvas) { setTimeout(setup, 400); return; }

        overlay = document.createElement('canvas');
        overlay.width = window.innerWidth;
        overlay.height = window.innerHeight;
        overlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:3;';
        oCtx = overlay.getContext('2d');
        veilCanvas.parentElement.appendChild(overlay);

        colorCanvas = document.createElement('canvas');
        colorCtx = colorCanvas.getContext('2d', { willReadFrequently: true });

        buildGrid();
        colorCanvas.width = gridCols;
        colorCanvas.height = gridRows;
        requestAnimationFrame(tick);

        window.addEventListener('resize', () => {
            overlay.width = window.innerWidth;
            overlay.height = window.innerHeight;
            buildGrid();
            colorCanvas.width = gridCols;
            colorCanvas.height = gridRows;
        });
    }

    window.addEventListener('DOMContentLoaded', setup);
})();
