# Carl Model Integration Guide

Felix now uses your custom **Carl.glb** model instead of procedural geometry!

## What Changed

### ✅ GLB Model Loading
- Added **GLTFLoader** for loading 3D models
- Auto-scales Carl to fit the display (2.5 units)
- Auto-centers the model in the scene
- Enables shadows for realistic lighting

### ✅ Animation Support
- **Built-in animations**: If Carl.glb has embedded animations, they'll play automatically
- **Custom animations**: Three behavior states still work:
  - `idle` - Gentle breathing, floating, subtle sway
  - `active` - Excited bouncing, nodding, energy pulses
  - `thinking` - Contemplative tilting, slow floating

### ✅ Enhanced Lighting
- Added 4 light sources for better model visibility:
  - Ambient light (general illumination)
  - Spotlight with green tint (BT-7274 style)
  - Fill light with blue tint (accent)
  - Back light (depth)

## Customization

### Adjust Model Scale

```javascript
// In loadCarlModel(), find this line:
const scale = 2.5 / maxDimension;

// Change 2.5 to make Carl bigger/smaller:
const scale = 4.0 / maxDimension;  // Larger Carl
const scale = 1.5 / maxDimension;  // Smaller Carl
```

### Adjust Camera Position

```javascript
// In initFelix(), find:
camera.position.set(0, 2, 5);

// Move camera closer/farther:
camera.position.set(0, 2, 3);  // Closer view
camera.position.set(0, 2, 8);  // Farther view
```

### Change Model Position

```javascript
// In loadCarlModel(), after centering:
felix.position.y = -center.y * scale + 0.5;

// Adjust the +0.5 to move Carl up/down:
felix.position.y = -center.y * scale + 1.0;  // Higher
felix.position.y = -center.y * scale + 0.0;  // Lower
```

### Adjust Animation Intensity

**Idle State** (line ~518):
```javascript
// Breathing intensity
const breathe = Math.sin(animationTime * 0.8) * 0.02;  // Default
const breathe = Math.sin(animationTime * 0.8) * 0.05;  // More breathing

// Floating range
felix.position.y = originalY + Math.sin(animationTime * 0.5) * 0.05;  // Default
felix.position.y = originalY + Math.sin(animationTime * 0.5) * 0.1;   // Float higher
```

**Active State** (line ~535):
```javascript
// Bounce height
const bounce = Math.abs(Math.sin(animationTime * 3)) * 0.15;  // Default
const bounce = Math.abs(Math.sin(animationTime * 3)) * 0.3;   // Higher bounces

// Energy pulse
const pulse = 1 + Math.sin(animationTime * 3) * 0.03;  // Default
const pulse = 1 + Math.sin(animationTime * 3) * 0.08;  // More dramatic
```

**Thinking State** (line ~557):
```javascript
// Tilt angle
felix.rotation.y = Math.sin(animationTime * 0.6) * 0.2;  // Default
felix.rotation.y = Math.sin(animationTime * 0.6) * 0.4;  // More tilt
```

## Using Model's Built-in Animations

If Carl.glb has animations (created in Blender, Maya, etc.), they'll play automatically!

### Check Available Animations

Open browser console (F12) when loading the page:
```
[Felix] Found 3 animations in model
```

### Control Which Animation Plays

```javascript
// In loadCarlModel(), find:
if (modelAnimations.length > 0) {
    modelAnimations[0].play();  // Plays first animation
}

// Change to play different animation:
if (modelAnimations.length > 1) {
    modelAnimations[1].play();  // Play second animation
}

// Play all animations:
modelAnimations.forEach(action => action.play());

// Loop animations:
modelAnimations[0].setLoop(THREE.LoopRepeat);
modelAnimations[0].play();
```

### Switch Animations Based on State

```javascript
// In the animation functions, add:
function idleAnimation() {
    if (modelAnimations[0]) {
        modelAnimations[0].play();  // Idle animation
    }
    // ... rest of code
}

function activeAnimation() {
    if (modelAnimations[1]) {
        modelAnimations[1].play();  // Active animation
    }
    // ... rest of code
}
```

## Lighting Customization

### Change Accent Colors

```javascript
// Green spotlight (BT-7274 style)
const spotLight = new THREE.SpotLight(0x00ff88, 1.2);

// Change to blue:
const spotLight = new THREE.SpotLight(0x00d4ff, 1.2);

// Change to red:
const spotLight = new THREE.SpotLight(0xff0088, 1.2);
```

