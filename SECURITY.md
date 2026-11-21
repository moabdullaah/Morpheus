# Morpheus security model

Morpheus runs with your user's permissions, across all your projects, and installs third-party plugins.
This file lists what can go wrong and what defends against it.

## Threat model

| # | Threat | Defenses | Residual risk |
|---|---|---|---|
| 1 | **Malicious or compromised plugin** (supply chain): a plugin update adds a hook or MCP server that steals data | Anthropic marketplaces track upstream (reviewed there). **Community marketplaces are pinned** to audited commits; `tools/review-update.sh` shows hook, MCP, network and exec changes in the plugins we use before a pin is bumped. Non-core packs are off by default. MCP npm packages pinned. | You must actually read the review output. Official plugins can still change upstream. |
| 2 | **Prompt injection**: a README, issue, web page or other project tells Claude to run commands or leak data | Brain and other-project content is wrapped in `<untrusted-data>` and the skill forbids following it. The guard hook stops the most damaging actions even if the model is fooled. Other projects are read-only by default. | Injection can't be fully prevented by prompts. Keep permission prompts on for unfamiliar repos. |
| 3 | **Secret exposure**: credentials read into context, stored in memory, or pushed to git | `deny` rules for `.env*`, `~/.ssh`, `~/.aws`, keys etc. The **PreToolUse guard** also covers `Bash` access (e.g. `cat .env`). The brain CLI **refuses to store secrets** (13 detectors). `brain.mjs scan` runs before every sync and blocks commits. Cross-project search skips secret files and redacts matching lines. | Novel secret formats may slip past regexes. Run `brain.mjs scan` occasionally. |
| 4 | **Memory leak**: the brain (`~/.morpheus`) synced to a public repo | Brain dir is `700`, files `600`. `sync` **refuses to push to a public GitHub repo** (checked with `gh`), and warns when visibility can't be verified. | Non-GitHub remotes can't be checked. Keep them private. |
| 5 | **Destructive commands**: `rm -rf ~`, disk wipes, force pushes, hard resets, `curl \| sh` | Guard **denies** catastrophic deletes and wipes, and **asks** before force push, hard reset/clean, pipe-to-shell, sudo, env dumps and chmod 777. The skill requires explicit approval for irreversible actions. | Obfuscated commands can evade regexes. The guard is a seatbelt, not a sandbox. |
| 6 | **Over-broad access**: Morpheus reading every folder on disk | Cross-project access is **opt-in** (installer asks; `MORPHEUS_PROJECTS` to set). Only `~/.morpheus` is added by default, and it's read-only. Writes go through the CLI. | Folders you approve are fully readable. |
| 7 | **Option/command injection in Morpheus itself** | The brain CLI uses `execFileSync` (no shell); search passes queries as `-F -e <q> --` with `--no-config`; registry paths are never interpolated into shell strings. | None known. |
| 8 | **Telemetry / data egress** | Vercel plugin telemetry disabled (`VERCEL_PLUGIN_TELEMETRY=off`). Integration packs (Figma, Linear, Notion, Vercel, Sentry) are opt-in per project. | Remote MCP servers you enable see what you send them. |
| 9 | **Insecure apps built by Morpheus** | Sentinel, the dedicated security agent (STRIDE threat model, OWASP/ASVS audit). Threat model at the Architecture gate and security audit at the Prove gate. `/morpheus:sentinel harden` adds gitleaks, OSV and CodeQL CI, a Sentinel AI review on every trusted PR, and Dependabot. A Stop-hook tripwire catches unreviewed security-sensitive changes. Findings are proven, regression-tested and tracked in a ledger. Opt-in security pack (claude-security, semgrep…). | Automated review finds a lot, not everything. Get human review for high-stakes apps. |

## Audit performed (at the pinned commits)
- **wshobson/agents** (plugins used by Morpheus) and **ui-ux-pro-max**: no hooks, no MCP servers, no runtime network calls.
  ui-ux-pro-max's search script is local-only Python.
- **Anthropic plugins with hooks**: superpowers (context injection), security-guidance (pip-installs the Agent SDK into a
  venv on first run), hookify, ralph-loop, vercel (telemetry, now disabled), claude-security, semgrep.
- **Remote MCP servers** (only when their pack is on): context7, GitHub, Figma, Linear, Notion, Supabase, Vercel, Sentry.

## Controls
| Setting | Effect |
|---|---|
| `MORPHEUS_GUARD=0` | Disable the guard hook (not recommended) |
| `MORPHEUS_AUTOCAPTURE=0` | Disable the end-of-session memory checkpoint |
| `~/.morpheus/.state/guard.log` | Every guard decision, with timestamp |
| `/morpheus:doctor` | Checks brain permissions, secrets, remote visibility, guard status and scanners |
| `/morpheus:sentinel` | Sentinel: review / audit / threat-model / harden / verify / status |
| `MORPHEUS_SENTINEL=0` | Disable the Sentinel tripwire (Stop hook) |

## Reporting
Found a hole? Open a private security advisory on this repository rather than a public issue.
