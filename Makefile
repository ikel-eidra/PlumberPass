# PlumberPass Makefile
# Common development tasks

.PHONY: help setup dev install backend-setup backend-run frontend-setup frontend-run test test-backend test-frontend lint format typecheck build clean docker-build docker-run

# Default target
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "$(BLUE)PlumberPass - Available Commands:$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""

# =============================================================================
# Setup Commands
# =============================================================================

setup: ## Full project setup (backend + frontend)
	@echo "$(BLUE)Setting up PlumberPass...$(NC)"
	$(MAKE) backend-setup
	$(MAKE) frontend-setup
	@echo "$(GREEN)✓ Setup complete!$(NC)"
	@echo "Run 'make dev' to start development servers"

install: setup ## Alias for setup

backend-setup: ## Install Python dependencies
	@echo "$(BLUE)Setting up backend...$(NC)"
	cd backend && python -m venv .venv
	cd backend && .venv\Scripts\pip install -r requirements.txt || .venv/bin/pip install -r requirements.txt
	@echo "$(GREEN)✓ Backend setup complete$(NC)"

frontend-setup: ## Install Node.js dependencies
	@echo "$(BLUE)Setting up frontend...$(NC)"
	cd frontend && npm install
	@echo "$(GREEN)✓ Frontend setup complete$(NC)"

# =============================================================================
# Development Commands
# =============================================================================

dev: ## Run both backend and frontend (parallel)
	@echo "$(BLUE)Starting development servers...$(NC)"
	@echo "Frontend will be available at http://localhost:5173"
	@echo "Backend will be available at http://localhost:8000"
	@echo "Press Ctrl+C to stop both servers"
	@echo ""
ifeq ($(OS),Windows_NT)
	start $(MAKE) backend-run
	start $(MAKE) frontend-run
else
	$(MAKE) backend-run & $(MAKE) frontend-run
endif

backend-run: ## Start FastAPI development server
	@echo "$(BLUE)Starting backend server...$(NC)"
	cd backend && .venv\Scripts\python -m uvicorn app.main:app --reload --port 8000 || .venv/bin/python -m uvicorn app.main:app --reload --port 8000

frontend-run: ## Start Vite development server
	@echo "$(BLUE)Starting frontend server...$(NC)"
	cd frontend && npm run dev

# =============================================================================
# Testing Commands
# =============================================================================

test: ## Run all tests
	@echo "$(BLUE)Running all tests...$(NC)"
	$(MAKE) test-backend
	$(MAKE) test-frontend

test-backend: ## Run Python tests with pytest
	@echo "$(BLUE)Running backend tests...$(NC)"
	cd backend && .venv\Scripts\pytest -v || .venv/bin/pytest -v

test-frontend: ## Run frontend tests
	@echo "$(BLUE)Running frontend tests...$(NC)"
	cd frontend && npm run test

test-coverage: ## Run tests with coverage report
	@echo "$(BLUE)Running tests with coverage...$(NC)"
	cd backend && .venv\Scripts\pytest --cov=app --cov-report=html || .venv/bin/pytest --cov=app --cov-report=html

# =============================================================================
# Code Quality Commands
# =============================================================================

lint: ## Run all linters
	@echo "$(BLUE)Running linters...$(NC)"
	$(MAKE) lint-backend
	$(MAKE) lint-frontend

lint-backend: ## Run Python linters (flake8, black check)
	@echo "$(BLUE)Linting Python code...$(NC)"
	cd backend && .venv\Scripts\flake8 app || .venv/bin/flake8 app
	cd backend && .venv\Scripts\black --check app || .venv/bin/black --check app

lint-frontend: ## Run ESLint
	@echo "$(BLUE)Linting JavaScript code...$(NC)"
	cd frontend && npm run lint

format: ## Auto-format all code
	@echo "$(BLUE)Formatting code...$(NC)"
	$(MAKE) format-backend
	$(MAKE) format-frontend

