.PHONY: help install build test test-unit test-integration test-watch test-coverage lint lint-fix typecheck clean dev verify publish

# Default target
.DEFAULT_GOAL := help

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*##"; printf "\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

install: ## Install dependencies
	npm install

build: ## Compile TypeScript to JavaScript
	npm run build

test: ## Run all tests
	npm test

test-unit: ## Run unit tests only
	npm run test:unit

test-integration: ## Run integration tests only
	npm run test:integration

test-watch: ## Run tests in watch mode
	npm run test:watch

test-coverage: ## Generate test coverage report
	npm run test:coverage

lint: ## Run ESLint
	npm run lint

lint-fix: ## Fix auto-fixable ESLint issues
	npm run lint:fix

typecheck: ## Run TypeScript type checking
	npm run typecheck

clean: ## Remove build artifacts and dependencies
	rm -rf dist node_modules coverage

dev: ## Start development mode with watch
	npm run dev

verify: ## Run lint + typecheck + test (pre-commit check)
	npm run verify

publish: build verify ## Build and publish to npm
	npm publish
