#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

echo "Registering marketplace from $REPO_ROOT ..."
claude plugin marketplace add "$REPO_ROOT"

echo "Installing fsad-training-harness@fsad-training ..."
claude plugin install fsad-training-harness@fsad-training -y

echo
echo "Done. Run 'claude plugin list' to confirm fsad-training-harness is installed."
