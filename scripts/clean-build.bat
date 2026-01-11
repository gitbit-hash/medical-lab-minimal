@echo off
REM Clean build script for Windows

echo Cleaning build cache and temporary files...

REM Remove Next.js build cache
if exist .next (
    echo   Removing .next directory...
    rmdir /s /q .next
)

REM Remove TypeScript cache
if exist node_modules\.cache (
    echo   Removing node_modules\.cache...
    rmdir /s /q node_modules\.cache
)

REM Remove build artifacts
if exist dist (
    echo   Removing dist directory...
    rmdir /s /q dist
)

REM Remove TypeScript build info
if exist *.tsbuildinfo (
    echo   Removing TypeScript build info...
    del /q *.tsbuildinfo
)

echo Clean complete!
echo.
echo Next steps:
echo   1. npm run db:generate
echo   2. npm run build

