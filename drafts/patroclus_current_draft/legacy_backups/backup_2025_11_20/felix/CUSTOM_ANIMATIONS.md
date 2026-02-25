# Custom Carl Animations - Implementation Guide

## 🎬 Your Custom Animation Set

### 1. **Curious Look-Around** (Active/Idle variation)
**Behavior**: Face comes toward screen, shifting and dipping head side-to-side, catching user's eyes, playfully looking at desk items

**Animation Details**:
- Duration: 4-6 seconds (looping)
- Key poses:
  - Frame 0: Default pose
  - Frame 30: Lean forward toward camera
  - Frame 50: Head tilt left, eyes tracking
  - Frame 70: Head tilt right, eyes scanning
  - Frame 90: Look down (at desk)
  - Frame 110: Look up at user
  - Frame 120: Return to default

### 2. **Quantum Stargazer** (Wonder/Idle)
**Behavior**: Head tilted back like looking at stars, hands loose, posture straight, contemplative wonder

**Animation Details**:
- Duration: 5-7 seconds (looping)
- Key poses:
  - Frame 0: Default pose
  - Frame 40: Head gradually tilts back
  - Frame 80: Full stargazer pose (hold)
  - Frame 100: Subtle head sway (still looking up)
  - Frame 140: Return to default

### 3. **Painting Walk-Around** (Harry Potter style)
**Behavior**: Walks off-screen on one side, reappears on the other side

**Animation Details**:
- Duration: 8-10 seconds (triggered, not looping)
- Key poses:
  - Frame 0: Default position (center)
  - Frame 20: Start walking right
  - Frame 60: Exit screen right (fade/disappear)
  - Frame 80: Teleport to left side (hidden)
  - Frame 100: Walk in from left
  - Frame 140: Return to center
  - Frame 160: Stop, return to idle

## 📐 Blender Implementation Guide

### Prerequisites
- Blender 3.0+ installed
- Carl.glb imported into Blender
- Basic rigging knowledge (or use auto-rig)

### Step 1: Import Carl

```
File → Import → glTF 2.0 (.glb)
- Select: Carl.glb
- Import settings: ✓ Include animations
```

### Step 2: Setup Armature (if needed)

**Option A: Manual Rigging**
```
1. Add Armature (Shift+A → Armature)
2. Position bones:
   - Root (pelvis)
   - Spine (3-4 bones)
   - Head, Neck
   - Arms (shoulder, elbow, wrist)
   - Legs (hip, knee, ankle)
3. Parent mesh to armature (Ctrl+P → Automatic Weights)
```

**Option B: Auto-Rigify**
```
1. Add-ons → Enable "Rigify"
2. Add → Armature → Basic → Basic Human
3. Align rig to Carl's proportions
4. Generate rig
5. Parent Carl mesh to rig
```

### Step 3: Create "Curious Look-Around" Animation

```python
# In Blender, switch to Animation workspace

1. Select armature
2. Timeline: Set to frame 0
3. Dope Sheet → Action Editor → New Action
4. Name: "CuriousLookAround"

# Keyframe sequence:
Frame 0:   Default pose (I → LocRotScale)
Frame 30:
  - Body: Lean forward (Z-axis +0.5 units)
  - Spine: Slight forward bend (X-rotation +10°)
  - Head: Face camera directly
  - Eyes: Look ahead (if separate)

Frame 50:
  - Head: Rotate left (Z-rotation -20°)
  - Head: Tilt (X-rotation +5°)
  - Eyes: Follow head direction

Frame 70:
  - Head: Rotate right (Z-rotation +20°)
  - Head: Tilt (X-rotation -5°)

Frame 90:
  - Head: Look down (X-rotation +30°)
  - Body: Slight lean forward

Frame 110:
  - Head: Look up at camera (X-rotation -10°)
  - Eyes: Wide/interested expression

Frame 120:
  - Return to frame 0 pose (smooth transition)

# Set interpolation to Bezier for smooth motion
# Graph Editor → Key → Interpolation Mode → Bezier
```

### Step 4: Create "Quantum Stargazer" Animation

```python
# Action Editor → New Action
# Name: "QuantumStargazer"

Frame 0:   Default pose

Frame 40:
  - Head: Begin tilt back (X-rotation -30°)
  - Neck: Extend (Y-axis +0.2)
  - Arms: Relax at sides

Frame 80:
  - Head: Full tilt back (X-rotation -60°)
  - Spine: Perfectly straight (0° all axes)
  - Arms: Completely loose, hands open
  - Fingers: Slightly spread (relaxed)

Frame 100:
  - Head: Gentle sway left (Z-rotation -5°)
  - Maintain upward gaze

Frame 120:
  - Head: Gentle sway right (Z-rotation +5°)

Frame 140:
  - Return to frame 0 (slow transition)

# Make sway subtle and contemplative
# Graph Editor → Add noise modifier for slight breathing
```

### Step 5: Create "Painting Walk-Around" Animation

```python
# Action Editor → New Action
# Name: "PaintingWalk"

Frame 0:   Default position (X=0, center screen)

Frame 20:
  - Root: Start walk cycle
  - Legs: Walking animation
  - Arms: Natural swing

Frame 40:
  - Root: Moving right (X=+2)
  - Body: Walking posture

Frame 60:
  - Root: Exit screen (X=+4)
  - Optional: Scale down slightly (distance effect)

# KEY MOMENT: Teleport/transition
Frame 80:
  - Root: Jump to left side (X=-4)
  - Scale: Maintain or slightly smaller

Frame 100:
  - Root: Walking in from left (X=-2)
  - Continue walk cycle

Frame 140:
  - Root: Return to center (X=0)
  - Slow down walk

Frame 160:
  - Stop walking
  - Transition to idle pose

# Add Camera-aware rotation:
# - When walking right: slight Y-rotation right
# - When walking left: slight Y-rotation left
```

