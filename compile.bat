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

:: Define which subfolders/files should be copied without minifying (space-separated)
set COPY_ONLY=cdn posts public search.json

:: Define excluded js, html, and css files (just filenames, space-separated)
set EXCLUDE=nothing.html

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
for %%d in (%COPY_ONLY%) do (
    echo.
    echo --- Copying %%d ---
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

    :: Process CSS
    for %%f in ("%SRC%\%%d\*.css") do (
        call :checkExclude "%%~nxf"
        if "!SKIP!"=="0" (
            echo Minifying %%~nxf
            minify.exe "%%f" -o "%DIST%\%%d\%%~nf.css"
        )
    )

    :: Process JS
    for %%f in ("%SRC%\%%d\*.js") do (
        call :checkExclude "%%~nxf"
        if "!SKIP!"=="0" (
            echo Minifying %%~nxf
            minify.exe "%%f" -o "%DIST%\%%d\%%~nf.js"
        )
    )

    :: Process HTML
    for %%f in ("%SRC%\%%d\*.html") do (
        call :checkExclude "%%~nxf"
        if "!SKIP!"=="0" (
            echo Minifying %%~nxf
            minify.exe "%%f" -o "%DIST%\%%d\%%~nf.html"
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
for %%x in (%EXCLUDE%) do (
    if /I "%~1"=="%%x" set "SKIP=1"
)
exit /b
