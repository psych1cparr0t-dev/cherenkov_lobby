---
description: full git deployment workflow — compress media, stage, commit, push
---

# Git Deploy Workflow

> This workflow is owned by the **git agent**. The main vibedev chat does NOT handle git operations — it only builds. When the user says "deploy", "push", "ship it", or "send to git", hand off to this workflow.

> ⚠️ **COORDINATION RULE**: Antigravity (the code agent) and the git agent both push to `vercel_deployment`. The git agent MUST always pull the latest `origin/main` from the submodule before running filter-repo. Failing to do this overwrites code changes made by Antigravity between deploys. **Never skip Step 0.**

// turbo-all

## 💡 Compression Quick Reference (always apply before upload)

| Source format | Target | Codec | Scale cap | CRF | Audio |
|---------------|--------|-------|-----------|-----|-------|
| `.webm` (any res) | `.webm` | libvpx-vp9 | 1280×720 | 35 | libopus 64k |
| `.mp4` / `.mov` | `.mp4` | libx264 | 1280×720 | 28 | aac 64k |
| `.ogv` | `.webm` (convert) | libvpx-vp9 | 1280×720 | 35 | libopus 64k |
| 4K source (>500MB) | `.webm` | libvpx-vp9 | 1280×720 | **38** | libopus 64k |
| `.wav` / `.aiff` | `.opus` | libopus | — | — | 96k |

**Target**: output must be **< 50 MB**. If over, raise CRF by 5 and re-encode.
**Naming**: always swap original to `*_original.ext` — never delete the source.

See full instructions: `.agent/workflows/compress_before_commit.md`

---

## Step 0 — Sync vercel_deployment to latest origin/main (MANDATORY)

Before touching anything else, pull the latest code from the `vercel_deployment` submodule remote. This preserves any code changes Antigravity pushed since the last deploy.

```bash
cd vercel_deployment
git fetch origin
git reset --hard origin/main
cd ..
```

Verify you have the latest commit:
```bash
git -C vercel_deployment log --oneline -3
```

---

## Pre-flight: Check for large media

Scan the working directory for uncompressed media files before touching git:

```bash
find . -not -path './.git/*' \( -name '*.mp4' -o -name '*.webm' -o -name '*.mov' -o -name '*.ogv' -o -name '*.mkv' -o -name '*.wav' -o -name '*.aiff' \) -size +5M -not -name '*_original*' | sort
```

If ANY file is **> 50 MB**, STOP and compress it first (see `compress_before_commit.md`).

## Step 1 — Compress all large media (mandatory, always run first)

For each file >5 MB found above, compress using the appropriate command:

**WebM / VP9:**
```bash
ffmpeg -y -i INPUT.webm \
  -vf "scale='min(1280,iw)':'min(720,ih)':force_original_aspect_ratio=decrease" \
  -c:v libvpx-vp9 -crf 35 -b:v 0 -deadline good -cpu-used 4 \
  -c:a libopus -b:a 64k \
  INPUT_compressed.webm
mv INPUT.webm INPUT_original.webm
mv INPUT_compressed.webm INPUT.webm
```

**MP4 / MOV → x264:**
```bash
ffmpeg -y -i INPUT.mp4 \
  -vf "scale='min(1280,iw)':'min(720,ih)':force_original_aspect_ratio=decrease" \
  -c:v libx264 -crf 28 -preset slow \
  -c:a aac -b:a 64k \
  INPUT_compressed.mp4
mv INPUT.mp4 INPUT_original.mp4
mv INPUT_compressed.mp4 INPUT.mp4
```

**OGV → WebM (convert format too):**
```bash
ffmpeg -y -i INPUT.ogv \
  -vf "scale='min(1280,iw)':'min(720,ih)':force_original_aspect_ratio=decrease" \
  -c:v libvpx-vp9 -crf 35 -b:v 0 -deadline good -cpu-used 4 \
  -c:a libopus -b:a 64k \
  INPUT.webm
mv INPUT.ogv INPUT_original.ogv
```

