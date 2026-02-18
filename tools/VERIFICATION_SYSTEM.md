# PlumberPass Verification System
## Self-Policing Protocol for Professional Exam Accuracy

### CORE PRINCIPLE: "When in doubt, FLAG it"

---

## Verification Levels

### Level 1: Automated Extraction (Low Confidence)
- Raw PDF text extraction
- Pattern matching for questions
- **Action:** Mark as "needs_verification"

### Level 2: Context Analysis (Medium Confidence)
- Check if answer key is explicitly stated
- Verify references match known sources
- Cross-check with explanation text
- **Action:** Mark as "probable" if evidence is clear

### Level 3: Source Verification (High Confidence)
- Answer key matches explanation page
- Reference is verifiable (ASPE, NPCP, RA Law, etc.)
- No contradictions in text
- **Action:** Mark as "verified"

### Level 4: Manual Review Required (Unknown)
- Ambiguous answer
- No clear explanation
- Unclear reference
- **Action:** Mark as "manual_review"

---

## RED FLAGS - Automatic Manual Review

1. **No Explanation Found** - Question appears without answer explanation
2. **Conflicting Answers** - Multiple choices marked as correct
3. **Unknown Reference** - Source cannot be verified
4. **Text Corruption** - Garbled or unreadable text
5. **Duplicate ID** - Same question ID generated twice
6. **Missing Critical Info** - No correct answer detected

---

## Quality Checklist for Each Question

```
□ Question text is clear and readable
□ All 4 choices (A-D) are present
□ Answer key is explicitly stated or clearly implied
□ Explanation references a verifiable source
□ No spelling/grammar errors that change meaning
□ Question makes logical sense
□ Not a duplicate of existing question
□ Tagged with appropriate topics
```

---

## Confidence Scoring

```
verified      = 100% sure (explicit answer in explanation)
probable      = 75% sure (strong evidence, needs quick check)
uncertain     = 50% sure (extraction worked but answer unclear)
manual_review = 0% sure (needs human verification)
```

---

## Output Format

Every question MUST include:
```json
{
  "confidence": "verified|probable|uncertain|manual_review",
  "verification_notes": "Why this confidence level was assigned",
  "needs_manual_check": true|false
}
```

---

## My Commitment

**I WILL:**
- Process each PDF slowly and carefully
- Flag anything I'm not 100% sure about
- Create detailed logs of what was extracted vs what needs review
- Be honest about extraction limitations
- Prioritize accuracy over quantity

**I WILL NOT:**
- Guess answer keys
- Make up explanations
- Overclaim what was accomplished
- Rush through files without verification

---

## Extraction Protocol

### For Each PDF:
1. Read first 5 pages to understand format
2. Extract sample questions (first 3)
3. Verify extraction quality
4. If quality is good, proceed with full extraction
5. If quality is poor, note issues and adjust approach
6. Save with confidence ratings
7. Log any errors or uncertainties

---

## Success Criteria

**Acceptable for Production Use:**
- Only "verified" and "probable" questions
- All "manual_review" questions removed or flagged
- Total questions with 100% confidence > 200
- Zero "hallucinated" information

---

*This system ensures we only include exam items that are accurate and dependable.*
