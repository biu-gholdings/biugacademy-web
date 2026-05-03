-- BIU.G Academy — run in Supabase SQL Editor (or psql) against your project database.
-- Optional columns certifications + tools_used may be empty string.

CREATE TABLE IF NOT EXISTS waitlist_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  country TEXT NOT NULL,
  province TEXT NOT NULL,
  city TEXT NOT NULL,
  area_of_interest TEXT NOT NULL,
  current_role TEXT NOT NULL,
  expertise TEXT NOT NULL,
  ai_experience_level TEXT NOT NULL,
  preferred_learning_track TEXT NOT NULL,
  cubeshackles_ecosystem_interest TEXT NOT NULL,
  problem_to_solve TEXT NOT NULL,
  why_join TEXT NOT NULL,
  consent BOOLEAN NOT NULL DEFAULT FALSE,
  certifications TEXT NOT NULL DEFAULT '',
  tools_used TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_applications_email ON waitlist_applications (lower(email));
CREATE INDEX IF NOT EXISTS idx_waitlist_applications_created_at ON waitlist_applications (created_at DESC);

CREATE TABLE IF NOT EXISTS waitlist_ai_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES waitlist_applications (id) ON DELETE CASCADE,
  learner_type TEXT NOT NULL,
  skill_level TEXT NOT NULL,
  ai_readiness_score SMALLINT NOT NULL,
  cubeshackles_fit_score SMALLINT NOT NULL,
  recommended_track TEXT NOT NULL,
  priority_level TEXT NOT NULL,
  strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
  gaps JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommended_next_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (application_id)
);

CREATE INDEX IF NOT EXISTS idx_waitlist_ai_profiles_application_id ON waitlist_ai_profiles (application_id);
