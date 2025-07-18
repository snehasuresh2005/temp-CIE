import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserById } from "@/lib/auth"
import { exec } from "child_process"
import { promisify } from "util"
import path from "path"
import fs from "fs/promises"

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }

    const user = await getUserById(userId)
    if (!user || user.role !== "FACULTY") {
      return NextResponse.json({ error: "Access denied - Faculty only" }, { status: 403 })
    }

    const body = await request.json()
    const { project_id, top_k = 3 } = body

    if (!project_id) {
      return NextResponse.json({ 
        error: "Project ID is required" 
      }, { status: 400 })
    }

    // Get project details
    const project = await prisma.project.findUnique({
      where: { id: project_id },
      include: {
        project_requests: {
          where: { status: "PENDING" },
          include: {
            student: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    if (project.created_by !== userId) {
      return NextResponse.json({ 
        error: "Access denied - You can only shortlist for your own projects" 
      }, { status: 403 })
    }

    if (!project.project_requests || project.project_requests.length === 0) {
      return NextResponse.json({ 
        error: "No pending applications found for this project" 
      }, { status: 400 })
    }

    // Check if resumes folder exists
    const resumesFolder = path.join(process.cwd(), "public", "project-applications", project_id)
    
    try {
      await fs.access(resumesFolder)
    } catch (error) {
      return NextResponse.json({ 
        error: "No resumes found for this project" 
      }, { status: 400 })
    }

    // Prepare project description for the selector
    const projectDescription = `
Project: ${project.name}

Description: ${project.description}

Requirements: Looking for candidates with relevant skills and experience for this project.

Expected completion: ${new Date(project.expected_completion_date).toLocaleDateString()}
    `.trim()

    // Create a temporary Python script to run the resume selector
    const scriptPath = path.join(process.cwd(), "scripts", "run_resume_selector.py")
    const mistralApiKey = process.env.MISTRAL_API_KEY || ""

    if (!mistralApiKey) {
      return NextResponse.json({ 
        error: "Mistral API key not configured" 
      }, { status: 500 })
    }

    // Create the Python script
    const pythonScript = `
import sys
import os
import json
import warnings

# Redirect all prints and warnings to stderr except our final JSON output
warnings.filterwarnings("ignore")
os.environ['TOKENIZERS_PARALLELISM'] = 'false'
os.environ['HF_HUB_DISABLE_SYMLINKS_WARNING'] = '1'

sys.path.append('${path.join(process.cwd(), "scripts").replace(/\\/g, "\\\\")}')

from resume_selector_main_class import ResumeSelector

def main():
    try:
        # Initialize the resume selector (quiet mode for API)
        print("Initializing AI Resume Selector...", file=sys.stderr)
        selector = ResumeSelector(api_key="${mistralApiKey}", quiet=True)
        
        # Process resumes from the project folder
        resume_folder = "${resumesFolder.replace(/\\/g, "\\\\")}"
        print(f"Processing resumes from: {resume_folder}", file=sys.stderr)
        success = selector.process_resumes(resume_folder)
        
        if not success:
            print(json.dumps({"error": "Failed to process resumes"}))
            return
        
        print(f"Successfully processed {selector.get_resume_count()} resumes", file=sys.stderr)
        
        # Project description
        project_desc = """${projectDescription.replace(/"/g, '\\"')}"""
        
        # Search for top candidates
        print("Searching for top candidates...", file=sys.stderr)
        candidates = selector.search_resumes(project_desc, top_k=${top_k})
        
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
`

    // Write the script
    await fs.writeFile(scriptPath, pythonScript)

    try {
      // Get Python path from environment or use dynamic detection
      let pythonPath = process.env.PYTHON_VENV_PATH;
      
      if (!pythonPath) {
        // Try to detect virtual environment automatically
        const venvPaths = [
          path.join(process.cwd(), "..", ".venv", process.platform === "win32" ? "Scripts" : "bin", process.platform === "win32" ? "python.exe" : "python"),
          path.join(process.cwd(), ".venv", process.platform === "win32" ? "Scripts" : "bin", process.platform === "win32" ? "python.exe" : "python"),
          path.join(process.env.HOME || process.env.USERPROFILE || "", ".venv", process.platform === "win32" ? "Scripts" : "bin", process.platform === "win32" ? "python.exe" : "python"),
        ];
        
        // Check which python path exists
        for (const checkPath of venvPaths) {
          try {
            await fs.access(checkPath);
            pythonPath = checkPath;
            break;
          } catch {
            // Continue to next path
          }
        }
        
        // Fallback to system python
        if (!pythonPath) {
          pythonPath = process.platform === "win32" ? "python.exe" : "python3";
          console.warn("Virtual environment not found, using system Python");
        }
      }
      
      console.log("Using Python path:", pythonPath);
      const { stdout, stderr } = await execAsync(`"${pythonPath}" "${scriptPath}"`, {
        cwd: process.cwd(),
        timeout: 120000, // 2 minutes timeout
        env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
      })

      if (stderr) {
        console.error("Python script stderr:", stderr)
      }

      // Parse the result
      const result = JSON.parse(stdout.trim())

      if (result.error) {
        return NextResponse.json({ 
          error: result.error 
        }, { status: 500 })
      }

      // Map results to include student information from database
      const shortlistedCandidates = []
      for (const candidate of result.candidates) {
        // Find the corresponding project request
        const projectRequest = project.project_requests.find(req => 
          req.resume_path && req.resume_path.includes(candidate.file_name)
        )

        if (projectRequest) {
          shortlistedCandidates.push({
            request_id: projectRequest.id,
            student_id: projectRequest.student_id,
            student_name: projectRequest.student.user.name,
            student_email: projectRequest.student.user.email,
            file_name: candidate.file_name,
            file_path: candidate.file_path,
            score: candidate.score,
            ai_analysis: {
              name: candidate.name,
              skills: candidate.skills,
              reasons: candidate.reasons,
              metadata: candidate.metadata
            }
          })
        }
      }

      // Clean up the temporary script
      try {
        await fs.unlink(scriptPath)
      } catch (error) {
        console.log("Could not delete temporary script:", error)
      }

      return NextResponse.json({ 
        success: true,
        project: {
          id: project.id,
          name: project.name,
          description: project.description
        },
        total_applications: project.project_requests.length,
        shortlisted_candidates: shortlistedCandidates
      })

    } catch (error) {
      console.error("Error running Python script:", error)
      
      // Clean up the temporary script
      try {
        await fs.unlink(scriptPath)
      } catch (cleanupError) {
        console.log("Could not delete temporary script:", cleanupError)
      }

      return NextResponse.json({ 
        error: "Failed to process resumes with AI" 
      }, { status: 500 })
    }

  } catch (error) {
    console.error("Error in shortlist endpoint:", error)
    return NextResponse.json({ 
      error: "Failed to shortlist candidates" 
    }, { status: 500 })
  }
}
