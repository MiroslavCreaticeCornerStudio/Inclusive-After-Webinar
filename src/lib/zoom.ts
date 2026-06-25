// Zoom Server-to-Server OAuth + webinar registration.
// Credentials come from the runtime env via `getSecret` (never hard-coded / committed):
// `.env` in dev, Vercel env vars in production — adapter-agnostic.
import { getSecret } from "astro:env/server";

export interface ZoomRegistration {
  joinUrl: string;
  registrantId: string;
  error?: string; // diagnostic only — Zoom error body when registration failed
  status?: number; // diagnostic only — Zoom HTTP status
}

async function getAccessToken(): Promise<string | null> {
  // trim() guards against secrets pasted with a stray space/newline
  const ZOOM_ACCOUNT_ID = getSecret("ZOOM_ACCOUNT_ID")?.trim();
  const ZOOM_CLIENT_ID = getSecret("ZOOM_CLIENT_ID")?.trim();
  const ZOOM_CLIENT_SECRET = getSecret("ZOOM_CLIENT_SECRET")?.trim();
  if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) return null;

  const basic = btoa(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`);
  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(ZOOM_ACCOUNT_ID)}`,
    { method: "POST", headers: { Authorization: `Basic ${basic}` } },
  );
  if (!res.ok) {
    console.error("Zoom token error", res.status, await res.text().catch(() => ""));
    return null;
  }
  const data = (await res.json()) as { access_token?: string };
  return data.access_token ?? null;
}

/**
 * Register a person for the configured webinar.
 * Returns the registrant's unique join URL, or null on any failure (never throws).
 */
export async function registerForWebinar(
  registrant: { email: string; firstName: string; lastName: string },
): Promise<ZoomRegistration | null> {
  // Strip all spaces — Zoom shows the ID as "879 7932 8808" but the API needs "87979328808".
  const webinarId = getSecret("ZOOM_WEBINAR_ID")?.replace(/\s+/g, "");
  if (!webinarId) return null;

  try {
    const token = await getAccessToken();
    if (!token) return null;

    const res = await fetch(
      `https://api.zoom.us/v2/webinars/${encodeURIComponent(webinarId)}/registrants`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({
          email: registrant.email,
          first_name: registrant.firstName,
          last_name: registrant.lastName || undefined,
        }),
      },
    );

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("Zoom register failed", res.status, body);
      return { joinUrl: "", registrantId: "", error: body.slice(0, 400), status: res.status };
    }

    const data = (await res.json()) as { join_url?: string; registrant_id?: string };
    return { joinUrl: data.join_url ?? "", registrantId: data.registrant_id ?? "" };
  } catch (err) {
    console.error("Zoom register threw", err);
    return null;
  }
}
