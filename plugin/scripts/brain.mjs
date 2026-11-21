#!/usr/bin/env node
// Morpheus brain engine: one zero-dependency CLI that owns ~/.morpheus.
// Markdown files are the single source of truth; this CLI is the only writer Claude needs.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SELF = fileURLToPath(import.meta.url);
const PLUGIN_ROOT = path.resolve(path.dirname(SELF), "..");
const DEPS = path.join(PLUGIN_ROOT, "dependencies.txt");
const HOME = os.homedir();
const BRAIN = process.env.MORPHEUS_HOME || path.join(HOME, ".morpheus");
const REG = path.join(BRAIN, "projects.json");
const STATE = path.join(BRAIN, ".state");
const SECTIONS = { purpose: "Purpose", decisions: "Key decisions", status: "Status / next steps", gotchas: "Gotchas", stack: "Stack" };
const EDIT_TOOLS = new Set(["Edit", "Write", "MultiEdit", "NotebookEdit"]);
const CAPTURE_MIN_EDITS = +(process.env.MORPHEUS_CAPTURE_MIN_EDITS || 5);

// ---------- utils ----------
const read = (p, d = "") => { try { return fs.readFileSync(p, "utf8"); } catch { return d; } };
const exists = (p) => { try { fs.accessSync(p); return true; } catch { return false; } };
const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "item";
const clip = (s, n) => (s.length > n ? s.slice(0, n).trimEnd() + "\n…" : s);
const today = () => new Date().toISOString().slice(0, 10);
const writeAtomic = (p, c) => { fs.mkdirSync(path.dirname(p), { recursive: true }); const t = `${p}.${process.pid}.tmp`; fs.writeFileSync(t, c); fs.renameSync(t, p); };
const readJSON = (p, d) => { try { return JSON.parse(read(p)); } catch { return d; } };
const readStdin = () => { if (process.stdin.isTTY) return ""; try { return fs.readFileSync(0, "utf8"); } catch { return ""; } };
const has = (bin) => spawnSync(process.platform === "win32" ? "where" : "which", [bin], { stdio: "ignore" }).status === 0;
const run = (bin, args, opts = {}) => { try { return execFileSync(bin, args, { stdio: ["ignore", "pipe", "ignore"], timeout: 8000, ...opts }).toString().trim(); } catch { return ""; } };
const git = (dir, args) => run("git", ["-C", dir, ...args], { timeout: 4000 });
const under = (p, root) => { const r = path.relative(root, path.resolve(p)); return !!r && !r.startsWith("..") && !path.isAbsolute(r) || path.resolve(p) === root; };

const SECRET_RE = [
  /\bsk-[A-Za-z0-9_-]{20,}/, /\bgh[pousr]_[A-Za-z0-9]{30,}/, /\bAKIA[0-9A-Z]{16}\b/, /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\bxox[abpr]-[A-Za-z0-9-]{10,}/, /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\./, /\b(password|passwd|secret|api[_-]?key|token)\s*[:=]\s*\S{8,}/i,
];
function guard(text) {
  if (SECRET_RE.some((r) => r.test(text))) { console.error("✗ Refused: this looks like it contains a secret. Morpheus never stores credentials."); process.exit(2); }
}

// ---------- brain ----------
function ensureBrain() {
  for (const d of ["projects", "patterns", ".state"]) fs.mkdirSync(path.join(BRAIN, d), { recursive: true });
  const seed = {
    "profile.md": `# Profile\n\n## Preferences\n<!-- one bullet per preference: - YYYY-MM-DD preference -->\n\n## Default stack\n- Next.js (App Router) + TypeScript strict + Tailwind + shadcn/ui\n- Supabase (Postgres, Auth, RLS) · Vitest + Playwright · Vercel + Sentry · pnpm\n`,
    "lessons.md": `# Lessons (cross-project)\n\n<!-- - YYYY-MM-DD [project] lesson -->\n`,
    "README.md": `# Morpheus brain\n\nSingle source of truth shared by every project. Written via brain.mjs.\n\n- profile.md: preferences & default stack\n- lessons.md: cross-project lessons\n- projects.json: registry\n- projects/<slug>.md: per-project brief\n- patterns/<name>.md: reusable solutions\n`,
    ".gitignore": ".state/\n*.tmp\n",
  };
  for (const [f, c] of Object.entries(seed)) if (!exists(path.join(BRAIN, f))) fs.writeFileSync(path.join(BRAIN, f), c);
  if (!exists(REG)) fs.writeFileSync(REG, "{}\n");
}
const loadReg = () => readJSON(REG, {});
const saveReg = (r) => writeAtomic(REG, JSON.stringify(r, null, 2) + "\n");

