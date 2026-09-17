#!/usr/bin/env node
'use strict';

/**
 * Agent capture hook for the 8x assignment.
 *
 * Fires automatically from .claude/settings.json on:
 *   UserPromptSubmit  -> append a PROMPT entry
 *   Stop              -> append a RESPONSE entry
 *   SessionStart      -> record the active model
 *   PostModelSwitch   -> record a mid-session model change
 *
 * Captures the prompt and the final response only. No thinking, no tool calls,
 * no intermediate steps. Never blocks or fails a turn: all errors are swallowed
 * and the process always exits 0.
 */

const fs = require('fs');
const path = require('path');

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const LOG_DIR = path.join(PROJECT_DIR, '.agent-logs');
const STATE_DIR = path.join(PROJECT_DIR, '.claude', 'state');
const RAW_EVENTS = path.join(STATE_DIR, 'raw-events.jsonl');

function readStdin() {
  return new Promise((resolve) => {
    const chunks = [];
    process.stdin.on('data', (c) => chunks.push(c));
    process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    process.stdin.on('error', () => resolve(''));
    setTimeout(() => resolve(Buffer.concat(chunks).toString('utf8')), 5000).unref();
  });
}

function ensureDirs() {
  fs.mkdirSync(LOG_DIR, { recursive: true });
  fs.mkdirSync(STATE_DIR, { recursive: true });
}

function statePath(sessionId) {
  return path.join(STATE_DIR, `${sessionId}.json`);
}

function loadState(sessionId) {
  try {
    return JSON.parse(fs.readFileSync(statePath(sessionId), 'utf8'));
  } catch {
    return null;
  }
}

function saveState(state) {
  fs.writeFileSync(statePath(state.sessionId), JSON.stringify(state, null, 2), 'utf8');
}

function utcStamp(d) {
  return d.toISOString();
}

function fileStamp(d) {
  return d.toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-');
}

/**
 * The model name is not present in UserPromptSubmit or Stop payloads, so it is
 * resolved from, in order: the payload itself, the model recorded by
 * SessionStart/PostModelSwitch, the session transcript, the environment.
 */
function resolveModel(payload, state, preferTranscript) {
  const direct = payload.model || payload.to_model;
  if (direct) return direct;

  const fromTranscript = modelFromTranscript(payload.transcript_path);
  const known = state && state.model;

  // At Stop the transcript names the model that actually produced the response,
  // so it wins. At prompt time the transcript still shows the previous turn, so a
  // model recorded by PostModelSwitch is the fresher answer.
  if (preferTranscript) {
    if (fromTranscript) return fromTranscript;
    if (known) return known;
  } else {
    if (known) return known;
    if (fromTranscript) return fromTranscript;
  }

  if (process.env.ANTHROPIC_MODEL) return process.env.ANTHROPIC_MODEL;
  return 'unknown';
}

function modelFromTranscript(transcriptPath) {
  if (!transcriptPath) return null;
  try {
    const raw = fs.readFileSync(transcriptPath, 'utf8');
    const lines = raw.split('\n');
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (!line) continue;
      let obj;
      try {
        obj = JSON.parse(line);
      } catch {
        continue;
      }
      const model = (obj.message && obj.message.model) || obj.model;
      if (model && typeof model === 'string' && model !== '<synthetic>') return model;
    }
  } catch {
    /* transcript unreadable or not yet written */
  }
  return null;
}

function recordRawEvent(payload) {
  try {
    const line = JSON.stringify({ captured_at: new Date().toISOString(), payload });
    fs.appendFileSync(RAW_EVENTS, line + '\n', 'utf8');
  } catch {
    /* debug trail is best-effort */
  }
}

function author() {
  try {
    const cfg = JSON.parse(
      fs.readFileSync(path.join(PROJECT_DIR, '.claude', 'hooks', 'capture-config.json'), 'utf8')
    );
    if (cfg.author) return cfg.author;
  } catch {
    /* fall through to default */
  }
  return 'unknown';
}

