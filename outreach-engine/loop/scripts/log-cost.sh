#!/usr/bin/env bash
# usage: log-cost.sh <stage> [usd]
echo -e "$(date -Is 2>/dev/null || date)\t$1\t${2:-0}" >> "$(dirname "$0")/../memory/usage.log"
