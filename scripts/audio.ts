// Generates one spoken clip per word, voice, and speed using edge-tts (the same
// provider used in napkin-chats), then normalises each clip with ffmpeg to a small,
// consistent deploy file. Raw masters live in generated/audio-masters/ (gitignored);
// the normalised deploy files live in static/audio/ and are committed and served.
//
//   node scripts/audio.ts generate [--force] [--concurrency=6] [--limit=N]
//                                  [--voices=ava,sonia] [--words=weather,climate]
//   node scripts/audio.ts validate
//
// Requires `edge-tts` (pip) and `ffmpeg`/`ffprobe` on the PATH.

import { execFile } from 'node:child_process';
import { constants } from 'node:fs';
import { access, mkdir, rename, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import words, { STRESS_PATTERNS } from '../src/data/words.ts';
import { SPEEDS, VOICES } from '../src/data/voices.ts';

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mastersDir = path.join(root, 'generated/audio-masters');
const deployDir = path.join(root, 'static/audio');
const manifestPath = path.join(deployDir, 'manifest.json');

// ffmpeg normalisation preset: mono, 24 kHz, 48 kbps MP3, loudness-normalised so every
// voice and word plays back at a comparable level. We measure each clip's integrated
// loudness and true peak, then apply a single fixed gain toward TARGET_I, capped so the
// true peak never exceeds TARGET_TP. This is linear loudness normalisation done by hand
// rather than via loudnorm's built-in application: ffmpeg 4.4's loudnorm has a bug where,
// whenever the gain needed to reach the target loudness would push the true peak past the
// TP ceiling, it wildly *attenuates* the clip (single words with sharp plosives/sibilants
// landed ~17 dB too quiet). Measuring then applying `volume` sidesteps that entirely.
const TARGET_I = -18; // LUFS, integrated loudness target
const TARGET_TP = -2; // dBTP, true-peak ceiling
const FFMPEG_PRESET = `mono MP3, 24 kHz, 48 kbps, loudness-normalised to I=${TARGET_I} LUFS with a ${TARGET_TP} dBTP ceiling`;

interface Task {
  word: string;
  voiceId: string;
  providerVoiceId: string;
  speedId: string;
  rate: string;
  masterPath: string;
  deployPath: string;
  relativeUrl: string;
}

const exists = (file: string) =>
  access(file, constants.R_OK)
    .then(() => true)
    .catch(() => false);

function uniqueWords(): string[] {
  const set = new Set<string>();
  for (const pattern of STRESS_PATTERNS) for (const word of words[pattern]) set.add(word);
  return [...set].sort();
}

function argValue(flag: string): string | undefined {
  return process.argv.find((arg) => arg.startsWith(`${flag}=`))?.split('=')[1];
}

function buildTasks(): Task[] {
  const voiceFilter = argValue('--voices')?.split(',');
  const wordFilter = argValue('--words')?.split(',');
  const wordLimit = argValue('--limit');
  let wordSet = uniqueWords();
  if (wordFilter) wordSet = wordSet.filter((word) => wordFilter.includes(word));
  if (wordLimit) wordSet = wordSet.slice(0, Number(wordLimit));

  const tasks: Task[] = [];
  for (const voice of VOICES) {
    if (voiceFilter && !voiceFilter.includes(voice.id)) continue;
    for (const speed of SPEEDS) {
      for (const word of wordSet) {
        const fileName = `${word}${speed.suffix}.mp3`;
        tasks.push({
          word,
          voiceId: voice.id,
          providerVoiceId: voice.providerVoiceId,
          speedId: speed.id,
          rate: speed.rate,
          masterPath: path.join(mastersDir, voice.id, fileName),
          deployPath: path.join(deployDir, voice.id, fileName),
          relativeUrl: `audio/${voice.id}/${fileName}`,
        });
      }
    }
  }
  return tasks;
}

async function synthesiseMaster(task: Task): Promise<void> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await execFileAsync(
        'edge-tts',
        // edge-tts uses argparse: a value that starts with "-" (e.g. "-25%") must be
        // attached with "=", otherwise it is mistaken for another option.
        [
          `--voice=${task.providerVoiceId}`,
          `--rate=${task.rate}`,
          `--text=${task.word}`,
          `--write-media=${task.masterPath}`,
        ],
        { maxBuffer: 2_000_000 },
      );
      if ((await stat(task.masterPath)).size > 256) return;
      lastError = new Error('edge-tts produced an empty clip.');
    } catch (error) {
      lastError = error;
    }
    if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 700));
  }
  throw lastError;
}

