# PlumberPass - Content Injection Protocol

Operative, to integrate the 200 items converted by Nana (NotebookLM), follow these steps:

## 1. Transmission Phase
Drop your JSON files into the following sector:
`backend/data/`

## 2. Naming Convention
While the system is now dynamic, for organizational clarity, please use the following pattern:
- `notebooklm_batch_X.json` (where X is the batch number or descriptor)

## 3. Schema Verification
Ensure Nana has followed the schema defined in `PROMPT_NOTEBOOKLM.md`. The backend expects the following keys at the root of the JSON:
- `"mcqs"`: Array of Multiple Choice Questions.
- `"flashcards"`: Array of Flashcard items.
- `"identification"`: Array of Identification (Fill-in-the-blank) items.

## 4. Initialization
Once the files are in the `backend/data/` directory:
1. Restart the Neural Brains (Backend) if it is running:
   ```bash
   ./start_sector.sh
   ```
2. The system will automatically glob all JSON files and aggregate them into your study pool.

## 5. Diagnostics
You can verify the injection by checking the dashboard. The "Questions" and "Flashcards" counts should reflect the total sum of all batch files + the seed data.

**Current Question Count:** 103 (Seed) + [Your New Items]
**Current Flashcard Count:** 60 (Seed) + [Your New Items]
