@echo off
echo Reinstalling AI packages...

:: Check if we're in the project directory
if not exist "package.json" (
    echo Error: Please run this script from the project root directory
    pause
    exit /b 1
)

:: Look for virtual environment in common locations
set VENV_PYTHON=""
if exist ".venv\Scripts\python.exe" (
    set VENV_PYTHON=".venv\Scripts\python.exe"
) else if exist "..\.venv\Scripts\python.exe" (
    set VENV_PYTHON="..\.venv\Scripts\python.exe"
) else (
    echo Error: Virtual environment not found!
    echo Please create a virtual environment first:
    echo   python -m venv .venv
    echo   .venv\Scripts\activate
    pause
    exit /b 1
)

echo Found Python at: %VENV_PYTHON%
echo Setting up Python environment...
%VENV_PYTHON% -m pip install --upgrade pip

echo Installing AI packages...
%VENV_PYTHON% -m pip install numpy sentence-transformers faiss-cpu pdfplumber mistralai python-dotenv

echo Testing installation...
%VENV_PYTHON% -c "import numpy, sentence_transformers, faiss, pdfplumber, mistralai; print('✅ All packages installed successfully!')"

echo Done! You can now use the AI shortlist feature.
pause
