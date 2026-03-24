# Master Plumber Web Research

Research date: March 21, 2026

Purpose: collect official, reusable Master Plumber licensure data from the web and turn it into product inputs for `PlumberPass`.

## What Is Officially Confirmed

### 1. July 2026 PRC schedule

- Official PRC schedule lists the next regular `Master Plumbers` licensure exam on `July 11 and 12, 2026`.
- Application period is `April 13, 2026` to `June 11, 2026`.
- Target release date is `July 15, 2026`.
- Testing centers listed by PRC: `NCR, Baguio, Butuan, Cagayan de Oro, Cebu, Davao, Iloilo, Koronadal, Legazpi, Lucena, Pagadian, Rosales, Tacloban, and Tuguegarao`.

Product use:
- This is now the source of truth for the app countdown and exam-window copy.

Source:
- https://www.prc.gov.ph/2026-schedule-examination

### 2. Official subject structure and weights

- The PRC board program for the `February 19-20, 2026` Master Plumbers Licensure Examination shows the current tested subject structure:
  - `Plumbing Arithmetic` — `10%`
  - `Sanitation, Plumbing Design and Installation` — `40%`
  - `Plumbing Code` — `10%`
  - `Practical Problems and Experiences` — `40%`
- The program also confirms the current 2-day exam flow and the calculator rule for non-programmable calculators.

Product use:
- This should drive mock-exam balancing, dashboard blueprint display, and future analytics by subject weight.

Source:
- https://www.prc.gov.ph/sites/default/files/112626-FEBRUARY%202026%20MPLE%20PROGRAM-1st%20draft%20-fINAL%20%282%29.pdf

### 3. Legal scope of the profession

- `Republic Act No. 1378` defines the practice of plumbing to include consultation, design, plans, specifications, estimates, installation, supervision, inspection, and acceptance of plumbing work for storm and sanitary drainage, venting, hot/cold water supply, storm drains, and sewerage systems.
- The same law sets the historical exam subjects and the minimum legal baseline for admission.

Product use:
- This is the authoritative boundary for what topics are in-scope for the review system.

Sources:
- https://lawphil.net/statutes/repacts/ra1955/ra_1378_1955.html
- https://www.prc.gov.ph/master-plumbing

### 4. Current admission / documentary requirements

- PRC `List of Requirements` currently groups Master Plumbing applicants into:
  - `Degree holders` in Architecture, Mechanical Engineering, Civil Engineering, Chemical Engineering, Mining Engineering, and Sanitary Engineering
  - `Registered professionals` in those same fields, with valid PRC ID attached
  - `Non-degree holders` with high school diploma/TOR plus a notarized `five-year` certificate of plumbing experience signed by a registered Master Plumber and supported by certificate of employment/service record
- PRC currently lists the examination fee for Master Plumbing as `PHP 600.00`.

Product use:
- Good for onboarding checklists, registration reminders, and future conversion screens for applicants.

Source:
- https://prc.gov.ph/list-of-requirements

### 5. Five-year experience interpretation

- PRC Resolution No. `03 s. 2009` clarifies that the five years of actual plumbing work experience should be counted `after high school graduation`.
- The resolution also breaks the experience profile into:
  - `1 year` apprentice in a duly registered and licensed plumbing company
  - `2 years` assistant plumber or plumber
  - `2 years` journeyman plumber

Product use:
- Important for any future eligibility checker or applicant guidance inside the app ecosystem.

Source:
- https://www.prc.gov.ph/sites/default/files/RESOLUTION%20NO.%2003%20S%202009%20MP.pdf

### 6. Accessibility and legal support references already aligned with the exam

- `Batas Pambansa Blg. 344` remains a usable official legal source for accessibility-related building requirements.
- PRC and NAMPAP history pages also confirm the adoption history of the `Revised Plumbing Code of 1999`, which remains central to Master Plumber review coverage.

Product use:
- Supports law/accessibility reviewer slices already present in the app content.

Sources:
- https://lawphil.net/statutes/bataspam/bp1983/bp_344_1983.html
- https://www.prc.gov.ph/master-plumbing

### 7. Exam frequency and official result trend

- PRC scheduled Master Plumber exams in `February 2026` and `July 2026`, confirming the app should support at least a two-cycle annual exam prep model.
- Recent official PRC result counts:
  - `July 2024`: `2,936 / 6,191`
  - `July 2025`: `2,971 / 5,145`
  - `February 2026`: `2,030 / 3,287`

Product use:
- Supports urgency, cadence planning, and future benchmark messaging, but should be used carefully in marketing.

Sources:
- https://www.prc.gov.ph/node/6780
- https://www.prc.gov.ph/article/july-2025-master-plumbers-licensure-examination-results-released-three-3-working-days
- https://www.prc.gov.ph/article/february-2026-master-plumbers-licensure-examination-results-released-three-3-working-days

### 8. Overseas expansion signal

- PRC's `2026 SPLE` announcement includes `Master Plumbers` among the professions offered to overseas Filipino workers, with testing across Middle East countries, Hong Kong, Singapore, and Taiwan.

Product use:
- This is a strong signal that the platform should remain mobile-first, cloud-ready, and region-flexible.

Source:
- https://www.prc.gov.ph/article/2026-special-professional-licensure-examinations-overseas-filipino-workers-middle-east

## Product Implications

1. `PlumberPass` should treat the Master Plumber exam as a structured 4-bucket exam, not just a generic mixed question stream.
2. Countdown, reminders, and milestone messaging must use the official `July 11-12, 2026` schedule, not placeholder July dates.
3. The app should eventually expose study views and analytics by:
   - Plumbing Arithmetic
   - Plumbing Code
   - Sanitation / Design / Installation
   - Practical Problems and Experiences
4. Future PRC reviewer products should use the same architecture:
   - official exam blueprint
   - official application window
   - subject weighting
   - eligibility / requirements layer
   - content taxonomy

## Repo Follow-Through From This Research

- Added frontend exam blueprint config in `frontend/src/config/examBlueprint.ts`
- Updated app countdown and exam labels to use the official PRC July 11-12, 2026 date window
- Added official exam blueprint presentation in the readiness / mastery flow
