-- Migration: 001_coding_jobs.sql
-- Creates the coding_jobs table for Kilo Cloud Agent task persistence.

CREATE TABLE IF NOT EXISTS coding_jobs (
  job_id TEXT PRIMARY KEY,
  telegram_chat_id INTEGER NOT NULL,
  repository TEXT NOT NULL,
  task_description TEXT NOT NULL,
  trigger_reference TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  result_summary TEXT,
  branch_url TEXT,
  pull_request_url TEXT,
  error_message TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_coding_jobs_chat_id ON coding_jobs(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_coding_jobs_status ON coding_jobs(status);
