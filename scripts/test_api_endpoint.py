#!/usr/bin/env python3
"""
Test the actual API endpoint for AI shortlisting
"""
import requests
import json

def test_api_shortlisting():
    print("🌐 Testing AI Shortlisting API Endpoint")
    print("=" * 50)
    
    # Test the API endpoint
    url = "http://localhost:3000/api/projects/shortlist"
    
    # Test data - using the project ID we know has resumes
    data = {
        "project_id": "cmd5mch76001gj40vqxknf824",
        "top_k": 3
    }
    
    print(f"📡 Making POST request to: {url}")
    print(f"📋 Request data: {json.dumps(data, indent=2)}")
    
    try:
        response = requests.post(url, json=data, timeout=120)  # 2 minutes timeout
        
        print(f"📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ API Response received successfully!")
            print(f"📊 Number of candidates: {len(result.get('candidates', []))}")
            
            for i, candidate in enumerate(result.get('candidates', []), 1):
                print(f"\n🥇 CANDIDATE #{i}")
                print(f"   👤 Name: {candidate.get('student_name', 'Unknown')}")
                print(f"   📧 Email: {candidate.get('student_email', 'Unknown')}")
                print(f"   📊 Score: {candidate.get('score', 0):.3f}")
                print(f"   📄 Resume: {candidate.get('file_name', 'Unknown')}")
                
                if 'ai_analysis' in candidate:
                    analysis = candidate['ai_analysis']
                    print(f"   🤖 AI Analysis:")
                    print(f"      💼 Name: {analysis.get('name', 'Unknown')}")
                    print(f"      🛠️  Skills: {', '.join(analysis.get('skills', [])[:5])}")
                    if analysis.get('reasons'):
                        print(f"      🎯 Reasons:")
                        for reason in analysis['reasons'][:3]:
                            print(f"         • {reason}")
                
                print("-" * 40)
        else:
            print(f"❌ API Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_api_shortlisting()
