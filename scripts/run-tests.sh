#!/bin/bash

# Test execution script for appointment-api
# Usage: ./scripts/run-tests.sh [test-type] [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
TEST_TYPE="all"
COVERAGE=false
WATCH=false
VERBOSE=false
CI_MODE=false

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_help() {
    cat << EOF
Usage: $0 [TEST_TYPE] [OPTIONS]

TEST_TYPE:
    unit          Run unit tests only
    integration   Run integration tests only
    e2e           Run end-to-end tests
    performance   Run performance tests
    all           Run all tests (default)

OPTIONS:
    --coverage, -c      Generate coverage report
    --watch, -w         Watch for changes
    --verbose, -v       Verbose output
    --ci                CI mode (no interactive prompts)
    --help, -h          Show this help message

Examples:
    $0 unit --coverage
    $0 e2e --verbose
    $0 all --coverage --ci
EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        unit|integration|e2e|performance|all)
            TEST_TYPE="$1"
            shift
            ;;
        --coverage|-c)
            COVERAGE=true
            shift
            ;;
        --watch|-w)
            WATCH=true
            shift
            ;;
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --ci)
            CI_MODE=true
            shift
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    log_error "Bun is not installed. Please install Bun first."
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    log_info "Installing dependencies..."
    bun install
fi

# Generate Prisma client if needed
if [ ! -d "node_modules/.prisma" ] || [ "prisma/schema.prisma" -nt "node_modules/.prisma/client/index.js" ]; then
    log_info "Generating Prisma client..."
    bun run db:generate
fi

# Set environment variables for testing
export NODE_ENV=test
export DATABASE_URL=${DATABASE_URL:-"postgresql://postgres:postgres@localhost:5432/appointment_test"}
export REDIS_URL=${REDIS_URL:-"redis://localhost:6379"}

# Function to run tests
run_test() {
    local test_command="$1"
    local test_name="$2"
    
    log_info "Running $test_name tests..."
    
    if [ "$WATCH" = true ]; then
        test_command="$test_command --watch"
    fi
    
    if [ "$VERBOSE" = true ]; then
        test_command="$test_command --verbose"
    fi
    
    if [ "$CI_MODE" = true ]; then
        test_command="$test_command --ci --watchAll=false"
    fi
    
    if eval "$test_command"; then
        log_success "$test_name tests completed successfully"
        return 0
    else
        log_error "$test_name tests failed"
        return 1
    fi
}

# Function to run coverage
run_coverage() {
    log_info "Generating coverage report..."
    
    if bun run test:cov; then
        log_success "Coverage report generated successfully"
        log_info "Coverage report available at: coverage/lcov-report/index.html"
        
        # Show coverage summary
        if [ -f "coverage/coverage-summary.json" ]; then
            log_info "Coverage Summary:"
            cat coverage/coverage-summary.json | grep -E '"(lines|functions|branches|statements)"' | head -4
        fi
        
        return 0
    else
        log_error "Coverage generation failed"
        return 1
    fi
}

# Main test execution logic
main() {
    local exit_code=0
    
    log_info "Starting test execution..."
    log_info "Test type: $TEST_TYPE"
    log_info "Coverage: $COVERAGE"
    log_info "Watch: $WATCH"
    log_info "CI Mode: $CI_MODE"
    
    case "$TEST_TYPE" in
        "unit")
            run_test "bun run test:unit" "unit" || exit_code=$?
            ;;
        "integration")
            run_test "bun run test:integration" "integration" || exit_code=$?
            ;;
        "e2e")
            run_test "bun run test:e2e" "E2E" || exit_code=$?
            ;;
        "performance")
            log_warning "Performance tests may take several minutes to complete..."
            run_test "bun run test:performance" "performance" || exit_code=$?
            ;;
        "all")
            run_test "bun run test:unit" "unit" || exit_code=$?
            
            if [ $exit_code -eq 0 ]; then
                run_test "bun run test:integration" "integration" || exit_code=$?
            fi
            
            if [ $exit_code -eq 0 ]; then
                run_test "bun run test:e2e" "E2E" || exit_code=$?
            fi
            
            if [ $exit_code -eq 0 ]; then
                log_warning "Running performance tests..."
                run_test "bun run test:performance" "performance" || exit_code=$?
            fi
            ;;
        *)
            log_error "Invalid test type: $TEST_TYPE"
            show_help
            exit 1
            ;;
    esac
    
    # Generate coverage if requested and tests passed
    if [ "$COVERAGE" = true ] && [ $exit_code -eq 0 ]; then
        run_coverage || exit_code=$?
    fi
    
    # Final summary
    if [ $exit_code -eq 0 ]; then
        log_success "All tests completed successfully! 🎉"
    else
        log_error "Some tests failed. Please check the output above."
    fi
    
    exit $exit_code
}

# Run main function
main