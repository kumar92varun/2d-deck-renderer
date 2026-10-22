#!/usr/bin/env node
/* Find when each sentence and each bold cue word is spoken in a beat's voiceover recording.

   Runs speech recognition (whisper.cpp, local, offline) on the audio, then lines the recognised words up with that
   beat's script from the storyboard. The alignment is by position, so a word the recogniser mishears (or writes in
   the other script) still gets the right time; those are flagged "check" so you can verify them by ear.

   Usage (from video/)
     node tools/cue-times.mjs --beat 3 --audio ~/recordings/beat03.m4a
     node tools/cue-times.mjs --beat 3 --audio beat03.wav --json out.json      # also write the raw result
   Options
     --storyboard FILE   default storyboard/tokenmaxxing.md
     --lang CODE         recogniser language, default hi
     --model FILE        default $WHISPER_MODEL or ~/.cache/deckrenderer-whisper/models/ggml-large-v3-turbo-q5_0.bin
   Setup: brew install whisper-cpp ffmpeg, plus the model file above (see the neon-explainer skill). */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf("--" + n); return i >= 0 ? argv[i + 1] : d; };
const beat = Number(opt("beat")), audio = opt("audio");
if (!beat || !audio) { console.error("Usage: node tools/cue-times.mjs --beat N --audio FILE [--json FILE]"); process.exit(1); }
const storyboard = opt("storyboard", "storyboard/tokenmaxxing.md");
const lang = opt("lang", "hi");
const model = opt("model", process.env.WHISPER_MODEL || path.join(os.homedir(), ".cache/deckrenderer-whisper/models/ggml-large-v3-turbo-q5_0.bin"));

// ---------- 1. the beat's script: tokens, sentence numbers, bold cue phrases ----------
const md = readFileSync(storyboard, "utf8");
const scriptSec = md.split("## Hindi voiceover script")[1]?.split("## Sources")[0];
if (!scriptSec) { console.error("No '## Hindi voiceover script' section in " + storyboard); process.exit(1); }
const parts = scriptSec.split(/\[(\d+)\]/);
let raw = null;
for (let i = 1; i < parts.length; i += 2) if (Number(parts[i]) === beat) raw = parts[i + 1];
if (raw == null) { console.error(`Beat ${beat} not found in the script section`); process.exit(1); }
raw = raw.replace(/\[pause\]/g, " ").replace(/\*\*Act[^\n]*/g, " ");

