@echo off
echo Reinstalling AI packages after system restart...
cd "C:\Users\Karthik GS\OneDrive\Desktop\CIE_Personal\temp-CIE-personal"

echo Setting up Python environment...
"C:/Users/Karthik GS/OneDrive/Desktop/CIE_Personal/.venv/Scripts/python.exe" -m pip install --upgrade pip

echo Installing AI packages...
"C:/Users/Karthik GS/OneDrive/Desktop/CIE_Personal/.venv/Scripts/python.exe" -m pip install numpy sentence-transformers faiss-cpu pdfplumber mistralai python-dotenv

echo Testing installation...
"C:/Users/Karthik GS/OneDrive/Desktop/CIE_Personal/.venv/Scripts/python.exe" -c "import numpy, sentence_transformers, faiss, pdfplumber, mistralai; print('✅ All packages installed successfully!')"

echo Done! You can now use the AI shortlist feature.
pause
