#!/usr/bin/env bash
# Runs all tests on saved fixtures: testthat, then node --test. No network.
set -euo pipefail
cd "$(dirname "$0")"

Rscript tests/testthat.R
node --test tests/js/
