#!/bin/bash

# 🚀 CI/CD Setup Script for Cursor AI Workflow Automation
# This script helps configure and validate the CI/CD environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to validate GitHub token
validate_github_token() {
    if [ -z "$GITHUB_TOKEN" ]; then
        print_error "GITHUB_TOKEN environment variable not set"
        return 1
    fi
    
    # Test GitHub API access
    if curl -s -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user >/dev/null 2>&1; then
        print_success "GitHub token is valid"
        return 0
    else
        print_error "GitHub token is invalid or expired"
        return 1
    fi
}

# Function to check required tools
check_required_tools() {
    print_status "Checking required tools..."
    
    local missing_tools=()
    
    # Check for required commands
    local tools=("node" "npm" "git" "curl" "jq")
    
    for tool in "${tools[@]}"; do
        if ! command_exists "$tool"; then
            missing_tools+=("$tool")
        fi
    done
    
    if [ ${#missing_tools[@]} -eq 0 ]; then
        print_success "All required tools are installed"
    else
        print_error "Missing required tools: ${missing_tools[*]}"
        print_status "Please install the missing tools and run this script again"
        return 1
    fi
}

# Function to validate project structure
validate_project_structure() {
    print_status "Validating project structure..."
    
    local required_files=(
        "package.json"
        "tsconfig.json"
        "jest.config.js"
        "create-vsix.js"
        ".github/workflows/ci.yml"
        ".github/workflows/release.yml"
        ".github/workflows/deploy.yml"
        ".github/workflows/monitor.yml"
        ".github/ci-config.json"
    )
    
    local missing_files=()
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            missing_files+=("$file")
        fi
    done
    
    if [ ${#missing_files[@]} -eq 0 ]; then
        print_success "Project structure is valid"
    else
        print_error "Missing required files: ${missing_files[*]}"
        return 1
    fi
}

# Function to validate package.json
validate_package_json() {
    print_status "Validating package.json..."
    
    if ! jq empty package.json 2>/dev/null; then
        print_error "package.json is not valid JSON"
        return 1
    fi
    
    # Check required fields
    local required_fields=("name" "version" "publisher" "engines" "main")
    local missing_fields=()
    
    for field in "${required_fields[@]}"; do
        if ! jq -e ".$field" package.json >/dev/null 2>&1; then
            missing_fields+=("$field")
        fi
    done
    
    if [ ${#missing_fields[@]} -eq 0 ]; then
        print_success "package.json validation passed"
    else
        print_error "Missing required fields in package.json: ${missing_fields[*]}"
        return 1
    fi
}

# Function to run local tests
run_local_tests() {
    print_status "Running local tests..."
    
    if npm run test:ci >/dev/null 2>&1; then
        print_success "Local tests passed"
    else
        print_error "Local tests failed"
        return 1
    fi
}

# Function to build extension locally
build_extension() {
    print_status "Building extension locally..."
    
    if npm run compile >/dev/null 2>&1; then
        print_success "Extension compiled successfully"
    else
        print_error "Extension compilation failed"
        return 1
    fi
    
    if node create-vsix.js >/dev/null 2>&1; then
        print_success "VSIX package created successfully"
    else
        print_error "VSIX package creation failed"
        return 1
    fi
}

# Function to check CI/CD configuration
check_cicd_config() {
    print_status "Checking CI/CD configuration..."
    
    if ! jq empty .github/ci-config.json 2>/dev/null; then
        print_error "CI/CD configuration is not valid JSON"
        return 1
    fi
    
    # Check required configuration sections
    local required_sections=("ci" "quality" "security" "release" "deployment" "monitoring")
    local missing_sections=()
    
    for section in "${required_sections[@]}"; do
        if ! jq -e ".$section" .github/ci-config.json >/dev/null 2>&1; then
            missing_sections+=("$section")
        fi
    done
    
    if [ ${#missing_sections[@]} -eq 0 ]; then
        print_success "CI/CD configuration is valid"
    else
        print_error "Missing configuration sections: ${missing_sections[*]}"
        return 1
    fi
}

# Function to display setup instructions
display_setup_instructions() {
    echo
    print_status "🔧 CI/CD Setup Instructions:"
    echo
    echo "1. Set up GitHub Secrets:"
    echo "   - Go to your repository settings"
    echo "   - Navigate to Secrets and variables → Actions"
    echo "   - Add the following secrets:"
    echo "     * VSCE_PAT: Your VS Code Marketplace Personal Access Token"
    echo "     * SNYK_TOKEN: Your Snyk API token (optional)"
    echo "     * SLACK_WEBHOOK_URL: Your Slack webhook URL (optional)"
    echo "     * DISCORD_WEBHOOK_URL: Your Discord webhook URL (optional)"
    echo
    echo "2. Configure Environments (optional):"
    echo "   - Go to Settings → Environments"
    echo "   - Create 'staging' and 'production' environments"
    echo "   - Configure protection rules as needed"
    echo
    echo "3. Enable GitHub Actions:"
    echo "   - Go to Actions tab in your repository"
    echo "   - Enable workflows if not already enabled"
    echo
    echo "4. Test the Pipeline:"
    echo "   - Make a small change and push to trigger CI"
    echo "   - Check the Actions tab to monitor progress"
    echo
    echo "5. Create Your First Release:"
    echo "   - Update version in package.json"
    echo "   - Create a GitHub release"
    echo "   - Monitor the release workflow"
    echo
}

# Function to display status summary
display_status_summary() {
    echo
    print_status "📊 Setup Status Summary:"
    echo
    echo "✅ Required tools: $(command_exists node && command_exists npm && command_exists git && echo "Installed" || echo "Missing")"
    echo "✅ Project structure: $(validate_project_structure >/dev/null 2>&1 && echo "Valid" || echo "Invalid")"
    echo "✅ Package.json: $(validate_package_json >/dev/null 2>&1 && echo "Valid" || echo "Invalid")"
    echo "✅ CI/CD config: $(check_cicd_config >/dev/null 2>&1 && echo "Valid" || echo "Invalid")"
    echo "✅ Local tests: $(run_local_tests >/dev/null 2>&1 && echo "Passing" || echo "Failing")"
    echo "✅ Extension build: $(build_extension >/dev/null 2>&1 && echo "Successful" || echo "Failed")"
    echo "✅ GitHub token: $(validate_github_token >/dev/null 2>&1 && echo "Valid" || echo "Invalid/Not Set")"
    echo
}

# Main execution
main() {
    echo "🚀 CI/CD Setup for Cursor AI Workflow Automation"
    echo "================================================"
    echo
    
    local exit_code=0
    
    # Run all checks
    check_required_tools || exit_code=1
    validate_project_structure || exit_code=1
    validate_package_json || exit_code=1
    check_cicd_config || exit_code=1
    run_local_tests || exit_code=1
    build_extension || exit_code=1
    validate_github_token || exit_code=1
    
    # Display results
    display_status_summary
    
    if [ $exit_code -eq 0 ]; then
        print_success "🎉 CI/CD setup validation completed successfully!"
        display_setup_instructions
    else
        print_error "❌ CI/CD setup validation failed. Please fix the issues above."
        echo
        print_status "For detailed information, see CI-CD-GUIDE.md"
    fi
    
    exit $exit_code
}

# Run main function
main "$@"
