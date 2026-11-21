# Morpheus installer for Windows (PowerShell). Installs Morpheus for every project (user scope).
# Usage:  install.cmd   (from Command Prompt / double-click)   or   powershell -ExecutionPolicy Bypass -File install.ps1
# Optional env: $env:MORPHEUS_SOURCE="owner/morpheus"; $env:MORPHEUS_PROJECTS="C:\code;D:\work"
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

$Deps = "$Dir\plugin\dependencies.txt"
$GlobalPacks = @("core") + @(($env:MORPHEUS_PACKS -split ',') | Where-Object { $_ })
Write-Host "> Adding marketplaces..." -ForegroundColor Green
Get-Content $Deps | Where-Object { $_ -like "@marketplace *" } | ForEach-Object {
  $parts = $_.Substring(13) -split '\|'; $src = $parts[1]; if ($parts.Count -gt 2 -and $parts[2]) { $src = "$($parts[1])#$($parts[2])" }
  $out = (claude plugin marketplace add $src --scope user 2>&1 | Out-String)
  if ($LASTEXITCODE -ne 0 -and $out -notmatch 'already') { Write-Warning "Marketplace ${src}: $($out.Trim())" } else { Write-Host "   $src" }
}
$out = (claude plugin marketplace add $Source --scope user 2>&1 | Out-String)
if ($LASTEXITCODE -ne 0 -and $out -notmatch 'already') { Write-Warning "Marketplace morpheus: $($out.Trim())" }
claude plugin marketplace update *> $null

Write-Host "> Installing plugins (global packs: $($GlobalPacks -join ', '))..." -ForegroundColor Green
$on = 0; $off = 0; $failed = @()
foreach ($line in Get-Content $Deps) {
  $l = ($line -replace '\s+#.*$', '').Trim()
  if (-not $l -or $l.StartsWith('#') -or $l.StartsWith('@')) { continue }
  $pack, $plugin = $l -split '\s+'
  $out = (claude plugin install $plugin --scope user -y 2>&1 | Out-String)
  if ($LASTEXITCODE -ne 0) { $failed += $plugin; Write-Warning "${plugin}: $(($out.Trim() -split "`n")[-1])"; continue }
  if ($GlobalPacks -contains $pack) { claude plugin enable $plugin --scope user *> $null; $on++ }
  else { claude plugin disable $plugin --scope user *> $null; $off++ }
}
claude plugin install morpheus@morpheus --scope user -y *> $null
claude plugin enable morpheus@morpheus --scope user *> $null
Write-Host "   $on plugins on everywhere, $off available per project (/morpheus:pack add <pack>)"
if ($failed) { Write-Warning "Failed: $($failed -join ', ')" }

if ($env:TWENTYFIRST_API_KEY) {
  claude mcp add magic-ui --scope user -e "API_KEY=$env:TWENTYFIRST_API_KEY" -- npx -y "@21st-dev/magic@latest" *> $null
}

Write-Host "> Creating the brain at ~\.morpheus..." -ForegroundColor Green
node "$Dir\plugin\scripts\brain.mjs" projects *> $null

$dirs = @()
if ($env:MORPHEUS_PROJECTS) { $dirs = $env:MORPHEUS_PROJECTS -split ';' }
else {
  $found = @(); foreach ($d in "projects","code","dev","src","repos","source\repos") { $p = Join-Path $HOME $d; if (Test-Path $p) { $found += $p } }
  if ($found) { $a = Read-Host "Let Morpheus read your other projects in: $($found -join ', ') ? [y/N]"; if ($a -match '^[Yy]') { $dirs = $found } }
}
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
s.permissions.allow = [...new Set([...(s.permissions.allow || []), "Read(~/.morpheus/**)", "mcp__plugin_morpheus_sequential-thinking", "mcp__plugin_morpheus_shadcn"])];
const deny = ["Read(**/.env)", "Read(**/.env.local)", "Read(**/.env.*.local)", "Read(**/.env.production)", "Read(**/.env.development)", "Read(**/.env.test)",
  "Read(~/.ssh/**)", "Read(~/.aws/**)", "Read(~/.gnupg/**)", "Read(~/.kube/**)", "Read(~/.docker/config.json)", "Read(~/.config/gh/**)",
  "Read(~/.netrc)", "Read(~/.npmrc)", "Read(~/.pypirc)", "Read(~/.pgpass)", "Read(~/.git-credentials)", "Read(**/*.pem)", "Read(**/*.key)", "Read(**/id_rsa*)", "Read(**/id_ed25519*)"];
s.permissions.deny = [...new Set([...(s.permissions.deny || []), ...deny])];
s.env ??= {}; s.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS ??= "1"; s.env.VERCEL_PLUGIN_TELEMETRY ??= "off";
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

# 'morpheus' command for Command Prompt, PowerShell and Windows Terminal: a small .cmd launcher on the user PATH.
$bin = Join-Path $HOME ".local\bin"
New-Item -ItemType Directory -Force -Path $bin | Out-Null
$launcher = "@echo off`r`nclaude --agent morpheus:morpheus --add-dir `"%USERPROFILE%\.morpheus`" %*`r`n"
Set-Content -Path (Join-Path $bin "morpheus.cmd") -Value $launcher -Encoding ASCII -NoNewline
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if (-not $userPath) { $userPath = "" }
if (-not (($userPath -split ';') | Where-Object { $_.TrimEnd('\') -ieq $bin })) {
  [Environment]::SetEnvironmentVariable("Path", (($userPath.TrimEnd(';') + ";" + $bin).TrimStart(';')), "User")
  Write-Host "> Added $bin to your user PATH (for the 'morpheus' command)" -ForegroundColor Green
}

Write-Host "`n  Morpheus is installed. Open a NEW terminal window and run 'morpheus' in any project folder." -ForegroundColor Cyan
Write-Host "  Then run /mcp once to log in to GitHub, Figma, Linear, Notion, Supabase, Vercel, Sentry."
