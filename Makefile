PHONY: setup up down build reset certs

certs:
	@bash ssl/generate-certs.sh

setup: certs
	cp frontend/.env.example frontend/.env
	cp backend/.env.example backend/.env
	sed 's/^DB_HOST=localhost$$/DB_HOST=postgres/' backend/.env.example > backend/dev/.env.docker
	@echo "VITE_BACKEND_URL=https://localhost/api" > frontend/dev/.env.docker
	@echo "VITE_BACKEND_GITHUB_OAUTH_URL=https://localhost/api/auth/github" >> frontend/dev/.env.docker

up: certs
	docker compose up

down:
	docker compose down

build:
	docker compose build

reset:
	docker compose down -v postgres frontend backend
