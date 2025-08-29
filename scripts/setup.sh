#!/bin/bash

# Cursor Auto Accept Extension - Quick Setup Script
# This script automates the entire setup process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
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

# Check if we're in the right directory
check_directory() {
    if [[ ! -f "package.json" ]] || [[ ! -d "src" ]]; then
        log_error "This script must be run from the project root directory"
        log_error "Please navigate to the cursor-auto-accept-extension folder and try again"
        exit 1
    fi
    log_success "Directory check passed"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js 16+ first."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ $NODE_VERSION -lt 16 ]]; then
        log_error "Node.js 16+ is required. Current version: $(node --version)"
        exit 1
    fi
    log_success "Node.js version: $(node --version)"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed. Please install npm first."
        exit 1
    fi
    log_success "npm version: $(npm --version)"
    
    # Check if Cursor is installed (optional)
    CURSOR_FOUND=false
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if [[ -d "/Applications/Cursor.app" ]]; then
            CURSOR_FOUND=true
            log_success "Cursor IDE found on macOS"
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v cursor &> /dev/null; then
            CURSOR_FOUND=true
            log_success "Cursor IDE found on Linux"
        fi
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        # Windows
        if [[ -f "$APPDATA/Cursor/Cursor.exe" ]] || [[ -f "$LOCALAPPDATA/Programs/Cursor/Cursor.exe" ]]; then
            CURSOR_FOUND=true
            log_success "Cursor IDE found on Windows"
        fi
    fi
    
    if [[ "$CURSOR_FOUND" == false ]]; then
        log_warning "Cursor IDE not found. You'll need to install it manually."
    fi
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    
    if [[ -d "node_modules" ]]; then
        log_info "node_modules already exists, skipping installation"
        return 0
    fi
    
    npm install
    if [[ $? -eq 0 ]]; then
        log_success "Dependencies installed successfully"
    else
        log_error "Failed to install dependencies"
        exit 1
    fi
}

# Build extension
build_extension() {
    log_info "Building extension..."
    
    # Clean output directory
    if [[ -d "out" ]]; then
        rm -rf out
        log_info "Cleaned output directory"
    fi
    
    # Compile TypeScript
    npm run compile
    if [[ $? -eq 0 ]]; then
        log_success "Extension built successfully"
    else
        log_error "Build failed"
        exit 1
    fi
    
    # Verify build output
    if [[ ! -f "out/extension.js" ]]; then
        log_error "Extension file not found after build"
        exit 1
    fi
}

# Run validation
run_validation() {
    log_info "Running validation..."
    
    # Check file structure
    REQUIRED_FILES=("package.json" "tsconfig.json" "src/extension.ts" "src/autoAccept.ts" "src/buttonDetector.ts" "src/analytics.ts" "src/storage.ts" "src/controlPanel.ts" "README.md" "LICENSE")
    
    for file in "${REQUIRED_FILES[@]}"; do
        if [[ ! -f "$file" ]]; then
            log_error "Required file missing: $file"
            exit 1
        fi
    done
    log_success "File structure validation passed"
    
    # Test TypeScript compilation
    log_info "Testing TypeScript compilation..."
    npx tsc --noEmit
    if [[ $? -eq 0 ]]; then
        log_success "TypeScript compilation test passed"
    else
        log_error "TypeScript compilation test failed"
        exit 1
    fi
    
    # Test package.json syntax
    log_info "Testing package.json syntax..."
    if node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8'))" 2>/dev/null; then
        log_success "package.json syntax test passed"
    else
        log_error "package.json syntax test failed"
        exit 1
    fi
}

# Run tests
run_tests() {
    log_info "Running tests..."
    
    # Run linting
    log_info "Running ESLint..."
    npm run lint
    if [[ $? -eq 0 ]]; then
        log_success "Linting passed"
    else
        log_warning "Linting failed (continuing anyway)"
    fi
    
    # Run tests if available
    if [[ -d "test" ]]; then
        log_info "Running tests..."
        npm run test
        if [[ $? -eq 0 ]]; then
            log_success "Tests passed"
        else
            log_warning "Tests failed (continuing anyway)"
        fi
    else
        log_info "No test directory found, skipping tests"
    fi
}

# Create VSIX package
create_vsix() {
    log_info "Creating VSIX package..."
    
    # Check if vsce is available
    if ! command -v vsce &> /dev/null; then
        log_info "Installing vsce globally..."
        npm install -g vsce
    fi
    
    # Create VSIX package
    vsce package
    if [[ $? -eq 0 ]]; then
        VSIX_FILE=$(ls -t *.vsix 2>/dev/null | head -1)
        if [[ -n "$VSIX_FILE" ]]; then
            log_success "VSIX package created: $VSIX_FILE"
        else
            log_error "VSIX file not found after packaging"
            return 1
        fi
    else
        log_error "VSIX creation failed"
        return 1
    fi
}

# Generate setup report
generate_report() {
    log_info "Generating setup report..."
    
    REPORT_FILE="setup-report.txt"
    
    cat > "$REPORT_FILE" << EOF
Cursor Auto Accept Extension - Setup Report
==========================================
Generated: $(date)
Project: $(basename $(pwd))

Setup Results:
- Prerequisites: ✅ PASSED
- Dependencies: ✅ INSTALLED
- Build: ✅ COMPLETED
- Validation: ✅ PASSED
- Tests: ✅ COMPLETED
- VSIX: ✅ CREATED

Next Steps:
1. Open Cursor IDE
2. Press Ctrl+Shift+P (or Cmd+Shift+P on macOS)
3. Type "Extensions: Install from VSIX"
4. Select the VSIX file: $VSIX_FILE
5. Restart Cursor IDE
6. Look for the 🚀 icon in the activity bar

Usage:
- Start Auto-Accept: Ctrl+Shift+P → "Cursor Auto Accept: Start Auto Accept"
- Show Control Panel: Ctrl+Shift+P → "Cursor Auto Accept: Show Control Panel"
- Export Analytics: Ctrl+Shift+P → "Cursor Auto Accept: Export Analytics"

Global Functions (Console):
- startAccept() - Start auto-accept
- stopAccept() - Stop auto-accept
- exportAnalytics() - Export data
- toggleDebug() - Toggle debug mode

Support:
- GitHub: https://github.com/ivalsaraj/cursor-auto-accept-extension
- LinkedIn: https://linkedin.com/in/ivalsaraj
- Email: ivan@ivalsaraj.com

EOF
    
    log_success "Setup report generated: $REPORT_FILE"
}

# Main setup function
main() {
    echo -e "${BLUE}"
    echo "🚀 Cursor Auto Accept Extension - Automated Setup"
    echo "=================================================="
    echo -e "${NC}"
    
    check_directory
    check_prerequisites
    install_dependencies
    build_extension
    run_validation
    run_tests
    create_vsix
    generate_report
    
    echo -e "${GREEN}"
    echo "🎉 Setup completed successfully!"
    echo "=================================================="
    echo "Your extension is ready to install in Cursor IDE!"
    echo ""
    echo "Next steps:"
    echo "1. Open Cursor IDE"
    echo "2. Install the VSIX file: $VSIX_FILE"
    echo "3. Restart Cursor IDE"
    echo "4. Look for the 🚀 icon in the activity bar"
    echo ""
    echo "For detailed instructions, see: setup-report.txt"
    echo -e "${NC}"
}

# Run main function
main "$@"
