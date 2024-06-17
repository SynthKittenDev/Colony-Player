@echo off
title - Make Colony Work -
setlocal

:: Define the target directory and file
set "targetDir=%AppData%\Macromedia\Flash Player\#Security\FlashPlayerTrust"
set "targetFile=winetrust.cfg"

:: Create the target directory if it doesn't exist
if not exist "%targetDir%" (
    mkdir "%targetDir%"
)

:: Get the current directory
set "currentDir=%cd%"

:: Define the full path to the target file
set "targetFilePath=%targetDir%\%targetFile%"

:: Append the current directory to the file
:: if it doesn't already contain the path
findstr /x /c:"%currentDir%" "%targetFilePath%" >nul 2>&1
if errorlevel 1 (
    echo %currentDir% >> "%targetFilePath%"
)

:: Notify the user the operation has completed
color a
echo Done! Your Colony should work now as long as you ran this file in the directory of the game.
echo.
endlocal

PAUSE
