// Forward the registration to the custom CRM (skyguru) — the only lead sink.
// Returns whether the CRM accepted the lead; never throws (caller maps false → error).
// Endpoint is overridable via the CRM_ENDPOINT env var; optional bearer auth via
// SKYGURU_API_KEY (sent only if set). Secrets via astro:env getSecret.
import { getSecret } from "astro:env/server";

const DEFAULT_CRM_ENDPOINT = "https://inclusive.skyguru.ai/api/v1/public/leads";

export async function sendToCrm(lead: Record<string, unknown>): Promise<boolean> {
  const endpoint = getSecret("CRM_ENDPOINT")?.trim() || DEFAULT_CRM_ENDPOINT;
  const apiKey = getSecret("SKYGURU_API_KEY")?.trim();

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify(lead),
    });
    if (!res.ok) {
      console.error("CRM error", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (err) {
    console.error("CRM request failed", err);
    return false;
  }
}
