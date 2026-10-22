# Creates sourcecodes.zip from app\ (excludes node_modules, .next, data files and secrets).
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$app = Join-Path $root "app"
$zip = Join-Path $root "sourcecodes.zip"
$staging = Join-Path ([System.IO.Path]::GetTempPath()) ("zenithium_zip_" + [guid]::NewGuid())

if (Test-Path $zip) { Remove-Item $zip -Force }
$excludeDirs = @("node_modules", ".next", "data")
$excludeFiles = @(".env", "next-env.d.ts", "AGENTS.md", "CLAUDE.md")

Get-ChildItem -Path $app -Recurse -File | Where-Object {
    $rel = $_.FullName.Substring($app.Length + 1)
    $top = $rel.Split([IO.Path]::DirectorySeparatorChar)[0]
    -not ($excludeDirs -contains $top) -and -not ($excludeFiles -contains $_.Name) -and -not $_.Name.EndsWith(".tmp")
} | ForEach-Object {
    $rel = $_.FullName.Substring($app.Length + 1)
    $dest = Join-Path $staging $rel
    New-Item -ItemType Directory -Force -Path (Split-Path -LiteralPath $dest) | Out-Null
    Copy-Item -LiteralPath $_.FullName -Destination $dest   # LiteralPath: folder names like [...path] contain wildcard chars
}

Compress-Archive -Path (Join-Path $staging "*") -DestinationPath $zip
Remove-Item $staging -Recurse -Force
Write-Host "Created $zip"
