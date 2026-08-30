"use strict";

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "support@biugacademy.org";
const EMAIL_FROM = process.env.EMAIL_FROM || "BIU.G Academy <support@biugacademy.org>";
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const RESEND_ENDPOINT = "https://api.resend.com/emails";
const MAX_ATTEMPTS = Number(process.env.EMAIL_MAX_ATTEMPTS || 5);

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatInterests(interests) {
  if (!Array.isArray(interests)) return "";
  return interests.join(", ");
}

function tableHtml(rows) {
  return rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px;font-weight:700;vertical-align:top">${escapeHtml(label)}</td><td style="padding:8px 12px">${escapeHtml(value || "—")}</td></tr>`
    )
    .join("");
}

function buildApplicationSupportHtml(payload) {
  const rows = [
    ["Application ID", payload.application_id],
    ["Name", payload.full_name],
    ["Email", payload.email],
    ["Phone", payload.phone_number],
    ["WhatsApp", payload.whatsapp_number],
    ["Province", payload.province],
    ["Municipality", payload.municipality],
    ["Age range", payload.age_range],
    ["Primary language", payload.primary_language],
    ["Education", payload.education_level],
    ["Areas of interest", formatInterests(payload.areas_of_interest)],
    ["Technical background", payload.technical_background],
    ["Internet access", payload.internet_access_level],
    ["Device access", payload.device_access],
    ["Employment", payload.employment_status],
    ["LinkedIn", payload.linkedin_optional],
    ["GitHub", payload.github_optional],
    ["Motivation", payload.motivation_statement],
    ["Referral source", payload.referral_source],
    ["Submitted at", payload.submission_timestamp],
  ];

  return `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#161616"><h2>New BIU.G Academy application</h2><table style="border-collapse:collapse;width:100%;max-width:760px">${tableHtml(rows)}</table></body></html>`;
}

function buildApplicantHtml(payload) {
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#161616;line-height:1.55"><h2>Candidatura recebida</h2><p>Olá ${escapeHtml(payload.full_name)},</p><p>Recebemos a sua candidatura à BIU.G Academy. O seu número de referência é <strong>${escapeHtml(payload.application_id)}</strong>.</p><p>A candidatura será analisada com base no perfil, motivação e alinhamento com a primeira turma. Caso seja selecionado, entraremos em contacto através dos dados fornecidos.</p><p>BIU.G Academy<br>support@biugacademy.org</p></body></html>`;
}

function buildSupportRequestHtml(payload) {
  const rows = [
    ["Support request ID", payload.support_request_id],
    ["Name", payload.name],
    ["Email", payload.email],
    ["Page", payload.page_url],
    ["Message", payload.message],
    ["Created at", payload.created_at],
  ];
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#161616"><h2>BIU.G Academy support request</h2><table style="border-collapse:collapse;width:100%;max-width:760px">${tableHtml(rows)}</table></body></html>`;
}

function buildEmail(record) {
  const payload = record.payload || {};
  if (record.message_type === "support_application_received") {
    return {
      to: record.recipient_email || SUPPORT_EMAIL,
      subject: record.subject,
      html: buildApplicationSupportHtml(payload),
      reply_to: payload.email || undefined,
    };
  }
  if (record.message_type === "support_request") {
    return {
      to: record.recipient_email || SUPPORT_EMAIL,
      subject: record.subject,
      html: buildSupportRequestHtml(payload),
      reply_to: payload.email || undefined,
    };
  }
  return {
    to: record.recipient_email,
    subject: record.subject,
    html: buildApplicantHtml(payload),
  };
}

async function sendViaResend(message) {
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

  const body = {
    from: EMAIL_FROM,
    to: [message.to],
    subject: message.subject,
    html: message.html,
  };
  if (message.reply_to) body.reply_to = message.reply_to;

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let data = {};
  try {
    data = JSON.parse(text);
  } catch (_error) {
    data = {};
  }
  if (!response.ok) {
    throw new Error(
      data.message || data.error || `Email provider returned HTTP ${response.status}`
    );
  }
  return data.id || null;
}

