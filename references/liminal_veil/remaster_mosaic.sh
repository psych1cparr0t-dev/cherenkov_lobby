#!/usr/bin/env bash
set -e

DIR="/Volumes/lacie_2tb/cherenkov_homepage/references/liminal_veil"
MOSAIC_DIR="$DIR/mosaic"
ORIG_DIR="$MOSAIC_DIR/originals"

# Remove broken/old scene files
rm -f "$MOSAIC_DIR"/scene_*.webm

# 1080p, VP9, 2M bitrate, no audio
BASE_OPTS="-y -c:v libvpx-vp9 -b:v 2M -crf 30 -an -vf scale=-1:1080 -cpu-used 4"

function clip() {
    local src="$1" ss="$2" dur="$3" dest="$4"
    echo "==== $dest (from $(basename "$src") @ ${ss}s for ${dur}s) ===="
    ffmpeg -ss "$ss" -i "$ORIG_DIR/$src" -t "$dur" $BASE_OPTS "$MOSAIC_DIR/$dest" < /dev/null
}

# --- Antarctica (188s source) — 3 clips ---
clip "National_Geographic_Endurance_and_Northern_Ross_Sea,_Antarctica.webm" 10 10 "scene_antarctica_1.webm"
clip "National_Geographic_Endurance_and_Northern_Ross_Sea,_Antarctica.webm" 50 10 "scene_antarctica_2.webm"
clip "National_Geographic_Endurance_and_Northern_Ross_Sea,_Antarctica.webm" 100 10 "scene_antarctica_3.webm"

# --- Cable Car (29s source) — 1 clip only (safe window: 0-19s) ---
clip "Wellington_Cable_Car_2020-05-17.webm" 5 10 "scene_cable_car.webm"

# --- Hong Kong Night (51s source) — 3 clips (safe window: 0-41s) ---
clip "Hong_Kong_Island_Night_Cityscape_2020.webm" 5 10 "scene_hong_kong_night_1.webm"
clip "Hong_Kong_Island_Night_Cityscape_2020.webm" 20 10 "scene_hong_kong_night_2.webm"
clip "Hong_Kong_Island_Night_Cityscape_2020.webm" 35 10 "scene_hong_kong_night_3.webm"

# --- Landwasserviadukt (169s source) — 2 clips, LONGER second clip so train exits ---
clip "Landwasserviadukt,_aerial_video.webm" 10 10 "scene_landwasserviadukt_1.webm"
# Start earlier so the train enters AND exits the viaduct
clip "Landwasserviadukt,_aerial_video.webm" 30 15 "scene_landwasserviadukt_2.webm"

# --- Village Life (117s source) — 2 clips (safe window: 0-107s) ---
clip "Cinematic_village_life_in_Talesh.webm" 15 10 "scene_village_life_1.webm"
clip "Cinematic_village_life_in_Talesh.webm" 60 10 "scene_village_life_2.webm"

# --- Semaphore Tower (8.3s source) — use full duration, not 10s ---
echo "==== scene_semaphore_tower.webm (full 8s source) ===="
ffmpeg -i "$ORIG_DIR/Bird's_eye_of_Semaphore_tower_at_Chhatna_at_Bankura_district_in_West_Bengal_04.webm" \
  $BASE_OPTS "$MOSAIC_DIR/scene_semaphore_tower.webm" < /dev/null

# --- New Clips (Wikimedia Sourced) ---
# clip "nyc_timelapse.ogv" 10 10 "scene_nyc_1.webm"
# clip "mumbai_timelapse.webm" 5 10 "scene_mumbai_1.webm"
# clip "snowy_landscape.webm" 5 10 "scene_snowy_1.webm"
# clip "bhopal_night.webm" 3 10 "scene_bhopal_1.webm"
# clip "mountain_fog_1.webm" 10 10 "scene_mountain_fog_1.webm"
# clip "mountain_fog_2.ogv" 0 6 "scene_mountain_fog_2.webm"
# clip "ocean_waves.ogv" 0 6 "scene_ocean_waves_1.webm"
# clip "train_station.webm" 5 10 "scene_train_station_1.webm"
# clip "lightning_storm.ogg" 5 10 "scene_lightning_1.webm"
echo "==== Done. All clips validated against source durations. ===="
