import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'copa2026admin';

const WIN_DIR = path.join(process.cwd(), 'public', 'win');
const OUTPUT = path.join(WIN_DIR, 'audios.json');
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.webm'];

// POST - Regenerate the audio manifest by scanning public/win/ directory
// This allows adding new audio files without redeploying
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const password = searchParams.get('password');

    if (!password || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Acesso negado. Senha inválida.' }, { status: 401 });
    }

    if (!fs.existsSync(WIN_DIR)) {
      fs.mkdirSync(WIN_DIR, { recursive: true });
    }

    const files = fs.readdirSync(WIN_DIR)
      .filter((f: string) => {
        const ext = path.extname(f).toLowerCase();
        return AUDIO_EXTENSIONS.includes(ext);
      })
      .map((f: string) => path.basename(f, path.extname(f)))
      .sort();

    const manifest = JSON.stringify(files, null, 2) + '\n';
    fs.writeFileSync(OUTPUT, manifest);

    console.log(`[audio-manifest] Regenerated with ${files.length} audio(s): ${files.join(', ')}`);

    return NextResponse.json({
      success: true,
      message: `Manifesto de áudio regenerado! ${files.length} arquivo(s) encontrado(s).`,
      files,
    });
  } catch (error: any) {
    console.error('Regenerate audio manifest error:', error);
    return NextResponse.json({ error: 'Failed to regenerate audio manifest', detail: error.message }, { status: 500 });
  }
}

// GET - Preview what would be in the manifest without regenerating
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const password = searchParams.get('password');

    if (!password || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Acesso negado. Senha inválida.' }, { status: 401 });
    }

    if (!fs.existsSync(WIN_DIR)) {
      return NextResponse.json({ files: [], message: 'Diretório public/win/ não existe.' });
    }

    const currentManifest = fs.existsSync(OUTPUT) ? JSON.parse(fs.readFileSync(OUTPUT, 'utf-8')) : [];
    const filesOnDisk = fs.readdirSync(WIN_DIR)
      .filter((f: string) => {
        const ext = path.extname(f).toLowerCase();
        return AUDIO_EXTENSIONS.includes(ext);
      })
      .map((f: string) => path.basename(f, path.extname(f)))
      .sort();

    const newFiles = filesOnDisk.filter((f: string) => !currentManifest.includes(f));
    const removedFiles = currentManifest.filter((f: string) => !filesOnDisk.includes(f));

    return NextResponse.json({
      currentManifest,
      filesOnDisk,
      newFiles,
      removedFiles,
      needsUpdate: newFiles.length > 0 || removedFiles.length > 0,
    });
  } catch (error: any) {
    console.error('Preview audio manifest error:', error);
    return NextResponse.json({ error: 'Failed to preview audio manifest', detail: error.message }, { status: 500 });
    }
}
