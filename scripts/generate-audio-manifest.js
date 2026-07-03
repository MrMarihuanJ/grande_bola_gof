#!/usr/bin/env node
/**
 * generate-audio-manifest.js
 * Scans public/win/ for audio files (.mp3, .wav, .ogg, .m4a) and generates public/win/audios.json
 * Run as part of the build process or manually with: node scripts/generate-audio-manifest.js
 * 
 * IMPORTANT: After adding new audio files to public/win/, you MUST either:
 * 1. Run this script and redeploy, OR
 * 2. Call the /api/admin/regenerate-audio-manifest API endpoint (admin only)
 */

const fs = require('fs');
const path = require('path');

const WIN_DIR = path.join(__dirname, '..', 'public', 'win');
const OUTPUT = path.join(WIN_DIR, 'audios.json');

// Supported audio extensions
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.webm'];

function generate() {
  if (!fs.existsSync(WIN_DIR)) {
    fs.mkdirSync(WIN_DIR, { recursive: true });
    console.log(`[audio-manifest] Created directory: ${WIN_DIR}`);
  }

  const files = fs.readdirSync(WIN_DIR)
    .filter(f => {
      const ext = path.extname(f).toLowerCase();
      return AUDIO_EXTENSIONS.includes(ext);
    })
    .map(f => path.basename(f, path.extname(f)))
    .sort();

  const manifest = JSON.stringify(files, null, 2) + '\n';
  fs.writeFileSync(OUTPUT, manifest);
  console.log(`[audio-manifest] Generated with ${files.length} audio(s): ${files.join(', ')}`);
  console.log(`[audio-manifest] Output: ${OUTPUT}`);
  console.log(`[audio-manifest] Supported extensions: ${AUDIO_EXTENSIONS.join(', ')}`);
  
  return files;
}

// Also export for programmatic use
if (require.main === module) {
  generate();
}

module.exports = { generate, WIN_DIR, OUTPUT };
