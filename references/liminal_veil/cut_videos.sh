#!/usr/bin/env bash

cd /Volumes/lacie_2tb/cherenkov_homepage/references/liminal_veil

# 1. Colosseum
ffmpeg -y -i cinematic/colosseum_aerial.webm -t 9.5 -c:v libvpx-vp9 -b:v 1M -crf 30 -an first_draft/colosseum_aerial_10s.webm < /dev/null

# 2. Robot Research
ffmpeg -y -i cinematic/robot_research.ogv -t 9.5 -c:v libvpx-vp9 -b:v 1M -crf 30 -an first_draft/robot_research_10s.webm < /dev/null

# 3. Floating Market
ffmpeg -y -i cinematic/floating_market.ogv -t 9.5 -c:v libvpx-vp9 -b:v 1M -crf 30 -an first_draft/floating_market_10s.webm < /dev/null

# 4. Starling Swarm
ffmpeg -y -i nature/starling_swarm_marloffstein.webm -t 9.5 -c:v libvpx-vp9 -b:v 1M -crf 30 -an first_draft/starling_swarm_10s.webm < /dev/null

# 5. Scene 4 Flow
ffmpeg -y -i flow_video/scene_4.mp4 -t 9.5 -c:v libvpx-vp9 -b:v 1M -crf 30 -an first_draft/scene_4_10s.webm < /dev/null