const norm = (s) => s.toLowerCase().replace(/[।.,?!:;"'“”‘’()\-–*$]/g, "").trim();
const script = []; let sentence = 0, cueN = 0;
for (const seg of raw.split(/(\*\*[^*]+\*\*)/)) {
  const bold = seg.startsWith("**"), text = bold ? seg.slice(2, -2) : seg;
  if (bold) cueN++;
  let k = 0;
  for (const t of text.split(/\s+/).filter(Boolean)) {
    // a lone "।" or "?" (e.g. after a bold word) still ends the sentence
    if (!/[\p{L}\p{N}]/u.test(t)) { if (/[।?]/.test(t) && script.length) sentence++; continue; }
    script.push({ text: t, n: norm(t), sentence, cue: bold ? cueN : 0, cueFirst: bold && k++ === 0 });
    if (/[।?]|\.$/.test(t)) sentence++;
  }
}
const cuePhrases = {}; script.forEach((t) => { if (t.cue) cuePhrases[t.cue] = (cuePhrases[t.cue] ? cuePhrases[t.cue] + " " : "") + t.text; });

// ---------- 2. recognise the audio ----------
const tmp = mkdtempSync(path.join(os.tmpdir(), "cue-times-"));
try {
  const wav = path.join(tmp, "a.wav");
  let r = spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-i", audio, "-ar", "16000", "-ac", "1", wav], { encoding: "utf8" });
  if (r.status !== 0) { console.error("ffmpeg could not read the audio:\n" + r.stderr); process.exit(1); }
  const dur = Number(spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", wav], { encoding: "utf8" }).stdout);
  r = spawnSync("whisper-cli", ["-m", model, "-f", wav, "-l", lang, "-ojf", "-of", path.join(tmp, "out"), "-ml", "1", "-sow"], { encoding: "utf8" });
  if (r.status !== 0) { console.error("whisper-cli failed (is it installed, and is the model at " + model + "?)\n" + r.stderr.slice(-600)); process.exit(1); }
  const heard = JSON.parse(readFileSync(path.join(tmp, "out.json"), "utf8")).transcription
    .map((s) => ({ text: s.text.trim(), from: s.offsets.from / 1000, to: s.offsets.to / 1000 }))
    .filter((w) => /[\p{L}\p{N}]/u.test(w.text) && !/^[\[(]/.test(w.text));
  heard.forEach((w) => { w.n = norm(w.text); });

  // ---------- 3. align heard words to script words (Needleman-Wunsch on string similarity) ----------
  const lev = (a, b) => { const m = a.length, n = b.length; if (!m || !n) return Math.max(m, n);
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) { const cur = [i]; for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; }
    return prev[n]; };
  const sim = (a, b) => (a === b ? 1 : 1 - lev(a, b) / Math.max(a.length, b.length));
  const GAP = -0.7, S = script.length, H = heard.length;
  const sc = (i, j) => 2 * sim(script[i].n, heard[j].n) - 0.6;
  const M = Array.from({ length: S + 1 }, () => new Float64Array(H + 1));
  for (let i = 1; i <= S; i++) M[i][0] = i * GAP;
  for (let j = 1; j <= H; j++) M[0][j] = j * GAP;
  for (let i = 1; i <= S; i++) for (let j = 1; j <= H; j++)
    M[i][j] = Math.max(M[i - 1][j - 1] + sc(i - 1, j - 1), M[i - 1][j] + GAP, M[i][j - 1] + GAP);
  let i = S, j = H; const pairs = new Array(S).fill(null);
  while (i > 0 && j > 0) {
    if (M[i][j] === M[i - 1][j - 1] + sc(i - 1, j - 1)) { pairs[i - 1] = j - 1; i--; j--; }
    else if (M[i][j] === M[i - 1][j] + GAP) i--; else j--;
  }
  script.forEach((t, k) => {
    const w = pairs[k] != null ? heard[pairs[k]] : null;
    t.time = w ? w.from : null; t.heard = w ? w.text : null; t.sim = w ? sim(t.n, w.n) : 0;
  });
  // words with no match get an estimated time from their neighbours
  for (let k = 0; k < S; k++) if (script[k].time == null) {
    let a = k - 1, b = k + 1; while (a >= 0 && script[a].time == null) a--; while (b < S && script[b].time == null) b++;
    const ta = a >= 0 ? script[a].time : 0, tb = b < S ? script[b].time : dur;
    script[k].time = ta + (tb - ta) * ((k - a) / (b - a)); script[k].est = true;
  }

  // ---------- 4. report ----------
  const f = (t) => t.toFixed(1).padStart(5);
  const flag = (t) => (t.est ? "  [estimated, check by ear]" : t.sim < 0.6 ? `  [heard as "${t.heard}", matched by position: check]` : "");
  const nSent = sentence + (script.some((t) => t.sentence === sentence) ? 1 : 0);
  console.log(`Beat ${beat}   audio ${dur.toFixed(1)} s   ${script.length} script words   ${(script.length / dur * 60).toFixed(0)} words/min\n`);
  const result = { beat, audioSeconds: dur, sentences: [], cues: [] };
  for (let s = 0; s < nSent; s++) {
    const toks = script.filter((t) => t.sentence === s); if (!toks.length) continue;
    console.log(`Sentence ${s + 1} starts ${f(toks[0].time)}   ${toks.map((t) => t.text).join(" ")}`);
    result.sentences.push({ n: s + 1, start: +toks[0].time.toFixed(2), text: toks.map((t) => t.text).join(" ") });
    for (const t of toks.filter((t) => t.cueFirst)) {
      console.log(`    cue "${cuePhrases[t.cue]}"   at ${f(t.time)}${flag(t)}`);
      result.cues.push({ phrase: cuePhrases[t.cue], at: +t.time.toFixed(2), check: !!(t.est || t.sim < 0.6) });
    }
  }
  const weak = script.filter((t) => t.est || t.sim < 0.6).length;
  console.log(`\n${script.length - weak} of ${script.length} words matched what was heard; ${weak} matched by position or estimated (cue words among them are flagged above).`);
  if (opt("json")) writeFileSync(opt("json"), JSON.stringify(result, null, 2));
} finally { rmSync(tmp, { recursive: true, force: true }); }
