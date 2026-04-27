# Project Memory Session Log — 2026-04-20

## Session Context
- **Objective:** Revert recent mosaic expansion and establish a persistent memory log for project tracking.
- **Project State:** High-fidelity "Liminal Veil" mosaic is active with native video crossfading. A dual-model AI concierge (Llama 3.2 3B / Llama 3.3 70B) is implemented for interactions.

## Keywords
- **Liminal Aesthetic:** The core design theme (brutalism, neo-futurism, atmospheric).
- **Native Video Mosaic:** Seamless WebM crossfading using a dual-video-buffer strategy (`vidA`, `vidB`).
- **Concierge API:** Routing between fast chat (3B) and tool execution (70B).
- **Vercel Deployment:** The production-ready codebase in `/vercel_deployment`.

## Actionable Improvements (Current Session)
1. **[COMPLETED] Mosaic Queue Reversion:** Reduced video count from 21 back to the 12 "validated" clips.
2. **[COMPLETED] Memory Persistence:** Established this log to bridge the gap between sessions.
3. **[IDEATION] SEO Optimization:** Enhance meta-descriptions and title tags for the Vercel deployment.
4. **[IDEATION] Performance Guardrails:** Further refine the `canplay` timeout logic in `veil_mosaic.js` to handle slow network states gracefully.

## Completed Actions
- Initialized session memory log.
- Identified target clips for removal based on `SCENES` count/comment discrepancy (21 vs 12).
- Reverted `vercel_deployment/scripts/veil_mosaic.js` to the 12 validated clips (Phase 1).
- Commented out new clips in `references/liminal_veil/remaster_mosaic.sh` to prevent accidental regeneration.
- Created `mosaic_manifest.json` for centralized video asset management.
- Developed `r2_ingest.js` for "smooth" transfer of assets to the `cherenkovmosaic` R2 bucket.
- Implemented dynamic manifest loading in `veil_mosaic.js` to support local and R2-hosted video paths.
- Initiated full unattended ingestion of all 21 segments in **4K Ultra-Fidelity** mode (12Mbps / CRF 15).
- Cached `mosaic_manifest.json` in `vercel_deployment/assets/` for production use.
