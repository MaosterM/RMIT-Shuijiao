#!/usr/bin/env bash
# Creates sourcecodes.zip from app/ (excludes node_modules, .next, data files and secrets).
set -euo pipefail
cd "$(dirname "$0")"
rm -f sourcecodes.zip
cd app
zip -r ../sourcecodes.zip . \
  -x "node_modules/*" ".next/*" "data/*" "*.tmp" ".env" "init/.env" "next-env.d.ts" "AGENTS.md" "CLAUDE.md"
cd ..
echo "Created $(pwd)/sourcecodes.zip"
