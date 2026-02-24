# LEH Development Makefile
# Quick setup and development commands

.PHONY: setup setup-backend setup-ai-worker setup-frontend
.PHONY: dev dev-backend dev-frontend
.PHONY: test test-backend test-backend-fast test-backend-fast-parallel test-backend-slow test-backend-diff-cover
.PHONY: test-ai-worker test-ai-worker-fast test-ai-worker-fast-parallel test-ai-worker-slow
.PHONY: test-frontend test-frontend-fast test-frontend-slow test-frontend-e2e-staging
.PHONY: lint clean help

# =============================================================================
# SETUP COMMANDS
# =============================================================================

## Install all dependencies for all services
setup: setup-backend setup-ai-worker setup-frontend
	@echo "All services set up successfully!"

## Setup Backend (FastAPI)
setup-backend:
	@echo "Setting up Backend..."
	cd backend && python3 -m venv .venv
	cd backend && . .venv/bin/activate && pip install -r requirements.txt
	@echo "Backend setup complete!"

## Setup AI Worker (Lambda)
setup-ai-worker:
	@echo "Setting up AI Worker..."
	cd ai_worker && python3 -m venv .venv
	cd ai_worker && . .venv/bin/activate && pip install -r requirements.txt
	@echo "AI Worker setup complete!"

## Setup Frontend (Next.js)
setup-frontend:
	@echo "Setting up Frontend..."
	cd frontend && npm install
	@echo "Frontend setup complete!"

# =============================================================================
# DEVELOPMENT COMMANDS
# =============================================================================

## Run all services (requires multiple terminals)
dev:
	@echo "Run these commands in separate terminals:"
	@echo "  Terminal 1: make dev-backend"
	@echo "  Terminal 2: make dev-frontend"

## Run Backend development server
dev-backend:
	cd backend && . .venv/bin/activate && uvicorn app.main:app --reload

## Run Frontend development server
dev-frontend:
	cd frontend && npm run dev

# =============================================================================
# TEST COMMANDS
# =============================================================================

## Run all tests
test: test-backend test-ai-worker test-frontend
	@echo "All tests completed!"

## Run Backend tests
test-backend:
	cd backend && . .venv/bin/activate && pytest

## Run Backend tests (fast loop)
test-backend-fast:
	cd backend && . .venv/bin/activate && pytest -m "not slow and not requires_db and not requires_aws and not integration"

## Run Backend tests (fast loop, parallel)
test-backend-fast-parallel:
	cd backend && . .venv/bin/activate && pytest -n auto --dist=loadfile -m "not slow and not requires_db and not requires_aws and not integration"

## Run Backend tests (slow/integration)
test-backend-slow:
	cd backend && . .venv/bin/activate && pytest -m "integration or slow or requires_db or requires_aws"

## Run Backend diff coverage against base branch
test-backend-diff-cover:
	cd backend && . .venv/bin/activate && pytest --cov=app --cov-report=xml && diff-cover coverage.xml --compare-branch=$${DIFF_COVER_BASE:-origin/main} --fail-under=$${DIFF_COVER_MIN:-80}

## Run AI Worker tests
test-ai-worker:
	cd ai_worker && . .venv/bin/activate && pytest

## Run AI Worker tests (fast loop)
test-ai-worker-fast:
	cd ai_worker && . .venv/bin/activate && pytest -m "not slow and not integration"

## Run AI Worker tests (fast loop, parallel)
test-ai-worker-fast-parallel:
	cd ai_worker && . .venv/bin/activate && pytest -n auto --dist=loadfile -m "not slow and not integration"

## Run AI Worker tests (slow/integration)
test-ai-worker-slow:
	cd ai_worker && . .venv/bin/activate && pytest -m "integration or slow"

## Run Frontend tests
test-frontend:
	cd frontend && npm test

## Run Frontend tests (fast loop)
test-frontend-fast:
	cd frontend && npm test

## Run Frontend tests (slow/staging E2E)
test-frontend-slow: test-frontend-e2e-staging

## Run Frontend E2E tests against staging
test-frontend-e2e-staging:
	cd frontend && npm run test:e2e:staging

# =============================================================================
# LINT COMMANDS
# =============================================================================

## Run linters on all services
lint:
	cd backend && . .venv/bin/activate && ruff check app/ tests/
	cd ai_worker && . .venv/bin/activate && ruff check src/ tests/
	cd frontend && npm run lint

# =============================================================================
# CLEANUP COMMANDS
# =============================================================================

## Clean up virtual environments and node_modules
clean:
	rm -rf backend/.venv
	rm -rf ai_worker/.venv
	rm -rf frontend/node_modules
	rm -rf backend/test.db
	@echo "Cleanup complete!"

# =============================================================================
# HELP
# =============================================================================

## Show this help message
help:
	@echo "LEH Development Commands"
	@echo "========================"
	@echo ""
	@echo "Setup:"
	@echo "  make setup           - Install all dependencies"
	@echo "  make setup-backend   - Setup Backend only"
	@echo "  make setup-ai-worker - Setup AI Worker only"
	@echo "  make setup-frontend  - Setup Frontend only"
	@echo ""
	@echo "Development:"
	@echo "  make dev-backend     - Run Backend server"
	@echo "  make dev-frontend    - Run Frontend server"
	@echo ""
	@echo "Testing:"
	@echo "  make test            - Run all tests"
	@echo "  make test-backend    - Run Backend tests"
	@echo "  make test-backend-fast - Run Backend fast tests"
	@echo "  make test-backend-fast-parallel - Run Backend fast tests in parallel"
	@echo "  make test-backend-slow - Run Backend slow/integration tests"
	@echo "  make test-backend-diff-cover - Run Backend diff coverage gate"
	@echo "  make test-ai-worker  - Run AI Worker tests"
	@echo "  make test-ai-worker-fast - Run AI Worker fast tests"
	@echo "  make test-ai-worker-fast-parallel - Run AI Worker fast tests in parallel"
	@echo "  make test-ai-worker-slow - Run AI Worker slow/integration tests"
	@echo "  make test-frontend   - Run Frontend tests"
	@echo "  make test-frontend-fast - Run Frontend fast tests"
	@echo "  make test-frontend-slow - Run Frontend staging E2E tests"
	@echo "  make test-frontend-e2e-staging - Run Frontend staging E2E tests"
	@echo ""
	@echo "Other:"
	@echo "  make lint            - Run linters"
	@echo "  make clean           - Remove venvs and node_modules"