function projectName() {
  try {
    const cfg = JSON.parse(
      fs.readFileSync(path.join(PROJECT_DIR, '.claude', 'hooks', 'capture-config.json'), 'utf8')
    );
    if (cfg.project) return cfg.project;
  } catch {
    /* fall through to default */
  }
  return path.basename(PROJECT_DIR);
}

function initState(sessionId, now) {
  const shortId = sessionId.slice(0, 8);
  const fileName = `${fileStamp(now)}_${sessionId}.md`;
  return {
    sessionId,
    shortId,
    file: path.join(LOG_DIR, fileName),
    date: now.toISOString().slice(0, 10),
    author: author(),
    project: projectName(),
    model: null,
    firstPromptTime: null,
    lastPromptTime: null,
    exchanges: 0,
  };
}

function buildFrontmatter(state) {
  return [
    '---',
    `session_id: ${state.sessionId}`,
    `date: ${state.date}`,
    `author: ${state.author}`,
    `model: ${state.model || 'unknown'}`,
    'tool: claude-code',
    `project: ${state.project}`,
    `total_exchanges: ${state.exchanges}`,
    `first_prompt_time: ${state.firstPromptTime || ''}`,
    `last_prompt_time: ${state.lastPromptTime || ''}`,
    '---',
    '',
    `# Session Log - ${state.date}`,
    '',
    `Session: \`${state.shortId}\` | Project: \`${state.project}\` | Author: \`${state.author}\``,
    '',
    '---',
    '',
    '',
  ].join('\n');
}

/** Rewrites the frontmatter in place, preserving every entry already appended. */
function writeLog(state, body) {
  fs.writeFileSync(state.file, buildFrontmatter(state) + body, 'utf8');
}

function readBody(state) {
  if (!fs.existsSync(state.file)) return '';
  const raw = fs.readFileSync(state.file, 'utf8');
  // Entries are the only lines that begin with '[LOG_ENTRY'. Anchoring on the
  // first of them survives responses that themselves contain '---' fences or a
  // quoted copy of this log format.
  const match = /^\[LOG_ENTRY /m.exec(raw);
  return match ? raw.slice(match.index) : '';
}

function appendEntry(state, type, num, timestamp, model, text) {
  const body = readBody(state);
  const entry =
    `[LOG_ENTRY type=${type} num=${num} session=${state.shortId}]\n` +
    `timestamp: ${timestamp}\n` +
    `model: ${model}\n` +
    '\n' +
    `${text}\n` +
    '\n\n';
  writeLog(state, body + entry);
}

async function main() {
  const rawInput = await readStdin();
  let payload;
  try {
    payload = JSON.parse(rawInput);
  } catch {
    return;
  }

  ensureDirs();
  recordRawEvent(payload);

  const event = payload.hook_event_name;
  const sessionId = payload.session_id;
  if (!sessionId) return;

  const now = new Date();
  let state = loadState(sessionId) || initState(sessionId, now);

  if (event === 'SessionStart' || event === 'PostModelSwitch' || event === 'PreModelSwitch') {
    const model = resolveModel(payload, state, false);
    if (model && model !== 'unknown') state.model = model;
    saveState(state);
    return;
  }

  const model = resolveModel(payload, state, event === 'Stop');
  if (model && model !== 'unknown') state.model = model;

  if (event === 'UserPromptSubmit') {
    const text = payload.user_input ?? payload.prompt ?? '';
    const ts = utcStamp(now);
    state.exchanges += 1;
    if (!state.firstPromptTime) state.firstPromptTime = ts;
    state.lastPromptTime = ts;
    saveState(state);
    appendEntry(state, 'PROMPT', state.exchanges, ts, state.model || 'unknown', text);
    return;
  }

  if (event === 'Stop') {
    const text = payload.last_assistant_message ?? '';
    if (!text) return;
    const ts = utcStamp(now);
    // A turn can end without a preceding user prompt (for example when an agent
    // completion wakes the session). Those responses are still logged, under the
    // current exchange number, rather than dropped.
    const num = state.exchanges === 0 ? 0 : state.exchanges;
    saveState(state);
    appendEntry(state, 'RESPONSE', num, ts, state.model || 'unknown', text);
  }
}

main()
  .catch(() => {})
  .finally(() => process.exit(0));
