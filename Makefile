.PHONY: help install dev run test clean docker-build docker-run

help: ## Show this help message
	@echo "InsideMotion - AI Rehab Motion Analysis"
	@echo "========================================"
	@echo ""
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	@echo "📦 Installing dependencies..."
	cd apps/backend && python3 -m venv venv
	cd apps/backend && . venv/bin/activate && pip install --upgrade pip
	cd apps/backend && . venv/bin/activate && pip install -r requirements.txt
	@echo "✓ Dependencies installed"

dev: ## Start development server
	@echo "🚀 Starting InsideMotion development server..."
	@echo "Server: http://localhost:8000"
	cd apps/backend && . venv/bin/activate && python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

run: install dev ## Install dependencies and start server

test: ## Run tests
	@echo "🧪 Running tests..."
	cd apps/backend && . venv/bin/activate && pytest

clean: ## Clean build artifacts and cache
	@echo "🧹 Cleaning..."
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "*.pyc" -delete 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	rm -rf apps/backend/venv
	@echo "✓ Cleaned"

docker-build: ## Build Docker image
	@echo "🐳 Building Docker image..."
	docker build -t insidemotion:latest .

docker-run: ## Run Docker container
	@echo "🐳 Running Docker container..."
	docker run -p 8000:8000 -v $(PWD)/data:/app/data insidemotion:latest

docker-stop: ## Stop Docker container
	@echo "🐳 Stopping Docker containers..."
	docker ps -q --filter "ancestor=insidemotion:latest" | xargs -r docker stop
