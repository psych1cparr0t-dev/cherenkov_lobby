#!/usr/bin/env bash

set -e

DIR="/Volumes/lacie_2tb/cherenkov_homepage/references/liminal_veil"
MOSAIC_DIR="$DIR/mosaic"
ORIG_DIR="$MOSAIC_DIR/originals"

# Ensure directories exist
mkdir -p "$ORIG_DIR"

# 1080p, 8 seconds, VP9, 2M bitrate (High fidelity but small file size)
OPTS="-y -t 8 -c:v libvpx-vp9 -b:v 2M -crf 30 -an -vf scale=-1:1080 -cpu-used 4"

function remaster() {
    local src_file="$1"
    local dest_name="$2"
    local full_src="$MOSAIC_DIR/$src_file"
    local full_dest="$MOSAIC_DIR/$dest_name"
    
    echo "----------------------------------------------------"
    echo "Remastering: $src_file -> $dest_name"
    ffmpeg -i "$full_src" $OPTS "$full_dest" < /dev/null
    
    # Move original to backup if it wasn't already in originals
    if [[ "$src_file" != originals/* ]]; then
        mv "$full_src" "$ORIG_DIR/"
    fi
}

# 1. Antarctica
remaster "National_Geographic_Endurance_and_Northern_Ross_Sea,_Antarctica.webm" "scene_antarctica.webm"

# 2. Cable Car
remaster "Wellington_Cable_Car_2020-05-17.webm" "scene_cable_car.webm"

# 3. Hong Kong Cityscape (Take 8s starting from 10s for better motion)
echo "Remastering: Hong Kong Cityscape (with offset)..."
ffmpeg -ss 10 -i "$MOSAIC_DIR/Hong_Kong_Island_Night_Cityscape_2020.webm" $OPTS "$MOSAIC_DIR/scene_hong_kong_night.webm" < /dev/null
mv "$MOSAIC_DIR/Hong_Kong_Island_Night_Cityscape_2020.webm" "$ORIG_DIR/"

# 4. Landwasservidukt
remaster "Landwasserviadukt,_aerial_video.webm" "scene_landwasserviadukt.webm"

# 5. Village Life
remaster "Cinematic_village_life_in_Talesh.webm" "scene_village_life.webm"

# 6. Semaphore Tower
remaster "Bird's_eye_of_Semaphore_tower_at_Chhatna_at_Bankura_district_in_West_Bengal_04.webm" "scene_semaphore_tower.webm"

# 7. Hong Kong Old
remaster "hong_kong.webm" "scene_hong_kong_day.webm"

echo "----------------------------------------------------"
echo "All scenes remastered to 1080p 8s clips in $MOSAIC_DIR"
echo "Originals backed up to $ORIG_DIR"