format-backend: ## Auto-format Python code with black
	@echo "$(BLUE)Formatting Python code...$(NC)"
	cd backend && .venv\Scripts\black app || .venv/bin/black app
	cd backend && .venv\Scripts\isort app || .venv/bin/isort app

format-frontend: ## Auto-format JavaScript/TypeScript code
	@echo "$(BLUE)Formatting JavaScript code...$(NC)"
	cd frontend && npm run format

typecheck: ## Run type checking
	@echo "$(BLUE)Running type checks...$(NC)"
	cd backend && .venv\Scripts\mypy app || .venv/bin/mypy app
	cd frontend && npm run typecheck

# =============================================================================
# Build Commands
# =============================================================================

build: ## Build production assets
	@echo "$(BLUE)Building for production...$(NC)"
	$(MAKE) build-frontend
	@echo "$(GREEN)✓ Build complete$(NC)"

build-frontend: ## Build frontend for production
	@echo "$(BLUE)Building frontend...$(NC)"
	cd frontend && npm run build

# =============================================================================
# Docker Commands
# =============================================================================

docker-build: ## Build Docker images
	@echo "$(BLUE)Building Docker images...$(NC)"
	docker-compose build

docker-run: ## Run with Docker Compose
	@echo "$(BLUE)Starting Docker containers...$(NC)"
	docker-compose up

docker-run-detached: ## Run with Docker Compose in detached mode
	@echo "$(BLUE)Starting Docker containers (detached)...$(NC)"
	docker-compose up -d

docker-stop: ## Stop Docker containers
	@echo "$(BLUE)Stopping Docker containers...$(NC)"
	docker-compose down

docker-logs: ## View Docker logs
	@echo "$(BLUE)Viewing logs...$(NC)"
	docker-compose logs -f

# =============================================================================
# Utility Commands
# =============================================================================

clean: ## Clean build artifacts and cache
	@echo "$(BLUE)Cleaning up...$(NC)"
ifeq ($(OS),Windows_NT)
	-rmdir /s /q backend\__pycache__ 2>nul
	-rmdir /s /q backend\app\__pycache__ 2>nul
	-rmdir /s /q frontend\node_modules 2>nul
	-rmdir /s /q frontend\dist 2>nul
else
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null
	find . -type f -name "*.pyc" -delete 2>/dev/null
	rm -rf frontend/node_modules frontend/dist
endif
	@echo "$(GREEN)✓ Cleanup complete$(NC)"

seed: ## Seed database with initial questions
	@echo "$(BLUE)Seeding database...$(NC)"
	cd backend && .venv\Scripts\python scripts/seed.py || .venv/bin/python scripts/seed.py
	@echo "$(GREEN)✓ Database seeded$(NC)"

import-questions: ## Import questions from JSON file
	@echo "$(YELLOW)Usage: make import-questions FILE=path/to/questions.json$(NC)"
ifdef FILE
	cd backend && .venv\Scripts\python scripts/import_questions.py --file $(FILE) || .venv/bin/python scripts/import_questions.py --file $(FILE)
else
	@echo "$(RED)Error: Please specify FILE=path/to/file.json$(NC)"
	@exit 1
endif

export-data: ## Export user data
	@echo "$(BLUE)Exporting data...$(NC)"
	cd backend && .venv\Scripts\python scripts/export.py || .venv/bin/python scripts/export.py

# =============================================================================
# Deployment Commands
# =============================================================================

deploy-check: ## Check if ready for deployment
	@echo "$(BLUE)Running deployment checks...$(NC)"
	$(MAKE) lint
	$(MAKE) test
	$(MAKE) build
	@echo "$(GREEN)✓ All checks passed$(NC)"

# =============================================================================
# Documentation
# =============================================================================

docs-serve: ## Serve documentation locally
	@echo "$(BLUE)Starting docs server...$(NC)"
	cd docs && python -m http.server 8080

# =============================================================================
# Helpful Aliases
# =============================================================================

b: backend-run ## Alias for backend-run
f: frontend-run ## Alias for frontend-run
d: dev ## Alias for dev
t: test ## Alias for test
l: lint ## Alias for lint