### Step 6: Add Facial Expressions (if Carl has face bones)

**For "Curious Look-Around"**:
```
- Eyes: Wide and tracking
- Eyebrows: Raised (curious)
- Mouth: Slight smile or neutral
```

**For "Quantum Stargazer"**:
```
- Eyes: Soft gaze or closed
- Eyebrows: Relaxed
- Mouth: Gentle smile (wonder)
```

**For "Painting Walk"**:
```
- Eyes: Purposeful direction
- Expression: Neutral walk
```

### Step 7: Animation Settings

```
Animation Properties Panel:
- Frame Rate: 30 FPS
- Loop: ✓ (for Curious and Stargazer)
- Loop: ✗ (for Painting Walk - triggered only)

Action Editor:
- Extrapolation: Cyclic (for looping animations)
- Blend Mode: Replace
```

### Step 8: Export for Felix

```
File → Export → glTF 2.0 (.glb)

Export Settings:
✓ Include:
  - Selected Objects
  - Animations
  - Custom Properties

✓ Animation:
  - Animation Mode: Actions
  - ✓ Always Sample Animations
  - ✓ Export All Actions
  - Group by NLA Track: ✗

✓ Transform:
  - +Y Up

✓ Geometry:
  - ✓ Apply Modifiers
  - ✓ UVs
  - ✓ Normals

Save as: Carl.glb
```

### Step 9: Name Animations for Auto-Detection

**Important**: Name your actions in Blender to trigger auto-mapping:

```
Good names (auto-detected):
- "CuriousLookAround"  → Maps to 'active' state
- "Idle_Curious"       → Maps to 'idle' state
- "QuantumStargazer"   → Maps to 'idle' or 'thinking'
- "PaintingWalk"       → Special trigger animation

Alternative naming:
- "Idle" or "Wait"     → idle state
- "Active" or "Talk"   → active state
- "Thinking"           → thinking state
```

## 🎨 Enhanced Animation Triggers

### JavaScript Implementation (felix-bot.html)

Once animations are in Carl.glb, they'll auto-play based on states!

**Additional Trigger for "Painting Walk"**:
```javascript
// Add to felix-bot.html

// Trigger walk animation randomly or on event
function triggerPaintingWalk() {
    if (felix.userData.animations.painting ||
        felix.userData.animations.walk) {

        const walkAnim = felix.userData.animations.painting ||
                        felix.userData.animations.walk;

        walkAnim.reset();
        walkAnim.setLoop(THREE.LoopOnce);
        walkAnim.clampWhenFinished = true;
        walkAnim.play();

        console.log('[Felix] Walking off like a painting!');
    }
}

// Trigger randomly every 2-5 minutes
setInterval(() => {
    if (Math.random() < 0.3 && animationState === 'idle') {
        triggerPaintingWalk();
    }
}, 180000); // 3 minutes
```

## 🎯 Quick Blender Workflow

### Total Time: ~2-3 hours for all 3 animations

1. **Import Carl** (5 min)
2. **Setup rig** (30-45 min if manual, 15 min if auto-rig)
3. **Curious animation** (30-40 min)
4. **Stargazer animation** (20-30 min)
5. **Painting walk** (40-50 min)
6. **Polish & test** (15-20 min)
7. **Export** (5 min)

## 🚀 Testing Checklist

After exporting new Carl.glb:

1. ✅ Replace Carl.glb file
2. ✅ Refresh browser (Cmd+Shift+R / Ctrl+Shift+R)
3. ✅ Open console (F12)
4. ✅ Look for: `[Felix] Found X animations in model`
5. ✅ Verify animation mapping:
   ```
   [Felix] ✓ Mapped "CuriousLookAround" to ACTIVE state
   [Felix] ✓ Mapped "QuantumStargazer" to IDLE state
   ```
6. ✅ Test states:
   - Idle → Should stargazer
   - Click → Should look around curiously
   - Chat → Appropriate animation

## 📚 Resources

**Blender Tutorials**:
- Official Blender Animation: https://www.blender.org/support/tutorials/
- Character Animation Basics: YouTube "Blender character animation tutorial"

**Rigging Tools**:
- Rigify: Built-in auto-rigging
- Auto-Rig Pro: Paid addon ($99) - fastest results
- Mixamo: Free auto-rigging online (limited to humanoid)

**Animation References**:
- Harry Potter paintings: Watch for walk-off behavior
- Curious behavior: Pet videos, robot animations
- Stargazing: Contemplative human poses

## 💡 Pro Tips

1. **Use Graph Editor**: Smooth curves make animations natural
2. **Add Noise**: Subtle noise modifier = breathing/aliveness
3. **Ease In/Out**: Use Bezier handles for smooth starts/stops
4. **Reference Video**: Record yourself for natural motion
5. **Test Early**: Export partial animations to test in Felix
6. **Layer Animations**: Use NLA editor for complex sequences
7. **Save Incrementally**: Save multiple versions as you work

---

**Ready to bring Carl to life!** 🎬✨

These animations will make Felix feel truly alive - curious, contemplative, and playful!
