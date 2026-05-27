-- BIU.G Academy waitlist intake schema.
-- PostgreSQL preferred. Run in Supabase SQL Editor or psql.

CREATE TABLE IF NOT EXISTS waitlist_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL DEFAULT '',
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
  linkedin_optional TEXT NOT NULL DEFAULT '',
  github_optional TEXT NOT NULL DEFAULT '',
  motivation_statement TEXT NOT NULL,
  consent_checkbox BOOLEAN NOT NULL DEFAULT FALSE,
  source_platform TEXT NOT NULL DEFAULT 'website-waitlist',
  browser_language TEXT NOT NULL DEFAULT '',
  timezone TEXT NOT NULL DEFAULT '',
  referral_source TEXT NOT NULL DEFAULT '',
  submission_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_form_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Duplicate prevention preparation and query performance.
CREATE INDEX IF NOT EXISTS idx_waitlist_applications_email_lower
  ON waitlist_applications (lower(email));
CREATE INDEX IF NOT EXISTS idx_waitlist_applications_phone_number
  ON waitlist_applications (phone_number);
CREATE INDEX IF NOT EXISTS idx_waitlist_applications_created_at
  ON waitlist_applications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_waitlist_applications_province
  ON waitlist_applications (province);
CREATE INDEX IF NOT EXISTS idx_waitlist_applications_primary_language
  ON waitlist_applications (primary_language);
