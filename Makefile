# PlumberPass Makefile

.PHONY: help install backend-install frontend-install backend-run frontend-run test typecheck build smoke publish-content docker-config android-build android-install

.DEFAULT_GOAL := help

help: ## Show available commands
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "%-18s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: backend-install frontend-install ## Install backend and frontend dependencies

backend-install: ## Create backend venv and install Python requirements
	python -m venv backend/.venv
	backend/.venv/Scripts/pip install -r backend/requirements.txt

frontend-install: ## Install frontend npm dependencies
	cd frontend && npm install

backend-run: ## Run FastAPI locally
	backend/.venv/Scripts/python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000

frontend-run: ## Run the Vite frontend locally
	cd frontend && npm run dev

test: ## Run backend test suite
	pytest -q

typecheck: ## Run frontend TypeScript checks
	cd frontend && npx tsc --noEmit

build: ## Build the frontend for production
	cd frontend && npm run build

smoke: ## Run the consolidated launch smoke script
	powershell -ExecutionPolicy Bypass -File .\scripts\launch_smoke.ps1

publish-content: ## Republish curated content and rebuild the offline bundle
	python .\scripts\publish_structured_reference_mcqs.py
	python .\scripts\publish_laws_mcqs.py
	python .\scripts\publish_conversion_mcqs.py
	python .\scripts\publish_visual_review_items.py
	python .\scripts\export_study_bundle.py

docker-config: ## Validate docker compose configuration
	docker compose config

android-build: ## Build the Android beta APK
	powershell -ExecutionPolicy Bypass -File .\scripts\build_android_beta.ps1

android-install: ## Install the Android beta APK on a device or emulator
	powershell -ExecutionPolicy Bypass -File .\scripts\install_android_beta.ps1
