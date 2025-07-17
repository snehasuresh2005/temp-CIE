#!/usr/bin/env python3
"""
Test the complete AI shortlisting functionality with real API key
"""
import os
import sys
import json

# Add current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from resume_selector_main_class import ResumeSelector
    
    def test_ai_shortlisting():
        print("🚀 Testing Complete AI Shortlisting Functionality")
        print("=" * 60)
        
        # Load API key from .env
        env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env")
        mistral_api_key = None
        
        if os.path.exists(env_path):
            with open(env_path, 'r') as f:
                for line in f:
                    if line.startswith('MISTRAL_API_KEY='):
                        mistral_api_key = line.split('=', 1)[1].strip().strip('"')
                        break
        
        if not mistral_api_key or mistral_api_key == "your_mistral_api_key_here":
            print("❌ No valid Mistral API key found in .env file")
            return
            
        print(f"✅ Found Mistral API key: {mistral_api_key[:8]}...")
        
        # Test project data
        project_id = "cmd5mch76001gj40vqxknf824"
        project_description = """
        We are looking for a Software Engineering Intern to join our development team. 
        The ideal candidate should have:
        - Strong programming skills in Python, JavaScript, or similar languages
        - Experience with web development frameworks (React, Node.js, Django, etc.)
        - Knowledge of databases and SQL
        - Experience with version control (Git)
        - Problem-solving abilities and analytical thinking
        - Good communication skills
        - Experience with machine learning or AI is a plus
        
        Responsibilities include:
        - Developing web applications using modern frameworks
        - Working with databases and APIs
        - Collaborating with the development team
        - Writing clean, maintainable code
        - Testing and debugging applications
        """
        
        # Initialize AI resume selector with real API key
        print("🤖 Initializing AI Resume Selector...")
        selector = ResumeSelector(api_key=mistral_api_key)
        
        # Get project applications directory
        project_dir = f"../public/project-applications/{project_id}"
        abs_project_dir = os.path.abspath(project_dir)
        
        if not os.path.exists(abs_project_dir):
            print(f"❌ Project directory not found: {abs_project_dir}")
            return
            
        print(f"📁 Project directory: {abs_project_dir}")
        
        # Process all resumes in the directory
        print("\n📚 Processing all resumes in directory...")
        success = selector.process_resumes(abs_project_dir)
        
        if not success:
            print("❌ Failed to process resumes")
            return
            
        print(f"✅ Successfully processed {selector.get_resume_count()} resumes")
        
        # Build search index
        print("\n🔍 Building AI search index...")
        index_success = selector.build_index()
        
        if not index_success:
            print("❌ Failed to build search index")
            return
            
        print("✅ Search index built successfully")
        
        # Perform AI-powered candidate shortlisting
        print(f"\n🎯 AI Shortlisting based on project requirements...")
        print(f"📋 Project Description Criteria:")
        print(f"   - {project_description.strip()}")
        
        try:
            top_candidates = selector.search_resumes(project_description, top_k=5)
            
            print(f"\n🏆 TOP {len(top_candidates)} CANDIDATES SELECTED:")
            print("=" * 60)
            
            for i, candidate in enumerate(top_candidates, 1):
                print(f"\n🥇 RANK #{i}")
                print(f"👤 Candidate: {candidate.get('file_name', 'Unknown')}")
                print(f"📊 Match Score: {candidate.get('score', 0):.3f}")
                
                # Generate detailed AI analysis for each candidate
                print(f"🤖 Generating AI Analysis...")
                try:
                    ai_summary = selector.generate_candidate_summary(project_description, candidate)
                    
                    print(f"   � Name: {ai_summary.get('name', 'Unknown')}")
                    print(f"   📈 AI Score: {ai_summary.get('score', 0):.3f}")
                    
                    if 'skills' in ai_summary and ai_summary['skills']:
                        print(f"   🛠️  Key Skills: {', '.join(ai_summary['skills'][:5])}")
                    
                    if 'reasons' in ai_summary and ai_summary['reasons']:
                        print(f"   🎯 Why Selected (AI Analysis):")
                        for reason in ai_summary['reasons'][:3]:  # Top 3 reasons
                            print(f"      • {reason}")
                    
                    if 'error' in ai_summary:
                        print(f"   ❌ AI Analysis Error: {ai_summary['error']}")
                        
                except Exception as e:
                    print(f"   ❌ Failed to generate AI analysis: {str(e)}")
                
                print("-" * 50)
            
            print(f"\n✅ AI Shortlisting completed successfully!")
            print(f"📝 Faculty can now see detailed reasons for each candidate selection")
            
        except Exception as e:
            print(f"❌ AI shortlisting failed: {str(e)}")
            import traceback
            traceback.print_exc()
        
    if __name__ == "__main__":
        test_ai_shortlisting()
        
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Make sure all dependencies are installed")
except Exception as e:
    print(f"❌ Test failed: {e}")
    import traceback
    traceback.print_exc()
