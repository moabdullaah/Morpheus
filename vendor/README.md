# Bundled third-party plugins

`wshobson/` contains plugins copied from https://github.com/wshobson/agents at commit
`42203085cfc5736204bf0f6d436dff7e1da0bf3f`, under the MIT License (see `wshobson/LICENSE`, © 2024 Seth Hobson).

They're bundled so Morpheus doesn't depend on the upstream marketplace name `claude-code-workflows`, which
clashes with other marketplaces of the same name. That also means you install exactly the audited copy
(no hooks, no MCP servers, no runtime network calls at audit time). `.codex-plugin/` folders were removed.
Refresh with `tools/vendor-sync.sh`, which shows risky changes before copying.
