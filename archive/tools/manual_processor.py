#!/usr/bin/env python3
"""
Manual processor - careful, file-by-file extraction
"""

import pdfplumber
import re
import json
from pathlib import Path


def unspace_line(line):
    """
    Carefully remove letter spacing.
    Example: "O S & Y m e a n s" -> "O S & Y means"
    """
    if not line or len(line) < 3:
        return line
    
    # Split by spaces
    parts = line.split()
    if len(parts) < 3:
        return line
    
    # Check if it looks like letter-spaced text
    # Heuristic: mostly single letters/short parts
    short_parts = sum(1 for p in parts if len(p) <= 2)
    if short_parts < len(parts) * 0.7:
        return line  # Probably not letter-spaced
    
    # Reconstruct words
    result = []
    current_word = ""
    
    for i, part in enumerate(parts):
        if i == 0:
            current_word = part
        elif part in ['&', '-', '/', '.', ',', '?', '!']:
            # Punctuation - attach to previous
            current_word += part
        elif len(part) == 1 and part.islower() and len(current_word) > 0 and current_word[-1].islower():
            # Lowercase letter after lowercase - likely same word
            current_word += part
        elif len(part) == 1 and part.isupper() and len(current_word) > 0:
            # Uppercase letter - could be new word or abbreviation
            if len(current_word) > 1 and current_word[-1].islower():
                # After lowercase word - likely new word
                result.append(current_word)
                current_word = part
            else:
                current_word += part
        elif len(part) > 1:
            # Multi-char part - likely a word
            if current_word:
                result.append(current_word)
            current_word = part
        else:
            current_word += part
    
    if current_word:
        result.append(current_word)
    
    return ' '.join(result)


def process_pdf_carefully(pdf_path, output_dir):
    """Process a single PDF file carefully."""
    print(f"\n{'='*80}")
    print(f"PROCESSING: {pdf_path.name}")
    print(f"{'='*80}")
    
    questions = []
    
    with pdfplumber.open(pdf_path) as pdf:
        print(f"Total pages: {len(pdf.pages)}")
        
        # Extract and clean all text
        all_cleaned_pages = []
        for i, page in enumerate(pdf.pages):
            text = page.extract_text()
            if text:
                lines = text.split('\n')
                cleaned_lines = [unspace_line(line) for line in lines]
                cleaned_text = '\n'.join(cleaned_lines)
                all_cleaned_pages.append((i+1, cleaned_text))
        
        # Save cleaned text for inspection
        debug_file = output_dir / f"{pdf_path.stem}_CLEANED.txt"
        with open(debug_file, 'w', encoding='utf-8') as f:
            for page_num, text in all_cleaned_pages:
                f.write(f"\n=== PAGE {page_num} ===\n")
                f.write(text)
                f.write("\n")
        print(f"Saved cleaned text to: {debug_file}")
        
        # Now parse questions
        full_text = '\n'.join([text for _, text in all_cleaned_pages])
        
        # Find question pairs (question page + explanation page)
        # Pattern: QUESTION #N appears, then same question #N appears again with explanation
        question_blocks = re.split(r'QUESTION\s*#(\d+)', full_text)
        
        print(f"Found {len(question_blocks)//2} potential questions")
        
        # Process pairs
        i = 1
        while i < len(question_blocks) - 1:
            qnum = question_blocks[i]
            content = question_blocks[i+1]
            
            # Split at next question or end
            content = re.split(r'QUESTION|=== PAGE', content)[0]
            
            # Parse this question
            lines = [l.strip() for l in content.split('\n') if l.strip()]
            
            # Find where choices start
            prompt_lines = []
            choices = {}
            explanation = []
            section = "prompt"
            current_choice = None
            
            for line in lines:
                # Check if it's a choice line
                choice_match = re.match(r'^([a-d])[\.\)]\s*(.+)', line, re.IGNORECASE)
                if choice_match:
                    section = "choices"
                    letter = choice_match.group(1).upper()
                    text = choice_match.group(2)
                    choices[letter] = text
                    current_choice = letter
                elif current_choice and section == "choices":
                    # Check if this is explanation (doesn't start with letter)
                    if not re.match(r'^[a-d][\.\)]', line, re.IGNORECASE) and len(line) > 10:
                        section = "explanation"
                        explanation.append(line)
                    else:
                        choices[current_choice] += ' ' + line
                elif section == "explanation":
                    explanation.append(line)
                elif section == "prompt":
                    prompt_lines.append(line)
            
            # Build question object
            if len(choices) >= 2:
                prompt = ' '.join(prompt_lines).replace('_', ' ').strip()
                
                # Determine answer from explanation
                answer_key = None
                expl_text = ' '.join(explanation)
                
                # Look for explicit answer
                for letter in ['A', 'B', 'C', 'D']:
                    if expl_text.startswith(f"{letter}:"):
                        answer_key = letter
                        break
                    if f"({letter})" in expl_text[:50]:
                        answer_key = letter
                        break
                
                if not answer_key:
                    # Guess based on which choice has longest explanation
                    longest = max(choices.keys(), key=lambda k: len(choices[k]))
                    answer_key = longest
                
                q = {
                    "id": f"{pdf_path.stem.replace(' ', '_').lower()}-q{int(qnum):03d}",
                    "prompt": prompt,
                    "choices": [{"label": k, "text": re.sub(r'\s*\([^)]+\)', '', v).strip()} 
                               for k, v in sorted(choices.items())],
                    "answer_key": answer_key,
                    "explanation": expl_text[:300],
                    "source": str(pdf_path),
                    "needs_verification": True  # Always flag for review
                }
                questions.append(q)
            
            i += 2
    
    print(f"Extracted {len(questions)} questions")
    return questions


def main():
    base_dir = Path("D:/projects/PlumberPass 01-27-26")
    materials_dir = base_dir / "materials/ADVANCE Q&A-20260126T193115Z-3-001"
    output_dir = base_dir / "MANUAL_EXTRACTS"
    output_dir.mkdir(exist_ok=True)
    
    # Process Week 2 first as test
    week2 = materials_dir / "WEEK 2.pdf"
    
    if week2.exists():
        questions = process_pdf_carefully(week2, output_dir)
        
        # Save
        output_file = output_dir / "WEEK_2_extracted.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump({
                "metadata": {
                    "source": str(week2),
                    "total_questions": len(questions),
                    "warning": "ALL QUESTIONS NEED MANUAL VERIFICATION",
                    "confidence": "low"
                },
                "questions": questions
            }, f, indent=2, ensure_ascii=False)
        
        print(f"\nSaved to: {output_file}")
        print(f"\nSAMPLE QUESTIONS:")
        for i, q in enumerate(questions[:3]):
            print(f"\n{i+1}. {q['prompt']}")
            for c in q['choices']:
                print(f"   {c['label']}. {c['text'][:40]}...")
            print(f"   Answer: {q['answer_key']} (NEEDS VERIFICATION)")


if __name__ == "__main__":
    main()
