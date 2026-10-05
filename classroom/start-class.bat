@echo off
rem PC Assembly Lab: start the classroom server on the teacher's PC (needs Python 3: https://www.python.org)
title PC Assembly Lab - classroom
cd /d "%~dp0"
where py >nul 2>nul && (py -3 server.py %* & goto :end)
where python >nul 2>nul && (python server.py %* & goto :end)
echo Python 3 is not installed. Get it from https://www.python.org/downloads/ (tick "Add python.exe to PATH").
:end
pause
