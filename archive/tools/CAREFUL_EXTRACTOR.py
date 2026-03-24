#!/usr/bin/env python3
"""
Careful PDF Extractor for PlumberPass
Follows verification system - prioritizes accuracy over quantity
"""

import json
import re
from pathlib import Path
from datetime import datetime

try:
    import pdfplumber
except ImportError:
    import subprocess
    import sys
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pdfplumber", "-q"])
    import pdfplumber


class CarefulExtractor:
    """Extracts questions with verification and confidence scoring."""
    
    def __init__(self):
        self.quality_log = []
        self.errors = []
    
    def log_quality(self, message):
        """Log quality assessment."""
        self.quality_log.append(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")
        print(f"  [LOG] {message}")
    
    def log_error(self, message):
        """Log errors."""
        self.errors.append(message)
        print(f"  [ERROR] {message}")
    
    def clean_text(self, text):
        """Clean text while preserving structure."""
        if not text:
            return ""
        
        # Remove excessive spacing between letters
        # Pattern: single letter followed by space (repeated)
        lines = text.split('\n')
        cleaned_lines = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Check if line has the spaced pattern
            # Heuristic: if mostly single characters separated by spaces
            chars = line.split()
            if len(chars) > 5 and all(len(c) <= 2 for c in chars[:5]):
                # This looks like letter-spaced text
                # Try to reconstruct
                result = chars[0]
                for i in range(1, len(chars)):
                    prev, curr = chars[i-1], chars[i]
                    
                    # Word boundary detection
                    new_word = False
                    if curr.isupper() and prev.islower() and len(prev) > 1:
                        new_word = True
                    elif curr in ['The', 'A', 'An', 'Is', 'For', 'Of', 'To']:
                        new_word = True
                    elif prev[-1] in '.!?;:':
                        new_word = True
                    
                    result += (' ' if new_word else '') + curr
                
                cleaned_lines.append(result)
            else:
                cleaned_lines.append(line)
        
        return '\n'.join(cleaned_lines)
    
    def verify_answer(self, question_text, choices, explanation_text):
        """
        Determine confidence level and answer key.
        Returns: (answer_key, confidence, notes)
        """
        confidence = "manual_review"
        answer_key = None
        notes = []
        
        if not explanation_text:
            notes.append("No explanation found")
            return None, "manual_review", notes
        
        # Look for explicit answer markers
        for letter in ['A', 'B', 'C', 'D']:
            # Pattern 1: "A: " at start of explanation
            if explanation_text.strip().startswith(f"{letter}:"):
                answer_key = letter
                confidence = "verified"
                notes.append(f"Explicit answer marker: {letter}:")
                break
            
            # Pattern 2: "Answer: A" or "Correct: A"
            if re.search(rf'\b[Аа]nswer[:\s]+{letter}\b', explanation_text):
                answer_key = letter
                confidence = "verified"
                notes.append(f"Answer explicitly stated")
                break
            
            # Pattern 3: Choice has explanation in parentheses with reference
            choice_pattern = rf'{letter}\s*\.\s*[^\(]+\(([^)]+)\)'
            matches = re.findall(choice_pattern, explanation_text)
            for match in matches:
                if any(ref in match for ref in ['ASPE', 'PDE', 'AUDEL', 'NPCP', 'RA ', 'Chapter', 'should be']):
                    answer_key = letter
                    confidence = "probable"
                    notes.append(f"Choice {letter} has reference: {match[:50]}")
                    break
        
        if not answer_key:
            notes.append("Could not determine answer key")
            confidence = "manual_review"
        
        return answer_key, confidence, notes
    
    def extract_advance_qa(self, pdf_path):
        """
        Extract from Advance Q&A format with full verification.
        Returns list of verified questions.
        """
        questions = []
        
        self.log_quality(f"Opening: {pdf_path.name}")
        
        with pdfplumber.open(pdf_path) as pdf:
            self.log_quality(f"Total pages: {len(pdf.pages)}")
            
            # Extract all text first
            full_text = ""
            for i, page in enumerate(pdf.pages):
                text = page.extract_text()
                if text:
                    full_text += f"\n\n---PAGE {i+1}---\n{text}"
            
            # Clean the text
            cleaned_text = self.clean_text(full_text)
            
            # Save raw extraction for manual review if needed
            debug_file = Path("EXTRACTION_DEBUG") / f"{pdf_path.stem}_extracted.txt"
            debug_file.parent.mkdir(exist_ok=True)
            with open(debug_file, 'w', encoding='utf-8') as f:
                f.write(cleaned_text)
            
            # Parse questions
            # Pattern: QUESTION #N appears twice (question page + explanation page)
            blocks = re.split(r'QUESTION\s*#(\d+)', cleaned_text)
            
            self.log_quality(f"Found {len(blocks)//2} potential question blocks")
            
            i = 1
            while i < len(blocks) - 1:
                qnum = blocks[i]
                content = blocks[i+1]
                
                # Parse this question
                q = self.parse_single_question(qnum, content, pdf_path.stem)
                
                if q:
                    questions.append(q)
                    self.log_quality(f"Q{qnum}: {q['confidence']} - {q['prompt'][:40]}...")
                else:
                    self.log_error(f"Q{qnum}: Failed to parse")
                
                i += 2
        
        return questions
    
    def parse_single_question(self, qnum, content, source):
        """Parse and verify a single question."""
        lines = [l.strip() for l in content.split('\n') if l.strip()]
        
        if not lines:
            return None
        
        # Separate question text from explanation
        # Find where choices start
        question_lines = []
        choice_lines = []
        explanation_lines = []
        
        section = "question"
        for line in lines:
            if re.match(r'^[a-d][\.\)]', line, re.IGNORECASE):
                section = "choices"
            elif section == "choices" and not re.match(r'^[a-d][\.\)]', line, re.IGNORECASE):
                section = "explanation"
            
            if section == "question":
                question_lines.append(line)
            elif section == "choices":
                choice_lines.append(line)
            else:
                explanation_lines.append(line)
        
        # Parse choices
        choices = {}
        current_letter = None
        
        for line in choice_lines:
            match = re.match(r'^([a-d])[\.\)]\s*(.+)', line, re.IGNORECASE)
            if match:
                current_letter = match.group(1).upper()
                choices[current_letter] = match.group(2)
            elif current_letter:
                choices[current_letter] += ' ' + line
        
        if len(choices) < 2:
            return None
        
        # Build prompt
        prompt = ' '.join(question_lines).replace('_', ' ')
        prompt = re.sub(r'\s+', ' ', prompt).strip()
        
        # Build explanation
        explanation = ' '.join(explanation_lines)
        
        # Verify answer
        answer_key, confidence, notes = self.verify_answer(prompt, choices, explanation)
        
        return {
            "id": f"{source.replace(' ', '_')}-q{int(qnum):03d}",
            "prompt": prompt,
            "choices": [{"label": k, "text": re.sub(r'\s*\([^)]+\)', '', v).strip()} 
                       for k, v in sorted(choices.items())],
            "answer_key": answer_key,
            "explanation_raw": explanation[:500],  # First 500 chars
            "confidence": confidence,
            "verification_notes": '; '.join(notes),
            "needs_manual_check": confidence != "verified",
            "source": source
        }
    
    def process_file(self, pdf_path, category):
        """Process a single PDF file."""
        print(f"\n{'='*80}")
        print(f"PROCESSING: {pdf_path.name}")
        print(f"CATEGORY: {category}")
        print(f"{'='*80}")
        
        try:
            if "ADVANCE" in category:
                return self.extract_advance_qa(pdf_path)
            else:
                self.log_quality("Format not recognized, skipping")
                return []
        except Exception as e:
            self.log_error(f"Exception: {str(e)}")
            return []


def main():
    base_path = Path("D:/projects/PlumberPass 01-27-26")
    materials_path = base_path / "materials"
    output_path = base_path / "VERIFIED_QUESTIONS"
    output_path.mkdir(exist_ok=True)
    
    extractor = CarefulExtractor()
    
    print("="*80)
    print("CAREFUL PDF EXTRACTOR - Verification System Active")
    print("="*80)
    
    # Process Advance Q&A files one by one
    advance_folder = materials_path / "ADVANCE Q&A-20260126T193115Z-3-001"
    
    if advance_folder.exists():
        pdf_files = sorted(advance_folder.glob("WEEK*.pdf"))
        
        all_verified = []
        all_probable = []
        all_manual = []
        
        for pdf in pdf_files:
            questions = extractor.process_file(pdf, "ADVANCE Q&A")
            
            # Categorize by confidence
            for q in questions:
                if q['confidence'] == 'verified':
                    all_verified.append(q)
                elif q['confidence'] == 'probable':
                    all_probable.append(q)
                else:
                    all_manual.append(q)
            
            # Save individual week
            if questions:
                week_file = output_path / f"{pdf.stem}_VERIFIED.json"
                with open(week_file, 'w', encoding='utf-8') as f:
                    json.dump({
                        "metadata": {
                            "source": str(pdf),
                            "total": len(questions),
                            "verified": len([q for q in questions if q['confidence'] == 'verified']),
                            "probable": len([q for q in questions if q['confidence'] == 'probable']),
                            "manual_review": len([q for q in questions if q['confidence'] not in ['verified', 'probable']])
                        },
                        "questions": questions
                    }, f, indent=2, ensure_ascii=False)
        
        # Summary
        print(f"\n{'='*80}")
        print("EXTRACTION COMPLETE")
        print(f"{'='*80}")
        print(f"VERIFIED (ready to use): {len(all_verified)}")
        print(f"PROBABLE (needs quick check): {len(all_probable)}")
        print(f"MANUAL REVIEW (needs your help): {len(all_manual)}")
        print(f"TOTAL: {len(all_verified) + len(all_probable) + len(all_manual)}")
        
        # Save master files
        if all_verified:
            with open(output_path / "VERIFIED_MASTER.json", 'w', encoding='utf-8') as f:
                json.dump({"questions": all_verified}, f, indent=2)
        
        # Save quality log
        with open(output_path / "EXTRACTION_LOG.txt", 'w', encoding='utf-8') as f:
            f.write("EXTRACTION LOG\n")
            f.write("="*80 + "\n\n")
            f.write('\n'.join(extractor.quality_log))
            f.write("\n\nERRORS:\n")
            f.write('\n'.join(extractor.errors))
    
    print(f"\nOutput saved to: {output_path}")


if __name__ == "__main__":
    main()
