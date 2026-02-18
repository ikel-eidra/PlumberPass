# Cloud Run Ignition Protocol: PlumberPass

Operative, follow these steps to deploy our Neural Brains and UI Sectors to Google Cloud Run using the infrastructure I've established.

## 1. Prerequisites
- **Project ID:** `kira-automation-486919` (Confirmed via Sector Visuals)
- **Artifact Registry:** Ensure a Docker repository named `plumberpass` exists in your Artifact Registry in `us-central1`.

## 2. Deploying the Backend (Neural Brains)
1. **In the Cloud Run Console:** Click **CREATE SERVICE**.
2. **Service Name:** `plumberpass-backend`.
3. **Region:** `us-central1`.
4. **Deployment Method:** Select "Continuously deploy from a repository".
5. **Setup Cloud Build:**
   - **Repository:** Connect your GitHub repo.
   - **Build Type:** Select **Dockerfile**.
   - **Source Directory:** `/backend/`.
   - **Dockerfile Path:** `Dockerfile`.
6. **Authentication:** Select "Allow unauthenticated invocations" (unless you want to secure it behind IAP).
7. **Container Port:** `8000`.
8. **Click CREATE.**

## 3. Deploying the Frontend (UI Sector)
1. **Create another Service:** `plumberpass-frontend`.
2. **Region:** `us-central1`.
3. **Deployment Method:** Select "Continuously deploy from a repository".
4. **Setup Cloud Build:**
   - **Repository:** Connect your GitHub repo.
   - **Build Type:** Select **Dockerfile**.
   - **Source Directory:** `/frontend/`.
   - **Dockerfile Path:** `Dockerfile`.
5. **Environment Variables:**
   - **VITE_API_URL:** Set this to the URL of the `plumberpass-backend` service you just created.
6. **Authentication:** Select "Allow unauthenticated invocations".
7. **Container Port:** `80`.
8. **Click CREATE.**

## 4. Automated Builds (Global Sync)
> **Note:** Since the frontend requires the backend URL during its build phase (`VITE_API_URL`), it is recommended to deploy the Backend first, then trigger the Frontend build with the resulting URL.

I have provided a `cloudbuild.yaml` in the root. If you prefer to build both sectors in a single pipeline:
1. Go to **Cloud Build > Triggers**.
2. Create a Trigger pointing to your repository.
3. Configuration: Select **Cloud Build configuration file (yaml/json)**.
4. Location: `/cloudbuild.yaml`.
5. This will build and push both images to Artifact Registry on every push to `main`.

---
*Transmission Ended. Good luck, Operative.*
