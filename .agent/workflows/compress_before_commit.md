---
description: compress video/audio files with ffmpeg before adding to git
---

# Compress Media Before Git Commit

**Rule**: ALL video and audio files MUST be compressed with ffmpeg before staging, committing, or pushing to any git repository. This applies to every project.

## Why

GitHub rejects files >100 MB and warns on files >50 MB. Large media bloats repo history permanently. Always compress to the smallest usable quality first.

## Target Specs

| Format | Codec | Resolution cap | CRF | Audio |
|--------|-------|---------------|-----|-------|
| `.webm` | libvpx-vp9 | 1280×720 (scale down only) | 35 | libopus 64k |
| `.mp4` / `.mov` | libx264 | 1280×720 (scale down only) | 28 | aac 64k |
| `.ogv` → `.webm` | libvpx-vp9 (convert) | 1280×720 | 35 | libopus 64k |
| `.wav` / `.aiff` | — | — | libopus 96k (→ .opus) | |

**Hard limit**: Output file must be **< 50 MB**. If it isn't, lower CRF (raise it by 5) and re-run.

## Step-by-step

### 1. Identify files to compress

Before any `git add`, scan for large media:

// turbo
1. Run the check command:
```bash
find . -not -path './.git/*' \( -name '*.mp4' -o -name '*.webm' -o -name '*.mov' -o -name '*.ogv' -o -name '*.mkv' -o -name '*.wav' -o -name '*.aiff' \) -size +5M | sort -k5 -rh
```

### 2. Compress each video file (webm)

```bash
ffmpeg -y -i INPUT.webm \
  -vf "scale='min(1280,iw)':'min(720,ih)':force_original_aspect_ratio=decrease" \
  -c:v libvpx-vp9 -crf 35 -b:v 0 -deadline good -cpu-used 4 \
  -c:a libopus -b:a 64k \
  OUTPUT_compressed.webm
```

Then swap: `mv INPUT.webm INPUT_original.webm && mv OUTPUT_compressed.webm INPUT.webm`

### 3. Compress each video file (mp4/mov)

```bash
ffmpeg -y -i INPUT.mp4 \
  -vf "scale='min(1280,iw)':'min(720,ih)':force_original_aspect_ratio=decrease" \
  -c:v libx264 -crf 28 -preset slow \
  -c:a aac -b:a 64k \
  OUTPUT_compressed.mp4
```

Then swap originals.

### 4. Convert .ogv → .webm

```bash
ffmpeg -y -i INPUT.ogv \
  -vf "scale='min(1280,iw)':'min(720,ih)':force_original_aspect_ratio=decrease" \
  -c:v libvpx-vp9 -crf 35 -b:v 0 -deadline good -cpu-used 4 \
  -c:a libopus -b:a 64k \
  OUTPUT.webm
```

### 5. Verify output size

```bash
ls -lh OUTPUT.webm
```

Must be **< 50 MB**. If larger, re-run with `-crf 40` (webm) or `-crf 33` (mp4).

### 6. Update .gitignore for originals

Add a line to `.gitignore` so original uncompressed files are never accidentally staged:

```
*_original.webm
*_original.mp4
*_original.mov
*_original.ogv
```

### 7. Stage and commit

```bash
git add <compressed files>
git commit -m "add compressed media assets"
git push
```

## Notes

- Keep `_original` files locally for re-editing — never commit them.
- `toxaway_falls.webm` (1 GB+) and similar huge files: consider keeping entirely out of git and hosting on cloud storage (e.g. Cloudflare R2, Backblaze B2) — link from the README instead.
- The `references/` directory is for local research assets and likely should be in `.gitignore` entirely if files are too large even after compression.
