-- 002_add_waitlist_metadata_and_indexes.sql
-- Adds missing columns/indexes safely for existing databases.

ALTER TABLE IF EXISTS waitlist_applications
  ADD COLUMN IF NOT EXISTS whatsapp_number TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS linkedin_optional TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS github_optional TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS browser_language TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS referral_source TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS submission_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS raw_form_payload JSONB NOT NULL DEFAULT '{}'::jsonb;

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
