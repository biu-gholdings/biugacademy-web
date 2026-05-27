-- 001_create_waitlist_applications.sql
-- Creates core waitlist table for fresh installations.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS waitlist_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  province TEXT NOT NULL,
  municipality TEXT NOT NULL,
  age_range TEXT NOT NULL,
  primary_language TEXT NOT NULL,
  education_level TEXT NOT NULL,
  areas_of_interest JSONB NOT NULL DEFAULT '[]'::jsonb,
  technical_background TEXT NOT NULL,
  internet_access_level TEXT NOT NULL,
  device_access TEXT NOT NULL,
  employment_status TEXT NOT NULL,
  motivation_statement TEXT NOT NULL,
  consent_checkbox BOOLEAN NOT NULL DEFAULT FALSE,
  source_platform TEXT NOT NULL DEFAULT 'website-waitlist',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
