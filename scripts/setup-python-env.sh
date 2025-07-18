#!/bin/bash

# Python Environment Setup Script for Linux/Mac
# This script sets up the Python virtual environment and installs required packages

echo "🐍 Setting up Python environment for AI features..."

# Check if we're in the project directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 is not installed"
    echo "Please install Python 3.8 or higher first"
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv .venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source .venv/bin/activate

# Upgrade pip
echo "⬆️  Upgrading pip..."
python -m pip install --upgrade pip

# Install required packages
echo "📥 Installing AI packages..."
python -m pip install numpy sentence-transformers faiss-cpu pdfplumber mistralai python-dotenv

# Test installation
echo "🧪 Testing installation..."
python -c "import numpy, sentence_transformers, faiss, pdfplumber, mistralai; print('✅ All packages installed successfully!')"

echo ""
echo "🎉 Setup complete! Your Python environment is ready for AI features."
echo ""
echo "📝 Next steps:"
echo "1. Make sure your .env file has MISTRAL_API_KEY and GEMINI_API_KEY"
echo "2. Start the development server: npm run dev"
echo ""
echo "💡 To activate the virtual environment manually:"
echo "   source .venv/bin/activate"
