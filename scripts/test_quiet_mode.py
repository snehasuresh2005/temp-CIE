#!/usr/bin/env python3
"""
Quick test of the API-compatible resume selector
"""
import os
import sys
import json

# Add current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from resume_selector_main_class import ResumeSelector
    
    def test_quiet_mode():
        print("🧪 Testing Quiet Mode Resume Selector")
        print("=" * 40)
        
        # Load API key from .env
        env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env")
        mistral_api_key = None
        
        if os.path.exists(env_path):
            with open(env_path, 'r') as f:
                for line in f:
                    if line.startswith('MISTRAL_API_KEY='):
                        mistral_api_key = line.split('=', 1)[1].strip().strip('"')
                        break
        
        if not mistral_api_key:
            print("❌ No API key found")
            return
            
        print(f"✅ API key loaded")
        
        # Initialize in quiet mode
        print("🤖 Initializing in quiet mode...")
        selector = ResumeSelector(api_key=mistral_api_key, quiet=True)
        print("✅ Initialized successfully with no verbose output!")
        
        # Test basic functionality
        project_dir = "../public/project-applications/cmd5mch76001gj40vqxknf824"
        abs_project_dir = os.path.abspath(project_dir)
        
        print("📚 Processing resumes...")
        success = selector.process_resumes(abs_project_dir)
        print(f"✅ Process result: {success}")
        
        print("🎯 Building index...")
        index_success = selector.build_index()
        print(f"✅ Index result: {index_success}")
        
        print("🔍 Testing search...")
        candidates = selector.search_resumes("Python developer needed", top_k=2)
        print(f"✅ Found {len(candidates)} candidates")
        
        # Test JSON output format
        results = []
        for candidate in candidates[:1]:  # Just test one
            summary = selector.generate_candidate_summary("Python developer", candidate)
            results.append({
                "file_name": candidate["file_name"],
                "score": candidate["score"],
                "name": summary.get("name", "Unknown"),
                "skills": summary.get("skills", []),
                "reasons": summary.get("reasons", [])
            })
        
        # Output clean JSON (like the API expects)
        print("\n📋 JSON Output Test:")
        json_output = json.dumps({"success": True, "candidates": results})
        print(json_output)
        
    if __name__ == "__main__":
        test_quiet_mode()
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
