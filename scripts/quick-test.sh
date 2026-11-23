#!/usr/bin/env bash
# MemoLib Quick Test Suite Runner
# Executes critical tests only (2-3 minutes)

set -e

echo "=================================="
echo "MemoLib Quick Test Suite"
echo "=================================="
echo ""
echo "Starting at: $(date)"
echo ""

TESTS_PASSED=0
TESTS_FAILED=0

run_test() {
    local name=$1
    local cmd=$2
    
    echo "[INF] Running: $name"
    echo "[INF] Command: $cmd"
    
    if eval "$cmd"; then
        echo "[OK]  $name PASSED"
        ((TESTS_PASSED++))
    else
        echo "[ERR] $name FAILED"
        ((TESTS_FAILED++))
    fi
    echo ""
}

# Core tests
echo "Phase 1: Unit Tests"
run_test "Unit Tests" "npm run test:unit"

echo "Phase 2: CI Tests"
run_test "CI Tests" "npm run test:ci"

echo "Phase 3: Type Check"
run_test "TypeScript" "npm run type-check"

echo "Phase 4: Linting"
run_test "ESLint" "npm run lint"

# Summary
echo "=================================="
echo "Test Summary"
echo "=================================="
echo "Passed: $TESTS_PASSED"
echo "Failed: $TESTS_FAILED"
echo "Total:  $((TESTS_PASSED + TESTS_FAILED))"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo "[GO] All tests passed!"
    exit 0
else
    echo "[STOP] Some tests failed"
    exit 1
fi
