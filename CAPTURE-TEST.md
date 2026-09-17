# CAPTURE-TEST.md

Verification that automatic prompt/response capture is installed and working.

## Tool and model

| | |
|---|---|
| **Tool** | Claude Code v2.1.207 (VSCode extension + CLI, same install) |
| **Model (setup session)** | Started on `claude-sonnet-5`, switched mid-setup to `claude-opus-5[1m]` via `/model` |
| **Model (canary sessions)** | `claude-opus-4-8` — the CLI default for headless `claude -p`, which is *not* the model the interactive session uses |
| **Planning vs execution** | Same model does both. No planner/executor split. One subagent (`claude-code-guide`) was used for research; subagent turns are not separate sessions and do not produce their own logs. |

The model difference between the interactive session and the `claude -p` canaries is real and
visible in the logs, which is the point of recording the model per turn.

## Mechanism

Claude Code hooks — they fire on their own, with nothing to remember.

**Config file changed:** [`.claude/settings.json`](.claude/settings.json)

**Hook script:** [`.claude/hooks/capture.js`](.claude/hooks/capture.js) (Node, no dependencies)

Four lifecycle events are wired to the same script, which dispatches on `hook_event_name`:

| Event | Purpose |
|---|---|
| `UserPromptSubmit` | Appends the `PROMPT` entry. Payload carries the verbatim prompt text. |
| `Stop` | Appends the `RESPONSE` entry at end of turn, from `last_assistant_message`. |
| `SessionStart` | Initialises per-session state. |
| `PostModelSwitch` | Records a mid-session `/model` switch so the change is visible per turn. |

Hooks are registered in **exec form** (`"command": "node"` + `"args": [...]`) rather than as a
shell string. On Windows the shell form is dispatched to PowerShell, Git Bash, or cmd depending on
what is installed; exec form bypasses the shell entirely so path quoting can't break it.

### Why only the prompt and the final response

`Stop` provides `last_assistant_message`, which is already the final plain-text answer with
thinking blocks and tool calls stripped. Nothing intermediate is read or written. The script never
parses the transcript for response content — it reads the transcript for exactly one thing, the
model name, which is not in the hook payload (see below).

### Failure isolation

The script wraps every operation in try/catch and always exits 0. A logging bug must never break a
turn.

## Where the canaries landed

- Canary 1 → [`.agent-logs/2026-09-17_17-02-03_db7d6992-5d83-4ba1-b40f-6f4c07d82760.md`](.agent-logs/2026-09-17_17-02-03_db7d6992-5d83-4ba1-b40f-6f4c07d82760.md)
- Canary 2 → [`.agent-logs/2026-09-17_17-03-22_5c95d9f4-de92-4848-9c6b-232f79ba38d1.md`](.agent-logs/2026-09-17_17-03-22_5c95d9f4-de92-4848-9c6b-232f79ba38d1.md)

Two different session IDs, two different files, from two separately launched sessions. The second
session had no knowledge of the first — it picked the hooks up from the committed project config,
which is the actual thing being tested.

### Canary 1, raw

```
---
session_id: db7d6992-5d83-4ba1-b40f-6f4c07d82760
date: 2026-09-17
author: Habibullah1498
model: claude-opus-4-8
tool: claude-code
project: amazon
total_exchanges: 1
first_prompt_time: 2026-09-17T17:02:04.083Z
last_prompt_time: 2026-09-17T17:02:04.083Z
---

# Session Log - 2026-09-17

Session: `db7d6992` | Project: `amazon` | Author: `Habibullah1498`

---

[LOG_ENTRY type=PROMPT num=1 session=db7d6992]
timestamp: 2026-09-17T17:02:04.083Z
model: unknown

CAPTURE TEST — 8x assignment, Habibullah1498


[LOG_ENTRY type=RESPONSE num=1 session=db7d6992]
timestamp: 2026-09-17T17:02:12.621Z
model: claude-opus-4-8

I don't have a task to act on here. "CAPTURE TEST — 8x assignment, Habibullah1498" doesn't describe anything for me to do, and I'm not going to start firing off tools or agents without a concrete request.

What would you like help with? For example:
- A coding or debugging task in `C:\Users\Habib\Downloads\amazon`
- Understanding something in this repo
- A research or setup question

Tell me the actual goal and I'll get to work.
```

### Canary 2, raw