Verify each output: `ls -lh OUTPUT` — must be **< 50 MB**. If not, re-run with `-crf 40`.

## Step 2 — Verify .gitignore protects originals

```bash
cat .gitignore | grep original
```

Should show `*_original.*` patterns. If missing, add them.

## Step 3 — Purge media blobs from git history (mandatory, every deploy)

Run `git-filter-repo` on **both** the parent repo and any submodules to strip all media
blobs from history before pushing. This prevents old force-added files from bloating pushes.

> ⚠️ `git-filter-repo` rewrites history and removes the remote. After running it, you MUST re-add the remote AND verify the latest code commits are still present (Step 0 guarantees this if you ran it).

**Parent repo:**
```bash
/Library/Frameworks/Python.framework/Versions/3.13/bin/git-filter-repo --force \
  --path-glob '*.webm' --path-glob '*.mp4' --path-glob '*.ogv' \
  --path-glob '*.mov'  --path-glob '*.mkv' --path-glob '*.wav' \
  --path-glob '*.aiff' --path-glob '*/__pycache__/*' \
  --invert-paths
```

**Re-add remote after filter-repo (it always removes it as a safety measure):**
```bash
git remote add origin https://github.com/psych1cparr0t-dev/cherenkov_lobby.git
```

**Each submodule (e.g. vercel_deployment):**
```bash
cd vercel_deployment
/Library/Frameworks/Python.framework/Versions/3.13/bin/git-filter-repo --force \
  --path-glob '*.webm' --path-glob '*.mp4' --path-glob '*.ogv' \
  --path-glob '*.mov'  --path-glob '*.mkv' --path-glob '*.wav' \
  --path-glob '*.aiff' \
  --invert-paths
git remote add origin https://github.com/psych1cparr0t-dev/cherenkov_lobby.git
cd ..
```

> If `git-filter-repo` is not installed: `pip3 install git-filter-repo`

## Step 4 — Check git status

```bash
git status
```

Review what's staged/unstaged. Never `git add -A` blindly — add files explicitly.

## Step 5 — Stage files

Stage only the files relevant to the current changeset:

```bash
git add <specific files or dirs>
```

Never force-add (`-f`) video/media files — the .gitignore rules exist for good reason.

## Step 6 — Commit with a clear message

```bash
git commit -m "<verb>: <short description of what changed>"
```

Good message format examples:
- `add: compressed reference videos for liminal veil`
- `update: veil mosaic reveals on cherenkov event`
- `remove: robot_research and scene_4 from tracking`
- `fix: cursor effect removed from homepage`

## Step 7 — Push

Because filter-repo rewrites history, always use `--force`:

```bash
# Parent repo
git push --force --set-upstream origin main

# Each submodule
cd vercel_deployment
git push --force origin main
cd ..
```

If remote has diverged and you want to preserve both histories first:
```bash
git fetch origin
git merge origin/main --allow-unrelated-histories --no-edit -X ours
# then filter-repo again before pushing
```

## Step 8 — Confirm

```bash
git log --oneline -5
git status
```

Verify the push succeeded and working tree is clean.

---

## Rules the git agent always follows

| Rule | Why |
|------|-----|
| Run `filter-repo` before EVERY push | Purges any media blobs that crept into history — keeps pushes fast |
| Re-add remote after `filter-repo` | It always removes origin as a safety measure |
| Run `filter-repo` on ALL submodules too | Each submodule has its own object store |
| Compress ALL media before staging | GitHub 100MB hard limit, 50MB soft limit |
| Never `git add -A` | Avoid accidentally staging secrets, node_modules, _originals |
| Never `git add -f` on video/audio | .gitignore rules protect the repo intentionally |
| Keep `_original.*` files local only | Large uncompressed masters live on local disk / external drives |
| Use descriptive commit messages | Verb-first, lowercase, clear scope |
| Check git status before AND after every operation | No surprises |
