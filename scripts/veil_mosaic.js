(function veilMosaic() {

  // Only valid scenes — confirmed to exist in the repo
  const SCENES = [
    'references/liminal_veil/first_draft/cherry_blossoms.webm',
    'references/liminal_veil/first_draft/mexico_city_crosswalk.webm',
    'references/liminal_veil/first_draft/whale_humpback.webm',
    'references/liminal_veil/first_draft/whales_orca.webm',
    'references/liminal_veil/first_draft/colosseum_aerial_10s.webm',
    'references/liminal_veil/first_draft/floating_market_10s.webm',
    'references/liminal_veil/first_draft/starling_swarm_10s.webm',
    'references/liminal_veil/first_draft/hong_kong_island.webm',
    'references/liminal_veil/first_draft/solis_bridge.webm',
    'references/liminal_veil/first_draft/talesh_cow.webm',
    'references/liminal_veil/first_draft/wellington_car.webm',
  ];

  const canvas = document.getElementById('veil-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  const offscreen = document.createElement('canvas');
  const octx = offscreen.getContext('2d', { willReadFrequently: true });

  // Hidden video elements — never shown, just decoded
  const vidA = document.createElement('video');
  const vidB = document.createElement('video');
  [vidA, vidB].forEach(v => {
    v.muted = true;
    v.playsInline = true;
    v.loop = false;
    v.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;top:-2px;left:-2px;';
    document.body.appendChild(v);
    v.addEventListener('error', () => skipToNext(v));
  });

  let currentVid = vidA, nextVid = vidB;
  let currentIndex = 0;
  let ready = false;
  let curOp = 0;
  let veilGo = false;
  let isTransitioning = false;
  let isDrawing = false;
  let currentBlockSize = 7;

  const XFADE = 1.0; // crossfade seconds

  // Start mosaic when reveal fires
  document.addEventListener('cherenkov:revealed', () => { veilGo = true; });

  function loadScene(i, v) {
    v.src = SCENES[i % SCENES.length];
    v.load();
  }

  function skipToNext(v) {
    if (v === currentVid) {
      [currentVid, nextVid] = [nextVid, currentVid];
      currentIndex++;
      loadScene(currentIndex + 1, nextVid);
      isTransitioning = false;
      currentVid.play().catch(() => { });
    } else {
      currentIndex++;
      loadScene(currentIndex + 1, nextVid);
    }
  }

  currentVid.addEventListener('canplay', () => { ready = true; });

  function resize() {
    const cfg = window.veilConfig || { block: 7 };
    currentBlockSize = cfg.block || 7;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    offscreen.width = Math.ceil(canvas.width / currentBlockSize);
    offscreen.height = Math.ceil(canvas.height / currentBlockSize);
  }
  window.addEventListener('resize', resize);
  resize();

  function checkTransition() {
    if (!currentVid.duration || currentVid.duration === Infinity) return;
    const timeLeft = currentVid.duration - currentVid.currentTime;
    if (timeLeft <= XFADE && !isTransitioning) {
      isTransitioning = true;
      nextVid.play().catch(() => { });
    }
    if (timeLeft <= 0.05 || currentVid.ended) {
      isTransitioning = false;
      [currentVid, nextVid] = [nextVid, currentVid];
      currentIndex++;
      loadScene(currentIndex + 1, nextVid);
      currentVid.play().catch(() => { });
    }
  }

  function drawFrame() {
    if (!ready || currentVid.readyState < 2) return;
    if (isDrawing) return;
    isDrawing = true;

    const cfg = window.veilConfig || { block: 7, lift: 20, colorScale: 0.92, desat: 0.05, maxOp: 0.92, zoomX: 1.0, zoomY: 1.0 };

    if (cfg.block !== currentBlockSize) { resize(); }

    try {
      checkTransition();

      const cols = offscreen.width, rows = offscreen.height;
      const cs = cfg.colorScale !== undefined ? cfg.colorScale : 0.35;

      octx.clearRect(0, 0, cols, rows);

      function blit(v, alpha) {
        if (v.readyState < 2) return;
        octx.globalAlpha = alpha;
        octx.drawImage(v, 0, 0, cols, rows);
      }

      if (isTransitioning && currentVid.duration && currentVid.duration !== Infinity) {
        const fade = Math.max(0, Math.min(1,
          1 - (currentVid.duration - currentVid.currentTime) / XFADE));
        blit(currentVid, 1.0);
        blit(nextVid, fade);
      } else {
        blit(currentVid, 1.0);
      }
      octx.globalAlpha = 1.0;

      const px = octx.getImageData(0, 0, cols, rows).data;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = (r * cols + c) * 4;
          let R = px[i], G = px[i + 1], B = px[i + 2];
          const grey = R * 0.299 + G * 0.587 + B * 0.114;
          const ds = cfg.desat || 0;
          R = R * (1 - ds) + grey * ds;
          G = G * (1 - ds) + grey * ds;
          B = B * (1 - ds) + grey * ds;
          R = Math.min(255, R * cs + cfg.lift);
          G = Math.min(255, G * cs + cfg.lift);
          B = Math.min(255, B * cs + cfg.lift + 7);
          ctx.fillStyle = `rgb(${R | 0},${G | 0},${B | 0})`;
          ctx.fillRect(c * cfg.block + 1, r * cfg.block + 1, cfg.block - 2, cfg.block - 2);
        }
      }
    } catch (e) {
      console.error('veil draw error:', e);
    } finally {
      isDrawing = false;
    }
  }

  function tick() {
    const cfg = window.veilConfig || { maxOp: 0.45 };
    // Opacity gate: starts climbing the moment cherenkov:revealed fires.
    // drawFrame() handles not-yet-ready video gracefully (early return).
    if (veilGo && curOp < cfg.maxOp) {
      curOp = Math.min(cfg.maxOp, curOp + 0.008);
    } else if (curOp > cfg.maxOp) {
      curOp = cfg.maxOp;
    }
    canvas.style.opacity = curOp.toFixed(3);
    drawFrame();
  }

  // Boot
  canvas.style.opacity = '0';
  loadScene(0, currentVid);
  loadScene(1, nextVid);
  currentVid.play().catch(() => { });
  setInterval(tick, 33);

})();
