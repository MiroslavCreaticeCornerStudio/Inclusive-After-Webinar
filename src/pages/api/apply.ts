// On-demand endpoint (runs as a Vercel serverless function) — NOT prerendered.
export const prerender = false;

import type { APIRoute } from "astro";
import { sendToCrm } from "../../lib/crm";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request }) => {
  // Accept JSON or classic form-encoded submissions.
  let body: Record<string, any> = {};
  try {
    const ct = request.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      body = await request.json();
    } else {
      const fd = await request.formData();
      fd.forEach((v, k) => (body[k] = v));
    }
  } catch {
    return json({ ok: false, error: "Невалидни данни." }, 400);
  }

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const phone = String(body.phone ?? "").trim();
  const consent =
    body.consent === true || body.consent === "on" || body.consent === "true";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, error: "Моля, въведете валиден имейл адрес." }, 400);
  }
  if (!consent) {
    return json({ ok: false, error: "Моля, дайте съгласие за обработка на данните." }, 400);
  }

  // The CRM (skyguru) is the only destination for leads.
  const crmPayload: Record<string, unknown> = {
    name,
    email,
    phone,
    consent,
    form: "Стани част от печелившия отбор!",
    source: "inclusive.bg",
    submitted_at: new Date().toISOString(),
  };
  // Facebook offline-conversion + UTM tracking, forwarded as-is when present.
  for (const key of [
    "fbclid",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "fb_click_time",
    "landing_url",
  ]) {
    const v = (body as Record<string, unknown>)[key];
    if (v !== undefined && v !== null && String(v).trim() !== "") crmPayload[key] = String(v);
  }

  // CV is required — uploaded straight to Vercel Blob from the browser (see
  // /api/blob-upload); we receive its public URL and forward it as an "extra" link.
  const cvUrl = String(body.cv ?? "").trim();
  if (!cvUrl) {
    return json({ ok: false, error: "Моля, прикачете CV." }, 400);
  }
  crmPayload.extra = [{ name: "Линк към CV", value: cvUrl }];

  // Success now depends on the CRM accepting the lead — no silent loss.
  const delivered = await sendToCrm(crmPayload);
  if (!delivered) {
    return json(
      { ok: false, error: "Възникна грешка при записването. Опитайте отново." },
      502,
    );
  }

  return json({ ok: true });
};

// Politely reject other methods.
export const GET: APIRoute = () => json({ ok: false, error: "method_not_allowed" }, 405);
