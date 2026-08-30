-- 003_create_email_outbox.sql
-- Atomically queues application notification and applicant confirmation emails.

CREATE TABLE IF NOT EXISTS email_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES waitlist_applications(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL CHECK (message_type IN ('support_application_received', 'applicant_confirmation')),
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  provider_message_id TEXT,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_outbox_dispatch
  ON email_outbox (status, next_attempt_at, created_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_email_outbox_application_type
  ON email_outbox (application_id, message_type)
  WHERE application_id IS NOT NULL;
