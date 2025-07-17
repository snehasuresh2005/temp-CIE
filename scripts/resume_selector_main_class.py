
import os
import sys
import json
import uuid
from pathlib import Path
from typing import List, Dict, Any
import logging
import numpy as np
import faiss
import pdfplumber
from sentence_transformers import SentenceTransformer
from mistralai import Mistral
class ResumeSelector:
    """
    A class for processing resumes and finding the best candidates for projects.

    This class handles:
    - PDF text extraction
    - Resume metadata extraction using LLM
    - Vector embedding and similarity search
    - Candidate ranking and summary generation
    """

    def __init__(self, api_key: str, embedding_model: str = "BAAI/bge-base-en-v1.5", quiet: bool = False):
        """
        Initialize the resume selector with a Mistral API key.

        Args:
            api_key (str): Mistral API key for LLM operations
            embedding_model (str): HuggingFace embedding model name
            quiet (bool): If True, suppress all console output
        """
        # Suppress PDF extraction warnings
        logging.getLogger("pdfminer").setLevel(logging.ERROR)

        self.quiet = quiet

        # Initialize Mistral client
        self.mistral_client = Mistral(api_key=api_key)

        # Initialize embedding model
        if not self.quiet:
            print("Loading embedding model...")
        self.embedding_model = SentenceTransformer(embedding_model)
        self.embedding_dim = self.embedding_model.get_sentence_embedding_dimension()

        # Initialize storage
        self.index = None
        self.resumes: List[str] = []
        self.file_paths: List[str] = []
        self.resume_metadata: Dict[str, Any] = {}

        if not self.quiet:
            print("✅ Resume Selector initialized!")

    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """
        Extract text content from a PDF file.

        Args:
            pdf_path (str): Path to the PDF file

        Returns:
            str: Extracted text content
        """
        text = ""
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text(
                        x_tolerance=1,
                        y_tolerance=1,
                        keep_blank_chars=False,
                        use_text_flow=True
                    )
                    if page_text:
                        text += page_text + "\n\n"
        except Exception as e:
            print(f"❌ Error extracting text from {pdf_path}: {e}", file=sys.stderr)

        return text.strip()

    def extract_metadata(self, text: str) -> Dict[str, Any]:
        """
        Extract structured metadata from resume text using LLM.

        Args:
            text (str): Resume text content

        Returns:
            Dict[str, Any]: Extracted metadata including name, skills, experience, etc.
        """
        prompt = f"""
Analyze the following resume text and extract structured metadata in JSON format:
{text[:4000]}

Return JSON with keys:
- name
- email
- phone
- skills
- experience_years
- education
- job_titles
- summary
Important: Only return valid JSON, no additional text.
"""
        try:
            response = self.mistral_client.chat.complete(
                model="mistral-small-latest",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            if not self.quiet:
                print(f"Metadata extraction error: {e}", file=sys.stderr)
            return {
                "name": "Unknown",
                "email": "",
                "phone": "",
                "skills": [],
                "experience_years": 0.0,
                "education": [],
                "job_titles": [],
                "summary": ""
            }

    def process_resumes(self, folder_path: str) -> bool:
        """
        Process all PDF resumes in a folder.

        Args:
            folder_path (str): Path to folder containing PDF resumes

        Returns:
            bool: True if processing was successful, False otherwise
        """
        # Clear existing data
        self.resumes.clear()
        self.file_paths.clear()
        self.resume_metadata.clear()

        # Find PDF files
        folder = Path(folder_path)
        if not folder.exists():
            print(f"❌ Folder {folder_path} does not exist!")
            return False

        pdf_files = list(folder.glob("*.pdf"))
        if not pdf_files:
            print("❌ No PDF files found!")
            return False

        # Process each PDF
        for pdf_file in pdf_files:
            file_id = uuid.uuid4().hex[:8]
            if not self.quiet:
                print(f"Processing: {pdf_file.name} (ID: {file_id})", file=sys.stderr)

            # Extract text
            text = self.extract_text_from_pdf(str(pdf_file))
            if not text:
                print(f"⚠️ No text extracted from {pdf_file.name}")
                continue

            # Extract metadata
            metadata = self.extract_metadata(text)

            # Store data
            self.resumes.append(text)
            self.file_paths.append(str(pdf_file))

            # Store metadata with truncated text for memory efficiency
            short_text = text[:2000] + "..." if len(text) > 2000 else text
            self.resume_metadata[file_id] = {
                "file_name": pdf_file.name,
                "file_path": str(pdf_file),
                "text": short_text,
                "metadata": metadata
            }

        if not self.quiet:
            print(f"✅ Processed {len(self.resumes)} resumes", file=sys.stderr)

        # Build search index
        if self.resumes:
            return self.build_index()
        return False

    def build_index(self) -> bool:
        """
        Build FAISS vector index for semantic search.

        Returns:
            bool: True if index was built successfully, False otherwise
        """
        enhanced_texts: List[str] = []

        for resume, path in zip(self.resumes, self.file_paths):
            # Find file ID
            file_id = None
            for fid, metadata in self.resume_metadata.items():
                if metadata["file_path"] == path:
                    file_id = fid
                    break

            if file_id is None:
                print(f"Warning: Could not find metadata for {path}")
                continue

            meta = self.resume_metadata[file_id]["metadata"]

            # Process skills safely
            clean_skills = self._extract_skills(meta.get('skills', []))

            # Get other metadata safely
            name = str(meta.get('name', 'Unknown'))
            experience_years = meta.get('experience_years', 0)
            if not isinstance(experience_years, (int, float)):
                experience_years = 0

            summary = str(meta.get('summary', ''))

            # Create enhanced text for better search
            enhanced_text = (
                f"Candidate Profile:\n"
                f"Name: {name}\n"
                f"Skills: {', '.join(clean_skills)}\n"
                f"Experience: {experience_years} years\n"
                f"Summary: {summary}\n\n"
                f"Resume Content:\n{resume[:3000]}"
            )
            enhanced_texts.append(enhanced_text)

        if not enhanced_texts:
            print("❌ No valid resume texts to index")
            return False

        try:
            # Create embeddings
            embeddings = self.embedding_model.encode(
                enhanced_texts,
                show_progress_bar=True
            ).astype('float32')

            # Normalize embeddings
            faiss.normalize_L2(embeddings)

            # Build FAISS index
            self.index = faiss.IndexFlatIP(self.embedding_dim)
            self.index.add(embeddings)

            if not self.quiet:
                print(f"✅ Indexed {len(enhanced_texts)} resumes", file=sys.stderr)
            return True

        except Exception as e:
            print(f"❌ Error building index: {e}")
            return False

    def search_resumes(self, project_description: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Search for resumes matching a project description.

        Args:
            project_description (str): Description of the project requirements
            top_k (int): Number of top candidates to return

        Returns:
            List[Dict[str, Any]]: List of matching candidates with scores and metadata
        """
        if not self.index:
            if not self.quiet:
                print("❌ Index not built. Please process resumes first.", file=sys.stderr)
            return []

        # Create search query
        query = f"Project Requirements:\n{project_description}\nLooking for relevant candidates."

        # Get query embedding
        query_embedding = self.embedding_model.encode([query]).astype('float32')
        faiss.normalize_L2(query_embedding)

        # Search index
        scores, indices = self.index.search(query_embedding, top_k * 2)

        # Re-rank results using metadata
        candidates_to_rerank = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < 0:
                continue

            path = self.file_paths[idx]
            file_id = self._get_file_id_by_path(path)

            if file_id is None:
                continue

            metadata = self.resume_metadata[file_id]["metadata"]
            metadata_score = self.calculate_metadata_similarity(project_description, metadata)

            # Combined score: 60% semantic similarity + 40% metadata similarity
            combined_score = (score * 0.6) + (metadata_score * 0.4)
            candidates_to_rerank.append((combined_score, idx, file_id))

        # Sort by combined score
        candidates_to_rerank.sort(key=lambda x: x[0], reverse=True)

        # Return top candidates
        results = []
        for score, idx, file_id in candidates_to_rerank[:top_k]:
            results.append({
                "id": file_id,
                "score": float(score),
                "file_name": self.resume_metadata[file_id]["file_name"],
                "file_path": self.resume_metadata[file_id]["file_path"],
                "text": self.resumes[idx],
                "metadata": self.resume_metadata[file_id]["metadata"]
            })

        return results

    def calculate_metadata_similarity(self, project_description: str, metadata: Dict[str, Any]) -> float:
        """
        Calculate similarity score based on metadata matching.

        Args:
            project_description (str): Project description
            metadata (Dict[str, Any]): Candidate metadata

        Returns:
            float: Similarity score between 0 and 1
        """
        score = 0.0
        project_desc_lower = project_description.lower()

        # Skills matching
        skills = self._extract_skills(metadata.get("skills", []))
        skill_matches = sum(1 for skill in skills if skill.lower() in project_desc_lower)
        score += min(0.4, skill_matches * 0.05)

        # Experience level matching
        experience_years = metadata.get("experience_years", 0)
        if not isinstance(experience_years, (int, float)):
            experience_years = 0

        if "senior" in project_desc_lower and experience_years >= 5:
            score += 0.2
        elif "junior" in project_desc_lower and experience_years < 5:
            score += 0.2

        # Education matching
        education = self._extract_list_items(metadata.get("education", []))
        for degree in education:
            degree_lower = degree.lower()
            if "phd" in project_desc_lower and "phd" in degree_lower:
                score += 0.1
            elif "master" in project_desc_lower and "master" in degree_lower:
                score += 0.1

        # Job title matching
        job_titles = self._extract_list_items(metadata.get("job_titles", []))
        for title in job_titles:
            if title.lower() in project_desc_lower:
                score += 0.05

        return min(1.0, score)

    def generate_candidate_summary(self, project_description: str, candidate_info: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a summary of why a candidate matches the project.

        Args:
            project_description (str): Project description
            candidate_info (Dict[str, Any]): Candidate information

        Returns:
            Dict[str, Any]: Summary with name, skills, reasons, and score
        """
        metadata = candidate_info.get("metadata", {})
        name = metadata.get("name", Path(candidate_info['file_name']).stem)

        # Extract information safely
        skills = self._extract_skills(metadata.get('skills', []))[:5]
        job_titles = self._extract_list_items(metadata.get('job_titles', []))
        education = self._extract_list_items(metadata.get('education', []))

        experience_years = metadata.get("experience_years", 0)
        if not isinstance(experience_years, (int, float)):
            experience_years = 0

        # Get resume excerpt
        excerpt = candidate_info.get('text', '')
        if isinstance(excerpt, str) and len(excerpt) > 1500:
            excerpt = excerpt[:1500] + "..."

        # Generate summary using LLM
        prompt = f"""
## PROJECT DESCRIPTION:
{project_description}

## CANDIDATE METADATA:
Name: {name}
Skills: {', '.join(skills)}
Experience: {experience_years} years
Previous Roles: {', '.join(job_titles)}
Education: {', '.join(education)}

## RESUME EXCERPT:
{excerpt}

---
Analyze candidate fit and provide EXACTLY in JSON:
{{
  "name": "{name}",
  "skills": {json.dumps(skills)},
  "reasons": [
    "Reason 1",
    "Reason 2", 
    "Reason 3"
  ],
  "score": {candidate_info['score']:.2f}
}}
"""

        try:
            response = self.mistral_client.chat.complete(
                model="mistral-small-latest",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                response_format={"type": "json_object"}
            )

            result = json.loads(response.choices[0].message.content)
            result.setdefault("reasons", [])
            result.setdefault("skills", [])
            return result

        except Exception as e:
            print(f"Error generating summary: {e}")
            return {
                "name": name,
                "skills": skills,
                "reasons": [f"Error generating summary: {str(e)}"],
                "score": candidate_info.get('score', 0),
                "error": str(e)
            }

    def get_resume_count(self) -> int:
        """Get the number of processed resumes."""
        return len(self.resumes)

    def is_ready(self) -> bool:
        """Check if the system is ready for searching."""
        return self.index is not None and len(self.resumes) > 0

    def get_resume_metadata(self, resume_id: str) -> Dict[str, Any]:
        """Get metadata for a specific resume by ID."""
        return self.resume_metadata.get(resume_id, {})

    def _extract_skills(self, skills_raw) -> List[str]:
        """Safely extract skills from various formats."""
        clean_skills = []

        if isinstance(skills_raw, list):
            for skill in skills_raw:
                try:
                    if isinstance(skill, str):
                        clean_skills.append(skill)
                    elif isinstance(skill, dict):
                        if 'skill' in skill:
                            clean_skills.append(str(skill['skill']))
                        elif 'name' in skill:
                            clean_skills.append(str(skill['name']))
                        else:
                            # Take first string value from dict
                            for value in skill.values():
                                if isinstance(value, str):
                                    clean_skills.append(value)
                                    break
                    else:
                        clean_skills.append(str(skill))
                except Exception as e:
                    print(f"Warning: Could not process skill {skill}: {e}")
                    continue
        elif isinstance(skills_raw, str):
            # Split by common delimiters
            delimiters = [',', ';', '|', '\n']
            skills_text = skills_raw
            for delimiter in delimiters:
                skills_text = skills_text.replace(delimiter, '|')
            clean_skills = [skill.strip() for skill in skills_text.split('|') if skill.strip()]

        return clean_skills[:10]  # Limit to 10 skills

    def _extract_list_items(self, items_raw) -> List[str]:
        """Safely extract items from various list formats."""
        clean_items = []

        if isinstance(items_raw, list):
            for item in items_raw:
                try:
                    if isinstance(item, str):
                        clean_items.append(item)
                    elif isinstance(item, dict):
                        if 'name' in item:
                            clean_items.append(str(item['name']))
                        elif 'title' in item:
                            clean_items.append(str(item['title']))
                        elif 'degree' in item:
                            clean_items.append(str(item['degree']))
                        else:
                            clean_items.append(str(item))
                    else:
                        clean_items.append(str(item))
                except Exception as e:
                    print(f"Warning: Could not process item {item}: {e}")
                    continue

        return clean_items

    def _get_file_id_by_path(self, file_path: str) -> str:
        """Get file ID by file path."""
        for file_id, metadata in self.resume_metadata.items():
            if metadata["file_path"] == file_path:
                return file_id
        return None


# Example usage:
if __name__ == "__main__":
    # Initialize the resume selector
    selector = ResumeSelector(api_key="your_mistral_api_key")

    # Process resumes from a folder
    success = selector.process_resumes("path/to/resume/folder")

    if success:
        # Search for candidates
        project_desc = """
        Looking for a senior Python developer with experience in:
        - Machine learning and AI
        - FastAPI and web development
        - Vector databases and embeddings
        - At least 5 years of experience
        """

        candidates = selector.search_resumes(project_desc, top_k=5)

        # Generate summaries for top candidates
        for candidate in candidates:
            summary = selector.generate_candidate_summary(project_desc, candidate)
            print(f"Candidate: {summary['name']}")
            print(f"Score: {summary['score']}")
            print(f"Skills: {summary['skills']}")
            print(f"Reasons: {summary['reasons']}")
            print("-" * 50)