# Morpheus installer for Windows (PowerShell). Installs Morpheus for every project (user scope).
# Usage:  .\install.ps1     Optional env: $env:MORPHEUS_SOURCE="owner/morpheus"; $env:MORPHEUS_PROJECTS="C:\code;D:\work"
$ErrorActionPreference = "Continue"
$Dir = Split-Path -Parent $MyInvocation.MyCommand.Path

foreach ($c in "claude","node","npx","git") {
  if (-not (Get-Command $c -ErrorAction SilentlyContinue)) { Write-Error "$c is required."; exit 1 }
}
foreach ($c in "uv","python","gh") {
  if (-not (Get-Command $c -ErrorAction SilentlyContinue)) { Write-Warning "$c not found (recommended)." }
}

$Source = $env:MORPHEUS_SOURCE
if (-not $Source) {
  $remote = git -C $Dir config --get remote.origin.url 2>$null
  if ($remote -match 'github\.com[:/]([^/]+/[^/.]+)') { $Source = $Matches[1] } else { $Source = $Dir }
}

Write-Host "> Adding marketplaces..." -ForegroundColor Green
Get-Content "$Dir\dependencies.txt" | Where-Object { $_ -like "@marketplace *" } | ForEach-Object {
  $src = ($_ -split '\|')[1]; claude plugin marketplace add $src --scope user *> $null; Write-Host "   $src"
}
claude plugin marketplace add $Source --scope user *> $null
claude plugin marketplace update *> $null

Write-Host "> Installing plugins..." -ForegroundColor Green
$plugins = @(Get-Content "$Dir\dependencies.txt" | Where-Object { $_ -and $_ -notmatch '^(#|@)' }) + "morpheus@morpheus"
$failed = @()
foreach ($p in $plugins) { claude plugin install $p --scope user -y *> $null; if ($LASTEXITCODE -ne 0) { $failed += $p } }
Write-Host "   $($plugins.Count - $failed.Count) plugins installed"
if ($failed) { Write-Warning "Failed: $($failed -join ', ')" }

if ($env:TWENTYFIRST_API_KEY) {
  claude mcp add magic-ui --scope user -e "API_KEY=$env:TWENTYFIRST_API_KEY" -- npx -y "@21st-dev/magic@latest" *> $null
}

Write-Host "> Creating the brain at ~\.morpheus..." -ForegroundColor Green
node "$Dir\plugin\scripts\brain.mjs" projects *> $null

$dirs = @()
if ($env:MORPHEUS_PROJECTS) { $dirs = $env:MORPHEUS_PROJECTS -split ';' }
else { foreach ($d in "projects","code","dev","src","repos","source\repos") { $p = Join-Path $HOME $d; if (Test-Path $p) { $dirs += $p } } }
$env:MORPHEUS_DIRS = ($dirs -join "`n")
@'
const fs = require("fs"), os = require("os"), path = require("path");
const p = path.join(os.homedir(), ".claude", "settings.json");
fs.mkdirSync(path.dirname(p), { recursive: true });
let s = {}; try { s = JSON.parse(fs.readFileSync(p, "utf8")); } catch {}
if (fs.existsSync(p)) fs.copyFileSync(p, p + ".bak-morpheus");
s.permissions ??= {};
const dirs = [path.join(os.homedir(), ".morpheus"), ...(process.env.MORPHEUS_DIRS || "").split("\n").filter(Boolean)];
s.permissions.additionalDirectories = [...new Set([...(s.permissions.additionalDirectories || []), ...dirs])];
s.permissions.allow = [...new Set([...(s.permissions.allow || []), "Read(~/.morpheus/**)", "Edit(~/.morpheus/**)", "Write(~/.morpheus/**)", "mcp__plugin_morpheus_morpheus-memory", "mcp__plugin_morpheus_sequential-thinking"])];
s.permissions.deny = [...new Set([...(s.permissions.deny || []), "Read(**/.env)", "Read(**/.env.*)"])];
s.env ??= {}; s.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS ??= "1";
fs.writeFileSync(p, JSON.stringify(s, null, 2) + "\n");
'@ | node -

$md = Join-Path $HOME ".claude\CLAUDE.md"
if (-not (Test-Path $md)) { New-Item -ItemType File -Path $md -Force | Out-Null }
if (-not (Select-String -Path $md -Pattern "BEGIN MORPHEUS" -Quiet)) {
  Add-Content $md @"

<!-- BEGIN MORPHEUS -->
## Morpheus
Morpheus is my global engineering brain (plugin ``morpheus``). Whenever I say "Morpheus", or ask to
plan, design, architect, build or ship something, load the ``morpheus:morpheus`` skill and act as
Morpheus. Global memory lives in ``~/.morpheus/``. Use it to reuse knowledge across projects and keep it updated.
<!-- END MORPHEUS -->
"@
}

if (-not (Test-Path $PROFILE)) { New-Item -ItemType File -Path $PROFILE -Force | Out-Null }
if (-not (Select-String -Path $PROFILE -Pattern "function morpheus" -Quiet)) {
  Add-Content $PROFILE "`n# Morpheus`nfunction morpheus { claude --agent morpheus:morpheus --add-dir `"`$HOME\.morpheus`" @args }"
}

Write-Host "`n  Morpheus is installed. Open a new terminal and run 'morpheus' in any project." -ForegroundColor Cyan
Write-Host "  Then run /mcp once to log in to GitHub, Figma, Linear, Notion, Supabase, Vercel, Sentry."
