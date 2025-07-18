# Python Environment Setup Script for Windows PowerShell
# This script sets up the Python virtual environment and installs required packages

Write-Host "🐍 Setting up Python environment for AI features..." -ForegroundColor Cyan

# Check if we're in the project directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Please run this script from the project root directory" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if Python is installed
try {
    $pythonVersion = python --version 2>$null
    Write-Host "✅ Found Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python 3.8 or higher first" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Create virtual environment if it doesn't exist
if (-not (Test-Path ".venv")) {
    Write-Host "📦 Creating virtual environment..." -ForegroundColor Yellow
    python -m venv .venv
}

# Activate virtual environment
Write-Host "🔧 Activating virtual environment..." -ForegroundColor Yellow
& ".venv\Scripts\Activate.ps1"

# Upgrade pip
Write-Host "⬆️  Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip

# Install required packages
Write-Host "📥 Installing AI packages..." -ForegroundColor Yellow
python -m pip install numpy sentence-transformers faiss-cpu pdfplumber mistralai python-dotenv

# Test installation
Write-Host "🧪 Testing installation..." -ForegroundColor Yellow
python -c "import numpy, sentence_transformers, faiss, pdfplumber, mistralai; print('✅ All packages installed successfully!')"

Write-Host ""
Write-Host "🎉 Setup complete! Your Python environment is ready for AI features." -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Make sure your .env file has MISTRAL_API_KEY and GEMINI_API_KEY" -ForegroundColor White
Write-Host "2. Start the development server: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "💡 To activate the virtual environment manually:" -ForegroundColor Cyan
Write-Host "   .venv\Scripts\Activate.ps1" -ForegroundColor White

Read-Host "Press Enter to exit"
