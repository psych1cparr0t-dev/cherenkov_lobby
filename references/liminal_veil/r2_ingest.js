/**
 * Cherenkov Mosaic — High-Fidelity R2 Ingestion (V3)
 * 
 * Fixes PATH issues for NPX/WRANGLER and uses a more resilient User-Agent.
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const BUCKET_NAME = "cherenkovmosaic";
const MANIFEST_PATH = path.join(__dirname, 'mosaic_manifest.json');

// Absolute Paths
const FFMPEG_PATH = "/opt/homebrew/bin/ffmpeg";
const NPX_PATH = "/usr/local/bin/npx";

// Inject node's location into sub-shell PATH so npx/wrangler can find it
const ENV = { 
    ...process.env, 
    PATH: `/usr/local/bin:/opt/homebrew/bin:${process.env.PATH}` 
};

// High Fidelity Options (4K / 12M / CRF 15)
const BASE_OPTS = `-y -c:v libvpx-vp9 -b:v 12M -crf 15 -an -vf "scale=-1:2160" -cpu-used 4`;

// Standard Browser User-Agent to satisfy Wikimedia
const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runResilientIngestion() {
    if (!fs.existsSync(MANIFEST_PATH)) {
        console.error("❌ Error: mosaic_manifest.json not found.");
        process.exit(1);
    }

    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    console.log(`\n💎 Mode: 4K Ultra-Fidelity (V3)`);
    console.log(`🚀 Destination: R2 Bucket "${BUCKET_NAME}"`);
    console.log(`----------------------------------------------------------`);

    for (const group of manifest) {
        const segments = group.segments || [];
        const groupSource = group.source_url;

        console.log(`\n🎬 Group: ${group.scene_group}`);
        
        for (const segment of segments) {
            const source = segment.source_url || groupSource;
            const r2Path = segment.r2_key;
            
            process.stdout.write(`  💠 Remastering ${segment.id}... `);

            try {
                // Command uses piping to stream 4K results directly to R2
                const cmd = `${FFMPEG_PATH} -user_agent "${USER_AGENT}" -ss ${segment.ss} -i "${source}" -t ${segment.t} ${BASE_OPTS} -f webm - | ${NPX_PATH} wrangler r2 object put "${BUCKET_NAME}/${r2Path}" --pipe`;
                
                execSync(cmd, { stdio: 'pipe', env: ENV });
                console.log(`[UPLOADED]`);
                
                // Significant sleep to respect Wikimedia (important for 429 avoidance)
                await sleep(5000); 

            } catch (err) {
                console.log(`[RETRYING]`);
                if (err.message.includes('429')) {
                    console.log(`     ⚠️ Rate limited (429). Waiting 30s...`);
                    await sleep(30000);
                } else {
                    console.error(`     Error: ${err.message}`);
                }
            }
        }
    }
}

runResilientIngestion();