// ---------- deps / packs ----------
function parseDeps() {
  const packs = {}, marketplaces = [];
  for (const raw of read(DEPS).split("\n")) {
    const line = raw.replace(/\s+#.*$/, "").trim();
    const cost = +(raw.match(/\(~(\d+)\)/)?.[1] || 0);
    if (!line || line.startsWith("#")) continue;
    if (line.startsWith("@marketplace ")) { const [name, src] = line.slice(13).split("|"); marketplaces.push({ name, src }); continue; }
    const [pack, plugin] = line.split(/\s+/);
    (packs[pack] ||= []).push({ plugin, cost });
  }
  return { packs, marketplaces };
}

// ---------- projects ----------
function detectStack(dir) {
  const s = new Set();
  const pkg = readJSON(path.join(dir, "package.json"), null);
  if (pkg) {
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    const map = { next: "Next.js", react: "React", vue: "Vue", nuxt: "Nuxt", svelte: "Svelte", "@sveltejs/kit": "SvelteKit", astro: "Astro", "@remix-run/react": "Remix", "react-router": "React Router", express: "Express", hono: "Hono", fastify: "Fastify", "@nestjs/core": "NestJS", tailwindcss: "Tailwind", "@supabase/supabase-js": "Supabase", prisma: "Prisma", "@prisma/client": "Prisma", "drizzle-orm": "Drizzle", convex: "Convex", typescript: "TypeScript", electron: "Electron", expo: "Expo", "react-native": "React Native", vitest: "Vitest", jest: "Jest", "@playwright/test": "Playwright", "@anthropic-ai/sdk": "Claude API", ai: "AI SDK", stripe: "Stripe", "@tanstack/react-query": "TanStack Query", zustand: "Zustand" };
    for (const [k, v] of Object.entries(map)) if (deps?.[k]) s.add(v);
    if (!s.size) s.add("Node.js");
  }
  const files = { "pyproject.toml": "Python", "requirements.txt": "Python", "go.mod": "Go", "Cargo.toml": "Rust", Gemfile: "Ruby", "composer.json": "PHP", "pom.xml": "Java", "build.gradle": "JVM", "pubspec.yaml": "Flutter", Dockerfile: "Docker", "vercel.json": "Vercel", "supabase": "Supabase", ".specify": "Spec Kit", "components.json": "shadcn/ui" };
  for (const [f, v] of Object.entries(files)) if (exists(path.join(dir, f))) s.add(v);
  return [...s];
}
function projectRoot(start) {
  const top = git(start, ["rev-parse", "--show-toplevel"]);
  if (top) return path.resolve(top);
  return ["package.json", "pyproject.toml", "go.mod", "Cargo.toml", "CLAUDE.md", ".specify"].some((m) => exists(path.join(start, m))) ? start : null;
}
function register(dir) {
  const root = projectRoot(path.resolve(dir));
  if (!root || root === HOME || root === path.parse(root).root || under(root, BRAIN)) return null;
  const reg = loadReg();
  let slug = Object.values(reg).find((e) => e.path === root)?.slug;
  if (!slug) { const base = slugify(path.basename(root)); slug = base; for (let i = 2; reg[slug]; i++) slug = `${base}-${i}`; }
  const prev = reg[slug] || {};
  const entry = {
    ...prev, slug, name: prev.name || path.basename(root), path: root,
    remote: git(root, ["config", "--get", "remote.origin.url"]) || prev.remote || "",
    branch: git(root, ["rev-parse", "--abbrev-ref", "HEAD"]),
    stack: detectStack(root),
    description: prev.description || readJSON(path.join(root, "package.json"), {}).description || "",
    firstSeen: prev.firstSeen || new Date().toISOString(), lastSeen: new Date().toISOString(),
  };
  reg[slug] = entry; saveReg(reg);
  const brief = briefPath(slug);
  if (!exists(brief)) writeAtomic(brief, `# ${entry.name}\n\n- **Path:** ${root}\n- **Remote:** ${entry.remote || "(none)"}\n\n## Purpose\n_unknown (Morpheus: fill in from README/CLAUDE.md)_\n\n## Stack\n${entry.stack.join(", ") || "unknown"}\n\n## Key decisions\n\n## Status / next steps\n\n## Gotchas\n`);
  return entry;
}
const briefPath = (slug) => path.join(BRAIN, "projects", `${slug}.md`);
const sorted = () => Object.values(loadReg()).sort((a, b) => (b.lastSeen || "").localeCompare(a.lastSeen || ""));
function findProjects(q) {
  if (!q) return sorted();
  const t = q.toLowerCase();
  return sorted().filter((e) => [e.slug, e.name, e.path, e.description, ...(e.stack || []), read(briefPath(e.slug)).slice(0, 4000)].join(" ").toLowerCase().includes(t));
}
const fmtRow = (e) => `- **${e.name}** (\`${e.slug}\`) ${e.path}${e.stack?.length ? ` · ${e.stack.join(", ")}` : ""}${e.description ? ` · ${e.description}` : ""}${exists(e.path) ? "" : " · ⚠ missing"}`;
function current(cwd) { return register(cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd()); }

// ---------- memory writes ----------
function upsertSection(md, heading, bullet, replace = false) {
  const lines = md.split("\n");
  let i = lines.findIndex((l) => l.trim().toLowerCase() === `## ${heading}`.toLowerCase());
  if (i === -1) { lines.push("", `## ${heading}`); i = lines.length - 1; }
  let end = i + 1; while (end < lines.length && !lines[end].startsWith("## ")) end++;
  if (replace) lines.splice(i + 1, end - i - 1, bullet, "");
  else { let ins = end; while (ins > i + 1 && lines[ins - 1].trim() === "") ins--; lines.splice(ins, 0, bullet); }
  return lines.join("\n");
}
function note(section, text, cwd) {
  guard(text);
  const key = section.toLowerCase(); const heading = SECTIONS[key];
  if (!heading) { console.error(`Unknown section "${section}". Use: ${Object.keys(SECTIONS).join(", ")}`); process.exit(1); }
  const e = current(cwd); if (!e) { console.error("Not inside a project."); process.exit(1); }
  const p = briefPath(e.slug);
  const replace = key === "purpose" || key === "stack";
  writeAtomic(p, upsertSection(read(p), heading, replace ? text : `- ${today()} ${text}`, replace));
  console.log(`✓ ${e.slug} › ${heading}`);
}
function lesson(text, cwd) {
  guard(text); const e = current(cwd);
  fs.appendFileSync(path.join(BRAIN, "lessons.md"), `- ${today()} [${e?.slug || "general"}] ${text}\n`);
  console.log("✓ lesson saved");
}
function pref(text) {
  guard(text); const p = path.join(BRAIN, "profile.md");
  writeAtomic(p, upsertSection(read(p), "Preferences", `- ${today()} ${text}`)); console.log("✓ preference saved");
}
function pattern(name, cwd) {
  const body = readStdin(); guard(body);
  if (!body.trim()) { console.error("Pipe the pattern's markdown on stdin."); process.exit(1); }
  const e = current(cwd); const p = path.join(BRAIN, "patterns", `${slugify(name)}.md`);
  writeAtomic(p, `${body.trim()}\n\n_Source: ${e?.slug || "unknown"} · ${today()}_\n`); console.log(`✓ pattern ${path.basename(p)}`);
}

// ---------- search ----------
function search(q, { code = false } = {}) {
  if (!q) { console.error("Usage: search <query> [--code]"); process.exit(1); }
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  const files = ["profile.md", "lessons.md", ...fs.readdirSync(path.join(BRAIN, "projects")).map((f) => `projects/${f}`), ...fs.readdirSync(path.join(BRAIN, "patterns")).map((f) => `patterns/${f}`)];
  const hits = [];
  for (const f of files) {
    read(path.join(BRAIN, f)).split("\n").forEach((line, i) => {
      const l = line.toLowerCase(); const score = terms.filter((t) => l.includes(t)).length;
      if (score) hits.push({ score, ref: `${f}:${i + 1}`, line: line.trim() });
    });
  }
  hits.sort((a, b) => b.score - a.score);
  console.log(`## Brain (${hits.length} hits)`);
  console.log(hits.slice(0, 30).map((h) => `- ${h.ref}  ${clip(h.line, 200)}`).join("\n") || "- none");
  if (!code) return;
  console.log(`\n## Code across projects`);
  const projects = sorted().filter((e) => exists(e.path));
  for (const e of projects) {
    const out = has("rg")
      ? run("rg", ["-n", "-i", "--max-count", "3", "--max-columns", "200", "-g", "!node_modules", "-g", "!dist", "-g", "!.next", "-g", "!*.lock", "-g", "!package-lock.json", q, e.path], { timeout: 15000 })
      : run("grep", ["-rniI", "-m", "3", "--exclude-dir=node_modules", "--exclude-dir=.git", "--exclude-dir=dist", "--exclude-dir=.next", q, e.path], { timeout: 15000 });
    if (out) console.log(`### ${e.name}\n` + out.split("\n").slice(0, 12).map((l) => "  " + clip(l.replace(e.path + path.sep, ""), 220)).join("\n"));
  }
}

// ---------- packs ----------
function projectSettings(cwd) {
  const e = current(cwd); if (!e) { console.error("Not inside a project."); process.exit(1); }
  const p = path.join(e.path, ".claude", "settings.json");
  return { e, p, s: readJSON(p, {}) };
}
function suggestPacks(stack) {
  const s = new Set(stack); const out = new Set();
  if (["Next.js", "React", "Vue", "Nuxt", "Svelte", "SvelteKit", "Astro", "Remix", "shadcn/ui", "Tailwind", "Expo", "React Native"].some((x) => s.has(x))) out.add("design");
  if (["Supabase", "Prisma", "Drizzle", "Express", "Hono", "Fastify", "NestJS", "Convex", "Python", "Go"].some((x) => s.has(x))) out.add("backend");
  if (s.has("Vercel")) out.add("ops");
  if (s.has("Spec Kit")) out.add("build");
  return [...out];
}
function packs(action, names, cwd) {
  const { packs: all } = parseDeps();
  if (!action || action === "list") {
    const { e, s } = projectSettings(cwd); const en = s.enabledPlugins || {};
    console.log(`Packs for ${e.name} (core is always on):`);
    for (const [name, list] of Object.entries(all)) {
      const on = name === "core" || list.every((x) => en[x.plugin] === true);
      const cost = list.reduce((a, x) => a + x.cost, 0);
      console.log(`- ${on ? "●" : "○"} ${name.padEnd(8)} ${String(list.length).padStart(2)} plugins · ~${cost.toLocaleString()} tok · ${list.map((x) => x.plugin.split("@")[0]).join(", ")}`);
    }
    const sug = suggestPacks(e.stack).filter((n) => !all[n]?.every((x) => en[x.plugin] === true));
    if (sug.length) console.log(`\nSuggested for this stack: ${sug.join(", ")}  →  /morpheus:pack add ${sug.join(" ")}`);
    return;
  }
  if (action === "suggest") { console.log(suggestPacks(current(cwd)?.stack || []).join(" ")); return; }
  if (!["add", "remove"].includes(action)) { console.error("Usage: pack [list|add|remove|suggest] <names…>"); process.exit(1); }
  const { e, p, s } = projectSettings(cwd);
  s.enabledPlugins ||= {};
  for (const n of names) {
    if (n === "core") { console.log("core is always on."); continue; }
    if (!all[n]) { console.error(`Unknown pack "${n}". Packs: ${Object.keys(all).join(", ")}`); continue; }
    for (const { plugin } of all[n]) action === "add" ? (s.enabledPlugins[plugin] = true) : delete s.enabledPlugins[plugin];
    console.log(`✓ ${action === "add" ? "enabled" : "disabled"} ${n} in ${e.name}`);
  }
  writeAtomic(p, JSON.stringify(s, null, 2) + "\n");
  console.log("Restart Claude Code (or run /reload-plugins) to apply.");
}

// ---------- sync ----------
function sync({ quiet = false } = {}) {
  if (!exists(path.join(BRAIN, ".git"))) { if (!quiet) console.log(`Brain is not a git repo. To sync across machines:\n  cd ${BRAIN} && git init -b main && git remote add origin <PRIVATE repo url>`); return; }
  git(BRAIN, ["add", "-A"]);
  if (git(BRAIN, ["status", "--porcelain"])) git(BRAIN, ["commit", "-qm", `brain: ${new Date().toISOString()}`]);
  if (quiet) return;
  if (git(BRAIN, ["remote"])) {
    const pull = spawnSync("git", ["-C", BRAIN, "pull", "--rebase", "-q"], { stdio: "inherit" });
    const push = spawnSync("git", ["-C", BRAIN, "push", "-q", "-u", "origin", "HEAD"], { stdio: "inherit" });
    console.log(pull.status === 0 && push.status === 0 ? "✓ brain synced" : "! sync had problems (see above)");
  } else console.log("✓ committed locally (no remote configured)");
}

// ---------- doctor ----------
function doctor() {
  const ok = (b, m, fix = "") => console.log(`${b ? "✓" : "✗"} ${m}${!b && fix ? `  →  ${fix}` : ""}`);
  console.log("# Morpheus doctor\n");
  ok(+process.versions.node.split(".")[0] >= 18, `node ${process.versions.node}`, "install Node 18+");
  for (const [b, fix] of [["git", "install git"], ["claude", "curl -fsSL https://claude.ai/install.sh | bash"], ["npx", "comes with Node"], ["uv", "curl -LsSf https://astral.sh/uv/install.sh | sh (Spec Kit)"], ["python3", "needed by ui-ux-pro-max search"], ["gh", "optional: GitHub CLI"], ["rg", "optional: faster cross-project code search"]]) ok(has(b), b, fix);
  try { fs.accessSync(BRAIN, fs.constants.W_OK); ok(true, `brain writable: ${BRAIN}`); } catch { ok(false, "brain writable", `mkdir -p ${BRAIN}`); }
  const missing = sorted().filter((e) => !exists(e.path));
  ok(!missing.length, `registry: ${sorted().length} projects${missing.length ? `, ${missing.length} missing paths` : ""}`, "node brain.mjs prune");
  ok(exists(path.join(BRAIN, ".git")), "brain under git (sync/backup)", `cd ${BRAIN} && git init -b main`);
  let list = null; if (has("claude")) { try { list = JSON.parse(run("claude", ["plugin", "list", "--json"], { timeout: 30000 })); } catch {} }
  if (list) {
    const installed = new Set(list.map((p) => p.id));
    const { packs: all } = parseDeps();
    for (const [name, l] of Object.entries(all)) {
      const miss = l.filter((x) => !installed.has(x.plugin)).map((x) => x.plugin);
      ok(!miss.length, `pack ${name}: ${l.length - miss.length}/${l.length} installed`, miss.length ? `re-run install.sh (missing: ${miss.map((m) => m.split("@")[0]).join(", ")})` : "");
    }
  } else ok(false, "plugin inventory", "could not run `claude plugin list --json`");
}
function prune() {
  const reg = loadReg(); let n = 0;
  for (const [k, e] of Object.entries(reg)) if (!exists(e.path)) { delete reg[k]; n++; }
  saveReg(reg); console.log(`✓ pruned ${n} missing project(s); briefs kept in projects/`);
}

// ---------- hooks ----------
function sessionStart() {
  ensureBrain();
  let input = {}; try { input = JSON.parse(readStdin() || "{}"); } catch {}
  let cur = null; try { cur = current(input.cwd); } catch {}
  const all = sorted(); const others = all.filter((e) => e.slug !== cur?.slug);
  const out = [`# 🧠 Morpheus online · ${all.length} project${all.length === 1 ? "" : "s"} in memory`,
    `When the user says "Morpheus" or asks to plan/design/architect/build/ship, load the \`morpheus:morpheus\` skill. Brain: ${BRAIN} · CLI: node "${SELF}" <command>`];
  if (cur) {
    out.push(`\n## Current: ${cur.name} (\`${cur.slug}\`) · ${cur.stack.join(", ") || "stack unknown"}`);
    out.push(clip(read(briefPath(cur.slug)).replace(/^# .*\n+/, ""), 1800));
    const en = readJSON(path.join(cur.path, ".claude", "settings.json"), {}).enabledPlugins || {};
    const { packs: all } = parseDeps();
    const on = Object.entries(all).filter(([n, l]) => n !== "core" && l.every((x) => en[x.plugin] === true)).map(([n]) => n);
    const sug = suggestPacks(cur.stack).filter((n) => !on.includes(n));
    out.push(`Packs: core${on.length ? ", " + on.join(", ") : ""}${sug.length ? ` · suggested: ${sug.join(", ")} (/morpheus:pack add ${sug.join(" ")})` : ""}`);
  }
  if (others.length) out.push(`\n## Other projects\n` + others.slice(0, 8).map((e) => `- ${e.name} (\`${e.slug}\`) · ${(e.stack || []).slice(0, 4).join(", ")}`).join("\n") + (others.length > 8 ? `\n- …${others.length - 8} more (/morpheus:projects)` : ""));
  const prefs = read(path.join(BRAIN, "profile.md")).split("\n").filter((l) => l.startsWith("- ")).slice(-12);
  if (prefs.length) out.push("\n## Profile\n" + prefs.join("\n"));
  const lessons = read(path.join(BRAIN, "lessons.md")).split("\n").filter((l) => l.startsWith("- ")).slice(-8);
  if (lessons.length) out.push("\n## Recent lessons\n" + lessons.join("\n"));
  process.stdout.write(out.join("\n") + "\n");
}
function captureCheck() {
  // Stop hook: after a substantial session with no memory update, ask Morpheus once to record what matters.
  if (process.env.MORPHEUS_AUTOCAPTURE === "0") return;
  let input = {}; try { input = JSON.parse(readStdin() || "{}"); } catch { return; }
  if (input.stop_hook_active || !input.session_id || !input.transcript_path) return;
  const flag = path.join(STATE, `captured-${slugify(input.session_id)}`);
  if (exists(flag)) return;
  let edits = 0, brainWrites = 0;
  for (const line of read(input.transcript_path).split("\n")) {
    if (!line.includes('"tool_use"')) continue;
    let ev; try { ev = JSON.parse(line); } catch { continue; }
    for (const c of ev?.message?.content || []) {
      if (c?.type !== "tool_use") continue;
      const fp = c.input?.file_path || c.input?.notebook_path || "";
      if (EDIT_TOOLS.has(c.name)) (fp && under(fp, BRAIN) ? brainWrites++ : edits++);
      if (c.name === "Bash" && /brain\.mjs"?\s+(note|lesson|pref|pattern)/.test(c.input?.command || "")) brainWrites++;
    }
  }
  if (edits < CAPTURE_MIN_EDITS || brainWrites > 0) return;
  fs.mkdirSync(STATE, { recursive: true }); fs.writeFileSync(flag, new Date().toISOString());
  process.stdout.write(JSON.stringify({ decision: "block", reason: `Morpheus memory checkpoint (${edits} file edits this session, no brain update yet). Record only durable facts with the brain CLI (node "${SELF}"): \`note decisions|status|gotchas "<text>"\` for this project, \`lesson "<text>"\` if it helps other projects, \`pref "<text>"\` for any new user preference. If nothing is worth keeping, reply "nothing to record". One short line to the user, then stop.` }));
}

// ---------- main ----------
const [cmd, ...rest] = process.argv.slice(2);
const flags = new Set(rest.filter((a) => a.startsWith("--")));
const args = rest.filter((a) => !a.startsWith("--"));
const HELP = `Morpheus brain CLI
  projects [query]            list/search known projects
  show <query>                registry entry + brief + CLAUDE.md/README of a project
  search <query> [--code]     full-text search of the brain (+ code across all projects)
  note <section> "<text>"     section: ${Object.keys(SECTIONS).join("|")} (current project)
  lesson "<text>"             cross-project lesson
  pref "<text>"               user preference
  pattern <name> < file.md    save a reusable pattern
  pack [list|add|remove|suggest] [packs…]   per-project plugin packs
  register [path] · prune · sync · doctor · path`;
try {
  ensureBrain();
  switch (cmd) {
    case "session-start": sessionStart(); break;
    case "capture-check": captureCheck(); break;
    case "autosave": sync({ quiet: true }); break;
    case "register": { const e = register(args[0] || process.cwd()); console.log(e ? JSON.stringify(e, null, 2) : "Not a project directory."); break; }
    case "projects": case "find": { const r = findProjects(args.join(" ")); console.log(r.length ? r.map(fmtRow).join("\n") : "No matching projects."); break; }
    case "show": {
      const e = findProjects(args.join(" "))[0]; if (!e) { console.log("No matching project."); break; }
      console.log(JSON.stringify(e, null, 2) + "\n\n" + read(briefPath(e.slug)));
      for (const f of ["CLAUDE.md", "README.md"]) { const t = read(path.join(e.path, f)); if (t) console.log(`\n--- ${f} ---\n` + clip(t, 3000)); }
      break;
    }
    case "search": search(args.join(" "), { code: flags.has("--code") }); break;
    case "note": note(args[0] || "", args.slice(1).join(" ")); break;
    case "lesson": lesson(args.join(" ")); break;
    case "pref": pref(args.join(" ")); break;
    case "pattern": pattern(args[0] || "pattern"); break;
    case "pack": packs(args[0], args.slice(1)); break;
    case "sync": sync(); break;
    case "doctor": doctor(); break;
    case "prune": prune(); break;
    case "path": console.log(BRAIN); break;
    default: console.log(HELP);
  }
} catch (err) {
  // Hooks must never break a session.
  if (!["session-start", "capture-check", "autosave"].includes(cmd)) { console.error(String(err?.stack || err)); process.exitCode = 1; }
}
