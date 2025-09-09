@echo off
setlocal enabledelayedexpansion
@REM This script needs to have an executable from https://github.com/tdewolff/minify/releases/latest in the same folder to run.

:: ================================
:: Configuration
:: ================================
:: Source root folder
set SRC=.
:: Destination root folder
set DIST=docs

:: Define which subfolders will be minified (space-separated)
set FOLDERS=components styles .

:: Define individual files to be minified (space-separated, with relative paths)
set INDIVIDUAL_FILES=cdn/prism/prism_vsc.css cdn/SVGpanzoom/svg-pan-zoom.js

:: Define which subfolders/files should be copied without minifying (space-separated)
set COPY_ONLY=cdn posts public search.json

:: Define excluded js, html, and css files (just filenames, space-separated)
set EXCLUDE=

:: ================================
:: Prepare destination
:: ================================
:: Remove old dist completely before starting
if exist "%DIST%" (
    echo Removing old "%DIST%"...
    rmdir /S /Q "%DIST%"
)
mkdir "%DIST%"

echo Processing files from "%SRC%" into "%DIST%"...

:: ================================
:: Copy-only folders/files
:: ================================
echo.
echo --- Copying ---
for %%d in (%COPY_ONLY%) do (
    echo ^> Copying %%d
    if exist "%SRC%\%%d\" (
        :: If it's a folder
        xcopy /E /I /Y "%SRC%\%%d" "%DIST%\%%d" >nul
    ) else if exist "%SRC%\%%d" (
        :: If it's a file
        copy /Y "%SRC%\%%d" "%DIST%\%%d" >nul
    ) else (
        echo Skipped %%d (not found)
    )
)

:: ================================
:: Loop through each defined folder for minification
:: ================================
for %%d in (%FOLDERS%) do (
    echo.
    echo --- Minifying folder: %%d ---

    :: Create subfolder inside dist if it doesn't exist
    if not exist "%DIST%\%%d" mkdir "%DIST%\%%d"

    :: Process CSS (only in the specific directory, not subdirectories)
    for /f "tokens=*" %%f in ('dir /b "%SRC%\%%d\*.css" 2^>nul') do (
        call :checkExclude "%%f"
        if "!SKIP!"=="0" (
            echo ^> Minifying %%f
            minify.exe "%SRC%\%%d\%%f" -o "%DIST%\%%d\%%f"
        ) else (
            echo ^> Skipping %%f ^(excluded^)
        )
    )

    :: Process JS (only in the specific directory, not subdirectories)  
    for /f "tokens=*" %%f in ('dir /b "%SRC%\%%d\*.js" 2^>nul') do (
        call :checkExclude "%%f"
        if "!SKIP!"=="0" (
            echo ^> Minifying %%f
            minify.exe "%SRC%\%%d\%%f" -o "%DIST%\%%d\%%f"
        ) else (
            echo ^> Skipping %%f ^(excluded^)
        )
    )

    :: Process HTML (only in the specific directory, not subdirectories)
    for /f "tokens=*" %%f in ('dir /b "%SRC%\%%d\*.html" 2^>nul') do (
        call :checkExclude "%%f"
        if "!SKIP!"=="0" (
            echo ^> Minifying %%f
            minify.exe "%SRC%\%%d\%%f" -o "%DIST%\%%d\%%f"
        ) else (
            echo ^> Skipping %%f ^(excluded^)
        )
    )
)

:: ================================
:: Process individual files for minification
:: ================================
if defined INDIVIDUAL_FILES (
    echo.
    echo --- Minifying individual files ---
    for %%f in (%INDIVIDUAL_FILES%) do (
        if exist "%SRC%\%%f" (
            :: Create directory structure if needed
            for %%p in ("%DIST%\%%f") do if not exist "%%~dpp" mkdir "%%~dpp"
            
            :: Simple minification without exclusion check for individual files
            echo ^> Minifying %%f
            minify.exe "%SRC%\%%f" -o "%DIST%\%%f"
        ) else (
            echo ^> File not found: %%f
        )
    )
)

echo.
echo Done. Files are located in "%DIST%".
pause
exit /b


:: ================================
:: Function: checkExclude
:: Input: filename
:: Sets variable SKIP=1 if excluded, 0 otherwise
:: ================================
:checkExclude
set "SKIP=0"
if defined EXCLUDE (
    for %%x in (%EXCLUDE%) do (
        if /I "%~1"=="%%x" set "SKIP=1"
    )
)
exit /b