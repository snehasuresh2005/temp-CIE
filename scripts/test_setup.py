"""
Test script to verify the resume selector setup
"""
import sys
import os

def test_imports():
    """Test if all required packages can be imported"""
    try:
        import pdfplumber
        print("✅ pdfplumber imported successfully")
        
        import sentence_transformers
        print("✅ sentence-transformers imported successfully")
        
        import faiss
        print("✅ faiss-cpu imported successfully")
        
        import mistralai
        print("✅ mistralai imported successfully")
        
        import numpy
        print("✅ numpy imported successfully")
        
        from resume_selector_main_class import ResumeSelector
        print("✅ ResumeSelector class imported successfully")
        
        return True
    except Exception as e:
        print(f"❌ Import error: {e}")
        return False

def test_resume_selector():
    """Test if ResumeSelector can be initialized"""
    try:
        from resume_selector_main_class import ResumeSelector
        # Test with dummy API key
        selector = ResumeSelector(api_key="test_key")
        print("✅ ResumeSelector initialized successfully")
        return True
    except Exception as e:
        print(f"❌ ResumeSelector initialization error: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing Resume Selector Setup...")
    print("-" * 40)
    
    imports_ok = test_imports()
    selector_ok = test_resume_selector()
    
    print("-" * 40)
    if imports_ok and selector_ok:
        print("🎉 All tests passed! Resume selector is ready to use.")
    else:
        print("❌ Some tests failed. Please check the errors above.")
