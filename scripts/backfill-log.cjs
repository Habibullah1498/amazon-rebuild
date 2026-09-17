// Recovers agent-log entries from Claude Code's own session transcript.
//
// Why this exists: creating package.json with "type": "module" for the Vite app
// made node treat every .js in the project as an ES module, including the hook
// (.claude/hooks/capture.js), which uses require(). Every hook invocation after
// that crashed with "require is not defined". Because the hook is written to
// never break a turn — swallow errors, always exit 0 — it failed silently, and
// the entire build went unrecorded.
//
// This does NOT tidy or rewrite anything. It reconstructs the entries the hook
// should have written, from the authoritative transcript, and labels every one
// of them so a reader can tell reconstruction from live capture. The original
// truncated log remains in git history.
//
// Usage: node scripts/backfill-log.cjs <transcript.jsonl> <session-id>
const fs = require('fs');
const path = require('path');

const [, , transcriptPath, sessionId] = process.argv;
if (!transcriptPath || !sessionId) {
  console.error('usage: node scripts/backfill-log.cjs <transcript.jsonl> <session-id>');
  process.exit(1);
}

const PROJECT_DIR = path.join(__dirname, '..');
const cfg = JSON.parse(fs.readFileSync(path.join(PROJECT_DIR, '.claude', 'hooks', 'capture-config.json'), 'utf8'));

const records = [];
for (const line of fs.readFileSync(transcriptPath, 'utf8').split('\n')) {
  const s = line.trim();
  if (!s) continue;
  try {
    records.push(JSON.parse(s));
  } catch {
    /* partial trailing write */
  }
}

const textOf = (content) => {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .filter((b) => b && b.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text)
    .join('\n');
};

// A real prompt is a user message carrying text blocks. Tool results are also
// role=user, so they are excluded by requiring text content and no tool_result.
function isRealPrompt(r) {
  if (r.type !== 'user' || r.isSidechain) return false;
  const c = r.message?.content;
  if (Array.isArray(c) && c.some((b) => b?.type === 'tool_result')) return false;
  return textOf(c).trim().length > 0;
}

const turns = [];
let current = null;
for (const r of records) {
  if (isRealPrompt(r)) {
    if (current) turns.push(current);
    current = {
      prompt: textOf(r.message.content),
      promptAt: r.timestamp,
      responses: [],
    };
  } else if (r.type === 'assistant' && !r.isSidechain && current) {
    const t = textOf(r.message?.content);
    if (t.trim()) current.responses.push({ text: t, at: r.timestamp, model: r.message?.model });
  }
}
if (current) turns.push(current);

const shortId = sessionId.slice(0, 8);
const first = turns[0]?.promptAt ?? '';
const last = turns[turns.length - 1]?.promptAt ?? '';
const date = (first || new Date().toISOString()).slice(0, 10);
const model = turns.flatMap((t) => t.responses.map((r) => r.model)).filter(Boolean).pop() ?? 'unknown';

let body = '';
turns.forEach((turn, i) => {
  const num = i + 1;
  body +=
    `[LOG_ENTRY type=PROMPT num=${num} session=${shortId}]\n` +
    `timestamp: ${turn.promptAt}\n` +
    `model: ${model}\n` +
    `source: reconstructed-from-transcript\n\n` +
    `${turn.prompt}\n\n\n`;

  // The final response is the last assistant text of the turn, matching what the
  // Stop hook's last_assistant_message would have contained.
  const finalResponse = turn.responses[turn.responses.length - 1];
  if (finalResponse) {
    body +=
      `[LOG_ENTRY type=RESPONSE num=${num} session=${shortId}]\n` +
      `timestamp: ${finalResponse.at}\n` +
      `model: ${finalResponse.model ?? model}\n` +
      `source: reconstructed-from-transcript\n\n` +
      `${finalResponse.text}\n\n\n`;
  }
});

const header = [
  '---',
  `session_id: ${sessionId}`,
  `date: ${date}`,
  `author: ${cfg.author}`,
  `model: ${model}`,
  'tool: claude-code',
  `project: ${cfg.project}`,
  `total_exchanges: ${turns.length}`,
  `first_prompt_time: ${first}`,
  `last_prompt_time: ${last}`,
  'reconstructed: true',
  '---',
  '',
  `# Session Log - ${date}`,
  '',
  `Session: \`${shortId}\` | Project: \`${cfg.project}\` | Author: \`${cfg.author}\``,
  '',
  '> **Reconstructed.** The capture hook broke partway through this session: adding',
  '> `"type": "module"` to package.json made node treat `.claude/hooks/capture.js` as an',
  '> ES module, so its `require()` calls threw on every invocation. The hook swallows',
  '> errors and always exits 0 so it can never break a turn, so it failed silently and',
  '> stopped recording after the timestamp of the last live entry. These entries were',
  '> recovered from Claude Code\'s own session transcript by `scripts/backfill-log.cjs`',
  '> and are labelled `source: reconstructed-from-transcript`. Nothing was edited,',
  '> summarised or removed; the truncated original is in git history.',
  '',
  '---',
  '',
  '',
].join('\n');

const files = fs.readdirSync(path.join(PROJECT_DIR, '.agent-logs')).filter((f) => f.includes(sessionId));
const target = files[0] ?? `${date}_reconstructed_${sessionId}.md`;
fs.writeFileSync(path.join(PROJECT_DIR, '.agent-logs', target), header + body, 'utf8');

console.log(`turns recovered: ${turns.length}`);
console.log(`written to: .agent-logs/${target}`);
turns.forEach((t, i) =>
  console.log(`  ${i + 1}. ${t.promptAt} ${JSON.stringify(t.prompt.slice(0, 60))} -> ${t.responses.length} assistant text block(s)`)
);
