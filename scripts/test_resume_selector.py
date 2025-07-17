#!/usr/bin/env python3
"""
Test script for the resume selector functionality
"""
import os
import sys
import json

# Add current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from resume_selector_main_class import ResumeSelector
    
    def test_resume_selector():
        print("🧪 Testing Resume Selector with real project data...")
        print("=" * 50)
        
        # Test with existing project
        project_id = "cmd5mch76001gj40vqxknf824"
        project_description = "Software Engineering Internship - Building web applications with modern frameworks"
        
        # Initialize resume selector (without Mistral for now)
        print("📚 Initializing Resume Selector...")
        selector = ResumeSelector(api_key="test_key")  # Use test key for now
        
        # Get project applications directory
        project_dir = f"../public/project-applications/{project_id}"
        abs_project_dir = os.path.abspath(project_dir)
        
        if not os.path.exists(abs_project_dir):
            print(f"❌ Project directory not found: {abs_project_dir}")
            return
            
        print(f"📁 Project directory: {abs_project_dir}")
        
        # List resume files
        resume_files = [f for f in os.listdir(abs_project_dir) if f.endswith('.pdf')]
        print(f"📄 Found {len(resume_files)} resume files:")
        for i, resume in enumerate(resume_files, 1):
            print(f"   {i}. {resume}")
        
        if not resume_files:
            print("❌ No resume files found!")
            return
            
        # Test PDF processing (without actual shortlisting to avoid API requirement)
        print("\n🔍 Testing PDF text extraction...")
        for resume_file in resume_files[:2]:  # Test first 2 resumes
            resume_path = os.path.join(abs_project_dir, resume_file)
            try:
                text = selector.extract_text_from_pdf(resume_path)
                word_count = len(text.split())
                print(f"✅ {resume_file}: Extracted {word_count} words")
                if word_count > 0:
                    preview = text[:100] + "..." if len(text) > 100 else text
                    print(f"   Preview: {preview}")
            except Exception as e:
                print(f"❌ {resume_file}: Error - {str(e)}")
        
        # Test complete resume processing workflow
        print("\n🧮 Testing complete resume processing workflow...")
        try:
            # Process resumes in the directory
            print("📚 Processing resumes...")
            success = selector.process_resumes(abs_project_dir)
            if success:
                print(f"✅ Successfully processed resumes")
                
                # Build search index
                print("🔍 Building search index...")
                index_success = selector.build_index()
                if index_success:
                    print(f"✅ Successfully built search index")
                    print(f"📊 Total resumes processed: {selector.get_resume_count()}")
                    print(f"🚀 System ready: {selector.is_ready()}")
                else:
                    print("❌ Failed to build search index")
            else:
                print("❌ Failed to process resumes")
                
        except Exception as e:
            print(f"❌ Resume processing failed: {str(e)}")
        
        print("\n🎉 Resume selector basic functionality test completed!")
        print("📝 Note: Full shortlisting with AI requires valid Mistral API key")
        
    if __name__ == "__main__":
        test_resume_selector()
        
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Make sure all dependencies are installed")
except Exception as e:
    print(f"❌ Test failed: {e}")
