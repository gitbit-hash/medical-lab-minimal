#!/usr/bin/env node
/**
 * Build Distribution Package Script
 * Creates a distributable package for client installation
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DIST_DIR = path.join(__dirname, '..', 'dist');
const PACKAGE_DIR = path.join(DIST_DIR, 'medica-lab-package');

// Clean and create directories
function setupDirectories() {
  console.log('📦 Setting up distribution directories...');
  
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  }
  
  fs.mkdirSync(DIST_DIR, { recursive: true });
  fs.mkdirSync(PACKAGE_DIR, { recursive: true });
  
  console.log('✅ Directories created');
}

// Copy necessary files
function copyFiles() {
  console.log('📋 Copying application files...');
  
  const filesToCopy = [
    '.next',
    'public',
    'prisma',
    'package.json',
    'package-lock.json',
    'next.config.ts',
    'tsconfig.json',
  ];
  
  filesToCopy.forEach(file => {
    const src = path.join(__dirname, '..', file);
    const dest = path.join(PACKAGE_DIR, file);
    
    if (fs.existsSync(src)) {
      if (fs.statSync(src).isDirectory()) {
        fs.cpSync(src, dest, { recursive: true });
      } else {
        fs.copyFileSync(src, dest);
      }
      console.log(`  ✓ ${file}`);
    }
  });
  
  // Copy node_modules (production only)
  console.log('📦 Copying production dependencies...');
  const nodeModulesSrc = path.join(__dirname, '..', 'node_modules');
  const nodeModulesDest = path.join(PACKAGE_DIR, 'node_modules');
  
  if (fs.existsSync(nodeModulesSrc)) {
    // Filter to production dependencies only
    execSync(`cp -r "${nodeModulesSrc}" "${nodeModulesDest}"`, { stdio: 'inherit' });
  }
  
  console.log('✅ Files copied');
}

// Create client configuration template
function createClientConfig() {
  console.log('⚙️  Creating client configuration template...');
  
  const configTemplate = `# Medical Lab Management - Client Configuration
# Copy this file to .env and update with your values

# Database Configuration
# For embedded PostgreSQL, use default values
LOCAL_DATABASE_URL=postgresql://medica_user:medica_password@localhost:5432/medica_lab
REMOTE_DATABASE_URL=postgresql://medica_user:medica_password@localhost:5432/medica_lab_remote

# Application URLs
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Generate a strong secret for production
NEXTAUTH_SECRET=CHANGE_THIS_IN_PRODUCTION

# License Configuration
LICENSE_VALIDATION_ENABLED=true
LICENSE_KEY=YOUR_LICENSE_KEY_HERE
LICENSE_OFFLINE_GRACE_DAYS=7
LICENSE_VALIDATION_INTERVAL=86400000

# Node Environment
NODE_ENV=production
`;

  fs.writeFileSync(
    path.join(PACKAGE_DIR, '.env.example'),
    configTemplate
  );
  
  console.log('✅ Configuration template created');
}

// Create installation scripts
function createInstallScripts() {
  console.log('📝 Creating installation scripts...');
  
  // Windows installer script
  const windowsScript = `@echo off
echo ========================================
echo Medical Lab Management - Installation
echo ========================================
echo.

echo [1/4] Checking prerequisites...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js 20+ from https://nodejs.org
    pause
    exit /b 1
)

where psql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: PostgreSQL is not found in PATH
    echo The application includes an embedded PostgreSQL installer
    echo Please run install-postgresql.bat if needed
)

echo [2/4] Installing dependencies...
call npm install --production
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo [3/4] Generating Prisma client...
call npm run db:generate
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to generate Prisma client
    pause
    exit /b 1
)

echo [4/4] Setting up database...
if not exist .env (
    echo Creating .env file from template...
    copy .env.example .env
    echo.
    echo IMPORTANT: Please edit .env and set your LICENSE_KEY
    echo.
)

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Edit .env file and set your LICENSE_KEY
echo 2. Run start.bat to start the application
echo 3. Open http://localhost:3000 in your browser
echo.
pause
`;

  fs.writeFileSync(
    path.join(PACKAGE_DIR, 'install.bat'),
    windowsScript
  );
  
  // Linux/Mac installer script
  const unixScript = `#!/bin/bash
set -e

echo "========================================"
echo "Medical Lab Management - Installation"
echo "========================================"
echo ""

echo "[1/4] Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo "Please install Node.js 20+ from https://nodejs.org"
    exit 1
fi

if ! command -v psql &> /dev/null; then
    echo "WARNING: PostgreSQL is not found in PATH"
    echo "Please install PostgreSQL 16+ or use the embedded version"
fi

echo "[2/4] Installing dependencies..."
npm install --production
if [ \$? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies"
    exit 1
fi

echo "[3/4] Generating Prisma client..."
npm run db:generate
if [ \$? -ne 0 ]; then
    echo "ERROR: Failed to generate Prisma client"
    exit 1
fi

echo "[4/4] Setting up database..."
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo ""
    echo "IMPORTANT: Please edit .env and set your LICENSE_KEY"
    echo ""
fi

echo ""
echo "========================================"
echo "Installation Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Edit .env file and set your LICENSE_KEY"
echo "2. Run ./start.sh to start the application"
echo "3. Open http://localhost:3000 in your browser"
echo ""
`;

  fs.writeFileSync(
    path.join(PACKAGE_DIR, 'install.sh'),
    unixScript
  );
  
  // Make shell script executable
  if (process.platform !== 'win32') {
    execSync(`chmod +x "${path.join(PACKAGE_DIR, 'install.sh')}"`);
  }
  
  console.log('✅ Installation scripts created');
}

// Create startup scripts
function createStartupScripts() {
  console.log('🚀 Creating startup scripts...');
  
  // Windows startup
  const windowsStart = `@echo off
echo Starting Medical Lab Management...
echo.

if not exist .env (
    echo ERROR: .env file not found!
    echo Please run install.bat first
    pause
    exit /b 1
)

echo Running database migrations...
call npm run db:migrate

echo.
echo Starting application...
echo Application will be available at http://localhost:3000
echo Press Ctrl+C to stop
echo.

call npm start
`;

  fs.writeFileSync(
    path.join(PACKAGE_DIR, 'start.bat'),
    windowsStart
  );
  
  // Linux/Mac startup
  const unixStart = `#!/bin/bash
set -e

echo "Starting Medical Lab Management..."
echo ""

if [ ! -f .env ]; then
    echo "ERROR: .env file not found!"
    echo "Please run ./install.sh first"
    exit 1
fi

echo "Running database migrations..."
npm run db:migrate

echo ""
echo "Starting application..."
echo "Application will be available at http://localhost:3000"
echo "Press Ctrl+C to stop"
echo ""

npm start
`;

  fs.writeFileSync(
    path.join(PACKAGE_DIR, 'start.sh'),
    unixStart
  );
  
  if (process.platform !== 'win32') {
    execSync(`chmod +x "${path.join(PACKAGE_DIR, 'start.sh')}"`);
  }
  
  console.log('✅ Startup scripts created');
}

// Create README for clients
function createClientREADME() {
  console.log('📖 Creating client README...');
  
  const readme = `# Medical Lab Management - Client Installation Guide

## System Requirements

- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 20.04+)
- **Node.js**: Version 20 or higher
- **PostgreSQL**: Version 16 or higher (embedded installer included)
- **RAM**: Minimum 4GB (8GB recommended)
- **Disk Space**: Minimum 2GB free space

## Quick Start

### Windows

1. Extract the package to a folder (e.g., \\\`C:\\\\MedicaLab\\\`)
2. Double-click \\\`install.bat\\\`
3. Edit \\\`.env\\\` file and set your \\\`LICENSE_KEY\\\`
4. Double-click \\\`start.bat\\\`
5. Open http://localhost:3000 in your browser

### macOS / Linux

1. Extract the package to a folder
2. Open terminal in the package directory
3. Run: \\\`chmod +x install.sh start.sh\\\`
4. Run: \\\`./install.sh\\\`
5. Edit \\\`.env\\\` file and set your \\\`LICENSE_KEY\\\`
6. Run: \\\`./start.sh\\\`
7. Open http://localhost:3000 in your browser

## Configuration

### License Key

1. Open \\\`.env\\\` file in a text editor
2. Find the line: \\\`LICENSE_KEY=YOUR_LICENSE_KEY_HERE\\\`
3. Replace \\\`YOUR_LICENSE_KEY_HERE\\\` with your actual license key
4. Save the file

### Database

The application uses PostgreSQL. By default, it connects to:
- **Host**: localhost
- **Port**: 5432
- **Database**: medica_lab
- **User**: medica_user
- **Password**: medica_password

To change these settings, edit the \\\`LOCAL_DATABASE_URL\\\` in the \\\`.env\\\` file.

## Troubleshooting

### Application won't start

1. Check that Node.js is installed: \\\`node --version\\\`
2. Check that PostgreSQL is running
3. Check the \\\`.env\\\` file exists and has correct values
4. Check the logs for error messages

### License error

1. Verify your license key is correct in \\\`.env\\\`
2. Ensure the license is not already bound to another machine
3. Contact support if issues persist

### Database connection error

1. Verify PostgreSQL is installed and running
2. Check database credentials in \\\`.env\\\`
3. Ensure the database exists
4. Run migrations: \\\`npm run db:migrate\\\`

## Support

For support, please contact:
- Email: support@yourcompany.com
- Documentation: [Your documentation URL]

## License

This software is licensed. Each license is bound to a single machine.

---

**Version**: 1.0.0
**Last Updated**: ${new Date().toISOString().split('T')[0]}
`;

  fs.writeFileSync(
    path.join(PACKAGE_DIR, 'README.md'),
    readme
  );
  
  console.log('✅ Client README created');
}

// Create package info
function createPackageInfo() {
  const packageInfo = {
    name: 'medica-lab',
    version: require('../package.json').version,
    buildDate: new Date().toISOString(),
    platform: process.platform,
    nodeVersion: process.version,
  };
  
  fs.writeFileSync(
    path.join(PACKAGE_DIR, 'package-info.json'),
    JSON.stringify(packageInfo, null, 2)
  );
  
  console.log('✅ Package info created');
}

// Main build function
function buildDistribution() {
  console.log('🏗️  Building distribution package...\\n');
  
  try {
    setupDirectories();
    copyFiles();
    createClientConfig();
    createInstallScripts();
    createStartupScripts();
    createClientREADME();
    createPackageInfo();
    
    console.log('\\n✅ Distribution package built successfully!');
    console.log(`\\📦 Package location: \\${PACKAGE_DIR}\\`);
    console.log('\\nNext steps:');
    console.log('1. Test the package in a clean environment');
    console.log('2. Create installer (see scripts/create-installer.js)');
    console.log('3. Package for distribution (ZIP, installer, etc.)');
  } catch (error) {
    console.error('\\n❌ Error building distribution:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  buildDistribution();
}

module.exports = { buildDistribution };