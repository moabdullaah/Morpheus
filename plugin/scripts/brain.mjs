#!/usr/bin/env node
// Morpheus brain CLI: manages ~/.morpheus (registry, notes, lessons) and feeds context to Claude.
// Usage: node brain.mjs <session-start|projects|find <q>|show <name>|register [path]|path>
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SELF = fileURLToPath(import.meta.url);

const HOME = os.homedir();
const BRAIN = process.env.MORPHEUS_HOME || path.join(HOME, ".morpheus");
const REG = path.join(BRAIN, "projects.json");
const MAX_LIST = 25;

const read = (p, d = "") => { try { return fs.readFileSync(p, "utf8"); } catch { return d; } };
const exists = (p) => { try { fs.accessSync(p); return true; } catch { return false; } };
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "project";
const clip = (s, n) => (s.length > n ? s.slice(0, n) + "\n…(truncated)" : s);

function ensureBrain() {
  fs.mkdirSync(path.join(BRAIN, "projects"), { recursive: true });
  fs.mkdirSync(path.join(BRAIN, "patterns"), { recursive: true });
  const seed = {
    "profile.md": "# Profile & preferences\n\n<!-- Morpheus: record how the user likes to work: stack, style, tone, tools. -->\n\n## Default stack\n- Next.js (App Router) + TypeScript strict + Tailwind + shadcn/ui\n- Supabase (Postgres, Auth, RLS) · Vitest + Playwright · Vercel + Sentry · pnpm\n",
    "lessons.md": "# Lessons learned (cross-project)\n\n<!-- Morpheus: append dated, one-line lessons. Format: - YYYY-MM-DD [project] lesson -->\n",
    "README.md": "# Morpheus brain\n\nGlobal memory shared by every project.\n\n- `profile.md`: user preferences and default stack\n- `lessons.md`: cross-project lessons\n- `projects.json`: registry of every project Morpheus has seen\n- `projects/<slug>.md`: brief per project (purpose, stack, decisions, status)\n- `patterns/`: reusable architectures, snippets, prompts\n- `memory.jsonl`: knowledge graph (morpheus-memory MCP)\n",
  };
  for (const [f, c] of Object.entries(seed)) {
    const p = path.join(BRAIN, f);
    if (!exists(p)) fs.writeFileSync(p, c);
  }
  if (!exists(REG)) fs.writeFileSync(REG, "{}\n");
}

const loadReg = () => { try { return JSON.parse(read(REG, "{}")); } catch { return {}; } };
const saveReg = (r) => {
  const tmp = REG + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(r, null, 2) + "\n");
  fs.renameSync(tmp, REG);
};

function git(dir, args) {
  try { return execFileSync("git", ["-C", dir, ...args], { stdio: ["ignore", "pipe", "ignore"], timeout: 3000 }).toString().trim(); }
  catch { return ""; }
}

function detectStack(dir) {
  const s = new Set();
  const pkg = (() => { try { return JSON.parse(read(path.join(dir, "package.json"))); } catch { return null; } })();
  if (pkg) {
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    const map = { next: "Next.js", react: "React", vue: "Vue", svelte: "Svelte", "@sveltejs/kit": "SvelteKit", astro: "Astro", "@remix-run/react": "Remix", express: "Express", hono: "Hono", "@nestjs/core": "NestJS", tailwindcss: "Tailwind", "@supabase/supabase-js": "Supabase", prisma: "Prisma", "drizzle-orm": "Drizzle", typescript: "TypeScript", electron: "Electron", expo: "Expo", "react-native": "React Native", vitest: "Vitest", "@playwright/test": "Playwright", "@anthropic-ai/sdk": "Claude API" };
    for (const [k, v] of Object.entries(map)) if (deps && deps[k]) s.add(v);
    if (!s.size) s.add("Node.js");
  }
  const files = { "pyproject.toml": "Python", "requirements.txt": "Python", "go.mod": "Go", "Cargo.toml": "Rust", "Gemfile": "Ruby", "composer.json": "PHP", "pom.xml": "Java", "build.gradle": "JVM", "pubspec.yaml": "Flutter", "Dockerfile": "Docker", ".specify": "Spec Kit", "components.json": "shadcn/ui" };
  for (const [f, v] of Object.entries(files)) if (exists(path.join(dir, f))) s.add(v);
  return [...s];
}

function projectRoot(start) {
  const top = git(start, ["rev-parse", "--show-toplevel"]);
  if (top) return top;
  const markers = ["package.json", "pyproject.toml", "go.mod", "Cargo.toml", "CLAUDE.md", ".specify"];
  return markers.some((m) => exists(path.join(start, m))) ? start : null;
}