// Measure a master's EBU R128 integrated loudness and true peak. loudnorm's first-pass
// *measurement* is reliable here (it is the built-in *application* that misbehaves — see
// FFMPEG_PRESET), and it reports both numbers we need in one JSON pass.
async function measureLoudness(file: string): Promise<{ inputI: number; inputTp: number }> {
  const { stderr } = await execFileAsync('ffmpeg', [
    '-hide_banner',
    '-i',
    file,
    '-af',
    'loudnorm=I=-18:LRA=7:TP=-2:print_format=json',
    '-f',
    'null',
    '-',
  ]);
  const match = /\{[^}]*"input_i"[^}]*\}/s.exec(stderr);
  const parsed = match ? (JSON.parse(match[0]) as Record<string, string>) : {};
  const inputI = Number.parseFloat(parsed.input_i ?? '');
  const inputTp = Number.parseFloat(parsed.input_tp ?? '');
  return { inputI, inputTp };
}

async function normaliseToDeploy(task: Task): Promise<void> {
  const { inputI, inputTp } = await measureLoudness(task.masterPath);
  // Gain toward the loudness target, capped so the true peak stays under the ceiling.
  // If a measurement came back non-finite (e.g. near-silent clip), fall back to no gain.
  const gain =
    Number.isFinite(inputI) && Number.isFinite(inputTp)
      ? Math.min(TARGET_I - inputI, TARGET_TP - inputTp)
      : 0;

  const temporary = `${task.deployPath}.tmp`;
  await execFileAsync('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-i',
    task.masterPath,
    '-map_metadata',
    '-1',
    '-ac',
    '1',
    '-ar',
    '24000',
    '-codec:a',
    'libmp3lame',
    '-b:a',
    '48k',
    '-af',
    `volume=${gain.toFixed(2)}dB`,
    '-f',
    'mp3',
    temporary,
  ]);
  await rename(temporary, task.deployPath);
}

async function generate(): Promise<void> {
  const force = process.argv.includes('--force');
  // Re-run normalisation from existing masters (no re-synthesis) — used to re-apply the
  // loudness fix without re-downloading every clip. --force re-synthesises masters too.
  const renormalize = process.argv.includes('--renormalize');
  const concurrency = Math.max(1, Number(argValue('--concurrency') ?? 6));
  const tasks = buildTasks();
  const voiceDirs = new Set(
    tasks.flatMap((task) => [path.dirname(task.masterPath), path.dirname(task.deployPath)]),
  );
  for (const dir of voiceDirs) await mkdir(dir, { recursive: true });

  let cursor = 0;
  let done = 0;
  let generated = 0;
  const started = Date.now();

  async function worker(): Promise<void> {
    while (cursor < tasks.length) {
      const task = tasks[cursor++];
      if (!task) return;
      const ready =
        !force &&
        !renormalize &&
        (await exists(task.deployPath)) &&
        (await stat(task.deployPath)).size > 256;
      if (!ready) {
        if (force || !(await exists(task.masterPath))) await synthesiseMaster(task);
        await normaliseToDeploy(task);
        generated += 1;
      }
      done += 1;
      if (done % 50 === 0 || done === tasks.length) {
        const rate = done / ((Date.now() - started) / 1000);
        const remaining = Math.round((tasks.length - done) / Math.max(rate, 0.01));
        process.stdout.write(
          `${done}/${tasks.length} clips ready (${generated} new, ~${remaining}s left)\n`,
        );
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, worker));
  await writeManifest();
  process.stdout.write(`Done. ${generated} clips generated, ${tasks.length} total.\n`);
}

async function writeManifest(): Promise<void> {
  const manifest = {
    version: 1,
    provider: 'edge-tts',
    ffmpegPreset: FFMPEG_PRESET,
    generatedAt: new Date().toISOString(),
    voices: VOICES.map((voice) => ({ id: voice.id, providerVoiceId: voice.providerVoiceId })),
    speeds: SPEEDS.map((speed) => ({ id: speed.id, suffix: speed.suffix, rate: speed.rate })),
    words: uniqueWords(),
  };
  await mkdir(deployDir, { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

async function validate(): Promise<void> {
  const tasks = buildTasks();
  const missing: string[] = [];
  for (const task of tasks) {
    if (!(await exists(task.deployPath)) || (await stat(task.deployPath)).size <= 256) {
      missing.push(task.relativeUrl);
    }
  }
  if (missing.length) {
    process.stdout.write(`${missing.length} of ${tasks.length} clips are missing. First few:\n`);
    for (const url of missing.slice(0, 10)) process.stdout.write(`  ${url}\n`);
    process.exitCode = 1;
    return;
  }
  process.stdout.write(`Validated ${tasks.length} clips across ${VOICES.length} voices.\n`);
}

const command = process.argv[2];
if (command === 'generate') await generate();
else if (command === 'validate') await validate();
else {
  process.stdout.write('Usage: node scripts/audio.ts generate|validate\n');
  process.exitCode = 1;
}
