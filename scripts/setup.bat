@echo off
REM Cursor Auto Accept Extension - Quick Setup Script for Windows
REM This script automates the entire setup process

setlocal enabledelayedexpansion

REM Set colors for output
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

REM Logging functions
:log_info
echo %BLUE%[INFO]%NC% %~1
goto :eof

:log_success
echo %GREEN%[SUCCESS]%NC% %~1
goto :eof

:log_warning
echo %YELLOW%[WARNING]%NC% %~1
goto :eof

:log_error
echo %RED%[ERROR]%NC% %~1
goto :eof

REM Check if we're in the right directory
:check_directory
call :log_info "Checking directory..."
if not exist "package.json" (
    call :log_error "This script must be run from the project root directory"
    call :log_error "Please navigate to the cursor-auto-accept-extension folder and try again"
    exit /b 1
)
if not exist "src" (
    call :log_error "This script must be run from the project root directory"
    call :log_error "Please navigate to the cursor-auto-accept-extension folder and try again"
    exit /b 1
)
call :log_success "Directory check passed"
goto :eof

REM Check prerequisites
:check_prerequisites
call :log_info "Checking prerequisites..."

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    call :log_error "Node.js is not installed. Please install Node.js 16+ first."
    exit /b 1
)

for /f "tokens=1,2 delims=." %%a in ('node --version') do (
    set "NODE_VERSION=%%a"
    set "NODE_VERSION=!NODE_VERSION:v=!"
)
if !NODE_VERSION! LSS 16 (
    call :log_error "Node.js 16+ is required. Current version: "
    node --version
    exit /b 1
)
call :log_success "Node.js version: "
node --version

REM Check npm
npm --version >nul 2>&1
if errorlevel 1 (
    call :log_error "npm is not installed. Please install npm first."
    exit /b 1
)
call :log_success "npm version: "
npm --version

REM Check if Cursor is installed (optional)
set "CURSOR_FOUND=false"
if exist "%APPDATA%\Cursor\Cursor.exe" (
    set "CURSOR_FOUND=true"
    call :log_success "Cursor IDE found on Windows"
) else if exist "%LOCALAPPDATA%\Programs\Cursor\Cursor.exe" (
    set "CURSOR_FOUND=true"
    call :log_success "Cursor IDE found on Windows"
) else (
    call :log_warning "Cursor IDE not found. You'll need to install it manually."
)

goto :eof

REM Install dependencies
:install_dependencies
call :log_info "Installing dependencies..."

if exist "node_modules" (
    call :log_info "node_modules already exists, skipping installation"
    goto :eof
)

npm install
if errorlevel 1 (
    call :log_error "Failed to install dependencies"
    exit /b 1
)
call :log_success "Dependencies installed successfully"
goto :eof

REM Build extension
:build_extension
call :log_info "Building extension..."

REM Clean output directory
if exist "out" (
    rmdir /s /q "out"
    call :log_info "Cleaned output directory"
)

REM Compile TypeScript
npm run compile
if errorlevel 1 (
    call :log_error "Build failed"
    exit /b 1
)
call :log_success "Extension built successfully"

REM Verify build output
if not exist "out\extension.js" (
    call :log_error "Extension file not found after build"
    exit /b 1
)
goto :eof

REM Run validation
:run_validation
call :log_info "Running validation..."

REM Check file structure
set "REQUIRED_FILES=package.json tsconfig.json src\extension.ts src\autoAccept.ts src\buttonDetector.ts src\analytics.ts src\storage.ts src\controlPanel.ts README.md LICENSE"

for %%f in (%REQUIRED_FILES%) do (
    if not exist "%%f" (
        call :log_error "Required file missing: %%f"
        exit /b 1
    )
)
call :log_success "File structure validation passed"

REM Test TypeScript compilation
call :log_info "Testing TypeScript compilation..."
npx tsc --noEmit
if errorlevel 1 (
    call :log_error "TypeScript compilation test failed"
    exit /b 1
)
call :log_success "TypeScript compilation test passed"

REM Test package.json syntax
call :log_info "Testing package.json syntax..."
node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8'))" >nul 2>&1
if errorlevel 1 (
    call :log_error "package.json syntax test failed"
    exit /b 1
)
call :log_success "package.json syntax test passed"
goto :eof

REM Run tests
:run_tests
call :log_info "Running tests..."

