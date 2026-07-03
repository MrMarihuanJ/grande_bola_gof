#!/usr/bin/env node
/**
 * generate-audio-manifest.js
 * Scans public/win/ for .mp3 files and generates public/win/audios.json
 * Run as part of the build process or manually with: node scripts/generate-audio-manifest.js
 */

const fs = require('fs');
const path = require('path');

const WIN_DIR = path.join(__dirname, '..', 'public', 'win');
const OUTPUT = path.join(WIN_DIR, 'audios.json');

function generate() {
  if (!fs.existsSync(WIN_DIR)) {
    fs.mkdirSync(WIN_DIR, { recursive: true });
  }

  const files = fs.readdirSync(WIN_DIR)
    .filter(f => f.endsWith('.mp3'))
    .map(f => f.replace(/\.mp3$/, ''))
    .sort();

  fs.writeFileSync(OUTPUT, JSON.stringify(files, null, 2) + '\n');
  console.log(`[audio-manifest] Generated with ${files.length} audio(s): ${files.join(', ')}`);
}

generate();
