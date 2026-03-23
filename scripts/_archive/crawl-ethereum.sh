#!/usr/bin/env bash
# crawl-ethereum.sh
#
# Crawls the Ethereum execution-layer P2P network using go-ethereum's devp2p tool.
# Produces a nodes.json file ready for process-eth-snapshot.ts.
#
# Usage:
#   ./scripts/crawl-ethereum.sh [output_file] [timeout]
#
# Defaults:
#   output_file = nodes.json
#   timeout     = 30m
#
# Prerequisites:
#   brew install go   (Go 1.21+)
#
# Examples:
#   ./scripts/crawl-ethereum.sh                      # → nodes.json, 30min
#   ./scripts/crawl-ethereum.sh my-crawl.json 60m    # → my-crawl.json, 60min

set -euo pipefail

OUTPUT="${1:-nodes.json}"
TIMEOUT="${2:-30m}"
START_TIME=$(date +%s)

echo "═══════════════════════════════════════════════════════════════"
echo " Ethereum Node Crawler — go-ethereum devp2p/discv4"
echo "═══════════════════════════════════════════════════════════════"
echo " Output  : $OUTPUT"
echo " Timeout : $TIMEOUT"
echo " Started : $(date)"
echo "───────────────────────────────────────────────────────────────"
echo ""

# Check Go is available
if ! command -v go &>/dev/null; then
    echo "Error: Go is not installed."
    echo "Install it with: brew install go"
    exit 1
fi

echo "Go version: $(go version)"
echo ""
echo "Starting crawl (this will take ~${TIMEOUT})..."
echo "Press Ctrl+C to stop early — partial results will be saved."
echo ""

go run github.com/ethereum/go-ethereum/cmd/devp2p@latest \
    discv4 crawl \
    -timeout "$TIMEOUT" \
    "$OUTPUT"

END_TIME=$(date +%s)
DURATION=$(( (END_TIME - START_TIME) / 60 ))

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo " Crawl complete!"
echo " Duration : ${DURATION} minutes"
echo " Output   : $OUTPUT"
echo " Nodes    : $(python3 -c "import json,sys; d=json.load(open('$OUTPUT')); print(len(d))" 2>/dev/null || echo '(run script to count)')"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Next step: process the snapshot"
echo "  npx tsx scripts/process-eth-snapshot.ts $OUTPUT --crawl-duration-min=${DURATION}"
echo ""
