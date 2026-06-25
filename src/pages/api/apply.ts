// On-demand endpoint (runs as a Vercel serverless function) — NOT prerendered.
export const prerender = false;

import type { APIRoute } from "astro";
// Adapter-agnostic runtime secrets (reads `.env` in dev, Vercel env vars in prod).
import { getSecret } from "astro:env/server";
import { registerForWebinar } from "../../lib/zoom";
import { sendToCrm } from "../../lib/crm";

const BREVO_CONTACTS_ENDPOINT = "https://api.brevo.com/v3/contacts";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// Normalize a (likely Bulgarian) phone number to E.164 for Brevo's SMS attribute.
function normalizePhone(raw: string): string | null {
  const p = (raw || "").trim().replace(/[^\d+]/g, "");
  if (!p) return null;
  if (p.startsWith("+")) return p;
  if (p.startsWith("00")) return "+" + p.slice(2);
  if (p.startsWith("359")) return "+" + p;
  if (p.startsWith("0")) return "+359" + p.slice(1);
  return "+359" + p;
}

export const POST: APIRoute = async ({ request }) => {
  const apiKey = getSecret("BREVO_API_KEY")?.trim();
  const listId = Number(getSecret("BREVO_LIST_ID") ?? 9);

  if (!apiKey) {
    return json(
      { ok: false, error: "Формата все още не е конфигурирана (липсва BREVO_API_KEY)." },
      500,
    );
  }

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

  const sms = normalizePhone(phone);
  const nameAttr: Record<string, string> = name ? { FIRSTNAME: name } : {};

  // Facebook offline-conversion tracking → Brevo contact attributes.
  // Mapped to the attributes that exist in this Brevo account (verified):
  // fb_click_time → AD_TIMESTAMP, landing_url → LANDING_PAGE.
  const TRACKING_MAP: Record<string, string> = {
    fbclid: "FBCLID",
    utm_source: "UTM_SOURCE",
    utm_medium: "UTM_MEDIUM",
    utm_campaign: "UTM_CAMPAIGN",
    utm_term: "UTM_TERM",
    utm_content: "UTM_CONTENT",
    fb_click_time: "AD_TIMESTAMP",
    landing_url: "LANDING_PAGE",
  };
  const trackingAttributes: Record<string, string> = {};
  for (const [key, attr] of Object.entries(TRACKING_MAP)) {
    const v = (body as Record<string, unknown>)[key];
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      trackingAttributes[attr] = String(v).slice(0, 250);
    }
  }

  // Register the attendee in the Zoom webinar (best-effort — a Zoom failure must
  // NEVER block the Brevo lead capture). The unique join link is stored on the
  // Brevo contact and returned so the thank-you page can show it.
  const nameParts = name.split(/\s+/).filter(Boolean);
  const zoom = await registerForWebinar({
    email,
    firstName: nameParts[0] ?? name,
    lastName: nameParts.slice(1).join(" "),
  });
  const joinUrl = zoom?.joinUrl ?? "";

  // Forward the full lead to the custom CRM (skyguru) — best-effort, never blocks.
  const crmPayload: Record<string, unknown> = {
    name,
    email,
    phone,
    consent,
    form: "Стани част от печелившия отбор!",
    source: "inclusive.bg",
    submitted_at: new Date().toISOString(),
  };
  if (joinUrl) crmPayload.join_url = joinUrl;
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
  await sendToCrm(crmPayload);

  const createContact = (attributes: Record<string, string>) =>
    fetch(BREVO_CONTACTS_ENDPOINT, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        email,
        attributes,
        listIds: [listId],
        updateEnabled: true, // upsert if the contact already exists
      }),
    });

  const ok = (res: Response) => res.ok || res.status === 201 || res.status === 204;

  try {
    // Phone → TELEFON (text) with SMS as a backup. Join link → both ZOOM_JOIN_URL and
    // WEBINARURL (both exist in this account). Richest payload first; fall back so a
    // missing attribute never costs us the lead OR the Zoom join link.
    const linkAttr = joinUrl ? { ZOOM_JOIN_URL: joinUrl, WEBINARURL: joinUrl } : {};
    const telAttr = phone ? { TELEFON: phone } : {};
    const smsAttr = sms ? { SMS: sms } : {};
    const attempts = [
      { ...nameAttr, ...telAttr, ...smsAttr, ...linkAttr, ...trackingAttributes },
      { ...nameAttr, ...telAttr, ...linkAttr, ...trackingAttributes },
      { ...nameAttr, ...telAttr, ...linkAttr },
      { ...nameAttr, ...smsAttr, ...linkAttr },
      { ...nameAttr, ...linkAttr },
      { ...nameAttr, ...telAttr },
      { ...nameAttr },
    ];
    let res: Response | null = null;
    for (const attrs of attempts) {
      res = await createContact(attrs);
      if (ok(res)) {
        return json({ ok: true, joinUrl });
      }
    }
    console.error("Brevo error", res?.status, res ? await res.text() : "no response");
    return json(
      { ok: false, error: "Възникна грешка при записването. Опитайте отново." },
      502,
    );
  } catch (e) {
    console.error("Brevo request failed", e);
    return json(
      { ok: false, error: "Възникна грешка при връзката. Опитайте отново." },
      502,
    );
  }
};

// Politely reject other methods.
export const GET: APIRoute = () => json({ ok: false, error: "method_not_allowed" }, 405);
