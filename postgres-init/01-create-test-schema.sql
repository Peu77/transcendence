-- Runs automatically on first database initialization (when the data directory is empty).
-- Creates an additional schema for tests.

CREATE SCHEMA IF NOT EXISTS test AUTHORIZATION postgres;

