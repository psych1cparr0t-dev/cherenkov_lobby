(function veilMosaic() {
  let currentBlockSize = 7;
  let veilGo = false;
  document.addEventListener('cherenkov:revealed', () => { veilGo = true; });
  const SCENES = [
    'references/liminal_veil/first_draft/cherry_blossoms.webm',
    'references/liminal_veil/first_draft/mexico_city_crosswalk.webm',
    'references/liminal_veil/first_draft/whale_humpback.webm',
    'references/liminal_veil/first_draft/whales_orca.webm',
    'references/liminal_veil/first_draft/colosseum_aerial_10s.webm',
    'references/liminal_veil/first_draft/floating_market_10s.webm',
    'references/liminal_veil/first_draft/starling_swarm_10s.webm',
    'references/liminal_veil/first_draft/scene_4_10s.webm',
    'references/liminal_veil/first_draft/nature1_10s.webm',
    'references/liminal_veil/first_draft/design1_10s.webm',
    'references/liminal_veil/first_draft/innovation1_10s.webm',
    'references/liminal_veil/first_draft/creative1_10s.webm'
  ];
  const canvas = document.getElementById('veil-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  const offscreen = document.createElement('canvas');
  const octx = offscreen.getContext('2d', { willReadFrequently: true });

  const vidA = document.createElement('video');
  const vidB = document.createElement('video');

  function skipToNext(vElement) {
    if (vElement === currentVid) {
      // Current video failed to load, force swap
      let temp = currentVid;
      currentVid = nextVid;
      nextVid = temp;
      currentIndex++;
      loadScene(currentIndex + 1, nextVid);
      isTransitioning = false;
      currentVid.play().catch(e => console.warn('veil post-skip play error:', e));
    } else if (vElement === nextVid) {
      // Next video failed to load in background, retry the next one
      currentIndex++;
      loadScene(currentIndex + 1, nextVid);
    }
  }

  [vidA, vidB].forEach(v => {
    v.muted = true; v.loop = false; v.playsInline = true;
    v.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;top:-2px;left:-2px;';
    document.body.appendChild(v);
    // If a video errors out (missing file, format not supported), we must skip it
    v.addEventListener('error', (e) => {
      console.warn(`veil mosaic failed to load video ${v.src}`, e);
      skipToNext(v);
    });
    // Important for Safari to play when back in view
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && v.duration > 0 && !v.paused && !v.ended) {
        v.play().catch(e => console.warn('veil resume error:', e));
        isDrawing = false; // Clear lock in case thread suspension stalled it
      }
    });
  });

  let currentVid = vidA, nextVid = vidB;
  let currentIndex = 0;
  let ready = false, curOp = 0;
  const TRANSITION_DURATION = 1.0; // 1 second crossfade
  let isTransitioning = false;

  function loadScene(i, vElement) {
    vElement.src = SCENES[i % SCENES.length];
    vElement.load();
  }

  currentVid.addEventListener('canplay', () => { ready = true; });

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    offscreen.width = Math.ceil(canvas.width / currentBlockSize);
    offscreen.height = Math.ceil(canvas.height / currentBlockSize);
  }
  window.addEventListener('resize', resize);
  resize();

  let isDrawing = false; // Strictly prevents interval-stacking

  function checkTransition() {
    let timeLeft = Infinity;

    // If we have a valid duration, calculate the time left
    if (currentVid.duration && currentVid.duration !== Infinity) {
      timeLeft = currentVid.duration - currentVid.currentTime;
    }

    // Start transition early if there's a valid duration and we are close to the end
    if (timeLeft <= TRANSITION_DURATION && !isTransitioning) {
      isTransitioning = true;
      nextVid.play().catch(e => console.warn('veil fade next play error:', e));
    }

    // If we reach the end (either by calculating timeLeft or the 'ended' flag organically fires)
    if (timeLeft <= 0.05 || currentVid.ended) {
      isTransitioning = false;
      // Swap videos
      let temp = currentVid;
      currentVid = nextVid;
      nextVid = temp;

      // Current is now the active one, prepare the next
      currentIndex++;
      loadScene(currentIndex + 1, nextVid);

      // Ensure it's still playing in case it paused itself
      currentVid.play().catch(e => console.warn('veil post-swap play error:', e));
    }
  }

  function drawFrame() {
    if (!ready || currentVid.readyState < 2) return;
    if (isDrawing) return; // Drop frame if still processing previous

    isDrawing = true;

    const config = window.veilConfig || { block: 7, lift: 155, colorScale: 0.35, desat: 0.6, maxOp: 0.45, zoomX: 1.0, zoomY: 1.0 };

    if (config.block !== currentBlockSize) {
      currentBlockSize = config.block;
      resize();
    }

    try {
      checkTransition();

      const cols = offscreen.width, rows = offscreen.height;

      function drawVideoFrame(v, alpha) {
        if (v.readyState < 2) return;
        octx.globalAlpha = alpha;
        let sWidth = v.videoWidth / config.zoomX;
        let sHeight = v.videoHeight / config.zoomY;
        let sx = (v.videoWidth - sWidth) / 2;
        let sy = (v.videoHeight - sHeight) / 2;

        if (v.videoWidth === 0 || config.zoomX === 1.0 && config.zoomY === 1.0) {
          octx.drawImage(v, 0, 0, cols, rows);
        } else {
          octx.drawImage(v, Math.max(0, sx), Math.max(0, sy), sWidth, sHeight, 0, 0, cols, rows);
        }
      }

      octx.clearRect(0, 0, cols, rows);

      if (isTransitioning && currentVid.duration && currentVid.duration !== Infinity) {
        const timeLeftFrame = currentVid.duration - currentVid.currentTime;
        const fadeProgress = Math.max(0, Math.min(1, 1 - (timeLeftFrame / TRANSITION_DURATION)));
        drawVideoFrame(currentVid, 1.0);
        drawVideoFrame(nextVid, fadeProgress);
      } else {
        drawVideoFrame(currentVid, 1.0);
      }
      octx.globalAlpha = 1.0;

      const px = octx.getImageData(0, 0, cols, rows).data;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = (r * cols + c) * 4;
          let R = px[i], G = px[i + 1], B = px[i + 2];

          const grey = R * 0.299 + G * 0.587 + B * 0.114;
          const ds = config.desat; // desaturate dynamically
          R = R * (1 - ds) + grey * ds;
          G = G * (1 - ds) + grey * ds;
          B = B * (1 - ds) + grey * ds;

          // Lift aggressively into the page's near-white band
          const cs = config.colorScale !== undefined ? config.colorScale : 0.35;
          R = Math.min(255, R * cs + config.lift);
          G = Math.min(255, G * cs + config.lift);
          B = Math.min(255, B * cs + config.lift + 7);

          ctx.fillStyle = `rgb(${R | 0},${G | 0},${B | 0})`;
          ctx.fillRect(c * config.block + 1, r * config.block + 1, config.block - 2, config.block - 2);
        }
      }
    } catch (e) {
      console.error("veil draw error:", e);
    } finally {
      isDrawing = false;
    }
  }

  function tick() {
    const config = window.veilConfig || { maxOp: 0.45 };
    if (ready && curOp < config.maxOp && veilGo) {
      curOp = Math.min(config.maxOp, curOp + 0.004);
    } else if (curOp > config.maxOp) {
      curOp = config.maxOp; // Allows dynamic scaling down
    }

    canvas.style.opacity = curOp.toFixed(3);

    // Even if opacity is 0, we must continue drawing so it doesn't freeze the video playhead state
    drawFrame();
  }

  canvas.style.opacity = '0';
  loadScene(0, currentVid);
  loadScene(1, nextVid);
  currentVid.play().catch(e => console.warn('veil initial play error:', e));

  // Steady background execution (safeguarded by isDrawing lock)
  setInterval(tick, 33);
})();
