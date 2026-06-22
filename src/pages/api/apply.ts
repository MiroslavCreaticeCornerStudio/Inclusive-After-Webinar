import type { APIRoute } from "astro";
import {
  ZOOM_ACCOUNT_ID,
  ZOOM_CLIENT_ID,
  ZOOM_CLIENT_SECRET,
  ZOOM_WEBINAR_ID,
  BREVO_API_KEY,
  BREVO_LIST_ID,
} from "astro:env/server";

// On-demand (server) route — runs as a function, never prerendered.
export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Best-effort normalize to E.164-ish for Brevo SMS (defaults to Bulgaria +359). */
function normalizePhone(raw: string): string | null {
  let p = raw.replace(/[^\d+]/g, "");
  if (!p) return null;
  if (p.startsWith("+")) return p;
  if (p.startsWith("00")) return "+" + p.slice(2);
  if (p.startsWith("0")) return "+359" + p.slice(1);
  if (p.startsWith("359")) return "+" + p;
  return "+359" + p;
}

/** Fetch a fresh Zoom Server-to-Server OAuth access token. */
async function getZoomToken(): Promise<string> {
  const basic = btoa(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`);
  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(ZOOM_ACCOUNT_ID)}`,
    { method: "POST", headers: { Authorization: `Basic ${basic}` } }
  );
  if (!res.ok) {
    throw new Error(`zoom_token ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("zoom_token: no access_token");
  return data.access_token;
}

/** Register the applicant as a webinar registrant. Returns the unique join URL. */
async function registerZoom(input: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}): Promise<string> {
  const token = await getZoomToken();
  const webinarId = ZOOM_WEBINAR_ID.replace(/\s+/g, "");
  const body: Record<string, string> = {
    email: input.email,
    first_name: input.firstName,
  };
  if (input.lastName) body.last_name = input.lastName;
  if (input.phone) body.phone = input.phone;

  const res = await fetch(`https://api.zoom.us/v2/webinars/${webinarId}/registrants`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`zoom_register ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as { join_url?: string };
  return data.join_url ?? "";
}

// Brevo custom field (text) that stores the registrant's unique Zoom join link.
const BREVO_ZOOM_LINK_ATTR = "ZOOM_JOIN_URL";
// Brevo text field for the raw phone (reliable — unlike SMS it has no E.164 validation).
const BREVO_PHONE_ATTR = "TELEFON";

/** Create/update the contact in Brevo and add to the configured list. */
async function addBrevo(input: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  joinUrl: string;
}): Promise<void> {
  const baseAttrs: Record<string, string> = {
    FIRSTNAME: input.firstName,
    LASTNAME: input.lastName,
  };
  if (input.phone) baseAttrs[BREVO_PHONE_ATTR] = input.phone;
  if (input.joinUrl) baseAttrs[BREVO_ZOOM_LINK_ATTR] = input.joinUrl;

  const post = (attributes: Record<string, string>) =>
    fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        email: input.email,
        attributes,
        listIds: [BREVO_LIST_ID],
        updateEnabled: true,
      }),
    });

  const sms = input.phone ? normalizePhone(input.phone) : null;
  let res = await post(sms ? { ...baseAttrs, SMS: sms } : baseAttrs);

  // If Brevo rejected the SMS format, retry without it so the contact is still saved.
  if (!res.ok && sms) {
    res = await post(baseAttrs);
  }
  if (!res.ok) {
    throw new Error(`brevo ${res.status}: ${await res.text()}`);
  }
}

export const POST: APIRoute = async ({ request }) => {
  // Accept JSON (fetch) or form-encoded (no-JS fallback).
  let name = "";
  let phone = "";
  let email = "";
  let consent = false;

  const ct = request.headers.get("content-type") || "";
  try {
    if (ct.includes("application/json")) {
      const b = (await request.json()) as Record<string, unknown>;
      name = String(b.name ?? "").trim();
      phone = String(b.phone ?? "").trim();
      email = String(b.email ?? "").trim();
      consent = b.consent === true || b.consent === "on" || b.consent === "true";
    } else {
      const f = await request.formData();
      name = String(f.get("name") ?? "").trim();
      phone = String(f.get("phone") ?? "").trim();
      email = String(f.get("email") ?? "").trim();
      consent = Boolean(f.get("consent"));
    }
  } catch {
    return json({ ok: false, error: "invalid_request" }, 400);
  }

  if (!name || !email) return json({ ok: false, error: "missing_fields" }, 400);
  if (!EMAIL_RE.test(email)) return json({ ok: false, error: "invalid_email" }, 400);
  if (!consent) return json({ ok: false, error: "consent_required" }, 400);

  const [firstName, ...rest] = name.split(/\s+/);
  const lastName = rest.join(" ");
  const payload = { firstName, lastName, email, phone };

  // Zoom first — its response carries the unique join URL we pass to Brevo.
  let zoomOk = false;
  let joinUrl = "";
  try {
    joinUrl = await registerZoom(payload);
    zoomOk = true;
  } catch (e) {
    console.error("[apply] Zoom failed:", (e as Error)?.message);
  }

  // Brevo second — store the join URL in the ZOOM_JOIN_URL custom field.
  let brevoOk = false;
  try {
    await addBrevo({ ...payload, joinUrl });
    brevoOk = true;
  } catch (e) {
    console.error("[apply] Brevo failed:", (e as Error)?.message);
  }

  // The lead is captured if at least one integration succeeded.
  if (!zoomOk && !brevoOk) {
    return json({ ok: false, error: "upstream_failed" }, 502);
  }

  return json({ ok: true, zoom: zoomOk, brevo: brevoOk });
};

// Politely reject other methods.
export const GET: APIRoute = () => json({ ok: false, error: "method_not_allowed" }, 405);