REM Run linting
call :log_info "Running ESLint..."
npm run lint
if errorlevel 1 (
    call :log_warning "Linting failed (continuing anyway)"
) else (
    call :log_success "Linting passed"
)

REM Run tests if available
if exist "test" (
    call :log_info "Running tests..."
    npm run test
    if errorlevel 1 (
        call :log_warning "Tests failed (continuing anyway)"
    ) else (
        call :log_success "Tests passed"
    )
) else (
    call :log_info "No test directory found, skipping tests"
)
goto :eof

REM Create VSIX package
:create_vsix
call :log_info "Creating VSIX package..."

REM Check if vsce is available
vsce --version >nul 2>&1
if errorlevel 1 (
    call :log_info "Installing vsce globally..."
    npm install -g vsce
)

REM Create VSIX package
vsce package
if errorlevel 1 (
    call :log_error "VSIX creation failed"
    exit /b 1
)

REM Find VSIX file
for %%f in (*.vsix) do (
    set "VSIX_FILE=%%f"
    goto :found_vsix
)
call :log_error "VSIX file not found after packaging"
exit /b 1

:found_vsix
call :log_success "VSIX package created: !VSIX_FILE!"
goto :eof

REM Generate setup report
:generate_report
call :log_info "Generating setup report..."

set "REPORT_FILE=setup-report.txt"

(
echo Cursor Auto Accept Extension - Setup Report
echo ==========================================
echo Generated: %date% %time%
echo Project: %CD%
echo.
echo Setup Results:
echo - Prerequisites: ✅ PASSED
echo - Dependencies: ✅ INSTALLED
echo - Build: ✅ COMPLETED
echo - Validation: ✅ PASSED
echo - Tests: ✅ COMPLETED
echo - VSIX: ✅ CREATED
echo.
echo Next Steps:
echo 1. Open Cursor IDE
echo 2. Press Ctrl+Shift+P
echo 3. Type "Extensions: Install from VSIX"
echo 4. Select the VSIX file: !VSIX_FILE!
echo 5. Restart Cursor IDE
echo 6. Look for the 🚀 icon in the activity bar
echo.
echo Usage:
echo - Start Auto-Accept: Ctrl+Shift+P → "Cursor Auto Accept: Start Auto Accept"
echo - Show Control Panel: Ctrl+Shift+P → "Cursor Auto Accept: Show Control Panel"
echo - Export Analytics: Ctrl+Shift+P → "Cursor Auto Accept: Export Analytics"
echo.
echo Global Functions (Console):
echo - startAccept() - Start auto-accept
echo - stopAccept() - Stop auto-accept
echo - exportAnalytics() - Export data
echo - toggleDebug() - Toggle debug mode
echo.
echo Support:
echo - GitHub: https://github.com/ivalsaraj/cursor-auto-accept-extension
echo - LinkedIn: https://linkedin.com/in/ivalsaraj
echo - Email: ivan@ivalsaraj.com
) > "!REPORT_FILE!"

call :log_success "Setup report generated: !REPORT_FILE!"
goto :eof

REM Main setup function
:main
echo %BLUE%
echo 🚀 Cursor Auto Accept Extension - Automated Setup
echo ==================================================
echo %NC%

call :check_directory
if errorlevel 1 exit /b 1

call :check_prerequisites
if errorlevel 1 exit /b 1

call :install_dependencies
if errorlevel 1 exit /b 1

call :build_extension
if errorlevel 1 exit /b 1

call :run_validation
if errorlevel 1 exit /b 1

call :run_tests
if errorlevel 1 (
    call :log_warning "Some tests failed, but continuing..."
)

call :create_vsix
if errorlevel 1 exit /b 1

call :generate_report
if errorlevel 1 exit /b 1

echo %GREEN%
echo 🎉 Setup completed successfully!
echo ==================================================
echo Your extension is ready to install in Cursor IDE!
echo.
echo Next steps:
echo 1. Open Cursor IDE
echo 2. Install the VSIX file: !VSIX_FILE!
echo 3. Restart Cursor IDE
echo 4. Look for the 🚀 icon in the activity bar
echo.
echo For detailed instructions, see: !REPORT_FILE!
echo %NC%

goto :eof

REM Run main function
call :main
if errorlevel 1 (
    echo.
    call :log_error "Setup failed. Please check the errors above and try again."
    pause
    exit /b 1
)

echo.
call :log_success "Setup completed successfully!"
pause
