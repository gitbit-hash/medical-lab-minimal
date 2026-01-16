#!/usr/bin/env node
/**
 * Create Installer Scripts
 * Generates platform-specific installers
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DIST_DIR = path.join(__dirname, '..', 'dist');
const PACKAGE_DIR = path.join(DIST_DIR, 'medica-lab-package');
const ROOT_DIR = path.join(__dirname, '..');

// Create a simple ICO file (base64 encoded placeholder icon)
function createPlaceholderIcon() {
  console.log('🎨 Creating placeholder icon...');

  // This is a minimal 16x16 ICO file encoded in base64
  const iconBase64 = 'AAABAAEAEBAAAAAAAABoBQAAFgAAACgAAAAQAAAAIAAAAAEACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

  const iconBuffer = Buffer.from(iconBase64, 'base64');
  fs.writeFileSync(path.join(DIST_DIR, 'icon.ico'), iconBuffer);
  console.log('✅ Placeholder icon created');
}

// Create Windows NSIS installer script (simplified version)
function createNSISInstaller() {
  console.log('📦 Creating Windows NSIS installer script...');

  const nsisScript = `; Medical Lab Management - NSIS Installer Script
; Simplified version without icons

!include "MUI2.nsh"

; Installer Information
Name "Medical Lab Management"
OutFile "medica-lab-installer.exe"
InstallDir "$PROGRAMFILES\\MedicaLab"
RequestExecutionLevel admin

; Interface Settings
!define MUI_ABORTWARNING
; Comment out icon lines if no icon file
; !define MUI_ICON "icon.ico"
; !define MUI_UNICON "icon.ico"

; Pages
!insertmacro MUI_PAGE_WELCOME
; License page removed
!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

; Languages
!insertmacro MUI_LANGUAGE "English"

; Installer Sections
Section "Application" SecApp
    SectionIn RO
    
    SetOutPath "$INSTDIR"
    
    ; Copy all files
    File /r "medica-lab-package\\*"
    
    ; Create shortcuts
    CreateDirectory "$SMPROGRAMS\\Medical Lab Management"
    CreateShortcut "$SMPROGRAMS\\Medical Lab Management\\Medical Lab Management.lnk" "$INSTDIR\\start.bat"
    CreateShortcut "$SMPROGRAMS\\Medical Lab Management\\Uninstall.lnk" "$INSTDIR\\Uninstall.exe"
    CreateShortcut "$DESKTOP\\Medical Lab Management.lnk" "$INSTDIR\\start.bat"
    
    ; Write registry keys
    WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\MedicaLab" "DisplayName" "Medical Lab Management"
    WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\MedicaLab" "UninstallString" "$INSTDIR\\Uninstall.exe"
    WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\MedicaLab" "InstallLocation" "$INSTDIR"
    WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\MedicaLab" "Publisher" "MedicaLab Software"
    WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\MedicaLab" "DisplayVersion" "1.0.0"
    
    ; Create uninstaller
    WriteUninstaller "$INSTDIR\\Uninstall.exe"
SectionEnd

Section "Create Desktop Shortcut" SecShortcut
    CreateShortcut "$DESKTOP\\Medical Lab Management.lnk" "$INSTDIR\\start.bat"
SectionEnd

; Uninstaller Section
Section "Uninstall"
    ; Remove shortcuts
    Delete "$DESKTOP\\Medical Lab Management.lnk"
    RMDir /r "$SMPROGRAMS\\Medical Lab Management"
    
    ; Remove files
    RMDir /r "$INSTDIR"
    
    ; Remove registry keys
    DeleteRegKey HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\MedicaLab"
SectionEnd
`;

  fs.writeFileSync(
    path.join(DIST_DIR, 'installer.nsi'),
    nsisScript
  );

  console.log('✅ NSIS installer script created');
  console.log('   To build installer, run: makensis installer.nsi');
}

// Create macOS DMG script
function createMacDMGScript() {
  console.log('🍎 Creating macOS DMG creation script...');

  // Define variables for the bash script
  const dmgName = 'medica-lab-installer';
  const volumeName = 'Medical Lab Management Installer';

  const dmgScript = `#!/bin/bash
# Create macOS DMG Installer
# Note: Requires create-dmg (brew install create-dmg)
# If create-dmg not available, creates a simple DMG using hdiutil

APP_NAME="Medical Lab Management"
DMG_NAME="${dmgName}"
VOLUME_NAME="${volumeName}"
SOURCE_DIR="medica-lab-package"
OUTPUT_DMG="${dmgName}.dmg"

echo "Creating DMG for Medical Lab Management..."

# Check if create-dmg is installed
if command -v create-dmg &> /dev/null; then
    # Use create-dmg for better looking DMG
    create-dmg \\
        --volname "${volumeName}" \\
        --window-pos 200 120 \\
        --window-size 800 400 \\
        --icon-size 100 \\
        --icon "install.sh" 200 190 \\
        --app-drop-link 600 185 \\
        "${OUTPUT_DMG}" \\
        "${SOURCE_DIR}"
else
    # Fallback to hdiutil (macOS built-in)
    echo "create-dmg not found, using hdiutil..."
    hdiutil create -volname "${volumeName}" -srcfolder "${SOURCE_DIR}" -ov -format UDZO "${OUTPUT_DMG}"
fi

echo "DMG created: ${OUTPUT_DMG}"
`;

  fs.writeFileSync(
    path.join(DIST_DIR, 'create-dmg.sh'),
    dmgScript
  );

  if (process.platform !== 'win32') {
    execSync(`chmod +x "${path.join(DIST_DIR, 'create-dmg.sh')}"`);
  }

  console.log('✅ macOS DMG script created');
}

// Create Linux AppImage script
function createLinuxAppImage() {
  console.log('🐧 Creating Linux AppImage script...');

  const appImageScript = `#!/bin/bash
# Create Linux AppImage
# Note: Requires appimagetool
# If not available, creates a simple tar.gz instead

APP_NAME="Medical Lab Management"
TAR_NAME="medica-lab-linux"

echo "Creating Linux package for Medical Lab Management..."

# Check if appimagetool is installed
if command -v appimagetool &> /dev/null; then
    echo "Creating AppImage..."
    # Create AppDir structure
    mkdir -p AppDir/usr/bin
    mkdir -p AppDir/usr/share/applications
    
    # Copy application files
    cp -r "medica-lab-package"/* "AppDir/usr/bin/"
    
    # Create desktop file
    cat > "AppDir/usr/share/applications/medica-lab.desktop" << EOF
[Desktop Entry]
Name=Medical Lab Management
Comment=Offline-first Medical Laboratory Management System
Exec=./start.sh
Icon=medica-lab
Type=Application
Categories=Office;Medical;
Terminal=true
EOF
    
    # Create AppRun
    cat > "AppDir/AppRun" << 'EOF'
#!/bin/bash
cd "$(dirname \\$0)/usr/bin"
exec ./start.sh
EOF
    chmod +x "AppDir/AppRun"
    
    # Create AppImage
    appimagetool "AppDir" "medica-lab.AppImage"
    echo "AppImage created: medica-lab.AppImage"
else
    echo "appimagetool not found, creating tar.gz package instead..."
    tar -czf "${TAR_NAME}.tar.gz" "medica-lab-package"
    echo "Tar package created: ${TAR_NAME}.tar.gz"
fi
`;

  fs.writeFileSync(
    path.join(DIST_DIR, 'create-appimage.sh'),
    appImageScript
  );

  if (process.platform !== 'win32') {
    execSync(`chmod +x "${path.join(DIST_DIR, 'create-appimage.sh')}"`);
  }

  console.log('✅ Linux AppImage script created');
}

// Create portable ZIP package
function createPortablePackage() {
  console.log('📦 Creating portable ZIP package...');

  const zipScript = process.platform === 'win32'
    ? `@echo off
echo Creating portable ZIP package...
if exist medica-lab-portable.zip del medica-lab-portable.zip
powershell Compress-Archive -Path medica-lab-package -DestinationPath medica-lab-portable.zip -Force
echo Portable package created: medica-lab-portable.zip
`
    : `#!/bin/bash
echo "Creating portable ZIP package..."
rm -f medica-lab-portable.zip
zip -r medica-lab-portable.zip medica-lab-package/
echo "Portable package created: medica-lab-portable.zip"
`;

  const ext = process.platform === 'win32' ? 'bat' : 'sh';
  fs.writeFileSync(
    path.join(DIST_DIR, `create-portable.${ext}`),
    zipScript
  );

  if (process.platform !== 'win32') {
    execSync(`chmod +x "${path.join(DIST_DIR, 'create-portable.sh')}"`);
  }

  console.log(`✅ Portable package script created (create-portable.${ext})`);
}

// Create README for installer scripts
function createInstallerREADME() {
  console.log('📖 Creating installer README...');

  const readme = `# Installer Scripts

This directory contains scripts to create platform-specific installers for the Medical Lab Management system.

## Prerequisites

### All Platforms
- Node.js 20+ installed
- Package built (run \`npm run dist:build\` first)
- Navigate to this directory: \`cd dist/\`

### Windows (NSIS)
1. Download and install NSIS (Nullsoft Scriptable Install System)
2. Run: \`"C:\\Program Files (x86)\\NSIS\\makensis.exe" installer.nsi\`
3. The installer will be created as \`medica-lab-installer.exe\`

### macOS (DMG)
1. Install create-dmg: \`brew install create-dmg\`
2. Run: \`./create-dmg.sh\`
3. The DMG will be created as \`medica-lab-installer.dmg\`

### Linux
1. Run: \`./create-appimage.sh\`
2. Will create either \`medica-lab.AppImage\` or \`medica-lab-linux.tar.gz\`

### Portable ZIP
- Windows: Run \`create-portable.bat\`
- macOS/Linux: Run \`./create-portable.sh\`
- Creates: \`medica-lab-portable.zip\`

## Quick Build Script

For Windows, you can run this from the project root:

\`\`\`batch
npm run dist:build
cd dist
"C:\\Program Files (x86)\\NSIS\\makensis.exe" installer.nsi
create-portable.bat
\`\`\`

## Notes

1. The NSIS installer has been simplified and doesn't require external icon/license files
2. All scripts should be run from the \`dist/\` directory
3. The \`medica-lab-package/\` directory must exist (created by build script)
4. Installers include the complete application with all dependencies

## Testing

Test the installer on a clean system before distribution.

---

**Build Date**: ${new Date().toISOString().split('T')[0]}
`;

  fs.writeFileSync(
    path.join(DIST_DIR, 'README.md'),
    readme
  );

  console.log('✅ Installer README created');
}

// Create a batch file to make building easier
function createBuildHelper() {
  console.log('🔧 Creating build helper script...');

  const buildScript = `@echo off
echo Medical Lab Management - Build Helper
echo ======================================
echo.

REM Check if NSIS is installed
set NSIS_PATH=
if exist "C:\\Program Files (x86)\\NSIS\\makensis.exe" (
    set NSIS_PATH="C:\\Program Files (x86)\\NSIS\\makensis.exe"
) else if exist "C:\\Program Files\\NSIS\\makensis.exe" (
    set NSIS_PATH="C:\\Program Files\\NSIS\\makensis.exe"
)

if "%NSIS_PATH%"=="" (
    echo ERROR: NSIS not found!
    echo Please install NSIS from: https://nsis.sourceforge.io/Download
    echo.
    pause
    exit /b 1
)

echo Found NSIS at: %NSIS_PATH%
echo.

REM Build distribution package
echo Step 1: Building distribution package...
call npm run dist:build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to build distribution package
    pause
    exit /b 1
)

echo.
echo Step 2: Creating installer files...
cd dist
call ..\\node_modules\\.bin\\node create-installer.js
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to create installer scripts
    pause
    exit /b 1
)

echo.
echo Step 3: Building Windows installer...
%NSIS_PATH% installer.nsi
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: NSIS build failed, creating portable package only
)

echo.
echo Step 4: Creating portable package...
call create-portable.bat

echo.
echo ======================================
echo Build Complete!
echo ======================================
echo.
echo Files created:
dir *.exe *.zip 2>nul
echo.
echo Next steps:
echo 1. Test the installer: medica-lab-installer.exe
echo 2. Test the portable package: medica-lab-portable.zip
echo 3. Distribute to clients
echo.
pause
`;

  fs.writeFileSync(
    path.join(ROOT_DIR, 'build-installer.bat'),
    buildScript
  );

  console.log('✅ Build helper script created (build-installer.bat)');
}

// Main function
function createInstallers() {
  console.log('🔨 Creating installer scripts...\n');

  if (!fs.existsSync(PACKAGE_DIR)) {
    console.error('❌ Package directory not found. Run build-distribution.js first.');
    console.error('   Try running: npm run dist:build');
    process.exit(1);
  }

  // Create required files
  createPlaceholderIcon();
  // License file creation removed

  // Create installer scripts
  createNSISInstaller();
  createMacDMGScript();
  createLinuxAppImage();
  createPortablePackage();
  createInstallerREADME();
  createBuildHelper();

  console.log('\n✅ Installer scripts created!');
  console.log('\nTo build the Windows installer:');
  console.log('1. Make sure NSIS is installed');
  console.log('2. Run from project root: build-installer.bat');
  console.log('3. Or manually:');
  console.log('   cd dist');
  console.log('   "C:\\Program Files (x86)\\NSIS\\makensis.exe" installer.nsi');
  console.log('   create-portable.bat');
}

if (require.main === module) {
  createInstallers();
}

module.exports = { createInstallers };