async function queueApplicationEmails(client, application) {
  const payload = { ...application, application_id: application.id };
  await client.query(
    `INSERT INTO email_outbox (application_id, message_type, recipient_email, subject, payload)
     VALUES
       ($1, 'support_application_received', $2, $3, $4::jsonb),
       ($1, 'applicant_confirmation', $5, $6, $4::jsonb)
     ON CONFLICT (application_id, message_type) WHERE application_id IS NOT NULL DO NOTHING`,
    [
      application.id,
      SUPPORT_EMAIL,
      `BIU.G Academy — New application — ${application.full_name}`,
      JSON.stringify(payload),
      application.email,
      "BIU.G Academy — Candidatura recebida",
    ]
  );
}

async function queueSupportRequestEmail(client, supportRequest) {
  const payload = {
    support_request_id: supportRequest.id,
    name: supportRequest.name,
    email: supportRequest.email,
    message: supportRequest.message,
    page_url: supportRequest.page_url,
    created_at: supportRequest.created_at,
  };
  await client.query(
    `INSERT INTO email_outbox (support_request_id, message_type, recipient_email, subject, payload)
     VALUES ($1, 'support_request', $2, $3, $4::jsonb)
     ON CONFLICT (support_request_id, message_type) WHERE support_request_id IS NOT NULL DO NOTHING`,
    [
      supportRequest.id,
      SUPPORT_EMAIL,
      `BIU.G Academy — Support request — ${supportRequest.name}`,
      JSON.stringify(payload),
    ]
  );
}

async function dispatchPendingEmails(pool, limit = 10) {
  const client = await pool.connect();
  let rows = [];
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `SELECT id, application_id, support_request_id, message_type, recipient_email, subject, payload, attempts
       FROM email_outbox
       WHERE status IN ('pending', 'failed')
         AND attempts < $1
         AND next_attempt_at <= NOW()
       ORDER BY created_at ASC
       FOR UPDATE SKIP LOCKED
       LIMIT $2`,
      [MAX_ATTEMPTS, limit]
    );
    rows = result.rows;
    if (rows.length) {
      await client.query(
        `UPDATE email_outbox SET status = 'processing', updated_at = NOW() WHERE id = ANY($1::uuid[])`,
        [rows.map((row) => row.id)]
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  for (const row of rows) {
    try {
      const providerMessageId = await sendViaResend(buildEmail(row));
      await pool.query(
        `UPDATE email_outbox
         SET status = 'sent', attempts = attempts + 1, provider_message_id = $2,
             sent_at = NOW(), last_error = NULL, updated_at = NOW()
         WHERE id = $1`,
        [row.id, providerMessageId]
      );
    } catch (error) {
      const nextDelayMinutes = Math.min(60, Math.max(2, 2 ** Math.min(row.attempts, 5)));
      await pool.query(
        `UPDATE email_outbox
         SET status = 'failed', attempts = attempts + 1, last_error = $2,
             next_attempt_at = NOW() + ($3 * INTERVAL '1 minute'), updated_at = NOW()
         WHERE id = $1`,
        [row.id, String(error.message || error).slice(0, 2000), nextDelayMinutes]
      );
    }
  }
  return rows.length;
}

function startOutboxWorker(pool) {
  const intervalMs = Number(process.env.EMAIL_WORKER_INTERVAL_MS || 15000);
  let running = false;
  async function tick() {
    if (running) return;
    running = true;
    try {
      await dispatchPendingEmails(pool, 20);
    } catch (error) {
      console.error("Email outbox dispatch failed", error);
    } finally {
      running = false;
    }
  }
  tick();
  const timer = setInterval(tick, intervalMs);
  if (typeof timer.unref === "function") timer.unref();
  return timer;
}

module.exports = {
  queueApplicationEmails,
  queueSupportRequestEmail,
  dispatchPendingEmails,
  startOutboxWorker,
};