```
---
session_id: 5c95d9f4-de92-4848-9c6b-232f79ba38d1
date: 2026-09-17
author: Habibullah1498
model: claude-opus-4-8
tool: claude-code
project: amazon
total_exchanges: 1
first_prompt_time: 2026-09-17T17:03:23.104Z
last_prompt_time: 2026-09-17T17:03:23.104Z
---

# Session Log - 2026-09-17

Session: `5c95d9f4` | Project: `amazon` | Author: `Habibullah1498`

---

[LOG_ENTRY type=PROMPT num=1 session=5c95d9f4]
timestamp: 2026-09-17T17:03:23.104Z
model: unknown

CAPTURE TEST 2 — second session check, Habibullah1498. Reply with exactly: canary two received.


[LOG_ENTRY type=RESPONSE num=1 session=5c95d9f4]
timestamp: 2026-09-17T17:03:33.397Z
model: claude-opus-4-8

canary two received.
```

## What did not work first

### 1. The documented prompt field name was wrong for this version

Before writing anything I had a subagent research the hook payload schemas. It reported —
confidently, with doc links — that `UserPromptSubmit` delivers the prompt in a field called
`user_input`, and explicitly flagged "**NOT** `prompt`".

On CLI v2.1.207 that is backwards. The actual payload keys are:

```
UserPromptSubmit | session_id, transcript_path, cwd, prompt_id, permission_mode, hook_event_name, prompt
Stop             | session_id, transcript_path, cwd, prompt_id, permission_mode, effort,
                   hook_event_name, stop_hook_active, last_assistant_message, background_tasks, session_crons
SessionStart     | session_id, transcript_path, cwd, hook_event_name, source
```

The field is `prompt`. Had the script trusted the research, every prompt would have logged as an
empty string while still appearing to "work" — the file would exist, entries would be numbered,
and the failure would only be visible by reading the contents.

It was caught because the script reads `payload.user_input ?? payload.prompt` and because it dumps
every raw payload to `.claude/state/raw-events.jsonl`, which is what the key listing above came
from. Verifying against the running binary rather than the documentation is what made the
difference.

### 2. Frontmatter duplicated itself on every append

The frontmatter has to be rewritten on each entry, because `total_exchanges` and
`last_prompt_time` change every turn. The first implementation found the end of the header by
searching for a `\n---\n\n` fence. The generated header ended with `---\n` — one newline, not two —
so the search never matched, the "body" was read back as the entire file including its header, and
each append stacked another complete copy of the frontmatter on top.

The fix does not just correct the fence. Matching on `---` was the wrong idea: any response
containing a Markdown horizontal rule would have broken it later, intermittently and only for
certain content. The parser now anchors on the first line matching `/^\[LOG_ENTRY /m`.

Re-tested with a prompt deliberately containing both a `---` fence and a fake
`[LOG_ENTRY type=PROMPT num=99]` string inside the body. Both round-tripped without corrupting the
file.

### 3. Model name is in no hook payload at all

Confirmed by the key listing above: no `UserPromptSubmit`, `Stop`, or `SessionStart` payload
carries the model. `SessionStart` does not either, so there is nothing to seed from at launch.

The model is instead read from the last assistant entry in the session transcript, with an explicit
precedence rule:

- At `Stop`, the transcript wins — it names the model that actually produced that response.
- At `UserPromptSubmit`, the transcript still describes the *previous* turn, so a model recorded by
  `PostModelSwitch` wins instead. Otherwise a `/model` switch would be reported one turn late.

## Known limitations

**The first `PROMPT` of a session logs `model: unknown`.** At that moment no assistant message
exists in the transcript and no payload carries the model, so it genuinely is not knowable. Both
canaries show this. The paired `RESPONSE` and the frontmatter both carry the real model, so no
information is actually lost. It is left as `unknown` rather than backfilled after the fact,
because rewriting an entry once more is known would be exactly the kind of log tidying that is
supposed to stay out of these files.

**Hooks load at session start.** This session was already running when
`.claude/settings.json` was created, and it produced no log file — which is how the limitation was
confirmed rather than assumed. New sessions pick the hooks up automatically, as canaries 1 and 2
demonstrate. An already-open session needs a restart (or opening `/hooks` once, which reloads the
config) before it is captured.

## Log hygiene

- `.agent-logs/` is **not** in `.gitignore`. It ships with the repo.
- `.gitignore` covers `.claude/state/` only — per-session counters plus the raw payload debug
  trail. That is bookkeeping, not conversation record.
- Entries are appended and never edited, summarised, or removed.
