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
set INDIVIDUAL_FILES=cdn\prism\prism_vsc.css cdn\SVGpanzoom\svg-pan-zoom.js

:: Define which subfolders\files should be copied without minifying (space-separated)
set COPY_ONLY=cdn posts public search.json

:: Define excluded js, html, and css files (space-separated)
:: Supports three formats:
:: - Full path: "folder\filename.html" (excludes specific file in specific folder)
:: - Wildcard: "ANY\filename.html" (excludes filename in any folder)
:: - Just filename: "filename.html" (excludes exact filename match only in root folder)
set EXCLUDE=

:: ================================
:: Validation
:: ================================
:: Check if source and destination are the same
if /I "%SRC%"=="%DIST%" (
    echo ERROR: Source and destination folders cannot be the same! ^(Because we delete the destination folder first^)
    echo Source: %SRC%
    echo Destination: %DIST%
    pause
    exit /b 1
)

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
        if not exist "%DIST%\src" mkdir "%DIST%\src"
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
        call :checkExclude "%%f" "%%d"
        if "!SKIP!"=="0" (
            echo ^> Minifying %%f
            minify.exe "%SRC%\%%d\%%f" -o "%DIST%\%%d\%%f"
        ) else (
            echo ^> Skipping %%f ^(excluded^)
        )
    )

    :: Process JS (only in the specific directory, not subdirectories)  
    for /f "tokens=*" %%f in ('dir /b "%SRC%\%%d\*.js" 2^>nul') do (
        call :checkExclude "%%f" "%%d"
        if "!SKIP!"=="0" (
            echo ^> Minifying %%f
            minify.exe "%SRC%\%%d\%%f" -o "%DIST%\%%d\%%f"
        ) else (
            echo ^> Skipping %%f ^(excluded^)
        )
    )

    :: Process HTML (only in the specific directory, not subdirectories)
    for /f "tokens=*" %%f in ('dir /b "%SRC%\%%d\*.html" 2^>nul') do (
        call :checkExclude "%%f" "%%d"
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
:: Input: filename and folder path
:: Sets variable SKIP=1 if excluded, 0 otherwise
:: Supports:
:: - Full paths: "src\filename.html" 
:: - Wildcards: "ANY\filename.html" (matches any folder)
:: - Just filenames: "filename.html" (exact match only in root folder)
:: ================================
:checkExclude
set "SKIP=0"
set "inputFile=%~1"
set "inputFolder=%~2"
set "fullPath=%inputFolder%\%inputFile%"

if defined EXCLUDE (
    for %%x in (%EXCLUDE%) do (
        set "pattern=%%x"
        
        if "!pattern:~0,4!"=="ANY\" (
            :: Wildcard pattern - check if filename matches in any folder
            set "wildcardFile=!pattern:~4!"
            if /I "!inputFile!"=="!wildcardFile!" set "SKIP=1"
        ) else (
            :: Check if pattern contains backslash
            if "!pattern!" NEQ "!pattern:\=!" (
                :: Full path pattern - exact path match
                if /I "!fullPath!"=="!pattern!" set "SKIP=1"
            ) else (
                :: Just filename pattern - only exclude if in root folder (no inputFolder or inputFolder is empty/.)
                if "!inputFolder!"=="." if /I "!inputFile!"=="!pattern!" set "SKIP=1"
            )
        )
    )
)
exit /b