#!/usr/bin/env bash

set -e

DIR="/Volumes/lacie_2tb/cherenkov_homepage/references/liminal_veil"
MOSAIC_DIR="$DIR/mosaic"
ORIG_DIR="$MOSAIC_DIR/originals"

# Ensure directories exist
mkdir -p "$ORIG_DIR"

# 1080p, 10 seconds (per user request), VP9, 2M bitrate (High fidelity, small size)
OPTS="-y -t 10 -c:v libvpx-vp9 -b:v 2M -crf 30 -an -vf scale=-1:1080 -cpu-used 4"

function extract_clip() {
    local src_file="$1"
    local start_time="$2"
    local dest_name="$3"
    local full_src="$ORIG_DIR/$src_file"
    local full_dest="$MOSAIC_DIR/$dest_name"
    
    echo "----------------------------------------------------"
    echo "Extracting: $src_file @ $start_time -> $dest_name"
    ffmpeg -ss "$start_time" -i "$full_src" $OPTS "$full_dest" < /dev/null
}

# Ensure all originals are in the originals folder
mv "$MOSAIC_DIR"/*.webm "$ORIG_DIR/" 2>/dev/null || true

# 1. Antarctica (Glacial floes, Ship's bow, Vast horizon)
extract_clip "National_Geographic_Endurance_and_Northern_Ross_Sea,_Antarctica.webm" "00:00:10" "scene_antarctica_1.webm"
extract_clip "National_Geographic_Endurance_and_Northern_Ross_Sea,_Antarctica.webm" "00:00:40" "scene_antarctica_2.webm"
extract_clip "National_Geographic_Endurance_and_Northern_Ross_Sea,_Antarctica.webm" "00:01:20" "scene_antarctica_3.webm"

# 2. Wellington Cable Car (Greenery ascent, City reveal)
extract_clip "Wellington_Cable_Car_2020-05-17.webm" "00:00:15" "scene_cable_car_1.webm"
extract_clip "Wellington_Cable_Car_2020-05-17.webm" "00:00:50" "scene_cable_car_2.webm"

# 3. Hong Kong (Night Harbor, Dense Skyline, Harbor Lights)
extract_clip "Hong_Kong_Island_Night_Cityscape_2020.webm" "00:00:20" "scene_hong_kong_night_1.webm"
extract_clip "Hong_Kong_Island_Night_Cityscape_2020.webm" "00:01:00" "scene_hong_kong_night_2.webm"
extract_clip "Hong_Kong_Island_Night_Cityscape_2020.webm" "00:01:40" "scene_hong_kong_night_3.webm"

# 4. Landwasserviadukt (Train crossing, Mountain pan)
extract_clip "Landwasserviadukt,_aerial_video.webm" "00:00:10" "scene_landwasserviadukt_1.webm"
extract_clip "Landwasserviadukt,_aerial_video.webm" "00:00:45" "scene_landwasserviadukt_2.webm"

# 5. Cinematic Village Life (Atmosphere, Street Architecture)
extract_clip "Cinematic_village_life_in_Talesh.webm" "00:00:30" "scene_village_life_1.webm"
extract_clip "Cinematic_village_life_in_Talesh.webm" "00:02:00" "scene_village_life_2.webm"

# 6. Semaphore Tower (Historic structure, Aerial landscape)
extract_clip "Bird's_eye_of_Semaphore_tower_at_Chhatna_at_Bankura_district_in_West_Bengal_04.webm" "00:00:05" "scene_semaphore_tower_1.webm"
extract_clip "Bird's_eye_of_Semaphore_tower_at_Chhatna_at_Bankura_district_in_West_Bengal_04.webm" "00:00:35" "scene_semaphore_tower_2.webm"

echo "----------------------------------------------------"
echo "14 scenes extracted to 1080p 10s clips in $MOSAIC_DIR"