### Adjust Light Intensity

```javascript
// Make everything brighter:
const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);  // Was 0.7
const spotLight = new THREE.SpotLight(0x00ff88, 2.0);         // Was 1.2
const fillLight = new THREE.PointLight(0x00d4ff, 1.0);        // Was 0.6
```

## Model Requirements

### Optimal GLB Model Specs
- **Format**: GLB (binary GLTF)
- **Triangles**: 5K-50K for web performance
- **Textures**: 1024x1024 or smaller
- **Animations**: Optional, but supported
- **Materials**: PBR materials recommended

### Export Settings (Blender)
1. File → Export → glTF 2.0 (.glb)
2. Format: glTF Binary (.glb)
3. Include: Selected Objects
4. Transform: +Y Up
5. Geometry: Apply Modifiers, UVs, Normals
6. Animation: Include if needed

## Troubleshooting

### Carl Not Appearing

**Check Browser Console (F12)**:
```javascript
[Felix] Loading Carl.glb model...
[Felix] Error loading Carl.glb: [error message]
```

**Common Issues**:
1. **File path wrong**: Verify `Carl.glb` is in same folder as `felix-bot.html`
2. **CORS error**: If testing locally, use a local server:
   ```bash
   # Python 3
   python -m http.server 8000
   # Then open: http://localhost:8000/felix-bot.html
   ```
3. **Model too large**: Check file size (<10MB recommended)

### Carl Too Small/Large

Adjust scale multiplier:
```javascript
const scale = 2.5 / maxDimension;  // Try 1.5, 3.0, 4.0, etc.
```

### Carl Off-Center

Adjust position offset:
```javascript
felix.position.y = -center.y * scale + 0.5;  // Adjust +0.5
```

### Animations Not Smooth

Check frame rate in console - should be ~60fps. If lower:
1. Reduce model complexity
2. Reduce texture sizes
3. Disable shadows:
   ```javascript
   renderer.shadowMap.enabled = false;
   ```

### Model Appears Black

Lighting issue - increase ambient light:
```javascript
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
```

## Advanced: Material Customization

### Apply Glow Effect to Carl

```javascript
// After model loads, in loadCarlModel():
felix.traverse((node) => {
    if (node.isMesh) {
        node.material.emissive = new THREE.Color(0x00ff88);
        node.material.emissiveIntensity = 0.2;
    }
});
```

### Make Carl Metallic

```javascript
felix.traverse((node) => {
    if (node.isMesh && node.material.isMeshStandardMaterial) {
        node.material.metalness = 0.8;
        node.material.roughness = 0.2;
    }
});
```

### Add Wireframe Overlay

```javascript
felix.traverse((node) => {
    if (node.isMesh) {
        const wireframe = new THREE.WireframeGeometry(node.geometry);
        const line = new THREE.LineSegments(wireframe);
        line.material.color = new THREE.Color(0x00ff88);
        line.material.opacity = 0.3;
        line.material.transparent = true;
        node.add(line);
    }
});
```

## Performance Tips

### Optimize for Web
1. **Reduce poly count**: Use decimation in Blender
2. **Compress textures**: Use 512x512 or 1024x1024
3. **Remove unused materials**: Clean up before export
4. **Bake lighting**: Pre-bake shadows and AO
5. **Use draco compression**: Smaller file size
   ```javascript
   const loader = new THREE.GLTFLoader();
   const dracoLoader = new THREE.DRACOLoader();
   dracoLoader.setDecoderPath('path/to/draco/');
   loader.setDRACOLoader(dracoLoader);
   ```

### FPS Counter

Add to see performance:
```javascript
// Add after renderer creation:
const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb
document.body.appendChild(stats.dom);

// In animate():
stats.begin();
// ... rendering code
stats.end();
```

## Next Steps

1. **Test the page** - Carl should be visible in bottom-right corner
2. **Adjust scale/position** - Make Carl fit your vision
3. **Try chat** - Click Carl to open the concierge interface
4. **Check console** - Verify model loaded successfully
5. **Customize animations** - Tune the behavior states

---

**Carl is now your concierge!** 🤖

The model automatically loads, scales, and animates. All the agent capabilities (N8n backend, enrichment module, chat interface) work exactly the same!