function register(dir) {
  const root = projectRoot(path.resolve(dir));
  if (!root || root === HOME || root === path.parse(root).root) return null;
  const reg = loadReg();
  let entry = Object.values(reg).find((e) => e.path === root);
  let slug = entry?.slug;
  if (!slug) {
    slug = slugify(path.basename(root));
    let i = 2;
    while (reg[slug] && reg[slug].path !== root) slug = `${slugify(path.basename(root))}-${i++}`;
  }
  const pkgDesc = (() => { try { return JSON.parse(read(path.join(root, "package.json"))).description || ""; } catch { return ""; } })();
  entry = {
    ...reg[slug],
    slug,
    name: reg[slug]?.name || path.basename(root),
    path: root,
    remote: git(root, ["config", "--get", "remote.origin.url"]) || reg[slug]?.remote || "",
    branch: git(root, ["rev-parse", "--abbrev-ref", "HEAD"]),
    stack: detectStack(root),
    description: reg[slug]?.description || pkgDesc,
    firstSeen: reg[slug]?.firstSeen || new Date().toISOString(),
    lastSeen: new Date().toISOString(),
  };
  reg[slug] = entry;
  saveReg(reg);
  const brief = path.join(BRAIN, "projects", `${slug}.md`);
  if (!exists(brief)) {
    fs.writeFileSync(brief, `# ${entry.name}\n\n- **Path:** ${root}\n- **Remote:** ${entry.remote || "(none)"}\n- **Stack:** ${entry.stack.join(", ") || "(unknown)"}\n\n## Purpose\n_(unknown: Morpheus should fill this in)_\n\n## Key decisions\n\n## Status / next steps\n\n## Gotchas\n`);
  }
  return entry;
}

function listProjects(filter) {
  const reg = loadReg();
  let rows = Object.values(reg).sort((a, b) => (b.lastSeen || "").localeCompare(a.lastSeen || ""));
  if (filter) {
    const q = filter.toLowerCase();
    rows = rows.filter((e) => [e.slug, e.name, e.path, e.description, ...(e.stack || [])].join(" ").toLowerCase().includes(q));
  }
  return rows;
}

const fmtRow = (e) => `- **${e.name}** (\`${e.slug}\`): ${e.path}${e.stack?.length ? ` · ${e.stack.join(", ")}` : ""}${e.description ? ` · ${e.description}` : ""}${exists(e.path) ? "" : " · ⚠ path missing"}`;

function sessionStart() {
  ensureBrain();
  let current = null;
  try { current = register(process.env.CLAUDE_PROJECT_DIR || process.cwd()); } catch {}
  const others = listProjects().filter((e) => !current || e.slug !== current.slug).slice(0, MAX_LIST);
  const out = [];
  out.push("# 🧠 Morpheus is online");
  out.push(`Morpheus is the user's global orchestrator brain. When the user says "Morpheus" (or /morpheus:morpheus), load the \`morpheus:morpheus\` skill and act as Morpheus.`);
  out.push(`Brain directory: ${BRAIN} (profile.md, lessons.md, projects/, patterns/, projects.json). Brain CLI: node "${SELF}" <projects|find|show|register>`);
  if (current) {
    out.push(`\n## Current project: ${current.name} (\`${current.slug}\`)\n${current.path} · ${current.stack.join(", ") || "stack unknown"}`);
    out.push(clip(read(path.join(BRAIN, "projects", `${current.slug}.md`)), 2500));
  } else {
    out.push("\n_Current directory is not a project; nothing registered._");
  }
  if (others.length) out.push(`\n## Other known projects (${others.length})\n` + others.map(fmtRow).join("\n"));
  const profile = read(path.join(BRAIN, "profile.md"));
  if (profile) out.push("\n## User profile\n" + clip(profile, 2000));
  const lessons = read(path.join(BRAIN, "lessons.md")).split("\n").filter((l) => l.startsWith("- ")).slice(-15);
  if (lessons.length) out.push("\n## Recent cross-project lessons\n" + lessons.join("\n"));
  process.stdout.write(out.join("\n") + "\n");
}

const [cmd, ...args] = process.argv.slice(2);
try {
  switch (cmd) {
    case "session-start": sessionStart(); break;
    case "path": console.log(BRAIN); break;
    case "register": { ensureBrain(); const e = register(args[0] || process.cwd()); console.log(e ? JSON.stringify(e, null, 2) : "Not a project directory."); break; }
    case "projects": case "find": { ensureBrain(); const rows = listProjects(args.join(" ")); console.log(rows.length ? rows.map(fmtRow).join("\n") : "No matching projects."); break; }
    case "show": {
      ensureBrain();
      const e = listProjects(args.join(" "))[0];
      if (!e) { console.log("No matching project."); break; }
      console.log(JSON.stringify(e, null, 2) + "\n\n" + read(path.join(BRAIN, "projects", `${e.slug}.md`)));
      for (const f of ["CLAUDE.md", "README.md"]) { const t = read(path.join(e.path, f)); if (t) console.log(`\n--- ${f} ---\n` + clip(t, 3000)); }
      break;
    }
    default: console.log("Usage: brain.mjs <session-start|projects|find <q>|show <name>|register [path]|path>");
  }
} catch (err) {
  // Never break a session because of the brain.
  if (cmd !== "session-start") { console.error(String(err)); process.exitCode = 1; }
}
