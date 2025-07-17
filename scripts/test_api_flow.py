#!/usr/bin/env python3
"""
Replicate exact API script execution
"""
import sys
import os
import json
import warnings

# Redirect all prints and warnings to stderr except our final JSON output
warnings.filterwarnings("ignore")
os.environ['TOKENIZERS_PARALLELISM'] = 'false'
os.environ['HF_HUB_DISABLE_SYMLINKS_WARNING'] = '1'

sys.path.append('C:\\Users\\Karthik GS\\OneDrive\\Desktop\\CIE_Personal\\temp-CIE-personal\\scripts')

from resume_selector_main_class import ResumeSelector

def main():
    try:
        # Initialize the resume selector (quiet mode for API)
        print("Initializing AI Resume Selector...", file=sys.stderr)
        selector = ResumeSelector(api_key="Z75qLmGvhgQWqynupSz0QleAqTDZjHQz", quiet=True)
        
        # Process resumes from the project folder
        resume_folder = "C:\\Users\\Karthik GS\\OneDrive\\Desktop\\CIE_Personal\\temp-CIE-personal\\public\\project-applications\\cmd5s7tnz0001gc0v2embyict"
        print(f"Processing resumes from: {resume_folder}", file=sys.stderr)
        success = selector.process_resumes(resume_folder)
        
        if not success:
            print(json.dumps({"error": "Failed to process resumes"}))
            return
        
        print(f"Successfully processed {selector.get_resume_count()} resumes", file=sys.stderr)
        
        # Project description
        project_desc = """
Project: Software Engineering Internship

Description: Looking for talented software engineering interns to join our team

Requirements: Looking for candidates with relevant skills and experience for this project.

Expected completion: 1/1/2025
        """.strip()
        
        # Search for top candidates
        print("Searching for top candidates...", file=sys.stderr)
        candidates = selector.search_resumes(project_desc, top_k=3)
        
        if not candidates:
            print(json.dumps({"error": "No suitable candidates found"}))
            return
        
        # Generate summaries for candidates
        print("Generating AI analysis for candidates...", file=sys.stderr)
        results = []
        for i, candidate in enumerate(candidates, 1):
            print(f"Analyzing candidate {i}/{len(candidates)}...", file=sys.stderr)
            summary = selector.generate_candidate_summary(project_desc, candidate)
            results.append({
                "file_name": candidate["file_name"],
                "file_path": candidate["file_path"],
                "score": candidate["score"],
                "name": summary.get("name", "Unknown"),
                "skills": summary.get("skills", []),
                "reasons": summary.get("reasons", []),
                "metadata": candidate.get("metadata", {})
            })
        
        print(f"AI analysis completed successfully!", file=sys.stderr)
        # Only print JSON to stdout
        print(json.dumps({"success": True, "candidates": results}))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()
