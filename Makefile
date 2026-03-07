PHONY: setup

setup:
	cp frontend/.env.example frontend/.env
	cp backend/.env.example backend/.env
	sed 's/^DB_HOST=localhost$$/DB_HOST=postgres/' backend/.env.example > backend/dev/.env.docker

up:
	docker compose up

down:
	docker compose down

build:
	docker compose build

reset:
	docker compose down -V postgres frontend backend

