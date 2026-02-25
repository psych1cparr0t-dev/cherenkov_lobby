# Carl Animation System Guide

## 🎬 Current Animation Setup

Felix's animation system supports **both**:
1. **Built-in GLB animations** (from Blender/Maya/etc.)
2. **Procedural animations** (coded movements)

## 🔍 Check Carl's Built-in Animations

**Open browser console (F12)** and look for:
```
[Felix] Found X animations in model
```

- **X = 0**: Carl has no built-in animations (using procedural only)
- **X = 1+**: Carl has embedded animations that will play!

## 📊 Animation States

Felix has 3 behavior states that trigger different animations:

### 1. **Idle State** (Default)
- Gentle breathing effect
- Subtle floating motion
- Soft rotation/sway
- **Triggers**: When no interaction

### 2. **Active State**
- Excited bouncing
- Nodding motions
- Scale pulsing (energy)
- **Triggers**: When chat opens, during conversation

### 3. **Thinking State**
- Contemplative tilting
- Slow floating
- Head rotation
- **Triggers**: When processing messages

## 🎨 Adding Animations to Carl.glb

### Option 1: Export from Blender

1. **Create animations in Blender**:
   - Select Carl armature
   - Enter Pose Mode (Ctrl+Tab)
   - Add keyframes (I key)
   - Create animation clips

2. **Name your animations** (important!):
   - `Idle` - Default breathing/waiting
   - `Active` - Excited/talking
   - `Thinking` - Contemplating

3. **Export as GLB**:
   ```
   File → Export → glTF 2.0 (.glb)
   - Format: glTF Binary (.glb)
   - Include: Animations ✓
   - Animation: Selected Actions
   ```

4. **Replace Carl.glb** and refresh browser

### Option 2: Use Mixamo (Free)

1. Upload Carl.glb to https://www.mixamo.com
2. Choose animations:
   - "Idle" animation for idle state
   - "Talking" or "Waving" for active
   - "Thinking" for thinking state
3. Download with "In Place" option
4. Replace Carl.glb

## 🔧 Animation Configuration

### Map GLB Animations to States

If Carl has animations, edit `felix-bot.html`:

```javascript
// Find the animation setup (around line 440)
if (gltf.animations && gltf.animations.length > 0) {
    mixer = new THREE.AnimationMixer(felix);

    // Map animations by name
    felix.userData.animations = {};

    gltf.animations.forEach((clip) => {
        const action = mixer.clipAction(clip);
        const name = clip.name.toLowerCase();

        // Map to states
        if (name.includes('idle')) {
            felix.userData.animations.idle = action;
        } else if (name.includes('active') || name.includes('talk')) {
            felix.userData.animations.active = action;
        } else if (name.includes('think')) {
            felix.userData.animations.thinking = action;
        }

        modelAnimations.push(action);
    });

    console.log('[Felix] Animation mapping:',
        Object.keys(felix.userData.animations));
}
```

### Play Animations by State

```javascript
function idleAnimation() {
    // Play GLB animation if available
    if (felix.userData.animations?.idle) {
        felix.userData.animations.idle.play();
    } else {
        // Fallback to procedural animation
        const breathe = Math.sin(animationTime * 0.8) * 0.02;
        felix.scale.y = felix.userData.originalScale.y + breathe;
        // ... rest of procedural code
    }
}

function activeAnimation() {
    if (felix.userData.animations?.active) {
        felix.userData.animations.active.play();
    } else {
        // Procedural fallback
        const bounce = Math.abs(Math.sin(animationTime * 3)) * 0.15;
        felix.position.y = felix.userData.originalPosition.y + bounce;
    }
}

function thinkingAnimation() {
    if (felix.userData.animations?.thinking) {
        felix.userData.animations.thinking.play();
    } else {
        // Procedural fallback
        felix.rotation.y = Math.sin(animationTime * 0.6) * 0.2;
    }
}
```

## 🎭 Advanced Animation Features

### Smooth Transitions

```javascript
function switchAnimation(from, to) {
    if (from) {
        from.fadeOut(0.5); // 0.5 second fade out
    }
    if (to) {
        to.reset().fadeIn(0.5).play();
    }
}
```

### Animation Blending

```javascript
// Blend between idle and active
function blendAnimation(animation1, animation2, weight) {
    animation1.weight = 1 - weight;
    animation2.weight = weight;
    animation1.play();
    animation2.play();
}
```

### Loop Control

```javascript
// Set animation to loop
action.setLoop(THREE.LoopRepeat);

// Play once
action.setLoop(THREE.LoopOnce);
action.clampWhenFinished = true;

// Ping-pong
action.setLoop(THREE.LoopPingPong);
```

### Speed Control

```javascript
// Slow down animation
action.timeScale = 0.5; // Half speed

// Speed up
action.timeScale = 2.0; // Double speed

// Reverse
action.timeScale = -1.0;
```

## 🎬 Quick Animation Examples

### Example 1: Simple Idle Loop

```javascript
// In Blender:
// 1. Keyframe 0: Default pose
// 2. Keyframe 60: Slight rotation
// 3. Keyframe 120: Back to default
// Name: "Idle"
```

### Example 2: Talking Animation

```javascript
// In Blender:
// 1. Keyframe 0: Closed mouth
// 2. Keyframe 5: Open mouth
// 3. Keyframe 10: Closed
// 4. Add subtle head bob
// Name: "Active"
```

### Example 3: Thinking Gesture

```javascript
// In Blender:
// 1. Keyframe 0: Normal pose
// 2. Keyframe 30: Head tilted
// 3. Keyframe 60: Hand near chin (if has arms)
// 4. Keyframe 90: Back to normal
// Name: "Thinking"
```

## 🐛 Troubleshooting

### Animations Not Playing

**Check console for**:
```
[Felix] Found 0 animations in model
```

**Solutions**:
1. Re-export GLB with "Include Animations" checked
2. Verify animations are not muted in Blender
3. Check animation names don't have special characters

### Animations Playing Too Fast/Slow

```javascript
// Adjust mixer update speed
if (mixer && loadingComplete) {
    mixer.update(delta * 0.5); // Slower
    mixer.update(delta * 2.0); // Faster
}
```

### Animations Stuttering

1. Check browser console for frame rate
2. Reduce polygon count in Carl model
3. Optimize animation keyframes (fewer keys)
4. Disable shadows temporarily:
   ```javascript
   renderer.shadowMap.enabled = false;
   ```

### Multiple Animations Playing at Once

```javascript
// Stop all animations first
modelAnimations.forEach(action => action.stop());

// Then play desired animation
felix.userData.animations.idle.play();
```

## 📝 Current Setup Summary

Your Felix currently has:
- ✅ GLB loader with animation support
- ✅ Animation mixer setup
- ✅ Procedural fallback animations
- ✅ 3 behavior states (idle, active, thinking)
- ✅ Smooth state transitions

**To add custom animations**:
1. Create animations in Blender/Maya
2. Export as GLB with animations included
3. Replace Carl.glb file
4. Refresh browser
5. Check console for "[Felix] Found X animations"

The system will automatically use your GLB animations if present, or fall back to procedural animations!

## 🚀 Next Steps

1. **Test current setup** - Click Carl, send messages, watch state changes
2. **Check console** - See if Carl has built-in animations
3. **Add animations** (optional) - Create in Blender and export
4. **Customize behavior** - Tune animation speeds and blending
5. **Advanced features** - Add more states, triggers, or gestures

---

**Carl's animation system is ready!** 🎬✨
