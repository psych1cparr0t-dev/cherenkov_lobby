#!/usr/bin/env bash
set -e

ORIG_DIR="/Volumes/lacie_2tb/cherenkov_homepage/references/liminal_veil/mosaic/originals"
mkdir -p "$ORIG_DIR"

# Pair format: filename url
clips=(
    "nyc_timelapse.ogv https://upload.wikimedia.org/wikipedia/commons/9/9a/Time_Lapse_of_New_York_City.ogv"
    "mumbai_timelapse.webm https://upload.wikimedia.org/wikipedia/commons/5/5b/Timelapse_at_Marine_Drive_Mumbai.webm"
    "snowy_landscape.webm https://upload.wikimedia.org/wikipedia/commons/0/05/Aerial_view_of_snowy_landscape.webm"
    "bhopal_night.webm https://upload.wikimedia.org/wikipedia/commons/4/45/Night_landscape_of_Bhopal_city.webm"
    "mountain_fog_1.webm https://upload.wikimedia.org/wikipedia/commons/0/06/Fog_covering_mountain_time_lapse.webm"
    "mountain_fog_2.ogv https://upload.wikimedia.org/wikipedia/commons/4/4d/Talkeetna_Mountain_fog_time_lapse.ogv"
    "ocean_waves.ogv https://upload.wikimedia.org/wikipedia/commons/0/08/Ocean_surface_waves_06.ogv"
    "train_station.webm https://upload.wikimedia.org/wikipedia/commons/6/6a/Train_passing_liminka_station.webm"
    "lightning_storm.ogg https://upload.wikimedia.org/wikipedia/commons/6/66/Lightning_storm_over_Colorado%2C_USA.ogg"
    "milky_way_timelapse.webm https://upload.wikimedia.org/wikipedia/commons/7/77/A_timelapse_of_the_Milky_Way%27s_movement_against_the_backdrop_of_the_Assy-Turgen_Observatory_at_an_altitude_of_2%2C750_m._Kazakhstan.webm"
)

for pair in "${clips[@]}"; do
    file=$(echo "$pair" | cut -d' ' -f1)
    url=$(echo "$pair" | cut -d' ' -f2)
    if [ ! -f "$ORIG_DIR/$file" ]; then
        echo "Downloading $file..."
        curl -L -o "$ORIG_DIR/$file" "$url"
    else
        echo "$file already exists, skipping."
    fi
done

echo "All downloads complete."
